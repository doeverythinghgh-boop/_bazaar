/**
 * @file add-product-ui-render.js
 * @description UI rendering logic for categories and checkbox grids.
 *
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 */
(function() {
    if (!window.PharmacyAddModule) return;
    const { utils, dom } = window.PharmacyAddModule;

    const ui = {
        populateCheckboxGrid: function(containerId, itemsObj, namePrefix) {
            const container = utils.getEl(containerId);
            if (!container) {
                console.error(`[Pharmacy] Container not found: ${containerId}`);
                return;
            }
            if (!itemsObj || Object.keys(itemsObj).length === 0) {
                console.warn(`[Pharmacy] No data to generate for: ${containerId}`);
                return;
            }

            container.innerHTML = '';
            console.log(`[Pharmacy] Generating ${Object.keys(itemsObj).length} items for: ${containerId}`);

            Object.entries(itemsObj).forEach(([key, val]) => {
                const labelText = (typeof val === 'object' && val !== null)
                    ? (window.app_language === 'en' ? (val.en || val.ar) : (val.ar || val.en))
                    : val;

                const item = document.createElement('label');
                item.className = 'pharmacy-checkbox-item';
                item.innerHTML = `
                    <input type="checkbox" name="${namePrefix}_refs" value="${key}">
                    <span>${labelText}</span>
                `;

                const checkbox = item.querySelector('input');
                checkbox.addEventListener('change', () => {
                    item.classList.toggle('selected', checkbox.checked);
                });

                container.appendChild(item);
            });
            console.log(` - Finished generating ${containerId}`);
        },

        populateMainCategories: function(data) {
            const mainSelect = utils.getEl('main-category');
            if (!mainSelect) return;
            const placeholder = typeof window.pharmacyL === 'function' ? window.pharmacyL('pharmacy_add_main_cat_placeholder') : '-- اختر الفئة الرئيسية --';
            mainSelect.innerHTML = `<option value="" data-lkey="pharmacy_add_main_cat_placeholder">${placeholder}</option>`;

            data.forEach(main => {
                const option = document.createElement('option');
                option.value = main.id;
                option.textContent = window.app_language === 'en' ? (main.name_en || main.title) : main.title;
                mainSelect.appendChild(option);
            });
        },

        populateSubCategories: function(subCategories) {
            const subSelect = utils.getEl('sub-category');
            if (!subSelect) return;
            const placeholder = typeof window.pharmacyL === 'function' ? window.pharmacyL('pharmacy_add_sub_cat_placeholder') : '-- اختر الفئة الفرعية --';
            subSelect.innerHTML = `<option value="" data-lkey="pharmacy_add_sub_cat_placeholder">${placeholder}</option>`;

            subCategories.forEach(sub => {
                const option = document.createElement('option');
                option.value = sub.id;
                option.textContent = window.app_language === 'en' ? (sub.name_en || sub.title) : sub.title;
                subSelect.appendChild(option);
            });
        }
    };

    window.PharmacyAddModule.ui = { ...window.PharmacyAddModule.ui, ...ui };
    console.log("[Pharmacy-Add-Module] UI Rendering logic loaded.");
})();
