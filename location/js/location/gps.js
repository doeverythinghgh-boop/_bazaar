/**
 * @file gps.js
 * @description Geolocation Services (GPS) integration for the location application.
 * Handles requesting and processing user's real-time position.
 *
 * @author Antigravity
 * @version 1.0.0
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


/**
 * Start the GPS location retrieval process
 * @memberof location_app
 * @returns {Promise<void>}
 */
window._androidLocationResolvers = window._androidLocationResolvers || [];

function invokeAndroidBridge(methodName, ...args) {
    if (window.BridgeManager && typeof window.BridgeManager.invoke === 'function') {
        return window.BridgeManager.invoke(methodName, ...args);
    }
    return false;
}

window.onAndroidLocationResult = function (payloadJson) {
    let parsedPayload = null;

    try {
        parsedPayload = payloadJson ? JSON.parse(payloadJson) : null;
    } catch (error) {
        console.error('[GPS] Failed to parse Android location payload:', error, payloadJson);
        parsedPayload = { status: 'parse_error' };
    }

    const resolvers = window._androidLocationResolvers.splice(0, window._androidLocationResolvers.length);
    resolvers.forEach(resolve => resolve(parsedPayload));
};

location_app.location_waitForAndroidLocationResult = function (timeout = 25000) {
    return new Promise((resolve) => {
        let settled = false;

        const resolver = (payload) => {
            if (settled) return;
            settled = true;
            clearTimeout(timerId);
            resolve(payload || { status: 'empty' });
        };

        const timerId = setTimeout(() => {
            const index = window._androidLocationResolvers.indexOf(resolver);
            if (index >= 0) window._androidLocationResolvers.splice(index, 1);
            resolver({ status: 'timeout' });
        }, timeout);

        window._androidLocationResolvers.push(resolver);
    });
};

location_app.getLocationByGPS = function () {
    return new Promise((resolve) => {
        try {
            if (!navigator.geolocation) {
                this.location_showAlert(window.langu('location_not_supported'), window.langu('location_browser_not_supported'), 'error');
                resolve();
                return;
            }

            if (this.location_isBusy) {
                this.location_showAlert(window.langu('location_busy_title'), window.langu('location_busy_text'), 'info');
                resolve();
                return;
            }

            this.location_isBusy = true;
            this.location_gpsAborted = false; // Reset abortion flag
            this.location_map.dragging.disable();

            Swal.fire({
                title: window.langu('location_finding_title'),
                html: `
                    <p style="margin-bottom: 12px;">${window.langu('location_allow_access')}</p>
                    <div class="swal2-loading" style="display: flex; justify-content: center; margin-bottom: 8px;">
                        <div class="swal2-loader" style="display: block;"></div>
                    </div>
                `,
                allowOutsideClick: false,
                allowEscapeKey: false,
                showCancelButton: true,
                cancelButtonText: window.langu('location_reset_cancel'),
                showConfirmButton: false, // Hide confirm button during search
                buttonsStyling: false,
                customClass: {
                    popup: 'swal-modern-mini-popup',
                    title: 'swal-modern-mini-title',
                    htmlContainer: 'swal-modern-mini-text',
                    cancelButton: 'swal-modern-mini-cancel'
                }
            }).then((result) => {
                if (result.isDismissed || result.dismiss === Swal.DismissReason.cancel) {
                    console.log("[GPS] User cancelled location retrieval.");
                    this.location_gpsAborted = true;
                    this.location_isBusy = false;
                    this.location_map.dragging.enable();
                }
            });

            console.log("[GPS] Starting Priority 1 (High Accuracy)...");

            if (window.BridgeManager && typeof window.BridgeManager.isAndroid === 'function' && window.BridgeManager.isAndroid()) {
                console.log("[GPS] Android smart location bridge detected. Delegating location request to native layer.");

                this.location_waitForAndroidLocationResult().then((result) => {
                    if (this.location_gpsAborted) return;

                    switch (result && result.status) {
                        case 'success_current':
                        case 'success_last_known':
                            this.location_onGPSSuccess({
                                coords: {
                                    latitude: result.lat,
                                    longitude: result.lng,
                                    accuracy: result.accuracy || 0
                                }
                            }, resolve);
                            return;
                        case 'service_disabled_no_last_known':
                            Swal.close();
                            this.location_isBusy = false;
                            this.location_map.dragging.enable();
                            Swal.fire({
                                title: window.langu('location_alert_title'),
                                text: window.langu('location_enable_service_short'),
                                confirmButtonText: window.langu('location_open_settings'),
                                buttonsStyling: false,
                                customClass: {
                                    popup: 'swal-modern-mini-popup',
                                    title: 'swal-modern-mini-title',
                                    htmlContainer: 'swal-modern-mini-text',
                                    confirmButton: 'swal-modern-mini-confirm'
                                }
                            }).then(() => {
                                invokeAndroidBridge('openLocationSettings');
                            });
                            resolve();
                            return;
                        case 'permission_denied':
                            this.location_onGPSError({ code: 1 }, resolve);
                            return;
                        default:
                            this.location_onGPSError({ code: 0 }, resolve);
                            return;
                    }
                });

                invokeAndroidBridge('requestSmartLocation');
                return;
            }

            const attemptPosition = (options, isFallback = false) => {
                if (this.location_gpsAborted) return; // Stop if user cancelled

                console.log(`[GPS] Calling getCurrentPosition (${isFallback ? "Fallback" : "Primary"})...`, options);

                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        if (this.location_gpsAborted) return;
                        console.log("[GPS] Success callback triggered.");
                        this.location_onGPSSuccess(position, resolve);
                    },
                    (error) => {
                        if (this.location_gpsAborted) return;
                        console.warn(`[GPS] Error callback (${isFallback ? "Fallback" : "Primary"}). Code:`, error.code, "Msg:", error.message);

                        // If primary HighAccuracy failed with Timeout (3) or Position Unavailable (2), try LowAccuracy
                        if (!isFallback && (error.code === 3 || error.code === 2)) {
                            console.log("[GPS] Attempting Fallback (HighAccuracy: false) with generous cache...");
                            attemptPosition({
                                enableHighAccuracy: false,
                                timeout: 20000,
                                maximumAge: 600000 // 10 minutes cache allowance
                            }, true);
                        } else {
                            this.location_onGPSError(error, resolve);
                        }
                    },
                    options
                );
            };

            // Initial Attempt: High Accuracy, 20s timeout
            attemptPosition({
                enableHighAccuracy: true,
                timeout: 20000,
                maximumAge: 0
            });

        } catch (error) {
            console.error('Error in GPS location retrieval:', error);
            this.location_onGPSError({ code: 0 }, resolve);
        }
    });
};

