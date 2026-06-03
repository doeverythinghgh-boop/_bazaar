/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */
(function() {
    if (!window.PharmacyProductManagerModule) return;
    const { state } = window.PharmacyProductManagerModule;

    window.PharmacyProductManagerModule.data.fetcher = {
        /**
         * Fetches both merchant-specific and static catalog products for a sub-category
         */
        fetchSubCategoryProducts: async function(subCatId) {
            return await Promise.all([
                window.PharmacyAPI.getProductsBySubCategory(state.userKey, subCatId).catch(() => []),
                window.PharmacyAPI.getSubCategoryStaticProducts(subCatId).catch(() => [])
            ]);
        }
    };
    console.log("[Pharmacy-Manager] Data Fetcher loaded.");
})();
