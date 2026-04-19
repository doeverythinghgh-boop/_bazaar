/**
 * @file pages/merchant-portfolio/js/pharmacy-add-product.js
 * @description Pharmacy product form controller for add/edit workflows.
 */

(function () {
    const FORM_DEFAULTS = {
        nameAr: '',
        nameEn: '',
        price: '',
        description: '',
        discount: '0',
        stock: '100',
        barcode: '',
        brandAr: '',
        brandEn: '',
        manufacturer: '',
        rx: false,
        ingredients: '',
        status: '1'
    };

    function getEl(id) {
        return document.getElementById(id);
    }

    function getImageUrl(imageName) {
        if (!imageName) return '';
        return (typeof window.getPublicR2FileUrl === 'function')
            ? window.getPublicR2FileUrl(imageName)
            : ('/' + imageName);
    }

    function createProductFormController(userKey) {
        const loader = getEl('loader');
        const mainSelect = getEl('main-category');
        const subSelect = getEl('sub-category');
        const detailsSection = getEl('product-details-section');
        const submitBtn = getEl('btn-submit-product');
        const formSelect = getEl('product-form');
        const strengthSelect = getEl('product-strength');
        const imageInput = getEl('product-image');
        const imagePreview = getEl('profile-avatar-preview');
        const imagePlaceholder = getEl('profile-avatar-placeholder');
        const editIconWrapper = getEl('pm-avatar-edit-icon-wrapper');
        const pickBtn = getEl('profile-avatar-pick-btn');
        const cameraBtn = getEl('profile-avatar-camera-btn');

        const state = {
            userKey,
            categories: [],
            currentEditingProductId: null,
            oldImageName: null
        };

        function setImagePreview(imageName) {
            if (!imagePreview || !imagePlaceholder || !editIconWrapper) return;
            if (!imageName) {
                imagePreview.src = '';
                imagePreview.style.display = 'none';
                imagePlaceholder.style.display = 'block';
                editIconWrapper.style.display = 'flex';
                return;
            }

            imagePreview.src = getImageUrl(imageName);
            imagePreview.style.display = 'block';
            imagePlaceholder.style.display = 'none';
            editIconWrapper.style.display = 'none';
        }

        function resetFormToAddMode() {
            state.currentEditingProductId = null;
            state.oldImageName = null;
            window.pendingProductImage = null;

            if (submitBtn) submitBtn.innerHTML = 'حفظ وإضافة المنتج <i class="fas fa-check"></i>';

            getEl('product-name-ar').value = FORM_DEFAULTS.nameAr;
            getEl('product-price').value = FORM_DEFAULTS.price;
            getEl('product-name-en').value = FORM_DEFAULTS.nameEn;
            getEl('product-description').value = FORM_DEFAULTS.description;
            getEl('product-discount').value = FORM_DEFAULTS.discount;
            getEl('product-stock').value = FORM_DEFAULTS.stock;
            getEl('product-barcode').value = FORM_DEFAULTS.barcode;
            getEl('product-brand-ar').value = FORM_DEFAULTS.brandAr;
            getEl('product-brand-en').value = FORM_DEFAULTS.brandEn;
            getEl('product-manufacturer').value = FORM_DEFAULTS.manufacturer;
            getEl('product-rx').checked = FORM_DEFAULTS.rx;
            getEl('product-ingredients').value = FORM_DEFAULTS.ingredients;
            getEl('product-status').value = FORM_DEFAULTS.status;
            if (formSelect) formSelect.value = '';
            if (strengthSelect) strengthSelect.value = '';

            setImagePreview('');

            if (detailsSection) detailsSection.classList.add('hidden');
            if (mainSelect) mainSelect.value = '';
            if (subSelect) {
                subSelect.innerHTML = '<option value="">-- اختر الفئة الفرعية --</option>';
                subSelect.value = '';
                subSelect.disabled = true;
            }
        }

        function populateDropdown(selectElement, itemsObj) {
            if (!selectElement || !itemsObj) return;
            Object.entries(itemsObj).forEach(([key, val]) => {
                const option = document.createElement('option');
                option.value = key;
                option.textContent = (typeof val === 'object' && val !== null)
                    ? (window.app_language === 'en' ? (val.en || val.ar) : (val.ar || val.en))
                    : val;
                selectElement.appendChild(option);
            });
        }

        function populateMainCategories(data) {
            if (!mainSelect) return;
            mainSelect.innerHTML = '<option value="" data-lkey="pharmacy_add_main_cat_placeholder">-- اختر الفئة الرئيسية --</option>';

            data.forEach(main => {
                const option = document.createElement('option');
                option.value = main.id;
                option.textContent = window.app_language === 'en' ? (main.name_en || main.title) : main.title;
                mainSelect.appendChild(option);
            });
        }

        function populateSubCategories(subCategories) {
            if (!subSelect) return;
            subSelect.innerHTML = '<option value="">-- اختر الفئة الفرعية --</option>';

            subCategories.forEach(sub => {
                const option = document.createElement('option');
                option.value = sub.id;
                option.textContent = window.app_language === 'en' ? (sub.name_en || sub.title) : sub.title;
                subSelect.appendChild(option);
            });
        }

        function handleMainCategoryChange(selectedMainId) {
            if (detailsSection) detailsSection.classList.add('hidden');
            if (!subSelect) return;

            subSelect.innerHTML = '<option value="">-- اختر الفئة الفرعية --</option>';
            if (!selectedMainId) {
                subSelect.disabled = true;
                return;
            }

            const mainObject = state.categories.find(category => String(category.id) === String(selectedMainId));
            if (Array.isArray(mainObject?.sub) && mainObject.sub.length > 0) {
                subSelect.disabled = false;
                populateSubCategories(mainObject.sub);
                return;
            }

            subSelect.disabled = true;
        }

        function prefillForEdit(product) {
            resetFormToAddMode();
            state.currentEditingProductId = product.product_id;
            state.oldImageName = product.image_names || null;

            if (submitBtn) submitBtn.innerHTML = 'تحديث بيانات المنتج <i class="fas fa-save"></i>';

            if (mainSelect) {
                mainSelect.value = product.custom_main_cat_id || '';
                handleMainCategoryChange(mainSelect.value);
            }

            if (subSelect) {
                subSelect.value = product.custom_sub_cat_id || '';
                if (subSelect.value && detailsSection) detailsSection.classList.remove('hidden');
            }

            getEl('product-name-ar').value = product.name_ar || '';
            getEl('product-name-en').value = product.name_en || '';
            getEl('product-price').value = product.price || '';
            getEl('product-discount').value = product.discount || 0;
            getEl('product-stock').value = product.stock_quantity || 100;
            getEl('product-barcode').value = product.barcode || '';
            getEl('product-brand-ar').value = product.brand_ar || '';
            getEl('product-brand-en').value = product.brand_en || '';
            getEl('product-manufacturer').value = product.manufacturer || '';
            getEl('product-description').value = product.description || '';
            getEl('product-rx').checked = product.is_prescription_required == 1;
            getEl('product-status').value = String(product.status ?? 1);

            let activeIngredients = [];
            try {
                activeIngredients = typeof product.active_ingredients === 'string'
                    ? JSON.parse(product.active_ingredients)
                    : (product.active_ingredients || []);
            } catch (_) {
                activeIngredients = [];
            }

            if (Array.isArray(activeIngredients)) {
                getEl('product-ingredients').value = activeIngredients.map(item => item.name_ar || item.name_en || '').filter(Boolean).join(', ');
            }

            try {
                const forms = typeof product.form_ref === 'string' ? JSON.parse(product.form_ref) : product.form_ref;
                if (forms?.[0] && formSelect) formSelect.value = forms[0];
            } catch (_) {}

            try {
                const strengths = typeof product.strength_ref === 'string' ? JSON.parse(product.strength_ref) : product.strength_ref;
                if (strengths?.[0] && strengthSelect) strengthSelect.value = strengths[0];
            } catch (_) {}

            setImagePreview(product.image_names || '');
        }

        async function loadInitialData() {
            try {
                const [context, referenceData] = await Promise.all([
                    window.PharmacyAPI.getCatalogContext(userKey, { force: true }),
                    window.PharmacyAPI.getReferenceData()
                ]);

                state.categories = Array.isArray(context?.mergedCategories) ? context.mergedCategories : [];

                if (formSelect) {
                    formSelect.innerHTML = '<option value="" data-lkey="pharmacy_add_default_form">-- الجرعة الافتراضية --</option>';
                    populateDropdown(formSelect, referenceData.forms || {});
                }

                if (strengthSelect) {
                    strengthSelect.innerHTML = '<option value="" data-lkey="pharmacy_add_default_strength">-- افتراضي --</option>';
                    populateDropdown(strengthSelect, referenceData.strengths || {});
                }

                populateMainCategories(state.categories);
            } catch (error) {
                console.error("[PharmacyAddProduct] Failed to load initial data:", error);
                Swal.fire('خطأ', 'حدث خطأ أثناء تحميل الفئات، يرجى المحاولة لاحقاً', 'error');
            } finally {
                if (loader) loader.style.display = 'none';
            }
        }

        function collectFormPayload(finalImageName) {
            const rawIngredients = getEl('product-ingredients').value.trim();
            const activeIngredientsArray = rawIngredients
                ? rawIngredients.split(',').map(item => item.trim()).filter(Boolean)
                : null;

            const payload = {
                product_id: state.currentEditingProductId,
                merchant_key: userKey,
                main_category_id: mainSelect?.value || null,
                sub_category_id: subSelect?.value || null,
                name_ar: getEl('product-name-ar').value.trim(),
                name_en: getEl('product-name-en').value.trim() || null,
                price: getEl('product-price').value.trim(),
                discount: getEl('product-discount').value.trim() || 0,
                stock_quantity: getEl('product-stock').value.trim() || 100,
                barcode: getEl('product-barcode').value.trim() || null,
                brand_ar: getEl('product-brand-ar').value.trim() || null,
                brand_en: getEl('product-brand-en').value.trim() || null,
                manufacturer: getEl('product-manufacturer').value.trim() || null,
                status: getEl('product-status').value || 1,
                description: getEl('product-description').value.trim() || null,
                is_prescription_required: getEl('product-rx').checked,
                form_ref: formSelect?.value ? [formSelect.value] : null,
                strength_ref: strengthSelect?.value ? [strengthSelect.value] : null,
                active_ingredients: activeIngredientsArray
                    ? activeIngredientsArray.map(name => ({ name_ar: name, name_en: name }))
                    : null
            };

            if (typeof finalImageName !== 'undefined') {
                payload.image_names = finalImageName;
            }

            return payload;
        }

        async function uploadPendingImage() {
            if (!window.pendingProductImage) return undefined;

            let finalImageName = `pharmacy_prod_${userKey}_${Date.now()}_${Math.random().toString(36).substring(7)}.webp`;
            if (typeof window.uploadFile2cf === 'function') {
                await window.uploadFile2cf(window.pendingProductImage, finalImageName);
            } else {
                finalImageName = window.pendingProductImage.name || finalImageName;
            }

            return finalImageName;
        }

        async function handleSubmit() {
            const nameAr = getEl('product-name-ar').value.trim();
            const price = getEl('product-price').value.trim();

            if (!nameAr || !price) {
                Swal.fire({
                    icon: 'warning',
                    title: 'حقول مطلوبة',
                    text: 'يرجى إدخال اسم المنتج والسعر على الأقل',
                    confirmButtonText: 'حسناً'
                });
                return;
            }

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري رفع وحفظ المنتج...';

            try {
                const finalImageName = await uploadPendingImage();
                const payload = collectFormPayload(finalImageName);

                if (!state.currentEditingProductId && typeof finalImageName === 'undefined') {
                    payload.image_names = null;
                }

                await window.PharmacyAPI.saveMerchantProduct(payload);
                window.PharmacyAPI.invalidateCatalogContext(userKey);

                await Swal.fire({
                    icon: 'success',
                    title: state.currentEditingProductId ? 'تمت تحديث المنتج' : 'تمت إضافة المنتج',
                    text: 'تم حفظ تفاصيل المنتج بجميع البيانات بنجاح.',
                    confirmButtonText: 'مشاهدة قائمة المنتجات',
                    allowOutsideClick: false
                });

                if (state.currentEditingProductId && finalImageName && state.oldImageName && typeof window.deleteFile2cf === 'function') {
                    try {
                        await window.deleteFile2cf(state.oldImageName);
                    } catch (deleteError) {
                        console.warn("[PharmacyAddProduct] Failed to delete old image:", deleteError);
                    }
                }

                if (window.pharmacyMerchantProductsUI?.loadProducts) {
                    await window.pharmacyMerchantProductsUI.loadProducts(userKey);
                }

                resetFormToAddMode();

                const productsTabBtn = document.querySelector('.navbar-menu li[data-tab="products-tab"]');
                if (productsTabBtn) productsTabBtn.click();
            } catch (error) {
                console.error("[PharmacyAddProduct] Save failed:", error);
                Swal.fire('خطأ', 'حدث مشكلة أثناء حفظ بيانات الصيدلية', 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = state.currentEditingProductId
                    ? 'تحديث بيانات المنتج <i class="fas fa-save"></i>'
                    : 'حفظ وإضافة المنتج <i class="fas fa-check"></i>';
            }
        }

        function bindCategoryEvents() {
            if (mainSelect) {
                mainSelect.addEventListener('change', event => {
                    handleMainCategoryChange(event.target.value);
                });
            }

            if (subSelect) {
                subSelect.addEventListener('change', event => {
                    if (event.target.value) {
                        detailsSection.classList.remove('hidden');
                        setTimeout(() => {
                            detailsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 100);
                        return;
                    }

                    detailsSection.classList.add('hidden');
                });
            }
        }

        function bindImageEvents() {
            window.pendingProductImage = null;

            if (pickBtn) {
                pickBtn.onclick = () => {
                    imageInput.removeAttribute("capture");
                    imageInput.click();
                };
            }

            if (cameraBtn) {
                cameraBtn.onclick = () => {
                    imageInput.setAttribute("capture", "environment");
                    imageInput.click();
                };
            }

            if (imageInput) {
                imageInput.addEventListener('change', async event => {
                    const file = event.target.files?.[0];
                    if (!file) return;

                    try {
                        window.pendingProductImage = (typeof compressImage === 'function')
                            ? await compressImage(file, 600, 600, 0.8)
                            : file;

                        imagePreview.src = URL.createObjectURL(window.pendingProductImage);
                        imagePreview.style.display = 'block';
                        imagePlaceholder.style.display = 'none';
                        editIconWrapper.style.display = 'none';
                    } catch (error) {
                        console.error("[PharmacyAddProduct] Image processing failed:", error);
                        Swal.fire('خطأ', 'حدث خطأ أثناء معالجة الصورة', 'error');
                    }
                });
            }
        }

        function bindSubmit() {
            if (submitBtn) {
                submitBtn.addEventListener('click', handleSubmit);
            }
        }

        return {
            init() {
                bindCategoryEvents();
                bindImageEvents();
                bindSubmit();
                loadInitialData();
            },
            prefillForEdit,
            refreshCategories: loadInitialData,
            resetFormToAddMode
        };
    }

    window.pharmacySetupAddProductTab = function (userKey) {
        if (!userKey) {
            console.error("[PharmacyAddProduct] userKey is required.");
            return;
        }

        const controller = createProductFormController(userKey);
        controller.init();

        window.pharmacyProductFormController = controller;
        window.pharmacyPreFillAddProductForm = controller.prefillForEdit;
    };
})();
