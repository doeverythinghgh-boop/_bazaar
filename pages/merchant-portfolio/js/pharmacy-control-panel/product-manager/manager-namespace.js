/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */
(function() {
    window.PharmacyProductManagerModule = {
        state: {
            userKey: new URLSearchParams(window.location.search).get('user_key'),
            subCategoryIndex: window.pharmacyProductSubCategoryIndex || {}
        },
        utils: {},
        data: {},
        ui: {},
        handlers: {}
    };
    // Ensure the legacy global pointer stays updated
    window.pharmacyProductSubCategoryIndex = window.PharmacyProductManagerModule.state.subCategoryIndex;
    console.log("[Pharmacy-Manager] Namespace and State initialized.");
})();
