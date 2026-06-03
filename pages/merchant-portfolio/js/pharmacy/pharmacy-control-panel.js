/**
 * @file pages/merchant-portfolio/js/pharmacy-control-panel.js
 * @description Pharmacy control panel bootstrapper.
 *
 * ⚠️ WARNING: DO NOT USE :hover OR tooltip/title attributes in this module.
 * This interface is optimized for touch/hybrid devices where hover states are unreliable.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


(function () {
    async function bootstrapPharmacyControlPanel() {
        if (typeof window.loadIndexTranslations === 'function') {
            await window.loadIndexTranslations();
        }

        if (typeof SessionManager !== 'undefined') {
            SessionManager.init();
        }

        // Inject the app header and mark the login/profile button as active.
        // The pharmacy control panel is reached through the merchant portfolio flow,
        // so the login button represents the current user's profile destination.
        if (typeof AppHeader !== 'undefined' && AppHeader.init) {
            await AppHeader.init('app-header-container', 'index-login-btn');
        }

        const userKey = new URLSearchParams(window.location.search).get('user_key');
        if (!userKey) {
            console.error("No user_key found in URL");
            return;
        }

        pharmacySetupTabNavigation();
        pharmacySetupCustomCatSubTabs();

        const context = await window.PharmacyAPI.getCatalogContext(userKey, { force: true });
        const preferenceState = pharmacyCreatePreferenceState(context.preferences, userKey);
        window.globalPreferenceState = preferenceState;
        window.pharmacyProductSubCategoryIndex = window.pharmacyProductSubCategoryIndex || {};

        const merchantProducts = await window.PharmacyAPI.fetchMerchantProducts(userKey);
        window.pharmacyCatalogToMerchantMap = {};

        merchantProducts.forEach(product => {
            if (product?.product_id && product?.custom_sub_cat_id) {
                window.pharmacyProductSubCategoryIndex[String(product.product_id)] = String(product.custom_sub_cat_id);
            }
            // Link catalog ID to merchant product for smart customization
            if (product?.original_catalog_id) {
                window.pharmacyCatalogToMerchantMap[String(product.original_catalog_id)] = product;
            }
        });

        console.log(`[Pharmacy-System] ️ Catalog mapping synchronized. ${Object.keys(window.pharmacyCatalogToMerchantMap).length} customized products indexed.`);


        pharmacyLoadCatalogData(preferenceState, userKey);
        pharmacySetupPreferenceSaving(preferenceState, userKey);
        pharmacySetupCustomCategoryLevelToggle();
        pharmacySetupCustomCategoryCreation(userKey);

        if (typeof window.pharmacySetupAddProductTab === 'function') {
            window.pharmacySetupAddProductTab(userKey);
        }

        if (window.pharmacyMerchantProductsUI?.loadProducts) {
            window.pharmacyMerchantProductsUI.loadProducts(userKey);

            const refreshBtn = document.getElementById('btn-refresh-products');
            if (refreshBtn) {
                refreshBtn.onclick = () => window.pharmacyMerchantProductsUI.loadProducts(userKey);
            }

            const productsTabBtn = document.querySelector('.navbar-menu li[data-tab="products-tab"]');
            if (productsTabBtn) {
                productsTabBtn.addEventListener('click', () => {
                    window.pharmacyMerchantProductsUI.loadProducts(userKey);
                });
            }
        }

        if (window.pharmacyCustomCatUI?.renderTree) {
            window.pharmacyCustomCatUI.renderTree(context.customCategories, context.catalogSource);
        }
    }

    document.addEventListener('DOMContentLoaded', bootstrapPharmacyControlPanel);
    window.bootstrapPharmacyControlPanel = bootstrapPharmacyControlPanel;
})();
