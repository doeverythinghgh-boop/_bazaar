/**
 * @file add-product-data-logic.js
 * @description Logic for collecting form payloads and prefilling for edit mode.
 *
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 */
(function() {
    if (!window.PharmacyAddModule) return;
    const { utils, state } = window.PharmacyAddModule;

    const dataLogic = {
        collectFormPayload: function(finalImageName) {
            const mainSelect = utils.getEl('main-category');
            const subSelect = utils.getEl('sub-category');

            const rawIngredients = utils.getEl('product-ingredients').value.trim();
            const activeIngredientsArray = rawIngredients
                ? rawIngredients.split(',').map(item => item.trim()).filter(Boolean)
                : null;

            const payload = {
                product_id: state.currentEditingProductId,
                merchant_key: state.userKey,
                main_category_id: mainSelect?.value || null,
                sub_category_id: subSelect?.value || null,
                name_ar: utils.getEl('product-name-ar').value.trim(),
                name_en: utils.getEl('product-name-en').value.trim() || null,
                price: utils.getEl('product-price').value.trim(),
                discount: utils.getEl('product-discount').value.trim() || 0,
                stock_quantity: utils.getEl('product-stock').value.trim() || 100,
                barcode: utils.getEl('product-barcode').value.trim() || null,
                brand_ar: utils.getEl('product-brand-ar').value.trim() || null,
                brand_en: utils.getEl('product-brand-en').value.trim() || null,
                manufacturer: utils.getEl('product-manufacturer').value.trim() || null,
                status: utils.getEl('product-status').value || 1,
                description: utils.getEl('product-description').value.trim() || null,
                is_prescription_required: utils.getEl('product-rx').checked,
                form_ref: (() => {
                    const vals = Array.from(document.querySelectorAll('#product-form-grid input:checked')).map(cb => cb.value);
                    console.log(`[Pharmacy] Collecting forms: [${vals.join(', ')}]`);
                    return vals.length > 0 ? vals : null;
                })(),
                strength_ref: (() => {
                    const vals = Array.from(document.querySelectorAll('#product-strength-grid input:checked')).map(cb => cb.value);
                    console.log(`[Pharmacy] Collecting strengths: [${vals.join(', ')}]`);
                    return vals.length > 0 ? vals : null;
                })(),
                active_ingredients: activeIngredientsArray
                    ? activeIngredientsArray.map(name => ({ name_ar: name, name_en: name }))
                    : null,
                original_catalog_id: window.pharmacyPendingCatalogHideId || null
            };

            if (typeof finalImageName !== 'undefined') {
                payload.image_names = finalImageName;
            }

            return payload;
        },

        fillCheckboxes: function(gridId, rawValues) {
            const container = utils.getEl(gridId);
            if (!container) {
                console.warn(`[Pharmacy] Grid container ${gridId} not found!`);
                return;
            }

            let values = rawValues;
            try {
                if (typeof values === 'string' && values.trim().startsWith('[')) {
                    values = JSON.parse(values);
                }
                if (Array.isArray(values) && values.length === 1 && typeof values[0] === 'string' && values[0].trim().startsWith('[')) {
                    values = JSON.parse(values[0]);
                }
            } catch (e) {
                console.warn(`[Pharmacy] JSON parse failed for values in ${gridId}:`, e);
            }

            if (!values || (Array.isArray(values) && values.length === 0)) {
                console.log(`[Pharmacy] No saved values for ${gridId}`);
                return;
            }

            const valArray = Array.isArray(values) ? values : [values];
            console.log(`[Pharmacy] Restoring grid values (${gridId}):`, valArray);

            let foundCount = 0;
            valArray.forEach(val => {
                const cleanVal = String(val).trim();
                const cb = container.querySelector(`input[value="${cleanVal}"]`);
                if (cb) {
                    cb.checked = true;
                    cb.closest('.pharmacy-checkbox-item')?.classList.add('selected');
                    foundCount++;
                } else {
                    console.warn(` - Value "${cleanVal}" not found in options for ${gridId}`);
                }
            });
            console.log(` - Checked ${foundCount} out of ${valArray.length} items.`);
        }
    };

    window.PharmacyAddModule.data.logic = dataLogic;
    console.log("[Pharmacy-Add-Module] Data processing logic loaded.");
})();
