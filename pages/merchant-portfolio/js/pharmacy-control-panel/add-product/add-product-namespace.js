/**
 * @file add-product-namespace.js
 * @description Core namespace and state initialization for the Pharmacy Add Product module.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

(function() {
    window.PharmacyAddModule = {
        state: {
            userKey: null,
            categories: [],
            currentEditingProductId: null,
            oldImageName: null,
            pendingPrefill: null
        },
        dom: {},
        utils: {},
        ui: {},
        data: {},
        events: {},

        // Final init will be attached in main.js
    };

    console.log("[Pharmacy-Add-Module] Namespace and State initialized.");
})();
