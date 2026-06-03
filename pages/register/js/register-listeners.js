/**
 * @file pages/register/js/register-listeners.js
 * @description Event listener setup for the registration page.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

export function registerSetupListeners() {
    if (window.__registerListenersBound) {
        console.log("[Register] Listeners already bound, skipping.");
        return;
    }
    window.__registerListenersBound = true;

    const devLog = window.RegisterDevLogger;
    if (devLog) devLog.info("RegisterListeners", "Setting up listeners.");
    console.log("[Register] Setting up listeners...");
    const els = window.registerGetElements ? window.registerGetElements() : null;
    if (!els) {
        console.error("[Register] registerGetElements not found; listener binding aborted.");
        return;
    }
    
    const services = window.RegisterListenerServices;

    if (services) {
        try {
            services.bindMediaInputs(els);
            services.bindSubmitAndRole(els);
            services.bindLiveValidation();
            services.bindPasswordToggles(els);
            services.bindStateAndDraft(els);
            services.syncManagers();
        } catch (error) {
            console.error("[Register] Listener services failed to bind safely.", error);
        }

        // Handle dynamic layout shifts (like screen rotation or window resizing)
        if (typeof window.addEventListener === "function") {
            window.addEventListener("resize", () => {
                if (window.RegisterLocationsUI && typeof window.RegisterLocationsUI.syncBlockHeight === "function") {
                    window.RegisterLocationsUI.syncBlockHeight();
                }
            });
        }
    } else {
        console.warn("[Register] RegisterListenerServices missing; listener binding may be incomplete.");
    }
}

export function registerSetupStepBehaviors() {
    const definitions = typeof window.registerGetAllStepDefinitions === "function"
        ? window.registerGetAllStepDefinitions()
        : [];

    const seenSetupKeys = new Set();
    const els = window.registerGetElements ? window.registerGetElements() : null;

    definitions.forEach((stepDefinition) => {
        const setupKey = stepDefinition.setupKey;
        if (!setupKey || seenSetupKeys.has(setupKey)) return;

        seenSetupKeys.add(setupKey);
        const setupHandler = window.registerStepSetupHandlers?.[setupKey];
        if (typeof setupHandler === "function") {
            setupHandler({ stepDefinition, els });
        }
    });
}

export const registerStepSetupHandlers = {
    phones({ els }) {
        if (!els || !els.phonesList || els.phonesList.dataset.stepSetupBound === "true") return;

        if (!Array.isArray(window.registerPhoneEntries) || !window.registerPhoneEntries.length) {
            window.registerPhoneEntries = window.registerCreatePhoneEntry 
                ? [window.registerCreatePhoneEntry({ is_primary: true, has_whatsapp: true })]
                : [];
        }

        if (typeof window.registerRenderPhones === 'function') {
            window.registerRenderPhones();
        }

        if (els.addPhoneBtn) {
            els.addPhoneBtn.addEventListener("click", () => {
                if (window.registerGetPhoneEntries && window.registerCreatePhoneEntry) {
                    window.registerGetPhoneEntries().push(window.registerCreatePhoneEntry());
                    window.registerRenderPhones();
                    if (window.registerCheckCurrentStepVisibility) {
                        window.registerCheckCurrentStepVisibility({ preserveReveal: true, preserveCurrentStep: true, skipScroll: true });
                    }
                }
            });
        }

        let registerPhoneDebounceTimer;
        els.phonesList.addEventListener("input", async (event) => {
            const index = parseInt(event.target?.dataset?.phoneIndex || "-1", 10);
            if (Number.isNaN(index) || index < 0) return;

            if (event.target.classList.contains("register-phone-number-input")) {
                const AuthValidators = window.AuthValidators;
                const normalized = AuthValidators ? AuthValidators.normalizePhone(event.target.value || "") : (event.target.value || "");
                
                if (window.registerGetPhoneEntries) {
                    const entries = window.registerGetPhoneEntries();
                    if (entries[index]) entries[index].number = normalized;
                }
                event.target.value = normalized;

                const entry = window.registerGetPhoneEntries ? window.registerGetPhoneEntries()[index] : null;
                if (entry?.is_primary) {
                    // ✅ Immediately invalidate verification and hide Next button
                    if (window.registerVerifiedPhones) window.registerVerifiedPhones.delete(normalized);

                    // 🚀 Instant feedback: show "Checking" immediately before the debounce
                    if (normalized && normalized.replace(/\D/g, "").length >= 12 && window.RegisterState) {
                         const errorMsg = window.RegisterErrorManager ? window.RegisterErrorManager.getMessage('register_phone_verifying') : 'register_phone_verifying';
                         window.RegisterState.updateField('phone', normalized, 'checking', errorMsg);
                    }

                    if (window.registerCheckCurrentStepVisibility) {
                        window.registerCheckCurrentStepVisibility({ preserveReveal: true, preserveCurrentStep: true, skipScroll: true });
                    }

                    // 🛡️ Debounce execution for the actual API call
                    if (registerPhoneDebounceTimer) clearTimeout(registerPhoneDebounceTimer);

                    registerPhoneDebounceTimer = setTimeout(() => {
                        if (typeof window.registerPerformPhoneDuplicationCheck === 'function') {
                            window.registerPerformPhoneDuplicationCheck(normalized);
                        }
                    }, 1200); // Slightly faster debounce
                }
            }

            if (window.registerCheckCurrentStepVisibility) {
                window.registerCheckCurrentStepVisibility({ preserveReveal: true, preserveCurrentStep: true, skipScroll: true });
            }
        });

        els.phonesList.addEventListener("change", (event) => {
            const index = parseInt(event.target?.dataset?.phoneIndex || "-1", 10);
            if (Number.isNaN(index) || index < 0) return;

            if (event.target.classList.contains("register-phone-primary-input")) {
                if (typeof window.registerSetPrimaryPhone === 'function') {
                    window.registerSetPrimaryPhone(index);
                }

                // ✅ Fetch fresh entries after update to ensure we use the new state
                const updatedEntries = window.registerGetPhoneEntries ? window.registerGetPhoneEntries() : [];
                const newPrimary = updatedEntries[index];

                if (typeof window.registerRenderPhones === 'function') {
                    window.registerRenderPhones();
                }

                // ✅ Hide Next button until new primary is verified
                if (window.registerCheckCurrentStepVisibility) {
                    window.registerCheckCurrentStepVisibility({ preserveReveal: true, preserveCurrentStep: true, skipScroll: true });
                }

                // ✅ Re-validate the newly selected primary phone immediately
                if (newPrimary && newPrimary.number && typeof window.registerPerformPhoneDuplicationCheck === 'function') {
                    window.registerPerformPhoneDuplicationCheck(newPrimary.number);
                }

                // 🚀 Sync with RegisterState
                if (window.RegisterState) {
                    window.RegisterState.updateField('phone', newPrimary?.number || '', 'idle');
                }
            }

            if (event.target.classList.contains("register-phone-whatsapp-input")) {
                const entries = window.registerGetPhoneEntries ? window.registerGetPhoneEntries() : [];
                const isChecked = !!event.target.checked;

                if (entries[index]) {
                    // Update state
                    entries[index].has_whatsapp = isChecked;

                    // Primary MUST have whatsapp
                    if (entries[index].is_primary && !isChecked) {
                        entries[index].has_whatsapp = true;
                    }
                }

                // ✅ Always re-render to update the visual "active" state of the labels
                if (typeof window.registerRenderPhones === 'function') {
                    window.registerRenderPhones();
                }
            }

            if (window.registerCheckCurrentStepVisibility) {
                window.registerCheckCurrentStepVisibility({ preserveReveal: true, preserveCurrentStep: true, skipScroll: true });
            }
        });

        els.phonesList.addEventListener("click", (event) => {
            const removeBtn = event.target.closest(".register-phone-remove-btn");
            if (!removeBtn) return;

            const index = parseInt(removeBtn.dataset.phoneIndex || "-1", 10);
            if (Number.isNaN(index) || index < 0) return;

            if (window.registerGetPhoneEntries && window.registerCreatePhoneEntry) {
                const entries = window.registerGetPhoneEntries();
                const removedPrimary = !!entries[index]?.is_primary;
                entries.splice(index, 1);

                if (!entries.length) {
                    entries.push(window.registerCreatePhoneEntry({ is_primary: true, has_whatsapp: true }));
                } else if (removedPrimary || !entries.some((entry) => entry.is_primary)) {
                    if (typeof window.registerSetPrimaryPhone === 'function') {
                        window.registerSetPrimaryPhone(0);
                    }
                }

                if (typeof window.registerRenderPhones === 'function') {
                    window.registerRenderPhones();
                }
                if (window.registerCheckCurrentStepVisibility) {
                    window.registerCheckCurrentStepVisibility({ preserveReveal: true, preserveCurrentStep: true, skipScroll: true });
                }
            }
        });

        els.phonesList.dataset.stepSetupBound = "true";
    },

    categories({ els }) {
        if (!els || !els.businessCategoryBtn || els.businessCategoryBtn.dataset.stepSetupBound === "true") return;

        els.businessCategoryBtn.addEventListener("click", async () => {
            try {
                if (!window.appCategoriesList && typeof window.fetchAppCategories === "function") {
                    await window.fetchAppCategories();
                }

                let currentSelection = {};
                if (els.businessCategoryJson.value) {
                    try {
                        currentSelection = JSON.parse(els.businessCategoryJson.value);
                    } catch (parseError) {
                        console.warn("[Register] Invalid category JSON, resetting selection.", parseError);
                        currentSelection = {};
                    }
                }

                if (window.CategoryTreeModal) {
                    const result = await window.CategoryTreeModal.show(currentSelection);
                    if (result) {
                        els.businessCategoryJson.value = JSON.stringify(result);
                        window.CategoryTreeModal.renderDetailedSelection(result, els.businessCategoryDisplay);

                        // 🚀 Manually trigger input event so DraftManager saves it
                        els.businessCategoryJson.dispatchEvent(new Event('input', { bubbles: true }));
                        if (window.RegisterDraftManager?.saveNow) {
                            window.RegisterDraftManager.saveNow();
                        }

                        if (typeof window.registerCheckCurrentStepVisibility === "function") {
                            window.registerCheckCurrentStepVisibility({ preserveReveal: true, preserveCurrentStep: true, skipScroll: true });
                        }
                        if (window.RegisterUxEngine?.syncStepUI) {
                            window.RegisterUxEngine.syncStepUI();
                        } else if (typeof window.registerSyncDeliveryGroupForCategories === "function") {
                            window.registerSyncDeliveryGroupForCategories();
                        }
                    }
                }
            } catch (error) {
                console.error("[Register] Failed to open category selector:", error);
                if (typeof window.AuthUI !== "undefined" && typeof window.AuthUI.showError === "function") {
                    window.AuthUI.showError(
                        window.langu("gen_swal_error_title") || "خطأ",
                        window.langu("cat_empty_list_error") || "حدث خطأ عند تحميل الفئات"
                    );
                }
            }
        });

        // Initialize Voice STT for Business Bio
        if (window.VoiceSTTManager && document.getElementById('btn-voice-register-bio')) {
            window.VoiceSTTManager.init('register_business_bio', 'btn-voice-register-bio');
        }

        els.businessCategoryBtn.dataset.stepSetupBound = "true";
    },

    location() {
        if (window.__registerMapMessageBound) return;
        window.addEventListener("message", registerHandleMapMessage);
        window.__registerMapMessageBound = true;
    },

    rating({ els }) {
        if (!els) return;
        if (els.ratingEnabledInput && els.ratingModeGroup && els.ratingEnabledInput.dataset.stepSetupBound !== "true") {
            const syncRatingModeVisibility = () => {
                els.ratingModeGroup.style.display = els.ratingEnabledInput.checked ? "block" : "none";
            };
            els.ratingEnabledInput.addEventListener("change", syncRatingModeVisibility);
            syncRatingModeVisibility();
            els.ratingEnabledInput.dataset.stepSetupBound = "true";
        }

        if (els.productRatingEnabledInput && els.productRatingModeGroup && els.productRatingEnabledInput.dataset.stepSetupBound !== "true") {
            const syncProductRatingModeVisibility = () => {
                els.productRatingModeGroup.style.display = els.productRatingEnabledInput.checked ? "block" : "none";
            };
            els.productRatingEnabledInput.addEventListener("change", syncProductRatingModeVisibility);
            syncProductRatingModeVisibility();
            els.productRatingEnabledInput.dataset.stepSetupBound = "true";
        }
    }
};

export function registerHandleMapMessage(event) {
    const els = window.registerGetElements ? window.registerGetElements() : null;
    if (!els) return;

    if (typeof window.registerIsTrustedMapMessage === 'function' && !window.registerIsTrustedMapMessage(event)) {
        return;
    }

    if (event.data && event.data.type === "LOCATION_SELECTED") {
        const coords = event.data.coordinates;
        console.log("[Register] Map location selected:", coords);

        if (els.coordsInput) els.coordsInput.value = coords;
        if (typeof window.registerSetMapStatus === 'function') {
            window.registerSetMapStatus(window.langu("register_map_restored") || "تم تحديد الموقع بنجاح");
        }
        if (window.registerLocationsApi?.handleDraftMutation) {
            window.registerLocationsApi.handleDraftMutation();
        }
        if (window.registerLocationsApi && typeof window.registerLocationsApi.render === "function") {
            window.registerLocationsApi.render();
        }
    } else if (event.data && event.data.type === "LOCATION_RESET") {
        if (els.coordsInput) els.coordsInput.value = "";
        if (typeof window.registerSetMapStatus === 'function') {
            window.registerSetMapStatus("");
        }
        if (window.registerLocationsApi?.handleDraftMutation) {
            window.registerLocationsApi.handleDraftMutation();
        }
        if (window.registerLocationsApi && typeof window.registerLocationsApi.render === "function") {
            window.registerLocationsApi.render();
        }
    }

    if (window.registerCheckCurrentStepVisibility) {
        window.registerCheckCurrentStepVisibility({ preserveReveal: true, preserveCurrentStep: true, skipScroll: true });
    }
}

// Hybrid bridge
window.registerSetupListeners = registerSetupListeners;
window.registerSetupStepBehaviors = registerSetupStepBehaviors;
window.registerStepSetupHandlers = registerStepSetupHandlers;
window.registerHandleMapMessage = registerHandleMapMessage;

console.log("[ESM Load] register-listeners.js: Hybrid bridge established.");
