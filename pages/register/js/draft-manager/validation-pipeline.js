/**
 * @file pages/register/js/draft-manager/validation-pipeline.js
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

(function() {
    'use strict';
    window.DraftManagerInternals = window.DraftManagerInternals || {};

    window.DraftManagerInternals.runSequentialRestoration = async function() {
        // 🛡️ SEQUENTIAL RESTORATION PIPELINE:
        // Re-validate fields in order to unblock Progressive Reveal
        console.log("[DraftRestoreDiag] Sequential restoration started.", {
            renderedSteps: document.querySelectorAll(".reg-step").length,
            activeSteps: typeof registerGetActiveWizardSteps === "function" ? registerGetActiveWizardSteps().length : null,
            usernameDomValue: document.getElementById("register_username")?.value || "",
            coordsDomValue: document.getElementById("register_coords")?.value || ""
        });
        window.DraftManagerInternals.syncPhoneValidationAfterRestore();
        window.DraftManagerInternals.syncPasswordValidationAfterRestore();
        window.DraftManagerInternals.syncLocationSelectionAfterRestore();

        if (typeof registerCheckCurrentStepVisibility === 'function') {
            await registerCheckCurrentStepVisibility({ preserveReveal: true, preserveCurrentStep: true, skipScroll: true });
        }
        if (typeof registerUpdateWizardUI === 'function') {
            registerUpdateWizardUI(true);
        }
        console.log("[DraftRestoreDiag] Sequential restoration finished.", {
            currentStep: window.regWizard?.currentStep,
            revealedStepCount: window.regWizard?.revealedStepCount,
            canSubmit: window.regWizard?.canSubmit,
            usernameDomValue: document.getElementById("register_username")?.value || "",
            coordsDomValue: document.getElementById("register_coords")?.value || ""
        });
    };

    window.DraftManagerInternals.syncPhoneValidationAfterRestore = function() {
        if (!window.RegisterState || !window.registerPhoneEntries || window.registerPhoneEntries.length === 0) return;
        const primaryPhone = window.registerPhoneEntries.find(p => p.is_primary) || window.registerPhoneEntries[0];
        if (!primaryPhone || !primaryPhone.number) return;

        const normalized = window.AuthValidators?.normalizePhone ? window.AuthValidators.normalizePhone(primaryPhone.number) : String(primaryPhone.number).trim();
        const isValidFormat = window.AuthValidators?.isValidPhone ? window.AuthValidators.isValidPhone(normalized) : normalized.replace(/\D/g, "").length >= 10;

        if (isValidFormat) {
            console.log(` [Sequential Restore] Verifying Phone: ${normalized}`);
            window.registerVerifiedPhones = window.registerVerifiedPhones || new Set();
            window.registerVerifiedPhones.add(normalized);
            window.RegisterState.updateField("phone", normalized, "valid", "register_phone_available");
        }
    };

    window.DraftManagerInternals.syncPasswordValidationAfterRestore = function() {
        if (!window.RegisterState) return;
        const pass = document.getElementById("register_password")?.value || "";
        const confirm = document.getElementById("register_confirm_password")?.value || "";

        if (!pass) return;

        const isValidPass = pass.length >= 4;
        if (isValidPass) {
            console.log(` [Sequential Restore] Validating Password`);
            window.RegisterState.updateField("password", pass, "valid");
        }

        if (isValidPass && pass === confirm) {
            window.RegisterState.updateField("confirmPassword", confirm, "valid", "✓");
        } else if (confirm) {
            window.RegisterState.updateField("confirmPassword", confirm, "invalid", "register_error_password_mismatch");
        }
    };

    window.DraftManagerInternals.syncLocationSelectionAfterRestore = function() {
        const locationsList = document.getElementById("reg-locations-list");
        if (!locationsList) return;

        const attemptSelection = () => {
            const firstRadio = locationsList.querySelector('input[type="radio"]');
            if (firstRadio && !firstRadio.checked) {
                console.log(` [Sequential Restore] Auto-selecting first location`);
                firstRadio.checked = true;
                firstRadio.dispatchEvent(new Event('change', { bubbles: true }));
                return true;
            }
            return !!firstRadio; // Return true if it's already checked or found
        };

        if (attemptSelection()) return;

        // If not rendered yet, wait for DOM mutations (API fetch takes time)
        const observer = new MutationObserver((mutations, obs) => {
            if (attemptSelection()) {
                obs.disconnect();
            }
        });

        observer.observe(locationsList, { childList: true, subtree: true });

        // Failsafe timeout
        setTimeout(() => observer.disconnect(), 3000);
    };

    window.DraftManagerInternals.syncIdentityValidationAfterRestore = function() {
        const usernameInput = document.getElementById("register_username");
        const username = usernameInput?.value || "";
        if (!usernameInput || !username.trim()) return;

        const validation = typeof registerValidateUsernameValue === "function"
            ? registerValidateUsernameValue(username)
            : { isValid: true };
        if (!validation.isValid) return;

        if (window.RegisterState) {
            window.RegisterState.updateField("username", username, "valid", "✓");
            window.RegisterState.updateField("register_username", username, "valid", "✓");
        }

        // 🎨 UI Polish: Ensure the UX Engine reflects the "complete" state
        if (window.RegisterUxEngine?.updateFieldFeedback) {
            window.RegisterUxEngine.updateFieldFeedback("username", "valid", "✓");
            window.RegisterUxEngine.updateFieldFeedback("register_username", "valid", "✓");
        } else {
            // Fallback if UX Engine is not ready
            const group = document.querySelector('[data-field-group="username"]');
            if (group) {
                group.setAttribute("data-state", "valid");
                group.classList.add("visible");
            }
        }
    };
})();
