/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */
/**
 * @file pages/productAdd/js/add1/add1.handler.js
 * @description Business logic and API calls for Product Add.
 */

window.ADD1_Handler = {
    /**
     * @function processSubmission
     * @description Handles the core logic of the addition process (Images + Payload).
     */
    processSubmission: async (context) => {
        const {
            images, productNameInput, descriptionTextarea, sellerMessageTextarea,
            notesInput, priceInput, quantityInput, originalPriceInput,
            realPriceInput, heavyLoadCheckbox, categories
        } = context;

        const productSerial = generateSerial();
        window.ProductDebugConsole?.snapshot('productAdd-submit', 'generated-product-key', { productSerial });

        // Convert draft-restored images (isLocal Base64) back to Blobs for upload
        for (const state of images) {
            if (state.isExisting && state.isLocal && state.url && !state.compressedBlob) {
                try {
                    const response = await fetch(state.url);
                    state.compressedBlob = await response.blob();
                    state.status = 'ready';    // switch to 'ready' so uploadReadyImages picks it up
                    state.isExisting = false;  // it's now a new upload, not an existing file
                    console.log('[Add1] Draft image converted to Blob for upload.');
                } catch (e) {
                    console.warn('[Add1] Failed to convert draft image to Blob:', e);
                }
            }
        }

        const uploadedImageUrls = await window.ProductFormSubmitCore.uploadReadyImages(images, productSerial, 'Add1');

        const currentMerchant = (typeof SessionManager !== 'undefined') ? SessionManager.getUser() : null;
        if (!currentMerchant) throw new Error('Merchant session is unavailable');

        const autoMode = window.AppBehavior?.autoApproveNotifyAdmin === true;
        const isApproved = autoMode ? 1 : 0;
        const specialtyConfig = window.ProductSpecialtyListingBridge?.getConfig?.() || null;
        const effectiveCategories = {
            mainId: categories?.mainId || specialtyConfig?.mainCategory || null,
            subId: categories?.subId || specialtyConfig?.defaultSubCategory || null
        };
        const isPharmacyCategory = window.ProductPharmacyBridge?.isPharmacyCategory?.(effectiveCategories.mainId, effectiveCategories.subId) === true;

        const productData = window.ProductFormSubmitCore.buildProductPayload({
            formValues: {
                productName: productNameInput.value || (specialtyConfig ? `${specialtyConfig.title} ${productSerial}` : ''),
                description: descriptionTextarea.value,
                sellerMessage: sellerMessageTextarea.value,
                notes: notesInput.value,
                price: priceInput.value,
                quantity: specialtyConfig ? 1 : quantityInput.value,
                originalPrice: originalPriceInput?.value,
                realPrice: realPriceInput?.value,
                heavyLoad: heavyLoadCheckbox?.checked
            },
            userKey: currentMerchant.user_key,
            productKey: productSerial,
            imageNames: uploadedImageUrls,
            categories: effectiveCategories,
            isAppPriceEnabled: true,
            fallbackServiceType: (effectiveCategories?.mainId == 6) ? 2 : 0,
            extra: {
                is_approved: isApproved,
                pharmacy_metadata: isPharmacyCategory ? 1 : 0,
                item_type: specialtyConfig?.itemType,
                [specialtyConfig?.flag || 'specialty_listing']: specialtyConfig ? 1 : undefined
            }
        });

        window.ProductDebugConsole?.snapshot('productAdd-submit', 'payload-ready', {
            productKey: productData.product_key,
            isApproved
        });

        return productData;
    },

    /**
     * @function executeAdd
     * @description Executes the API calls for adding and notifying.
     */
    executeAdd: async (productData) => {
        if (window.ProductSpecialtyListingBridge?.isSpecialtyProduct?.(productData)) {
            const dbResult = await window.ProductSpecialtyListingBridge.saveListing(productData, 'POST');
            window.ProductDebugConsole?.snapshot('productAdd-submit', 'create-specialty-listing-response', {
                productKey: productData.product_key,
                hasError: !!dbResult?.error
            });
            if (dbResult && dbResult.error) throw new Error(dbResult.error);
            return;
        }

        // Use addProduct (which is the standard API service)
        const dbResult = await addProduct(productData);

        window.ProductDebugConsole?.snapshot('productAdd-submit', 'create-product-response', {
            productKey: productData.product_key,
            hasError: !!dbResult?.error
        });

        if (dbResult && dbResult.error) throw new Error(dbResult.error);

        if (window.ProductPharmacyBridge?.saveMetadata) {
            await window.ProductPharmacyBridge.saveMetadata(productData, 'POST');
        }

        const autoMode = window.AppBehavior?.autoApproveNotifyAdmin === true;
        const shouldNotify = !autoMode;

        if (shouldNotify && typeof notifyAdminOnNewItem === 'function') {
            window.ProductDebugConsole?.log('productAdd-submit', 'notify-admin-start', {
                productKey: productData.product_key
            });
            await notifyAdminOnNewItem(productData);
            window.ProductDebugConsole?.log('productAdd-submit', 'notify-admin-complete', {
                productKey: productData.product_key
            });
        }
    },

    /**
     * @function collectDraftData
     * @description Collects all form data for draft saving.
     */
    collectDraftData: async (context) => {
        const params = new URLSearchParams(window.location.search);
        const providerKey = params.get('provider_key');
        const selected = (typeof ProductStateManager !== 'undefined') ? ProductStateManager.getSelectedCategories() : {};

        const images = context.images || [];
        const productNameInput = context.productNameInput;
        const descriptionTextarea = context.descriptionTextarea;
        const sellerMessageTextarea = context.sellerMessageTextarea;
        const notesInput = context.notesInput;
        const quantityInput = context.quantityInput;
        const priceInput = context.priceInput;
        const originalPriceInput = context.originalPriceInput;
        const realPriceInput = context.realPriceInput;
        const heavyLoadCheckbox = context.heavyLoadCheckbox;

        const draftImages = [];
        if (Array.isArray(images)) {
            for (const img of images) {
                if (img.url) {
                    draftImages.push({
                        status: img.status,
                        url: img.url,
                        id: img.id,
                        isLocal: !!img.isLocal,
                        isExisting: !!img.isExisting
                    });
                } else if (img.file) {
                    try {
                        const b64 = await window.ProductDraftManager.fileToBase64(img.file);
                        draftImages.push({ status: img.status, url: b64, id: img.id, isLocal: true });
                    } catch (e) {
                        console.warn('[Add1] Failed to convert image to Base64 for draft:', e);
                    }
                }
            }
        }

        return {
            providerKey,
            mainId: selected.mainId,
            subId: selected.subId,
            name: productNameInput?.value,
            description: descriptionTextarea?.value,
            sellerMessage: sellerMessageTextarea?.value,
            notes: notesInput?.value,
            quantity: quantityInput?.value,
            price: priceInput?.value,
            originalPrice: originalPriceInput?.value,
            realPrice: realPriceInput?.value,
            heavyLoad: heavyLoadCheckbox?.checked,
            images: draftImages
        };
    },

    /**
     * @function saveDraft
     * @description Saves the current form state as a draft.
     */
    saveDraft: async (context) => {
        if (typeof window.ProductDraftManager === 'undefined') return;
        const data = await window.ADD1_Handler.collectDraftData(context);
        const key = window.ProductDraftManager.generateKey(data.providerKey, 'new', data.mainId, data.subId);
        window.ProductDraftManager.saveDraft(key, data);
    },

    /**
     * @function checkForChanges
     * @description Checks for changes between initial state and current state.
     */
    checkForChanges: async (context, uiHelpers) => {
        if (typeof window.ProductDraftManager === 'undefined' || !window.ADD1_initialState) return;
        const current = await window.ADD1_Handler.collectDraftData(context);
        const changed = window.ProductDraftManager.hasChanges(window.ADD1_initialState, current);

        if (uiHelpers && uiHelpers.updateSubmitButtonState) {
            uiHelpers.updateSubmitButtonState(changed);
        }
    },

    /**
     * @function restoreDraft
     * @description Restores the form state from a saved draft.
     */
    restoreDraft: async (context, uiHelpers) => {
        if (typeof window.ProductDraftManager === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        const providerKey = params.get('provider_key');
        const selected = (typeof ProductStateManager !== 'undefined') ? ProductStateManager.getSelectedCategories() : {};

        if (!selected.mainId || !selected.subId) return;

        const key = window.ProductDraftManager.generateKey(providerKey, 'new', selected.mainId, selected.subId);
        const draft = window.ProductDraftManager.loadDraft(key);

        if (draft) {
            console.log('[Add1] Restoring draft for category:', selected.mainId, selected.subId);
            if (uiHelpers && uiHelpers.populateForm) {
                uiHelpers.populateForm(draft, context);
            }
            if (uiHelpers && uiHelpers.restoreImages) {
                uiHelpers.restoreImages(draft.images);
            }
            window.ADD1_initialState = draft;
            console.log('[Add1] Draft restoration complete.');
        }
    }
};
