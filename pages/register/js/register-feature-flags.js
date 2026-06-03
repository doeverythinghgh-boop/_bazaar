/**
 * @file pages/register/js/register-feature-flags.js
 * @description Runtime feature flags for register/profile wizard flows.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


(function initRegisterFeatureFlags(globalScope) {
    "use strict";

    if (!globalScope) return;
    if (globalScope.RegisterFeatureFlags) return;

    const defaults = {
        WIZARD_BOOTSTRAP_V2: true,
        PROFILE_PIPELINE_V2: true,
        DOM_CONTRACT_CHECKS: true,
        DEFER_NON_CRITICAL_INIT: true
    };

    const source = globalScope.__REGISTER_FEATURE_FLAGS__ || {};

    globalScope.RegisterFeatureFlags = Object.freeze({
        ...defaults,
        ...source
    });
})(window);
