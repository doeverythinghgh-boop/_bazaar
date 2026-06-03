/**
 * @file pages/register/js/register-listener-services.js
 * @description Listener binding services for register wizard.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


window.RegisterListenerServices = (function () {
    "use strict";

    function bindMediaInputs(els) {
        if (els.avatarPickBtn && els.avatarPickBtn.dataset.bound !== "true") {
            els.avatarPickBtn.addEventListener("click", () => els.avatarInput && els.avatarInput.click());
            els.avatarPickBtn.dataset.bound = "true";
        }
        if (els.avatarCameraBtn && els.avatarCameraBtn.dataset.bound !== "true") {
            els.avatarCameraBtn.addEventListener("click", registerHandleCameraTrigger);
            els.avatarCameraBtn.dataset.bound = "true";
        }
        if (els.avatarTrigger && els.avatarTrigger.dataset.bound !== "true") {
            els.avatarTrigger.addEventListener("click", () => els.avatarInput && els.avatarInput.click());
            els.avatarTrigger.dataset.bound = "true";
        }
        if (els.avatarInput && els.avatarInput.dataset.bound !== "true") {
            els.avatarInput.addEventListener("change", registerHandleAvatarChange);
            els.avatarInput.dataset.bound = "true";
        }

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

        document.querySelectorAll(".reg-cover-slot-input").forEach((input) => {
            if (input.dataset.bound === "true") return;
            input.addEventListener("change", (event) => {
                const index = Number(input.id.split("-").pop());
                registerHandleCoverChange(index, event);
            });
            input.dataset.bound = "true";
        });
    }

    function bindSubmitAndRole(els) {
        if (els.form && window.regWizard?.mode !== window.WIZARD_MODES?.PROFILE) {
            els.form.addEventListener("submit", registerHandleSubmit);
        }

        if (els.roleCheckboxes) {
            els.roleCheckboxes.forEach((chk) => {
                chk.addEventListener("change", registerUpdateRoleDescription);
            });
        }
    }

    function bindLiveValidation() {
        const liveFields = registerGetLiveValidationElements();
        liveFields.forEach((field) => {
            if (!field) return;
            if (field.classList.contains("register-phone-number-input")) return;
            if (field.dataset.liveValidationBound === "true") return;
            field.addEventListener("input", () => {
                registerCheckCurrentStepVisibility({ preserveReveal: true, preserveCurrentStep: true, skipScroll: true });
            });
            field.dataset.liveValidationBound = "true";
        });
    }

    function bindPasswordToggles() {
        // Handled via event delegation in register-ux-engine.js for better dynamic compatibility.
    }

    function bindStateAndDraft(els) {
        document.querySelectorAll('[data-js$="-input"]').forEach((input) => {
            if (input.dataset.stateDraftBound === "true") return;
            input.addEventListener("input", (e) => {
                if (window.RegisterState) {
                    window.RegisterState.updateField(e.target.id, e.target.value, "idle");
                    if (window.RegisterDraftManager) window.RegisterDraftManager.saveDraft();
                }
            });
            input.dataset.stateDraftBound = "true";
        });

        if (!els.form || els.form.dataset.stateDraftFormBound === "true") return;
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
        els.form.dataset.stateDraftFormBound = "true";
    }

    function syncManagers() {
        if (window.RegisterUxEngine) window.RegisterUxEngine.init();
        if (window.registerLocationsApi) {
            window.registerLocationsApi.bindUiOnce();
            window.registerLocationsApi.render();
        }
        if (window.registerSocialLinksApi) {
            window.registerSocialLinksApi.bindAddButtonsOnce();
            window.registerSocialLinksApi.renderVisibilityFromValues();
        }
        if (window.RegisterDeliveryPartnerManager) {
            window.RegisterDeliveryPartnerManager.bindUiOnce();
        }
    }

    function bindDynamicStepDom(els = registerGetElements()) {
        bindMediaInputs(els);
        bindLiveValidation();
        bindPasswordToggles(els);
        bindStateAndDraft(els);
        syncManagers();
    }

    return {
        bindMediaInputs,
        bindSubmitAndRole,
        bindLiveValidation,
        bindPasswordToggles,
        bindStateAndDraft,
        syncManagers,
        bindDynamicStepDom
    };
})();
