/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */
(function() {
    if (!window.PharmacyProductManagerModule) return;
    const { utils } = window.PharmacyProductManagerModule;

    window.PharmacyProductManagerModule.data.merger = {
        /**
         * Merges custom products with catalog products to create a unified display list
         */
        mergeProducts: function(customProducts, catalogProducts) {
            if (customProducts.length > 0) {
                console.log("[Pharmacy] Inspecting first custom product structure:", customProducts[0]);
            }
            const customMap = new Map();
            customProducts.forEach(p => {
                const origId = utils.normalizeId(p.original_catalog_id || p.catalog_id);
                if (origId) {
                    customMap.set(origId, p);
                    console.log(` - Map Entry: CatalogID[${origId}] -> ProductID[${p.product_id || p.id}]`);
                }
            });

            const displayProducts = [];

            // Map catalog products to customized versions if they exist
            catalogProducts.forEach(catProd => {
                const catId = utils.normalizeId(catProd.id);
                let custom = customMap.get(catId);

                if (custom) {
                    displayProducts.push({
                        ...catProd, // Base catalog metadata
                        ...custom,   // Override with merchant customization
                        isCustomized: true,
                        displayId: catId // Use catalog ID for preference mapping
                    });

                    // If we matched via ID, remove from map to avoid duplicate in manual list
                    customMap.delete(catId);
                } else {
                    displayProducts.push({
                        ...catProd,
                        isCustomized: false,
                        displayId: catId
                    });
                }
            });

            // Add remaining merchant products (e.g., manually added items not in catalog)
            customProducts.forEach(p => {
                const pId = utils.normalizeId(p.product_id || p.id);
                const origId = utils.normalizeId(p.original_catalog_id || p.catalog_id || p.ref_id || p.id_original);

                // Skip if already processed via catalog mapping
                if (origId && !customMap.has(origId)) return;

                displayProducts.push({
                    ...p,
                    isCustomized: true,
                    displayId: pId
                });
            });

            return displayProducts;
        },

        /**
         * Finds a product record by ID in either the custom or catalog list
         */
        findProductForCustomization: function(customList, catalogList, targetId) {
            console.log(`[Pharmacy] Debug Matching: Searching for ID "${targetId}"`);

            // Debug: List all keys and values for the first custom product to find the ID
            if (customList.length > 0) {
                const first = customList[0];
                console.log(" - Full Keys in Custom Product:", Object.keys(first));
                for (let key in first) {
                    if (String(first[key]).includes(targetId)) {
                        console.log(` - Found Target ID "${targetId}" in field: "${key}" (Value: ${first[key]})`);
                    }
                }
            }

            // 1. Try custom products first (ID match)
            let product = customList.find(p => {
                const pOriginalId = utils.normalizeId(p.original_catalog_id || p.catalog_id || p.ref_id || p.id_original);
                const pProductId = utils.normalizeId(p.product_id || p.id);
                const match = (pOriginalId === targetId) || (pProductId === targetId);

                console.log(` - Comparing: Custom[original=${pOriginalId}, id=${pProductId}] vs Target[${targetId}]`);
                if (match) console.log(" - Match found in Custom List by ID:", p);
                return match;
            });

            // 2. Final Fallback to catalog
            if (!product) {
                product = catalogList.find(p => {
                    const catId = utils.normalizeId(p.id);
                    const match = (catId === targetId);
                    if (match) console.log(" - Match found in Catalog List:", p);
                    return match;
                });
            }
            return product;
        }
    };
    console.log("[Pharmacy-Manager] Data Merger loaded.");
})();
