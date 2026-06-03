/**
 * @file add-product-form-prefill.js
 * @description Prefill logic for pharmacy product editing.
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
    const { utils, state, ui, data } = window.PharmacyAddModule;

    window.PharmacyAddModule.form = window.PharmacyAddModule.form || {};
    window.PharmacyAddModule.form.prefillForEdit = function(product) {
        if (!state.categories || state.categories.length === 0) {
            console.log("[Pharmacy] Categories not loaded yet, queueing product for prefill...");
            state.pendingPrefill = product;
            return;
        }

        console.log("[Pharmacy] Starting form prefill with data...", product);
        if (typeof window.PharmacyAddModule.form.resetFormToAddMode === 'function') {
            window.PharmacyAddModule.form.resetFormToAddMode();
        }

        state.currentEditingProductId = product.product_id || null;
        state.oldImageName = product.image_names || product.image || null;
        console.log(`[Pharmacy] State: Product=${state.currentEditingProductId}, Image=${state.oldImageName}`);

        if (product.original_catalog_id) {
            window.pharmacyPendingCatalogHideId = product.original_catalog_id;
            console.log(`[Pharmacy] Active catalog link: ${product.original_catalog_id}`);
        }

        const submitBtn = utils.getEl('btn-submit-product');
        if (submitBtn) {
            if (state.currentEditingProductId) {
                const label = typeof window.pharmacyL === 'function' ? window.pharmacyL('update_product_btn') : 'تحديث بيانات المنتج';
                submitBtn.innerHTML = `${label} <i class="fas fa-save"></i>`;
            } else {
                const label = typeof window.pharmacyL === 'function' ? window.pharmacyL('pharmacy_add_submit_btn') : 'حفظ وإضافة المنتج';
                submitBtn.innerHTML = `${label} <i class="fas fa-check"></i>`;
            }
        }

        console.log("[Pharmacy] Configuring categories...");
        const mainSelect = utils.getEl('main-category');
        if (mainSelect) {
            mainSelect.value = product.custom_main_cat_id || '';
            window.PharmacyAddModule.controller.handleMainCategoryChange(mainSelect.value);
        }

        const subSelect = utils.getEl('sub-category');
        if (subSelect) {
            subSelect.value = product.custom_sub_cat_id || '';
        }

        const detailsSection = utils.getEl('product-details-section');
        if ((product.custom_sub_cat_id || product.custom_main_cat_id) && detailsSection) {
            detailsSection.classList.remove('hidden');
        }

        const fieldMap = {
            'product-name-ar': product.name_ar || '',
            'product-name-en': product.name_en || '',
            'product-price': product.price || '',
            'product-discount': product.discount || 0,
            'product-stock': product.stock_quantity || 100,
            'product-barcode': product.barcode || '',
            'product-brand-ar': product.brand_ar || '',
            'product-brand-en': product.brand_en || '',
            'product-manufacturer': product.manufacturer || '',
            'product-description': product.description || ''
        };

        Object.entries(fieldMap).forEach(([id, value]) => {
            const el = utils.getEl(id);
            if (el) el.value = value;
        });

        if (utils.getEl('product-rx')) {
            utils.getEl('product-rx').checked = (product.is_prescription_required == 1 || product.is_prescription_required === true);
        }
        if (utils.getEl('product-status')) {
            utils.getEl('product-status').value = String(product.status ?? 1);
        }

        console.log("[Pharmacy] Restoring strengths and forms...");
        if (data.logic && typeof data.logic.fillCheckboxes === 'function') {
            data.logic.fillCheckboxes('product-form-grid', product.form_ref);
            data.logic.fillCheckboxes('product-strength-grid', product.strength_ref);
        }

        let activeIngredients = [];
        try {
            activeIngredients = typeof product.active_ingredients === 'string'
                ? JSON.parse(product.active_ingredients)
                : (product.active_ingredients || []);
        } catch (error) {
            console.warn("[Pharmacy] Error processing ingredients:", error);
        }

        if (Array.isArray(activeIngredients) && utils.getEl('product-ingredients')) {
            const ingText = activeIngredients.map(item => {
                if (typeof item === 'string') return item;
                return item.name_ar || item.name_en || '';
            }).filter(Boolean).join(', ');
            utils.getEl('product-ingredients').value = ingText;
        }

        if (state.oldImageName) {
            ui.media.setImagePreview(state.oldImageName);
        }

        console.log("[Pharmacy] Prefill operation completed successfully.");
    };
})();
