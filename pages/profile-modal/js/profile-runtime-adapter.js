/**
 * @file pages/profile-modal/js/profile-runtime-adapter.js
 * @description Adapter layer to isolate profile page from direct register internals usage.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


window.ProfileRuntimeAdapter = (function () {
    "use strict";

    function setModeProfile() {
        if (typeof window.registerSetWizardMode === "function" && window.WIZARD_MODES?.PROFILE) {
            window.registerSetWizardMode(window.WIZARD_MODES.PROFILE);
        }
    }

    function primeStateFromUser() {
        if (!window.ProfileDataBridge?.primeWizardState) return Promise.resolve(false);
        return window.ProfileDataBridge.primeWizardState();
    }

    function refreshRoleDescription() {
        if (typeof window.registerUpdateRoleDescription === "function") {
            window.registerUpdateRoleDescription();
            return;
        }
        if (typeof window.registerUpdateWizardTotalSteps === "function") {
            window.registerUpdateWizardTotalSteps();
        }
    }

    function renderPhones() {
        if (typeof window.registerRenderPhones === "function") {
            window.registerRenderPhones();
        }
    }

    function syncUx() {
        if (!window.RegisterUxEngine) return;
        if (typeof window.RegisterUxEngine.syncFieldValues === "function") {
            window.RegisterUxEngine.syncFieldValues();
        }
        if (typeof window.RegisterUxEngine.syncStepUI === "function") {
            window.RegisterUxEngine.syncStepUI();
        }
    }

    function renderLocations() {
        if (window.registerLocationsApi?.render) {
            window.registerLocationsApi.render();
        }
    }

    async function refreshStepVisibility(options = {}) {
        if (typeof window.registerCheckCurrentStepVisibility !== "function") return;
        await window.registerCheckCurrentStepVisibility(options);
    }

    function refreshWizardUi(lightMode = true) {
        if (typeof window.registerUpdateWizardUI === "function") {
            window.registerUpdateWizardUI(lightMode);
        }
    }

    return {
        setModeProfile,
        primeStateFromUser,
        refreshRoleDescription,
        renderPhones,
        syncUx,
        renderLocations,
        refreshStepVisibility,
        refreshWizardUi
    };
})();
