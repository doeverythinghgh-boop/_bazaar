/**
 * @file add-product-data-api.js
 * @description API interactions for the Pharmacy Add Product module.
 *
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 */
(function() {
    if (!window.PharmacyAddModule) return;
    const { state, ui, data } = window.PharmacyAddModule;

    const apiActions = {
        loadInitialData: async function() {
            console.log("[Pharmacy] Loading initial data and reference lists...");
            const loader = document.getElementById('loader');
            try {
                const [context, referenceData] = await Promise.all([
                    window.PharmacyAPI.getCatalogContext(state.userKey, { force: true }),
                    window.PharmacyAPI.getReferenceData()
                ]);

                state.categories = Array.isArray(context?.mergedCategories) ? context.mergedCategories : [];
                console.log("[Pharmacy] Populating grids from reference data...");
                console.log(" - Forms count:", Object.keys(referenceData.forms || {}).length);
                console.log(" - Strengths count:", Object.keys(referenceData.strengths || {}).length);

                ui.populateCheckboxGrid('product-form-grid', referenceData.forms || {}, 'form');
                ui.populateCheckboxGrid('product-strength-grid', referenceData.strengths || {}, 'strength');

                ui.populateMainCategories(state.categories);

                if (state.pendingPrefill) {
                    console.log("[Pharmacy] Executing pending prefill after category load completion.");
                    const dataToFill = state.pendingPrefill;
                    state.pendingPrefill = null;
                    window.PharmacyAddModule.controller.prefillForEdit(dataToFill);
                }
            } catch (error) {
                console.error("[PharmacyAddProduct] Failed to load initial data:", error);
            } finally {
                if (loader) loader.style.display = 'none';
            }
        },

        uploadPendingImage: async function() {
            if (!window.pendingProductImage) return undefined;

            let finalImageName = `pharmacy_prod_${state.userKey}_${Date.now()}_${Math.random().toString(36).substring(7)}.webp`;
            if (typeof window.uploadFile2cf === 'function') {
                await window.uploadFile2cf(window.pendingProductImage, finalImageName);
            } else {
                finalImageName = window.pendingProductImage.name || finalImageName;
            }

            return finalImageName;
        }
    };

    window.PharmacyAddModule.data.api = apiActions;
    console.log("[Pharmacy-Add-Module] API Actions loaded.");
})();
