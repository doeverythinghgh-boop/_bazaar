/**
 * @file pages/merchant-portfolio/js/pharmacy/pharmacy-ui-init.js
 * @description Entry points and bridge functions for pharmacy storefront.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


(function () {
    const { ensureFilteredProductsContainer } = window.pharmacyUILayout;
    window.portfolioRenderPharmacyCatalog = async function (options = {}) {
        const isPharmacy = !!(options.isPharmacy && !options.append && !window.portfolioState?.showFeaturedOnly);
        if (!isPharmacy) return false;

        if (window.pharmacyUICategories && typeof window.pharmacyUICategories.renderPharmacyCatalog === 'function') {
            await window.pharmacyUICategories.renderPharmacyCatalog(options.grid);
        }
        return true;
    };

    window.portfolioShowPharmacySubCatsInline = function(category, skipClear) {
        if (window.pharmacyUICategories && typeof window.pharmacyUICategories.showPharmacySubCategories === 'function') {
            window.pharmacyUICategories.showPharmacySubCategories(category, skipClear);
        }
    };
    window.portfolioEnsurePharmacyContainer = ensureFilteredProductsContainer;
})();
