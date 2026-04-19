/**
 * @file pages/register/js/register-listeners.js
 * @description Event listener setup for the registration page.
 */

function registerSetupListeners() {
    if (window.__registerListenersBound) {
        console.log("[Register] Listeners already bound, skipping.");
        return;
    }
    window.__registerListenersBound = true;

    console.log("[Register] Setting up listeners...");
    const els = registerGetElements();

    if (els.avatarPickBtn) els.avatarPickBtn.addEventListener("click", () => els.avatarInput && els.avatarInput.click());
    if (els.avatarCameraBtn) els.avatarCameraBtn.addEventListener("click", registerHandleCameraTrigger);
    if (els.avatarTrigger) els.avatarTrigger.addEventListener("click", () => els.avatarInput && els.avatarInput.click());
    if (els.avatarInput) els.avatarInput.addEventListener("change", registerHandleAvatarChange);

    document.querySelectorAll('[id^="reg-cover-pick-"]').forEach((btn) => {
        if (btn.dataset.bound === "true") return;
        btn.addEventListener("click", () => {
            const index = Number(btn.id.split("-").pop());
            const input = document.getElementById(`reg-cover-input-${index}`);
            if (input) input.click();
        });
        btn.dataset.bound = "true";
    });

    document.querySelectorAll('[id^="reg-cover-camera-"]').forEach((btn) => {
        if (btn.dataset.bound === "true") return;
        btn.addEventListener("click", () => {
            const index = Number(btn.id.split("-").pop());
            registerTriggerSlotCamera(index);
        });
        btn.dataset.bound = "true";
    });

    document.querySelectorAll('[id^="reg-cover-delete-"]').forEach((btn) => {
        if (btn.dataset.bound === "true") return;
        btn.addEventListener("click", () => {
            const index = Number(btn.id.split("-").pop());
            registerDeleteCoverSlot(index);
        });
        btn.dataset.bound = "true";
    });

    document.querySelectorAll('.reg-cover-slot-input').forEach((input) => {
        if (input.dataset.bound === "true") return;
        input.addEventListener("change", (event) => {
            const index = Number(input.id.split("-").pop());
            registerHandleCoverChange(index, event);
        });
        input.dataset.bound = "true";
    });

    
    // 💠 Handle Optional Sections Collapsibles (Delegated on Container)

    if (els.form) {
        els.form.addEventListener("submit", registerHandleSubmit);
    }

    if (els.roleCheckboxes) {
        els.roleCheckboxes.forEach((chk) => {
            chk.addEventListener("change", registerUpdateRoleDescription);
        });
    }

    const liveFields = registerGetLiveValidationElements();
    liveFields.forEach((field) => {
        if (!field) return;
        // 🛡️ Skip immediate live validation for phone numbers to prevent API bombarding
        // Phone numbers are handled by their own debounced listener below.
        if (field.classList.contains("register-phone-number-input")) return;

        field.addEventListener("input", () => {
            registerCheckCurrentStepVisibility({ preserveReveal: true, preserveCurrentStep: true, skipScroll: true });
        });
    });

    if (els.passwordToggleIcon && els.password) {
        els.passwordToggleIcon.addEventListener("click", () => {
            registerTogglePasswordVisibility(els.password, els.passwordToggleIcon);
        });
    }
    if (els.confirmPasswordToggleIcon && els.confirmPassword) {
        els.confirmPasswordToggleIcon.addEventListener("click", () => {
            registerTogglePasswordVisibility(els.confirmPassword, els.confirmPasswordToggleIcon);
        });
    }

    // New UX & State Listeners
    document.querySelectorAll('[data-js$="-input"]').forEach(input => {
        input.addEventListener('input', (e) => {
            if (window.RegisterState) {
                // Determine the logical field ID (alias). 
                // We prefer data-field-group from the wrapper, or fallback to the input's own ID-to-alias mapping.
                const groupWrapper = e.target.closest('[data-field-group]');
                const fieldId = groupWrapper ? groupWrapper.getAttribute('data-field-group') : e.target.id;
                
                window.RegisterState.updateField(fieldId, e.target.value, 'idle');
                
                // Trigger debounced save
                if (window.RegisterDraftManager) window.RegisterDraftManager.saveDraft();
            }
        });
    });

    if (els.form) {
        const persistDraft = (event) => {
            const target = event?.target;
            if (target?.type === "file") return;
            if (window.RegisterDraftManager) window.RegisterDraftManager.saveDraft();
            if (typeof registerCheckCurrentStepVisibility === "function") {
                registerCheckCurrentStepVisibility({ preserveReveal: true, preserveCurrentStep: true, skipScroll: true });
            }
        };
        els.form.addEventListener("input", persistDraft);
        els.form.addEventListener("change", persistDraft);
    }

    if (window.RegisterUxEngine) window.RegisterUxEngine.init();

    // Locations manager (multi) - safe no-op if step not loaded yet
    if (window.registerLocationsApi) {
        window.registerLocationsApi.bindUiOnce();
        window.registerLocationsApi.render();
    }

    // Social links manager (multi) - safe no-op if step not loaded yet
    if (window.registerSocialLinksApi) {
        window.registerSocialLinksApi.bindAddButtonsOnce();
        window.registerSocialLinksApi.renderVisibilityFromValues();
    }
}

