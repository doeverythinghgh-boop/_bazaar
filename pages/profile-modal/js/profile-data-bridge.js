/**
 * @file pages/profile-modal/js/profile-data-bridge.js
 * @description Bridges UserService and RegisterState to prepopulate the Profile Wizard.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


window.ProfileDataBridge = (function () {
    'use strict';

    function bridgeLog(message, payload) {
        if (window.RegisterDevLogger) {
            window.RegisterDevLogger.info("ProfileBridge", message, payload);
            return;
        }
        if (payload === undefined) {
            console.log(`[ProfileBridge] ${message}`);
            return;
        }
        console.log(`[ProfileBridge] ${message}`, payload);
    }

    /**
     * Fetches the current logged-in user and populates RegisterState and the DOM.
     * @returns {Promise<boolean>}
     */
    async function primeWizardState() {
        bridgeLog("Fetching user data for wizard.");

        if (!window.UserService || !window.RegisterState) {
            console.error("[ProfileDataBridge] Core services (UserService/RegisterState) missing!");
            return false;
        }

        const user = window.UserService.get();
        if (!user) {
            console.error("[ProfileDataBridge] No logged-in user found!");
            return false;
        }

        const setDomValue = (id, value) => {
            const el = document.getElementById(id);
            if (el) {
                if (el.type !== 'file') el.value = value;
                bridgeLog(`✨ DOM mapped: #${id} -> "${value.toString().substring(0, 30)}${value.toString().length > 30 ? '...' : ''}"`);
            } else {
                bridgeLog(`❌ DOM mapping FAILED: #${id} NOT FOUND in current DOM.`);
            }
            updateWizardField(id, value);
        };
        const mappers = window.ProfileBridgeMappers || {};
        const mapperContext = {
            setDomValue,
            updateWizardField,
            markProfilePhonesAsVerified,
            primeProfileLocations
        };

        bridgeLog("Mapping user data to wizard fields.", {
            username: user.username,
            linksType: typeof user.links,
            links: user.links,
            userKeys: Object.keys(user)
        });

        if (window.RegisterState && typeof window.RegisterState.setBulkUpdate === 'function') {
            bridgeLog("Entering bulk reconstruction mode.");
            window.RegisterState.setBulkUpdate(true);
        }

        try {
            // 1. Sync Roles/Account Type (Bitmask support)
            const roles = parseInt(user.account_type || 1, 10);
            bridgeLog("Mapping account type.", { roles });
            if (typeof registerSetSelectedAccountType === 'function') {
                registerSetSelectedAccountType(roles);
            }

            // 1.5 RE-LOAD STEPS IF ROLES CHANGED (Crucial for Profile Modal)
            // We must do this BEFORE mappers because mappers target DOM elements in these steps.
            if (window.RegisterLoader && typeof window.RegisterLoader.loadSteps === 'function') {
                bridgeLog("Re-loading steps after account type sync to ensure all business steps are present.");
                await window.RegisterLoader.loadSteps();

                // CRITICAL: Re-bind step behaviors (like "Add Phone" button listeners)
                // because loadSteps replaced the DOM elements.
                if (typeof window.registerSetupStepBehaviors === 'function') {
                    bridgeLog("Re-binding step behaviors after DOM injection.");
                    window.registerSetupStepBehaviors();
                }
                if (window.RegisterListenerServices?.bindDynamicStepDom && typeof window.registerGetElements === "function") {
                    bridgeLog("Re-binding dynamic DOM listeners after profile step injection.");
                    window.RegisterListenerServices.bindDynamicStepDom(window.registerGetElements());
                }
            }

            // 2. Map data sections through focused mappers
            mappers.mapIdentity?.(mapperContext, user);
            mappers.mapPhones?.(mapperContext, user);
            mappers.mapBusiness?.(mapperContext, user);
            mappers.mapSettings?.(mapperContext, user);
            mappers.mapMedia?.(mapperContext, user);
            mappers.mapCategories?.(mapperContext, user);
            mappers.mapLocation?.(mapperContext, user);
            mappers.mapLinks?.(mapperContext, user);

            if (window.registerSocialLinksApi) {
                window.registerSocialLinksApi.renderVisibilityFromValues();
                window.registerSocialLinksApi.bindAddButtonsOnce();
            }

            mappers.mapSecurityDefaults?.(mapperContext);

            // 7. Sync Wizard Meta
            if (typeof registerUpdateWizardTotalSteps === 'function') {
                registerUpdateWizardTotalSteps();
            }

            // 8. FINAL UI SYNC: Force UX Engine to reveal all primed blocks
            if (window.RegisterState && typeof window.RegisterState.setBulkUpdate === 'function') {
                bridgeLog("Exiting bulk reconstruction mode.");
                window.RegisterState.setBulkUpdate(false);
            }

            if (window.RegisterUxEngine && typeof window.RegisterUxEngine.syncStepUI === 'function') {
                bridgeLog("Final UI synchronization.");
                window.RegisterUxEngine.syncStepUI();

                console.log(" [ProfileDataBridge] PROFILE DATA PRIMING COMPLETED. ");

                // 9. Auto-expand optional sections that have data
                document.querySelectorAll('.reg-optional-wrapper').forEach(wrapper => {
                    const inputs = wrapper.querySelectorAll('input, select, textarea');
                    const hasData = Array.from(inputs).some(input => input.value && input.value.trim() !== '');
                    if (hasData) {
                        wrapper.classList.add('expanded');
                    }
                });
            }

            return true;
        } catch (error) {
            if (window.RegisterState && typeof window.RegisterState.setBulkUpdate === 'function') {
                window.RegisterState.setBulkUpdate(false);
            }
            console.error("[ProfileDataBridge] Error during data mapping:", error);
            return false;
        }
    }

    /**
     * Helper to update RegisterState atomically.
     */
    function updateWizardField(fieldId, value) {
        if (!window.RegisterState) return;

        // We set state to 'valid' for existing data to allow transition
        // except for passwords which are mandatory to leave empty/manage
        const fieldState = (value && fieldId !== 'password' && fieldId !== 'currentPassword') ? 'valid' : 'idle';

        window.RegisterState.updateField(fieldId, value, fieldState);
    }

    function markProfilePhonesAsVerified(phones) {
        if (!window.registerVerifiedPhones) {
            window.registerVerifiedPhones = new Set();
        }

        (Array.isArray(phones) ? phones : []).forEach((phoneEntry) => {
            const number = String(phoneEntry?.number || phoneEntry || "").trim();
            if (number) {
                window.registerVerifiedPhones.add(number);
            }
        });
    }

    function primeProfileLocations(user) {
        let locations = [];
        const settings = window.UserFormService?.parseSettings
            ? window.UserFormService.parseSettings(user.settings)
            : parseJsonObject(user.settings);

        if (Array.isArray(settings.locations) && settings.locations.length > 0) {
            locations = settings.locations;
        } else if (user.location || user.address) {
            locations = [{
                coords: user.location || "",
                address: user.address || "",
                is_primary: true
            }];
        }

        if (window.UserLocationsClient) {
            window.registerLocations = window.UserLocationsClient.normalizeLocations(locations);
        } else {
            window.registerLocations = locations;
        }

        const primary = window.UserLocationsClient ? window.UserLocationsClient.getPrimary(window.registerLocations) : (window.registerLocations[0] || null);
        if (primary) {
            const els = typeof registerGetElements === "function" ? registerGetElements() : {};
            if (els.coordsInput) {
                els.coordsInput.value = primary.coords || "";
            }
            if (els.address) {
                els.address.value = primary.address || "";
            }
        }

        if (primary && primary.coords && primary.coords.includes(",")) {
            const els = typeof registerGetElements === "function" ? registerGetElements() : {};
            if (els.mapIframe) {
                const [lat, lng] = primary.coords.split(",").map((c) => c.trim());
                const timestamp = Date.now();
                els.mapIframe.src = `/location/LOCATION.html?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}&embedded=true&hideSave=true&v=${timestamp}`;
                console.log("️ [ProfileDataBridge] Forced Map Iframe to update with primary coordinates.");
            }
        }
    }

    function parseJsonObject(value) {
        if (!value) return {};
        if (typeof value === "object" && !Array.isArray(value)) return value;
        try {
            return JSON.parse(value || "{}");
        } catch (error) {
            console.error("[ProfileDataBridge] Failed to parse JSON object value; defaulting to empty object.", {
                rawValue: value,
                error: error?.message || error
            });
            return {};
        }
    }

    return {
        primeWizardState
    };
})();
