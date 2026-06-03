/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */
/**
 * @file pages/productEdit/js/edit/edit.handler.js
 * @description Business logic and API calls for Product Edit.
 */

window.EDIT_Handler = {
    /**
     * @function processSubmission
     * @description Handles the core logic of the submission process.
     */
    processSubmission: async (context) => {
        const {
            form, productNameInput, descriptionTextarea, priceInput, quantityInput,
            originalPriceInput, realPriceInput, sellerMessageTextarea, notesInput,
            heavyLoadCheckbox, selectedCategories, images, originalImageNames
        } = context;

        const productKey = form.dataset.productKey;
        for (const state of images) {
            if (state.isLocal && state.url && !state.compressedBlob) {
                try {
                    const response = await fetch(state.url);
                    state.compressedBlob = await response.blob();
                    state.status = 'ready';
                    state.isExisting = false;
                    console.log('[Edit] Draft image converted to Blob for upload.');
                } catch (error) {
                    console.warn('[Edit] Failed to convert draft image to Blob:', error);
                }
            }
        }

        const existingImages = images.filter((state) => state.isExisting === true);
        const newImages = images.filter((state) => state.status === 'ready' && state.isExisting === false);
        const remainingExistingImageNames = existingImages
            .map((state) => state.fileName)
            .filter(Boolean);
        const imagesToDelete = originalImageNames.filter((name) => !remainingExistingImageNames.includes(name));

        window.ProductDebugConsole?.snapshot('productEdit-submit', 'image-plan', {
            productKey,
            existingImageCount: existingImages.length,
            newImageCount: newImages.length,
            deleteCount: imagesToDelete.length
        });

        let uploadedImageUrls = [];
        try {
            uploadedImageUrls = await window.ProductFormSubmitCore.uploadReadyImages(newImages, productKey, 'CloudflareUpload');
            window.ProductDebugConsole?.snapshot('productEdit-submit', 'upload-complete', {
                productKey,
                uploadedImageCount: uploadedImageUrls.length
            });
        } catch (uploadError) {
            window.ProductDebugConsole?.error('productEdit-submit', 'upload-error', {
                productKey,
                message: uploadError?.message || String(uploadError)
            });
            throw new Error(`Failed to upload new image: ${uploadError.message}`);
        }

        const allImageNames = [...remainingExistingImageNames, ...uploadedImageUrls];
        const currentProduct = (typeof ProductStateManager !== 'undefined') ? ProductStateManager.getCurrentProduct() : null;
        if (!currentProduct) throw new Error('Current product is unavailable in state manager');

        window.ProductDebugConsole?.snapshot('productEdit-submit', 'current-product-loaded', {
            productKey: currentProduct.product_key || null,
            currentImageCount: String(currentProduct.ImageName || '').split(',').filter(Boolean).length
        });

        const autoMode = window.AppBehavior?.autoApproveNotifyAdmin === true;
        const isApproved = autoMode ? 1 : 0;
        const specialtyConfig = window.ProductSpecialtyListingBridge?.getConfig?.(currentProduct) || null;
        const effectiveCategories = {
            mainId: selectedCategories?.mainId || currentProduct.MainCategory || specialtyConfig?.mainCategory || null,
            subId: selectedCategories?.subId || currentProduct.SubCategory || specialtyConfig?.defaultSubCategory || null
        };
        const isPharmacyCategory = window.ProductPharmacyBridge?.isPharmacyCategory?.(effectiveCategories.mainId, effectiveCategories.subId) === true;

        const productData = window.ProductFormSubmitCore.buildProductPayload({
            formValues: {
                productName: productNameInput.value || currentProduct.productName || (specialtyConfig ? `${specialtyConfig.title} ${productKey}` : ''),
                description: descriptionTextarea.value,
                price: priceInput.value,
                quantity: specialtyConfig ? 1 : quantityInput.value,
                originalPrice: originalPriceInput?.value,
                realPrice: realPriceInput?.value,
                sellerMessage: sellerMessageTextarea.value,
                notes: notesInput.value,
                heavyLoad: heavyLoadCheckbox?.checked
            },
            userKey: currentProduct.user_key,
            productKey,
            imageNames: allImageNames,
            categories: effectiveCategories,
            fallbackCategories: currentProduct,
            isAppPriceEnabled: true,
            fallbackServiceType: (currentProduct.MainCategory == 6) ? 2 : 0,
            extra: {
                is_approved: isApproved,
                pharmacy_metadata: isPharmacyCategory ? 1 : 0,
                item_type: specialtyConfig?.itemType || currentProduct.item_type,
                [specialtyConfig?.flag || 'specialty_listing']: specialtyConfig ? 1 : undefined
            }
        });

        window.ProductDebugConsole?.snapshot('productEdit-submit', 'payload-ready', {
            productKey: productData.product_key,
            imageCount: allImageNames.length,
            mainCategory: productData.MainCategory,
            subCategory: productData.SubCategory
        });

        const hasDataChanged = window.ProductFormSubmitCore.hasMeaningfulProductChanges(productData, currentProduct);

        return {
            hasDataChanged,
            productData,
            imagesToDelete
        };
    },

    /**
     * @function executeUpdate
     * @description Executes the API calls for updating and notifying.
     */
    executeUpdate: async (productData, imagesToDelete) => {
        const productKey = productData.product_key;
        if (window.ProductSpecialtyListingBridge?.isSpecialtyProduct?.(productData)) {
            const dbResult = await window.ProductSpecialtyListingBridge.saveListing(productData, 'PUT');
            window.ProductDebugConsole?.snapshot('productEdit-submit', 'update-specialty-listing-response', {
                productKey,
                hasError: !!dbResult?.error,
                keys: Object.keys(dbResult || {})
            });
            if (dbResult && dbResult.error) throw new Error(dbResult.error);

            if (typeof ProductStateManager !== 'undefined') {
                const updatedProduct = (dbResult && !dbResult.error && typeof dbResult === 'object')
                    ? { ...productData, ...dbResult }
                    : productData;
                const currentOptions = ProductStateManager.getViewOptions(productKey);
                ProductStateManager.setProductForView(updatedProduct, currentOptions);
                if (updatedProduct.MainCategory && updatedProduct.SubCategory) {
                    ProductStateManager.setSelectedCategories(updatedProduct.MainCategory, updatedProduct.SubCategory);
                    if (typeof window.EDIT_persistCategorySelection === 'function') {
                        window.EDIT_persistCategorySelection(productKey, updatedProduct.MainCategory, updatedProduct.SubCategory);
                    }
                }
            }

            if (imagesToDelete.length > 0) {
                window.ProductDebugConsole?.log('productEdit-submit', 'delete-removed-images-start', {
                    productKey,
                    deleteCount: imagesToDelete.length
                });
                const deletePromises = imagesToDelete.map((name) =>
                    deleteFile2cf(name, (msg) => console.log('[CloudflareDelete]', msg)).catch(() => null)
                );
                await Promise.all(deletePromises);
                window.ProductDebugConsole?.log('productEdit-submit', 'delete-removed-images-complete', {
                    productKey,
                    deleteCount: imagesToDelete.length
                });
            }
            return;
        }

        const dbResult = await updateProduct(productData);
        window.ProductDebugConsole?.snapshot('productEdit-submit', 'update-product-response', {
            productKey,
            hasError: !!dbResult?.error,
            keys: Object.keys(dbResult || {})
        });
        if (dbResult && dbResult.error) throw new Error(dbResult.error);

        if (window.ProductPharmacyBridge?.saveMetadata) {
            if (window.ProductPharmacyBridge.isPharmacyProduct?.(productData) === true) {
                await window.ProductPharmacyBridge.saveMetadata(productData, 'PUT');
            } else if (typeof window.ProductPharmacyBridge.deleteMetadata === 'function') {
                await window.ProductPharmacyBridge.deleteMetadata(productData);
            }
        }

        // Synchronize local state registry with the new data
        if (typeof ProductStateManager !== 'undefined') {
            const updatedProduct = (dbResult && !dbResult.error && typeof dbResult === 'object')
                ? { ...dbResult, ...productData }
                : productData;
            const currentOptions = ProductStateManager.getViewOptions(productKey);
            ProductStateManager.setProductForView(updatedProduct, currentOptions);

            // Also explicitly update the selected categories to match the new ones
            if (updatedProduct.MainCategory && updatedProduct.SubCategory) {
                ProductStateManager.setSelectedCategories(updatedProduct.MainCategory, updatedProduct.SubCategory);
                if (typeof window.EDIT_persistCategorySelection === 'function') {
                    window.EDIT_persistCategorySelection(productKey, updatedProduct.MainCategory, updatedProduct.SubCategory);
                }
            }

            window.ProductDebugConsole?.log('productEdit-submit', 'local-state-synchronized', { productKey });
        }

        const autoMode = window.AppBehavior?.autoApproveNotifyAdmin === true;
        const shouldNotify = !autoMode;

        if (shouldNotify && typeof notifyAdminOnItemUpdate === 'function') {
            window.ProductDebugConsole?.log('productEdit-submit', 'notify-admin-start', { productKey });
            await notifyAdminOnItemUpdate(productData);
            window.ProductDebugConsole?.log('productEdit-submit', 'notify-admin-complete', { productKey });
        }

        if (imagesToDelete.length > 0) {
            window.ProductDebugConsole?.log('productEdit-submit', 'delete-removed-images-start', {
                productKey,
                deleteCount: imagesToDelete.length
            });
            const deletePromises = imagesToDelete.map((name) =>
                deleteFile2cf(name, (msg) => console.log('[CloudflareDelete]', msg)).catch(() => null)
            );
            await Promise.all(deletePromises);
            window.ProductDebugConsole?.log('productEdit-submit', 'delete-removed-images-complete', {
                productKey,
                deleteCount: imagesToDelete.length
            });
        }
    },

    /**
     * @function collectDraftData
     * @description Collects all form data for draft saving or change detection.
     */
    collectDraftData: async () => {
        const params = new URLSearchParams(window.location.search);
        const providerKey = params.get('provider_key');
        const productKey = params.get('product_key') || params.get('key') || params.get('id') || params.get('car_key') || params.get('real_estate_key');
        const currentProduct = (typeof ProductStateManager !== 'undefined') ? ProductStateManager.getCurrentProduct() : null;
        const selected = (typeof window.EDIT_getCurrentCategorySelection === 'function')
            ? window.EDIT_getCurrentCategorySelection(currentProduct)
            : ((typeof ProductStateManager !== 'undefined') ? ProductStateManager.getSelectedCategories() : {});
        const dom = EDIT_getDomElements();

        // Collect images
        const images = [];
        if (Array.isArray(window.EDIT_images)) {
            for (const img of window.EDIT_images) {
                if (img.url) {
                    images.push({
                        status: img.status,
                        url: img.url,
                        id: img.id,
                        fileName: img.fileName,
                        isExisting: img.isExisting === true,
                        isLocal: !!img.isLocal
                    });
                } else if (img.file) {
                    try {
                        const b64 = await window.ProductDraftManager.fileToBase64(img.file);
                        images.push({ status: img.status, url: b64, id: img.id, isLocal: true });
                    } catch (e) {
                        console.warn('[Edit] Failed to convert image to Base64 for draft:', e);
                    }
                }
            }
        }

        return {
            providerKey,
            productKey,
            mainId: selected.mainId,
            subId: selected.subId,
            name: dom.productNameInput?.value,
            description: dom.descriptionTextarea?.value,
            sellerMessage: dom.sellerMessageTextarea?.value,
            notes: dom.notesInput?.value,
            quantity: dom.quantityInput?.value,
            price: dom.priceInput?.value,
            originalPrice: dom.originalPriceInput?.value,
            realPrice: dom.realPriceInput?.value,
            heavyLoad: dom.heavyLoadCheckbox?.checked,
            images: images
        };
    },

    /**
     * @function saveDraft
     * @description Saves the current form state as a draft.
     */
    saveDraft: async () => {
        if (typeof window.ProductDraftManager === 'undefined') return;
        const data = await EDIT_Handler.collectDraftData();
        const key = window.ProductDraftManager.generateKey(data.providerKey, data.productKey, data.mainId, data.subId);
        window.ProductDraftManager.saveDraft(key, data);
    },

    /**
     * @function checkForChanges
     * @description Checks for changes between initial state and current state.
     */
    checkForChanges: async (uiHelpers) => {
        if (typeof window.ProductDraftManager === 'undefined' || !window.EDIT_initialState) return;
        const current = await EDIT_Handler.collectDraftData();
        const changed = window.ProductDraftManager.hasChanges(window.EDIT_initialState, current);

        if (uiHelpers && uiHelpers.updateSubmitButtonState) {
            uiHelpers.updateSubmitButtonState(changed);
        }
    },

    /**
     * @function restoreDraft
     * @description Restores the form state from a saved draft.
     */
    restoreDraft: async (uiHelpers) => {
        if (typeof window.ProductDraftManager === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        const providerKey = params.get('provider_key');
        const productKey = params.get('product_key') || params.get('key') || params.get('id') || params.get('car_key') || params.get('real_estate_key');
        const currentProduct = (typeof ProductStateManager !== 'undefined') ? ProductStateManager.getCurrentProduct() : null;
        const selected = (typeof window.EDIT_getCurrentCategorySelection === 'function')
            ? window.EDIT_getCurrentCategorySelection(currentProduct)
            : ((typeof ProductStateManager !== 'undefined') ? ProductStateManager.getSelectedCategories() : {});

        if (!selected.mainId || !selected.subId) return;

        const key = window.ProductDraftManager.generateKey(providerKey, productKey, selected.mainId, selected.subId);
        const draft = window.ProductDraftManager.loadDraft(key);

        if (draft) {
            console.log('[Edit] Restoring draft for product:', productKey);
            const dom = EDIT_getDomElements();

            if (uiHelpers && uiHelpers.populateForm) {
                uiHelpers.populateForm(draft, dom);
            }
            if (uiHelpers && uiHelpers.restoreImages) {
                uiHelpers.restoreImages(draft.images);
            }

            await EDIT_Handler.checkForChanges(uiHelpers);
            console.log('[Edit] Draft restoration complete.');
        }
    }
};