/**
 * Handle successful GPS location update
 * @memberof location_app
 * @param {GeolocationPosition} position - Success position object
 * @param {Function} resolve - Resolution for the main GPS promise
 * @returns {void}
 */
location_app.location_onGPSSuccess = function (position, resolve) {
    try {
        Swal.close();
        this.location_isBusy = false;
        this.location_map.dragging.enable();

        const location_lat = position.coords.latitude;
        const location_lng = position.coords.longitude;
        const location_accuracy = position.coords.accuracy;
        console.log("[GPS] Position acquired:", location_lat, location_lng, "Accuracy:", location_accuracy);

        this.location_handleLocationSelection(location_lat, location_lng);

        if (location_accuracy && this.location_map) {
            if (this.location_accuracyCircle) {
                this.location_map.removeLayer(this.location_accuracyCircle);
            }
            this.location_accuracyCircle = L.circle([location_lat, location_lng], {
                radius: location_accuracy,
                fillOpacity: 0.1,
                color: '#2563eb',
                weight: 1
            }).addTo(this.location_map);
        }

        resolve();
    } catch (error) {
        console.error('Error processing GPS success:', error);
        resolve();
    }
};

/**
 * Handle GPS errors (permission denied, timeout, unavailable)
 * @memberof location_app
 * @param {GeolocationPositionError} error - Error object
 * @param {Function} resolve - Resolution for the main GPS promise
 * @returns {void}
 */
location_app.location_onGPSError = function (error, resolve) {
    try {
        Swal.close();
        this.location_isBusy = false;

        if (this.location_map) {
            this.location_map.dragging.enable();
        }

        const location_errorMessages = {
            1: window.langu('location_error_denied'),
            2: window.langu('location_error_unavailable'),
            3: window.langu('location_error_timeout'),
            0: window.langu('location_error_unknown')
        };

        this.location_showAlert(
            window.langu('location_error_gps_title'),
            location_errorMessages[error.code] || location_errorMessages[0],
            'error'
        );

        resolve();
    } catch (innerError) {
        console.error('Error handling GPS error:', innerError);
        resolve();
    }
};