function registerSetupStepBehaviors() {
    const definitions = typeof window.registerGetAllStepDefinitions === "function"
        ? window.registerGetAllStepDefinitions()
        : [];

    const seenSetupKeys = new Set();
    definitions.forEach((stepDefinition) => {
        const setupKey = stepDefinition.setupKey;
        if (!setupKey || seenSetupKeys.has(setupKey)) return;

        seenSetupKeys.add(setupKey);
        const setupHandler = window.registerStepSetupHandlers?.[setupKey];
        if (typeof setupHandler === "function") {
            setupHandler({ stepDefinition, els: registerGetElements() });
        }
    });
}

window.registerStepSetupHandlers = {
    phones({ els }) {
        if (!els.phonesList || els.phonesList.dataset.stepSetupBound === "true") return;

        if (!Array.isArray(window.registerPhoneEntries) || !window.registerPhoneEntries.length) {
            window.registerPhoneEntries = [registerCreatePhoneEntry({ is_primary: true, has_whatsapp: true })];
        }

        registerRenderPhones();

        if (els.addPhoneBtn) {
            els.addPhoneBtn.addEventListener("click", () => {
                registerGetPhoneEntries().push(registerCreatePhoneEntry());
                registerRenderPhones();
                registerCheckCurrentStepVisibility({ preserveReveal: true, preserveCurrentStep: true, skipScroll: true });
            });
        }

        let registerPhoneDebounceTimer;
        els.phonesList.addEventListener("input", async (event) => {
            const index = parseInt(event.target?.dataset?.phoneIndex || "-1", 10);
            if (Number.isNaN(index) || index < 0) return;

            if (event.target.classList.contains("register-phone-number-input")) {
                const normalized = AuthValidators.normalizePhone(event.target.value || "");
                registerGetPhoneEntries()[index].number = normalized;
                event.target.value = normalized;

                const entry = registerGetPhoneEntries()[index];
                if (entry?.is_primary) {
                    // ✅ Immediately invalidate verification and hide Next button
                    if (window.registerVerifiedPhones) window.registerVerifiedPhones.delete(normalized);
                    
                    // 🚀 Instant feedback: show "Checking" immediately before the debounce
                    if (normalized && normalized.replace(/\D/g, "").length >= 12 && window.RegisterState) {
                         const errorMsg = window.RegisterErrorManager ? window.RegisterErrorManager.getMessage('register_phone_verifying') : 'register_phone_verifying';
                         window.RegisterState.updateField('phone', normalized, 'checking', errorMsg);
                    }

                    registerCheckCurrentStepVisibility({ preserveReveal: true, preserveCurrentStep: true, skipScroll: true });

                    // 🛡️ Debounce execution for the actual API call
                    if (registerPhoneDebounceTimer) clearTimeout(registerPhoneDebounceTimer);

                    registerPhoneDebounceTimer = setTimeout(() => {
                        registerPerformPhoneDuplicationCheck(normalized);
                    }, 1200); // Slightly faster debounce
                }
            }

            registerCheckCurrentStepVisibility({ preserveReveal: true, preserveCurrentStep: true, skipScroll: true });
        });

        els.phonesList.addEventListener("change", (event) => {
            const index = parseInt(event.target?.dataset?.phoneIndex || "-1", 10);
            if (Number.isNaN(index) || index < 0) return;

            if (event.target.classList.contains("register-phone-primary-input")) {
                const entries = registerGetPhoneEntries();

                registerSetPrimaryPhone(index);
                
                // ✅ Fetch fresh entries after update to ensure we use the new state
                const updatedEntries = registerGetPhoneEntries();
                const newPrimary = updatedEntries[index];

                registerRenderPhones();

                // ✅ Hide Next button until new primary is verified
                registerCheckCurrentStepVisibility({ preserveReveal: true, preserveCurrentStep: true, skipScroll: true });

                // ✅ Re-validate the newly selected primary phone immediately
                if (newPrimary && newPrimary.number) {
                    registerPerformPhoneDuplicationCheck(newPrimary.number);
                }

                // 🚀 Sync with RegisterState
                if (window.RegisterState) {
                    window.RegisterState.updateField('phone', newPrimary?.number || '', 'idle');
                }
            }

            if (event.target.classList.contains("register-phone-whatsapp-input")) {
                const entries = registerGetPhoneEntries();
                const isChecked = !!event.target.checked;
                
                // Update state
                entries[index].has_whatsapp = isChecked;

                // Primary MUST have whatsapp
                if (entries[index].is_primary && !isChecked) {
                    entries[index].has_whatsapp = true;
                }
                
                // ✅ Always re-render to update the visual "active" state of the labels
                registerRenderPhones();
            }

            registerCheckCurrentStepVisibility({ preserveReveal: true, preserveCurrentStep: true, skipScroll: true });
        });

        els.phonesList.addEventListener("click", (event) => {
            const removeBtn = event.target.closest(".register-phone-remove-btn");
            if (!removeBtn) return;

            const index = parseInt(removeBtn.dataset.phoneIndex || "-1", 10);
            if (Number.isNaN(index) || index < 0) return;

            const entries = registerGetPhoneEntries();
            const removedPrimary = !!entries[index]?.is_primary;
            entries.splice(index, 1);

            if (!entries.length) {
                entries.push(registerCreatePhoneEntry({ is_primary: true, has_whatsapp: true }));
            } else if (removedPrimary || !entries.some((entry) => entry.is_primary)) {
                registerSetPrimaryPhone(0);
            }

            registerRenderPhones();
            registerCheckCurrentStepVisibility({ preserveReveal: true, preserveCurrentStep: true, skipScroll: true });
        });

        els.phonesList.dataset.stepSetupBound = "true";
    },

    categories({ els }) {
        if (!els.businessCategoryBtn || els.businessCategoryBtn.dataset.stepSetupBound === "true") return;

        els.businessCategoryBtn.addEventListener("click", async () => {
            try {
                if (!window.appCategoriesList && typeof fetchAppCategories === "function") {
                    await fetchAppCategories();
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

                const result = await CategoryTreeModal.show(currentSelection);
                if (result) {
                    els.businessCategoryJson.value = JSON.stringify(result);
                    CategoryTreeModal.renderDetailedSelection(result, els.businessCategoryDisplay);
                    
                    // 🚀 Manually trigger input event so DraftManager saves it
                    els.businessCategoryJson.dispatchEvent(new Event('input', { bubbles: true }));

                    if (typeof registerCheckCurrentStepVisibility === "function") {
                        registerCheckCurrentStepVisibility({ preserveReveal: true, preserveCurrentStep: true, skipScroll: true });
                    }
                }
            } catch (error) {
                console.error("[Register] Failed to open category selector:", error);
                if (typeof AuthUI !== "undefined" && typeof AuthUI.showError === "function") {
                    AuthUI.showError(
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

function registerHandleMapMessage(event) {
    const els = registerGetElements();

    if (!registerIsTrustedMapMessage(event)) {
        return;
    }

    if (event.data && event.data.type === "LOCATION_SELECTED") {
        const coords = event.data.coordinates;
        console.log("[Register] Map location selected:", coords);

        if (els.coordsInput) els.coordsInput.value = coords;
        registerSetMapStatus(window.langu("register_map_restored") || "تم تحديد الموقع بنجاح");
        if (window.registerLocationsApi && typeof window.registerLocationsApi.render === "function") {
            window.registerLocationsApi.render();
        }
    } else if (event.data && event.data.type === "LOCATION_RESET") {
        if (els.coordsInput) els.coordsInput.value = "";
        registerSetMapStatus("");
        if (window.registerLocationsApi && typeof window.registerLocationsApi.render === "function") {
            window.registerLocationsApi.render();
        }
    }

    registerCheckCurrentStepVisibility({ preserveReveal: true, preserveCurrentStep: true, skipScroll: true });
}
