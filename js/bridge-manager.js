/**
 * @file bridge-manager.js
 * @description Centralized and protected manager for the JavaScript Bridge.
 * Implements security (Function Freezing), auditing (Logging), and environment checks.
 * @version 1.0.0
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


(function () {
    "use strict";

    let hasSignaledReady = false;
    let bridgeCallQueue = [];

    function isIndexRoute() {
        const path = window.location.pathname || '';
        return path === '/' || /(^|\/)index\.html$/.test(path);
    }

    function scheduleAutomaticReadySignal() {
        const trigger = function () {
            if (isIndexRoute()) {
                bridgeLog('info', 'Automatic ready signal skipped for index route.', {
                    path: window.location.pathname
                });
                return;
            }

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setTimeout(() => {
                        BridgeManager.signalReady('auto_load');
                    }, 120);
                });
            });
        };

        if (document.readyState === 'complete') {
            trigger();
        } else {
            window.addEventListener('load', trigger, { once: true });
        }

        window.addEventListener('pageshow', () => {
            if (!hasSignaledReady && !isIndexRoute()) {
                BridgeManager.signalReady('pageshow_restore');
            }
        });
    }

    // --- 1. Internal Log Helper ---
    function bridgeLog(type, message, data) {
        const timestamp = new Date().toLocaleTimeString();
        const prefix = `[BridgeManager] [${timestamp}]`;
        const logMsg = `${prefix} ${message}`;

        if (window.onNativeLog) {
            window.onNativeLog(type, logMsg + (data ? ": " + JSON.stringify(data) : ""));
        } else {
            if (type === 'error') console.error(logMsg, data || '');
            else if (type === 'warn') console.warn(logMsg, data || '');
            else console.log(logMsg, data || '');
        }
    }

    // --- 2. The Bridge Manager Object ---
    const BridgeManager = {
        /**
         * Checks if the Android bridge is available.
         */
        isAndroid: function () {
            return !!window.Android;
        },

        /**
         * Safely invokes an Android bridge method with logging.
         */
        invoke: function (methodName, ...args) {
            if (!this.isAndroid()) {
                bridgeLog('info', `Method ${methodName} ignored: Not in Android environment.`);
                return false;
            }

            // Queue calls if not ready yet, unless it's the ready signal itself
            if (!hasSignaledReady && methodName !== 'onWebAppReady') {
                bridgeLog('info', `Queueing Bridge Call: ${methodName} (Bridge not ready yet)`);
                bridgeCallQueue.push({ methodName, args });
                return true;
            }

            if (typeof window.Android[methodName] === 'function') {
                try {
                    bridgeLog('info', `Calling Native: ${methodName}`, args);
                    window.Android[methodName](...args);
                    return true;
                } catch (e) {
                    bridgeLog('error', `Failed to call ${methodName}`, e.message);
                    return false;
                }
            } else {
                bridgeLog('error', `Method ${methodName} not found on window.Android`);
                return false;
            }
        },

        /**
         * Safely invokes an Android bridge method that returns a synchronous value.
         */
        invokeForResult: function (methodName, ...args) {
            if (!this.isAndroid()) {
                bridgeLog('info', `Method ${methodName} ignored: Not in Android environment.`);
                return null;
            }

            if (typeof window.Android[methodName] === 'function') {
                try {
                    bridgeLog('info', `Calling Native for result: ${methodName}`, args);
                    return window.Android[methodName](...args);
                } catch (e) {
                    bridgeLog('error', `Failed to call ${methodName}`, e.message);
                    return null;
                }
            }

            bridgeLog('error', `Method ${methodName} not found on window.Android`);
            return null;
        },

        /**
         * Signal that the Web App is fully ready.
         */
        signalReady: function (reason = 'explicit') {
            if (hasSignaledReady) {
                bridgeLog('info', 'Ready signal ignored because it was already sent.', { reason });
                return false;
            }

            if (isIndexRoute()) {
                bridgeLog('warn', 'Ready signal blocked on index route to avoid premature splash release.', {
                    reason,
                    path: window.location.pathname
                });
                return false;
            }

            const sent = this.invoke('onWebAppReady');
            if (sent) {
                hasSignaledReady = true;
                bridgeLog('info', 'Ready signal sent to native successfully.', { reason, path: window.location.pathname });
                this.flushQueue();
            }
            return sent;
        },

        /**
         * Flushes any queued bridge calls after initialization.
         */
        flushQueue: function () {
            if (bridgeCallQueue.length > 0) {
                bridgeLog('info', `Flushing ${bridgeCallQueue.length} queued bridge calls.`);
                bridgeCallQueue.forEach(call => {
                    this.invoke(call.methodName, ...call.args);
                });
                bridgeCallQueue = [];
            }
        },

        /**
         * Sync splash slogans to native side.
         */
        syncSplashSlogans: function (slogansJson) {
            if (window.Localization && typeof window.Localization.updateSplashSlogans === 'function') {
                try {
                    bridgeLog('info', 'Syncing Splash Slogans to Native');
                    window.Localization.updateSplashSlogans(slogansJson);
                    return true;
                } catch (e) {
                    bridgeLog('error', 'Failed to sync slogans', e.message);
                }
            }
            return false;
        },

        /**
         * Notifies Android about back button state.
         * @param {boolean} canGoBack - Whether the web history has pages to go back to.
         */
        updateBackState: function (canGoBack) {
            // [Future] This would call a native method to enable/disable hardware back interception
            // bridgeLog('info', `Back state updated: canGoBack=${canGoBack}`);
        },

        /**
         * Triggers the native share sheet.
         */
        share: function (title, url) {
            return this.invoke('share', title, url);
        },

        /**
         * Sends an analytics event to native when supported.
         */
        logEvent: function (eventName, payload = {}) {
            const payloadJson = JSON.stringify(payload || {});
            if (this.isAndroid() && typeof window.Android?.logEvent === 'function') {
                return this.invoke('logEvent', eventName, payloadJson);
            }
            if (this.isAndroid() && typeof window.Android?.logToNative === 'function') {
                return this.invoke('logToNative', 'info', 'Analytics', JSON.stringify({ eventName, payload: payload || {} }));
            }
            bridgeLog('info', 'Native analytics event ignored outside Android environment.', { eventName });
            return false;
        }
    };

    // --- 3. Global Callback Handlers (Cross-Frame Support) ---
    /**
     * This is the primary entry point for Android's location response.
     * Since Android calls evaluateJavascript on the 'Top' window, this function
     * is responsible for finding any embedded iframes and delivering the result to them.
     */
    window.onAndroidLocationResult = function (payloadJson) {
        bridgeLog('info', 'Global onAndroidLocationResult triggered. Routing to child frames.');

        let dispatchedCount = 0;
        const iframes = document.getElementsByTagName('iframe');

        for (let i = 0; i < iframes.length; i++) {
            try {
                const iframeWin = iframes[i].contentWindow;
                // If the iframe has defined its own handler, we forward the call
                if (iframeWin && typeof iframeWin.onAndroidLocationResult === 'function') {
                    bridgeLog('info', `Forwarding result to iframe [${iframes[i].id || i}]`);
                    iframeWin.onAndroidLocationResult(payloadJson);
                    dispatchedCount++;
                }
            } catch (e) {
                // Ignore cross-origin errors (though unlikely in this local asset environment)
            }
        }

        if (dispatchedCount === 0) {
            bridgeLog('warn', 'Location result received but no active receivers (iframes) found in current page.');
        } else {
            bridgeLog('info', `Location result successfully dispatched to ${dispatchedCount} receiver(s).`);
        }
    };

    // --- 4. Security: Freeze the Manager ---
    // This prevents any external script from modifying our bridge logic.
    Object.freeze(BridgeManager);

    // --- 5. Global Exposure ---
    window.BridgeManager = BridgeManager;

    // --- 6. Initial Boot Log ---
    bridgeLog('info', 'BridgeManager initialized and protected.');
    scheduleAutomaticReadySignal();
})();
