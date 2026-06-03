/**
 * @file add-product-form-submit.js
 * @description Submit handler for pharmacy product management.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */
(function () {
    if (!window.PharmacyAddModule) return;
    const { utils, state, data } = window.PharmacyAddModule;

    window.PharmacyAddModule.form = window.PharmacyAddModule.form || {};
    window.PharmacyAddModule.form.handleSubmit = async function () {
        console.log("[Pharmacy] Starting save process...");
        const submitBtn = utils.getEl('btn-submit-product');

        console.log("[Pharmacy] Collecting values for validation...");
        const nameArEl = utils.getEl('product-name-ar');
        const nameEnEl = utils.getEl('product-name-en');
        const mainCatEl = utils.getEl('main-category');
        const subCatEl = utils.getEl('sub-category');

        const nameAr = nameArEl ? nameArEl.value.trim() : '';
        const nameEn = nameEnEl ? nameEnEl.value.trim() : '';
        const mainCat = mainCatEl ? mainCatEl.value : '';
        const subCat = subCatEl ? subCatEl.value : '';

        console.log(` - Arabic Name: "${nameAr}"`);
        console.log(` - English Name: "${nameEn}"`);
        console.log(` - Main Category: "${mainCat}"`);
        console.log(` - Sub Category: "${subCat}"`);

        let isValid = true;

        const showError = (el, msg) => {
            if (!el) return;
            el.style.border = '2px solid #ef4444';
            let errSpan = el.parentNode.querySelector('.validation-err');
            if (!errSpan) {
                errSpan = document.createElement('span');
                errSpan.className = 'validation-err';
                errSpan.style.color = '#ef4444';
                errSpan.style.fontSize = '0.8rem';
                errSpan.style.marginTop = '4px';
                errSpan.style.display = 'block';
                el.parentNode.insertBefore(errSpan, el.nextSibling);
            }
            errSpan.textContent = msg;
            const clearFn = () => { el.style.border = ''; errSpan.remove(); };
            el.addEventListener('input', clearFn, { once: true });
            el.addEventListener('change', clearFn, { once: true });
        };

        document.querySelectorAll('.validation-err').forEach(e => e.remove());
        [nameArEl, nameEnEl, mainCatEl, subCatEl].forEach(el => { if (el) el.style.border = ''; });

        if (!mainCat) {
            console.warn("[Pharmacy] Validation Error: Main Category is empty!");
            showError(mainCatEl, typeof window.pharmacyL === 'function' ? window.pharmacyL('pharmacy_add_main_cat_label') : 'يرجى اختيار الفئة الرئيسية');
            isValid = false;
        }
        if (!subCat) {
            console.warn("[Pharmacy] Validation Error: Sub Category is empty!");
            showError(subCatEl, typeof window.pharmacyL === 'function' ? window.pharmacyL('pharmacy_add_sub_cat_label') : 'يرجى اختيار الفئة الفرعية');
            isValid = false;
        }
        if (!nameAr) {
            console.warn("[Pharmacy] Validation Error: Arabic Name is empty!");
            showError(nameArEl, typeof window.pharmacyL === 'function' ? window.pharmacyL('pharmacy_add_name_ar_label') : 'يرجى إدخال اسم المنتج بالعربية');
            isValid = false;
        }
        if (!nameEn) {
            console.warn("[Pharmacy] Validation Error: English Name is empty!");
            showError(nameEnEl, typeof window.pharmacyL === 'function' ? window.pharmacyL('pharmacy_add_name_en_label') : 'يرجى إدخال اسم المنتج بالإنجليزية');
            isValid = false;
        }

        if (!isValid) {
            console.error("[Pharmacy] Save halted due to field validation failure.");
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'warning',
                    title: typeof window.pharmacyL === 'function' ? window.pharmacyL('required_fields_title') : 'حقول مطلوبة',
                    text: typeof window.pharmacyL === 'function' ? window.pharmacyL('required_fields_text') : 'يرجى ملء الحقول المحددة باللون الأحمر',
                    customClass: {
                        popup: 'swal-modern-mini-popup',
                        confirmButton: 'swal-modern-mini-confirm'
                    }
                });
            }
            return;
        }

        console.log("[Pharmacy] All required fields validated. Disabling submit button and starting upload...");
        if (submitBtn) {
            submitBtn.disabled = true;
            const loaderText = typeof window.pharmacyL === 'function' ? window.pharmacyL('saving_loader') : 'جاري رفع وحفظ المنتج...';
            submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${loaderText}`;
        }

        try {
            console.log("[Pharmacy] Step 1: Processing and uploading image...");
            const finalImageName = (data.api && typeof data.api.uploadPendingImage === 'function')
                ? await data.api.uploadPendingImage()
                : undefined;
            console.log(`[Pharmacy] Image upload result: ${finalImageName || 'No new image uploaded'}`);

            console.log("[Pharmacy] Step 2: Collecting final form data payload...");
            const payload = (data.logic && typeof data.logic.collectFormPayload === 'function')
                ? data.logic.collectFormPayload(finalImageName)
                : {};

            if (!state.currentEditingProductId && typeof finalImageName === 'undefined') {
                payload.image_names = state.oldImageName || null;
            }
            console.log("[Pharmacy] Collected payload prepared for transmission:", payload);

            console.log("[Pharmacy] Step 3: Sending request to API...");
            const response = await window.PharmacyAPI.saveMerchantProduct(payload);
            console.log("[Pharmacy] Product saved successfully in database!");

            if (payload.original_catalog_id) {
                const finalId = payload.product_id || response?.product_id || response?.id;
                if (finalId) {
                    window.pharmacyCatalogToMerchantMap = window.pharmacyCatalogToMerchantMap || {};
                    window.pharmacyCatalogToMerchantMap[String(payload.original_catalog_id)] = {
                        ...payload,
                        product_id: finalId
                    };
                    console.log(`[Pharmacy-System] Catalog map updated for Catalog ID: ${payload.original_catalog_id}`);
                }
            }

            console.log("[Pharmacy] Step 4: Invalidating cache...");
            window.PharmacyAPI.invalidateCatalogContext(state.userKey);

            if (window.pharmacyPendingCatalogHideId) {
                console.log(`[Pharmacy] Step 5: Ensuring original catalog product (${window.pharmacyPendingCatalogHideId}) remains visible after customization...`);
                const prefState = window.globalPreferenceState;
                if (prefState && prefState.hidden_catalog_products.has(String(window.pharmacyPendingCatalogHideId))) {
                    prefState.hidden_catalog_products.delete(String(window.pharmacyPendingCatalogHideId));
                    const prefsData = {
                        hidden_main_categories: Array.from(prefState.hidden_main_categories),
                        hidden_sub_categories: Array.from(prefState.hidden_sub_categories),
                        hidden_catalog_products: Array.from(prefState.hidden_catalog_products)
                    };
                    await window.PharmacyAPI.savePreferences(state.userKey, prefsData);
                    console.log("[Pharmacy] Store preferences updated successfully; customized catalog product is visible.");
                }
                delete window.pharmacyPendingCatalogHideId;
            }

            if (typeof Swal !== 'undefined') {
                await Swal.fire({
                    icon: 'success',
                    title: state.currentEditingProductId
                        ? (typeof window.pharmacyL === 'function' ? window.pharmacyL('save_success_edit') : 'تمت تحديث المنتج')
                        : (typeof window.pharmacyL === 'function' ? window.pharmacyL('save_success_add') : 'تمت إضافة المنتج'),
                    text: typeof window.pharmacyL === 'function' ? window.pharmacyL('product_details_saved') : 'تم حفظ تفاصيل المنتج بجميع البيانات بنجاح.',
                    confirmButtonText: typeof window.pharmacyL === 'function' ? window.pharmacyL('view_products_btn') : 'مشاهدة قائمة الخدمات',
                    customClass: {
                        popup: 'swal-modern-mini-popup',
                        confirmButton: 'swal-modern-mini-confirm'
                    }
                });
            }

            if (state.currentEditingProductId && finalImageName && state.oldImageName && typeof window.deleteFile2cf === 'function') {
                console.log(`[Pharmacy] Deleting old image: ${state.oldImageName}`);
                try { await window.deleteFile2cf(state.oldImageName); } catch (e) { console.warn(" - Old image deletion failed", e); }
            }

            if (window.pharmacyMerchantProductsUI?.loadProducts) {
                console.log("[Pharmacy] Reloading product list in the UI...");
                await window.pharmacyMerchantProductsUI.loadProducts(state.userKey);
            }

            console.log("[Pharmacy] Resetting form and returning to product management tab...");
            if (typeof window.PharmacyAddModule.form.resetFormToAddMode === 'function') {
                window.PharmacyAddModule.form.resetFormToAddMode();
            }
            const productsTabBtn = document.querySelector('.navbar-menu li[data-tab="products-tab"]');
            if (productsTabBtn) productsTabBtn.click();

        } catch (error) {
            console.error("[Pharmacy] Product save failed (Exception):", error);
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                const updateLabel = typeof window.pharmacyL === 'function' ? window.pharmacyL('update_product_btn') : 'تحديث بيانات المنتج';
                const addLabel = typeof window.pharmacyL === 'function' ? window.pharmacyL('pharmacy_add_submit_btn') : 'حفظ وإضافة المنتج';

                submitBtn.innerHTML = state.currentEditingProductId
                    ? `${updateLabel} <i class="fas fa-save"></i>`
                    : `${addLabel} <i class="fas fa-check"></i>`;
            }
        }
    };
})();
