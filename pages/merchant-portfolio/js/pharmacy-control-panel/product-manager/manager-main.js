/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */
(function() {
    if (!window.PharmacyProductManagerModule) return;
    const { data, ui, handlers, state } = window.PharmacyProductManagerModule;

    /**
     * Entry point: Orchestrates opening the product management modal for a sub-category
     */
    async function pharmacyOpenProductManagement(subCatId, subCatTitle) {
        console.log(`[Pharmacy-Swal-Diagnostic] Lifecycle: Management requested for SubCategory=${subCatId} (${subCatTitle})`);

        ui.renderer.showLoading();

        try {
            // 1. Fetch Parallel Data
            const [customList, catalogList] = await data.fetcher.fetchSubCategoryProducts(subCatId);
            console.log(`[Pharmacy-Swal-Diagnostic] Lifecycle: Data retrieved. Custom=${customList.length}, Catalog=${catalogList.length}`);

            // 2. Merge Data
            const displayProducts = data.merger.mergeProducts(customList, catalogList);
            
            // 3. ASYNC Transition: Ensure loading modal closes and event loop settles before opening manager modal
            Swal.close();
            
            requestAnimationFrame(() => {
                ui.renderer.renderManagementModal(subCatTitle, subCatId, displayProducts);
            });
            
        } catch (error) {
            console.error(`[Pharmacy-Swal-Diagnostic] Lifecycle: Management open failed.`, error);
            if (Swal.isVisible()) {
                Swal.close();
            }
        }
    }

    // Export functions to window object for backward compatibility with DOM onclick handlers
    window.pharmacyOpenProductManagement = pharmacyOpenProductManagement;
    window.pharmacyToggleProductVisibility = handlers.toggleVisibility;
    window.pharmacyCustomizeCatalogProduct = handlers.customizeProduct;
    window.pharmacyResolveSubCategoryForProduct = state.sync.resolveSubCategory;
    window.pharmacyCountHiddenProductsForSubCategory = state.sync.countHiddenProducts;

    console.log("[Pharmacy-Manager] All modules loaded and ready.");
})();
