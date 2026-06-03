/**
 * @file add-product-controller.js
 * @description Orchestration logic for the Pharmacy Add Product module.
 *
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 */
(function() {
    if (!window.PharmacyAddModule) return;
    const { state, ui, utils, events, data } = window.PharmacyAddModule;

    const controller = {
        handleMainCategoryChange: function(selectedMainId) {
            const detailsSection = utils.getEl('product-details-section');
            const subSelect = utils.getEl('sub-category');

            if (detailsSection) detailsSection.classList.add('hidden');
            if (!subSelect) return;

            const placeholder = typeof window.pharmacyL === 'function' ? window.pharmacyL('pharmacy_add_sub_cat_placeholder') : '-- اختر الفئة الفرعية --';
            subSelect.innerHTML = `<option value="">${placeholder}</option>`;
            if (!selectedMainId) {
                subSelect.disabled = true;
                return;
            }

            const mainObject = state.categories.find(category => String(category.id) === String(selectedMainId));
            if (Array.isArray(mainObject?.sub) && mainObject.sub.length > 0) {
                subSelect.disabled = false;
                ui.populateSubCategories(mainObject.sub);
                return;
            }

            subSelect.disabled = true;
        },

        init: function() {
            console.log("[Pharmacy-Add-Module] Initializing controller...");
            events.bindCategoryEvents();
            events.bindImageEvents();
            events.bindSubmit();
            data.api.loadInitialData();
        }
    };

    window.PharmacyAddModule.controller = controller;
    console.log("[Pharmacy-Add-Module] Controller logic loaded.");
})();
