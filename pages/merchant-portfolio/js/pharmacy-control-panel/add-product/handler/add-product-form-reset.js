/**
 * @file add-product-form-reset.js
 * @description Form reset logic for pharmacy product management.
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
    const { utils, state, ui, CONSTANTS } = window.PharmacyAddModule;

    window.PharmacyAddModule.form = window.PharmacyAddModule.form || {};
    window.PharmacyAddModule.form.resetFormToAddMode = function() {
        console.log("[Pharmacy] Resetting form to default state.");
        state.currentEditingProductId = null;
        state.oldImageName = null;
        window.pendingProductImage = null;

        if (window.pharmacyPendingCatalogHideId && !window.pharmacyIsCustomizing) {
            console.log(`[Pharmacy] Catalog link for product (${window.pharmacyPendingCatalogHideId}) removed for data cleanup.`);
            delete window.pharmacyPendingCatalogHideId;
        }

        const submitBtn = utils.getEl('btn-submit-product');
        if (submitBtn) {
            const label = typeof window.pharmacyL === 'function' ? window.pharmacyL('pharmacy_add_submit_btn') : 'حفظ وإضافة المنتج';
            submitBtn.innerHTML = `${label} <i class="fas fa-check"></i>`;
        }

        utils.getEl('product-name-ar').value = CONSTANTS.FORM_DEFAULTS.nameAr;
        utils.getEl('product-price').value = CONSTANTS.FORM_DEFAULTS.price;
        utils.getEl('product-name-en').value = CONSTANTS.FORM_DEFAULTS.nameEn;
        utils.getEl('product-description').value = CONSTANTS.FORM_DEFAULTS.description;
        utils.getEl('product-discount').value = CONSTANTS.FORM_DEFAULTS.discount;
        utils.getEl('product-stock').value = CONSTANTS.FORM_DEFAULTS.stock;
        utils.getEl('product-barcode').value = CONSTANTS.FORM_DEFAULTS.barcode;
        utils.getEl('product-brand-ar').value = CONSTANTS.FORM_DEFAULTS.brandAr;
        utils.getEl('product-brand-en').value = CONSTANTS.FORM_DEFAULTS.brandEn;
        utils.getEl('product-manufacturer').value = CONSTANTS.FORM_DEFAULTS.manufacturer;
        utils.getEl('product-rx').checked = CONSTANTS.FORM_DEFAULTS.rx;
        utils.getEl('product-ingredients').value = CONSTANTS.FORM_DEFAULTS.ingredients;
        utils.getEl('product-status').value = CONSTANTS.FORM_DEFAULTS.status;

        const checkboxGrids = document.querySelectorAll('.pharmacy-checkbox-grid');
        checkboxGrids.forEach(grid => {
            grid.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                cb.checked = false;
                cb.closest('.pharmacy-checkbox-item')?.classList.remove('selected');
            });
        });

        ui.media.setImagePreview('');

        const detailsSection = utils.getEl('product-details-section');
        if (detailsSection) detailsSection.classList.add('hidden');

        const mainSelect = utils.getEl('main-category');
        if (mainSelect) mainSelect.value = '';

        const subSelect = utils.getEl('sub-category');
        if (subSelect) {
            const placeholder = typeof window.pharmacyL === 'function' ? window.pharmacyL('pharmacy_add_sub_cat_placeholder') : '-- اختر الفئة الفرعية --';
            subSelect.innerHTML = `<option value="">${placeholder}</option>`;
            subSelect.value = '';
            subSelect.disabled = true;
        }
    };
})();
