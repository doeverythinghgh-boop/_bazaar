/**
 * @file pages/register/js/register-dom-contract.js
 * @description Validates critical DOM contracts for register/profile pages.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


(function initRegisterDomContract(globalScope) {
    "use strict";

    if (!globalScope) return;
    if (globalScope.RegisterDomContract) return;

    const CONTRACTS = {
        shared: ["register_form", "reg-wizard-container", "reg-submit-btn", "header-injection-point"],
        register: ["reg-wizard-footer", "reg-role-description", "reg-recover-banner"],
        profile: ["pm-wizard-footer", "pm-save-btn-label", "reg-recover-banner"]
    };

    function getMode(modeHint) {
        if (modeHint) return modeHint;
        return window.location.pathname.includes("profile-modal") ? "profile" : "register";
    }

    function validate(modeHint = null) {
        const mode = getMode(modeHint);
        const requiredIds = [...CONTRACTS.shared, ...(CONTRACTS[mode] || [])];
        const missing = requiredIds.filter((id) => !document.getElementById(id));

        if (missing.length) {
            console.warn("[RegisterDomContract] Missing required DOM ids.", { mode, missing });
            return { valid: false, mode, missing };
        }

        if (window.RegisterDevLogger?.info) {
            window.RegisterDevLogger.info("DomContract", "DOM contract validated.", { mode, count: requiredIds.length });
        }
        return { valid: true, mode, missing: [] };
    }

    globalScope.RegisterDomContract = {
        validate
    };
})(window);
