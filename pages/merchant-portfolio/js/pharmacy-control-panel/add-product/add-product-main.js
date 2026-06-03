/**
 * @file add-product-main.js
 * @description Main entry point for the Pharmacy Add Product module.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

(function() {
    if (!window.PharmacyAddModule) return;

    window.pharmacySetupAddProductTab = function (userKey) {
        if (!userKey) {
            console.error("[PharmacyAddProduct] userKey is required.");
            return;
        }

        console.log("[Pharmacy-Add-Module] Module setup initiated for userKey: " + userKey);

        const module = window.PharmacyAddModule;
        module.state.userKey = userKey;

        // Finalize module exports for global access (backward compatibility)
        window.pharmacyProductFormController = {
            prefillForEdit: (prod) => module.form.prefillForEdit(prod),
            refreshCategories: () => module.data.api.loadInitialData(),
            resetFormToAddMode: () => module.form.resetFormToAddMode()
        };

        window.pharmacyPreFillAddProductForm = module.form.prefillForEdit;

        // Start initialization
        module.controller.init();
    };

    console.log("[Pharmacy-Add-Module] Main entry point ready.");
})();
