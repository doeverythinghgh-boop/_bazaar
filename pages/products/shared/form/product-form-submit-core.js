/**
 * @file pages/products/shared/form/product-form-submit-core.js
 * @description Shared validation and payload helpers for product add/edit submit flows.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


window.ProductFormSubmitCore = window.ProductFormSubmitCore || (function createProductFormSubmitCore() {
    function debug(event, payload, level = 'log') {
        if (window.ProductDebugConsole && typeof window.ProductDebugConsole[level] === 'function') {
            window.ProductDebugConsole[level]('product-form-submit-core', event, payload);
            return;
        }

        const consoleMethod = console[level] || console.log;
        if (typeof payload === 'undefined') {
            consoleMethod.call(console, `[ProductFormSubmitCore] ${event}`);
        } else {
            consoleMethod.call(console, `[ProductFormSubmitCore] ${event}`, payload);
        }
    }

    function validateImageCollection(options = {}) {
        const {
            images = [],
            uploaderEl = null,
            clearError = null,
            showError = null,
            requiredMessage = '',
            processingMessage = '',
            failedMessage = ''
        } = options;

        if (clearError && uploaderEl) clearError(uploaderEl);

        const readyImages = images.filter((state) => state.status === 'ready' && state.compressedBlob);
        const pendingImages = images.filter((state) => state.status === 'pending' || state.status === 'compressing');
        const failedImages = images.filter((state) => state.status === 'error');
        const existingImages = images.filter((state) => state.isExisting === true);

        debug('validate-image-collection', {
            total: images.length,
            ready: readyImages.length,
            pending: pendingImages.length,
            failed: failedImages.length,
            existing: existingImages.length
        });

        if (readyImages.length === 0 && existingImages.length === 0) {
            if (showError && uploaderEl) showError(uploaderEl, requiredMessage);
            debug('validate-image-collection-failed', { reason: 'required-image-missing' }, 'warn');
            return false;
        }

        if (pendingImages.length > 0) {
            if (showError && uploaderEl) showError(uploaderEl, processingMessage);
            debug('validate-image-collection-failed', { reason: 'images-still-processing' }, 'warn');
            return false;
        }

        if (failedImages.length > 0) {
            if (showError && uploaderEl) showError(uploaderEl, failedMessage);
            debug('validate-image-collection-failed', { reason: 'images-have-errors' }, 'warn');
            return false;
        }

        debug('validate-image-collection-passed');
        return true;
    }

    function validateRequiredCategory(options = {}) {
        const {
            categories,
            categoryDisplay,
            clearError,
            showError,
            message
        } = options;

        if (clearError && categoryDisplay) clearError(categoryDisplay);
        const isValid = !!(categories?.mainId && categories?.subId);
        debug('validate-required-category', {
            categories,
            valid: isValid
        }, isValid ? 'log' : 'warn');

        if (isValid) return true;
        if (showError && categoryDisplay) showError(categoryDisplay, message);
        return false;
    }

    function validateRequiredText(options = {}) {
        const {
            input,
            clearError,
            showError,
            message,
            minLength = 1
        } = options;

        if (clearError && input) clearError(input);
        const value = input?.value?.trim?.() || '';
        const isValid = !!(value && value.length >= minLength);
        debug('validate-required-text', {
            targetId: input?.id || null,
            valueLength: value.length,
            minLength,
            valid: isValid
        }, isValid ? 'log' : 'warn');

        if (isValid) return true;
        if (showError && input) showError(input, message);
        return false;
    }

    function validateMinimumNumber(options = {}) {
        const {
            input,
            clearError,
            showError,
            message,
            min = 0,
            allowEmpty = false
        } = options;

        if (clearError && input) clearError(input);
        if (!input) {
            debug('validate-minimum-number-missing-input', null, 'warn');
            return false;
        }

        if (allowEmpty && input.value === '') {
            debug('validate-minimum-number-allow-empty', { targetId: input.id || null });
            return true;
        }

        const numericValue = parseFloat(input.value);
        const isValid = input.value !== '' && !Number.isNaN(numericValue) && numericValue >= min;
        debug('validate-minimum-number', {
            targetId: input?.id || null,
            value: input.value,
            min,
            valid: isValid
        }, isValid ? 'log' : 'warn');

        if (isValid) return true;
        if (showError) showError(input, message);
        return false;
    }

    async function uploadReadyImages(imageStates, productKey, logLabel = 'ProductForm') {
        const uploadedImageUrls = [];
        let uploadIndex = 0;

        debug('upload-ready-images-start', {
            productKey,
            totalImages: imageStates.length,
            readyImages: imageStates.filter((state) => state.status === 'ready' && state.compressedBlob).length
        });

        for (const state of imageStates) {
            if (state.status !== 'ready' || !state.compressedBlob) continue;

            uploadIndex += 1;
            const fileName = `${Date.now()}_${uploadIndex}_${productKey}.webp`;
            debug('upload-ready-image-start', {
                productKey,
                fileName,
                uploadIndex
            });

            const result = await uploadFile2cf(
                state.compressedBlob,
                fileName,
                (message) => {
                    debug('upload-ready-image-progress', {
                        label: logLabel,
                        fileName,
                        message
                    });
                    console.log(`[${logLabel}]`, message);
                }
            );

            uploadedImageUrls.push(result.file || fileName);
            debug('upload-ready-image-complete', {
                productKey,
                fileName,
                storedName: result.file || fileName
            });
        }

        debug('upload-ready-images-complete', {
            productKey,
            uploadedCount: uploadedImageUrls.length
        });
        return uploadedImageUrls;
    }

    function resolveServiceType(mainId, subId, fallbackServiceType = 0) {
        const categorySubmitSettings = (typeof window.ProductCategoryUi !== 'undefined' && typeof window.ProductCategoryUi.getSubmitSettings === 'function')
            ? window.ProductCategoryUi.getSubmitSettings(mainId, subId)
            : null;
        const resolved = categorySubmitSettings?.serviceType ?? fallbackServiceType;

        debug('resolve-service-type', {
            mainId,
            subId,
            fallbackServiceType,
            resolved
        });
        return resolved;
    }

    function buildProductPayload(options = {}) {
        const {
            formValues = {},
            userKey = null,
            productKey = null,
            imageNames = [],
            categories = {},
            fallbackCategories = {},
            isAppPriceEnabled = true,
            fallbackServiceType = 0,
            extra = {}
        } = options;

        const mainCategory = categories?.mainId || fallbackCategories?.mainId || fallbackCategories?.MainCategory || null;
        const subCategory = categories?.subId || fallbackCategories?.subId || fallbackCategories?.SubCategory || null;
        const addPageContext = (typeof document !== 'undefined' && document.body?.id === 'product-add-page') ? 'add' : 'edit';
        const profile = (typeof window.ProductCategoryUi !== 'undefined')
            ? (window.ProductCategoryUi.getActiveProfile?.(addPageContext) ||
                (typeof window.ProductCategoryUi.resolveCategoryProfile === 'function'
                    ? window.ProductCategoryUi.resolveCategoryProfile(mainCategory, subCategory)
                    : null))
            : null;
        const isVisible = (fieldKey) => {
            if (!profile || typeof window.ProductCategoryUi === 'undefined') return true;
            return window.ProductCategoryUi.isFieldVisible(addPageContext, fieldKey, profile);
        };

        const payload = {
            productName: normalizeArabicText((formValues.productName || '').trim()),
            user_key: userKey,
            product_key: productKey,
            product_description: normalizeArabicText((formValues.description || '').trim()),
            product_price: isVisible('price') ? (parseFloat(formValues.price) || 0) : 0,
            product_quantity: isVisible('quantity') ? (parseInt(formValues.quantity, 10) || 0) : 0,
            original_price: isVisible('originalPrice') ? (parseFloat(formValues.originalPrice) || null) : null,
            realPrice: (isAppPriceEnabled && isVisible('realPrice')) ? (parseFloat(formValues.realPrice) || null) : null,
            user_message: normalizeArabicText((formValues.sellerMessage || '').trim()),
            user_note: normalizeArabicText((formValues.notes || '').trim()),
            ImageName: imageNames.join(','),
            MainCategory: mainCategory,
            SubCategory: subCategory,
            ImageIndex: imageNames.length,
            serviceType: resolveServiceType(mainCategory, subCategory, fallbackServiceType),
            heavyLoad: isVisible('heavyLoad') && formValues.heavyLoad ? 1 : 0,
            ...extra
        };

        debug('build-product-payload', {
            productKey,
            userKey,
            mainCategory,
            subCategory,
            imageCount: imageNames.length,
            heavyLoad: payload.heavyLoad,
            hasExtraKeys: Object.keys(extra || {}).length > 0
        });
        return payload;
    }

    function hasMeaningfulProductChanges(productData, currentProduct) {
        const hasChanges = !(
            productData.productName === (currentProduct.productName || '') &&
            productData.product_description === (currentProduct.product_description || '') &&
            productData.product_price === (currentProduct.product_price || 0) &&
            productData.product_quantity === (currentProduct.product_quantity || 0) &&
            productData.original_price === (currentProduct.original_price || null) &&
            productData.realPrice === (currentProduct.realPrice || null) &&
            productData.heavyLoad === (currentProduct.heavyLoad || 0) &&
            productData.user_message === (currentProduct.user_message || '') &&
            productData.user_note === (currentProduct.user_note || '') &&
            String(productData.MainCategory) === String(currentProduct.MainCategory || '') &&
            String(productData.SubCategory) === String(currentProduct.SubCategory || '') &&
            productData.ImageName === (currentProduct.ImageName || '')
        );

        debug('has-meaningful-product-changes', {
            productKey: productData?.product_key || currentProduct?.product_key || null,
            changed: hasChanges
        }, hasChanges ? 'log' : 'warn');
        return hasChanges;
    }

    function resetCounters(counterIds = []) {
        debug('reset-counters-start', { counterIds });
        counterIds.forEach((id) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.textContent = id.includes('description') ? '0 / 1500' : '0 / 100';
        });
        debug('reset-counters-complete', { counterIds });
    }

    return {
        buildProductPayload,
        hasMeaningfulProductChanges,
        resetCounters,
        uploadReadyImages,
        validateImageCollection,
        validateMinimumNumber,
        validateRequiredCategory,
        validateRequiredText
    };
})();
