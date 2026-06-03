/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */
(function() {
    if (!window.PharmacyProductManagerModule) return;
    const { data, utils } = window.PharmacyProductManagerModule;

    window.PharmacyProductManagerModule.handlers.customizeProduct = async function(productId, subCatId) {
        console.log(`[Pharmacy] Starting product customization for Catalog ID: ${productId}`);

        try {
            // Fetch fresh data for accurate mapping
            const [customList, catalogList] = await data.fetcher.fetchSubCategoryProducts(subCatId);
            const product = data.merger.findProductForCustomization(customList, catalogList, productId);

            if (!product) {
                console.error("[Pharmacy] Could not find product data for customization.");
                console.warn(`[Pharmacy-Swal-Diagnostic] Customize modal remained open. Reason: product data was not found. Product=${productId}, SubCategory=${subCatId}`);
                return false;
            }

            console.log("[Pharmacy] Raw product data for prefill:", product);

            const mainCat = window.globalCatalogData?.find(m => m.sub?.some(s => String(s.id) === String(subCatId)));

            // Robust Property Mapping
            const nameAr = utils.getFirst(product.title || product.name_ar || product.name || '');
            const nameEn = utils.getFirst(product.name_en || product.title_en || '');
            const imagePath = utils.getFirst(product.image || product.img || product.image_url || product.image_path || null);
            const rawIngredients = product.active_ingredients || product.ingredients || product.ingredients_ar || [];
            const description = utils.getFirst(product.description || product.desc || '');
            const price = utils.getFirst(product.price || '');
            const brandAr = utils.getFirst(product.brand_ar || product.brand || '');
            const brandEn = utils.getFirst(product.brand_en || '');

            // Ingredient Standardization
            let ingredients = Array.isArray(rawIngredients) ? rawIngredients : [];
            if (ingredients.length === 0 && (nameAr || nameEn)) {
                ingredients = [{ name_ar: nameAr, name_en: nameEn }];
            }

            ingredients = ingredients.map(ing => {
                const val = utils.getFirst(ing);
                return typeof val === 'string' ? { name_ar: val, name_en: val } : val;
            });

            // Smart Linking: Check if this catalog item is already customized by the merchant
            const existingMerchantProduct = window.pharmacyCatalogToMerchantMap ? window.pharmacyCatalogToMerchantMap[String(productId)] : null;

            if (existingMerchantProduct) {
                console.log(`[Pharmacy-Bridge] Existing customization detected for Catalog ID: ${productId}. Linking to Merchant Product ID: ${existingMerchantProduct.product_id}`);
            } else {
                console.log(`[Pharmacy-Bridge] No existing customization for Catalog ID: ${productId}. Starting new customization flow.`);
            }

            const productToUse = existingMerchantProduct || product;

            const prefillData = {
                product_id: productToUse.product_id || null,
                name_ar: productToUse.name_ar || nameAr,
                name_en: productToUse.name_en || nameEn,
                price: productToUse.price || price,
                description: productToUse.description || description,
                brand_ar: productToUse.brand_ar || brandAr,
                brand_en: productToUse.brand_en || brandEn,
                custom_main_cat_id: productToUse.custom_main_cat_id || mainCat?.id || null,
                custom_sub_cat_id: productToUse.custom_sub_cat_id || subCatId,
                image_names: productToUse.image_names || imagePath,
                active_ingredients: productToUse.active_ingredients || ingredients,
                is_prescription_required: (productToUse.is_prescription_required || productToUse.rx || productToUse.prescription) ? 1 : 0,
                original_catalog_id: productId,
                form_ref: productToUse.form_ref || null,
                strength_ref: productToUse.strength_ref || null
            };

            // Bridge state for cross-module communication
            window.pharmacyPendingCatalogHideId = productId;
            window.pharmacyIsCustomizing = true;

            const addTabBtn = document.querySelector('.navbar-menu li[data-tab="add-product-tab"]');
            if (addTabBtn) {
                console.log("[Pharmacy] Transitioning to Add Product tab...");
                addTabBtn.click();
            }

            if (typeof window.pharmacyPreFillAddProductForm === 'function') {
                window.pharmacyPreFillAddProductForm(prefillData);
                console.log("[Pharmacy] Prefill function called with full payload.");
                return true;
            }
            console.warn("[Pharmacy-Swal-Diagnostic] Customize modal remained open. Reason: pharmacyPreFillAddProductForm is not loaded.");
            return false;
        } catch (error) {
            console.error(`[Pharmacy-Swal-Diagnostic] Customize action failed. Product=${productId}, SubCategory=${subCatId}`, error);
            return false;
        } finally {
            window.pharmacyIsCustomizing = false;
        }
    };
    console.log("[Pharmacy-Manager] Customize Bridge loaded.");
})();
