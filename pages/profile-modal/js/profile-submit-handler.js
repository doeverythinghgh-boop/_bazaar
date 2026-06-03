/**
 * @file pages/profile-modal/js/profile-submit-handler.js
 * @description Processes the Profile Wizard submission and synchronizes changes with UserService.
 * Refactored to use specialized services (Media, Account).
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


window.ProfileSubmitHandler = (function () {
    'use strict';

    function profileLog(message, payload) {
        if (window.RegisterDevLogger) {
            window.RegisterDevLogger.info("ProfileSubmit", message, payload);
            return;
        }
        if (payload === undefined) {
            console.log(`[ProfileSubmit] ${message}`);
            return;
        }
        console.log(`[ProfileSubmit] ${message}`, payload);
    }

    async function handleSave() {
        profileLog("Starting profile update submission.");

        if (window.regWizard.isSubmitting) return;
        window.regWizard.isSubmitting = true;

        if (window.AuthUI) {
            window.AuthUI.showLoading(window.langu ? window.langu("profile_saving_loader") : "جاري حفظ التعديلات...");
        }

        try {
            const pipeline = window.ProfileSubmitPipeline;
            if (!pipeline) throw new Error("ProfileSubmitPipeline is missing.");

            const wizData = window.RegisterState.getFullState();
            const fields = wizData.fields;
            const currentUser = window.UserService.get();
            const userKey = currentUser.user_key;

            profileLog(`Preparing update for user ${userKey}.`);

            // 0. Domain Validation (Safeguard)
            pipeline.validateBusinessLocationRequirement();
            if (window.regWizard.isBusinessAccount && window.RegisterDeliveryPartnerManager) {
                const skipDeliveryPartner = typeof window.registerHasDeliveryServiceCategorySelection === "function"
                    && window.registerHasDeliveryServiceCategorySelection();
                const deliveryValid = skipDeliveryPartner || window.RegisterDeliveryPartnerManager.validate({ silent: false });
                if (!deliveryValid) {
                    throw new Error("يرجى اختيار مقدم خدمة توصيل واحد قبل الحفظ.");
                }
            }

            // 1. Password Verification Logic
            profileLog("Validating password change flow.");
            const passwordCtx = await pipeline.validatePasswordChangeIfRequested(fields, currentUser);
            const newPassword = passwordCtx.newPassword;

            // 2. Handle Media Uploads (Via Service)
            profileLog("Uploading pending media.");
            const media = await pipeline.uploadMedia(userKey);

            // 3. Prepare Payload
            profileLog("Building update payload.");
            const updates = pipeline.buildUpdates(fields, currentUser, media);

            if (newPassword) {
                profileLog("Password update requested.");
                updates.password = newPassword;
            }

            // 3.5 Check for changes
            const hasSignificantUpdates = typeof pipeline.areUpdatesSignificant === "function"
                ? pipeline.areUpdatesSignificant(updates, currentUser)
                : true;
            if (!hasSignificantUpdates) {
                if (window.regWizard.isBusinessAccount && window.RegisterDeliveryPartnerManager) {
                    profileLog("No profile field changes detected. Synchronizing delivery provider relation.");
                    await window.RegisterDeliveryPartnerManager.syncSellerRelation(userKey);
                    if (window.AuthUI) window.AuthUI.close();
                    if (window.SWAL_UTILITY) {
                        await window.SWAL_UTILITY.alert({
                            titleKey: "profile_save_success_title",
                            textKey: "profile_save_success_text",
                            icon: "success"
                        });
                    }
                    window.regWizard.isSubmitting = false;
                    return;
                }
                profileLog("No significant changes detected. Skipping update.");
                if (window.AuthUI) window.AuthUI.close();
                if (window.SWAL_UTILITY) {
                    await window.SWAL_UTILITY.alert({
                        titleKey: "profile_no_changes_title",
                        textKey: "profile_no_changes_detected",
                        icon: "info"
                    });
                }
                window.regWizard.isSubmitting = false;
                return;
            }

            profileLog("Payload ready.", {
                user_key: updates.user_key,
                account_type: updates.account_type
            });

            // 4. API Call
            profileLog("Dispatching profile update request.");
            const result = await pipeline.submitUpdates(updates);
            profileLog("Profile update response received.");

            if (result && !result.error) {
                const confirmedUser = window.UserService.mergeUser(currentUser, result);
                if (window.regWizard.isBusinessAccount && window.RegisterDeliveryPartnerManager) {
                    await window.RegisterDeliveryPartnerManager.syncSellerRelation(userKey);
                }
                window.UserService.save(confirmedUser);

                if (window.SWAL_UTILITY) {
                    await window.SWAL_UTILITY.alert({
                        titleKey: "profile_save_success_title",
                        textKey: "profile_save_success_text",
                        icon: "success"
                    });
                }

                if (window.RegisterDraftManager) {
                    window.RegisterDraftManager.clearDraft();
                }

                // Redirect to portfolio after success
                window.location.href = `/pages/merchant-portfolio/merchant-portfolio.html?user_key=${encodeURIComponent(userKey)}`;
            } else {
                throw new Error(result?.error || "API Update failed");
            }

        } catch (error) {
            const normalized = window.RegisterErrorUtils?.logError
                ? window.RegisterErrorUtils.logError("ProfileSubmitHandler", "Profile update failed.", error)
                : { message: error?.message || "Unknown error" };
            if (window.SWAL_UTILITY) {
                window.SWAL_UTILITY.alert({
                    titleKey: "gen_swal_error_title",
                    text: normalized.message,
                    icon: "error"
                });
            }
        } finally {
            if (window.AuthUI) window.AuthUI.close();
            window.regWizard.isSubmitting = false;
        }
    }

    return {
        handleSave
    };
})();

// Bind form submission
document.addEventListener('submit', (e) => {
    if (e.target.id === 'register_form' && window.regWizard?.mode === 'PROFILE') {
        e.preventDefault();
        window.ProfileSubmitHandler.handleSave();
    }
});
