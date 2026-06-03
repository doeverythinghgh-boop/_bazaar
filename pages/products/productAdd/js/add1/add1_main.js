/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */
/**
 * @file pages/productAdd/js/add1/add1.main.js
 * @description Main entry point for Product Add submission logic.
 */



/**
 * @function ADD1_initSubmitLogic
 * @description Initializes the submit event listener for the product add form.
 */
window.ADD1_initSubmitLogic = function() {
    if (!add1_form) {
        console.error('[Add1] Form element not found.');
        return;
    }

    add1_form.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('[Add1] Submit event triggered.');
        window.ProductDebugConsole?.log('productAdd-submit', 'submit-start');

        const context = {
            images: add1_images,
            uploaderEl: add1_uploaderEl,
            categoryDisplay: document.getElementById('add1_category_display'),
            categories: (typeof ProductStateManager !== 'undefined')
                ? ProductStateManager.getSelectedCategories()
                : { mainId: null, subId: null },
            productNameInput: add1_productNameInput,
            descriptionTextarea: add1_descriptionTextarea,
            sellerMessageTextarea: add1_sellerMessageTextarea,
            quantityInput: add1_quantityInput,
            priceInput: add1_priceInput,
            originalPriceInput: add1_originalPriceInput,
            realPriceInput: add1_realPriceInput,
            notesInput: add1_notesInput,
            heavyLoadCheckbox: add1_heavyLoadCheckbox
        };

        window.ProductDebugConsole?.snapshot('productAdd-submit', 'submit-context', {
            categories: context.categories,
            imageCount: Array.isArray(context.images) ? context.images.length : 0,
            userKey: window.userSession?.user_key || null
        });

        // 1. Validation
        if (!ADD1_Validation.validateForm(context)) {
            window.ProductDebugConsole?.warn('productAdd-submit', 'validation-failed');
            return;
        }

        window.ProductDebugConsole?.log('productAdd-submit', 'validation-passed');

        // 2. UI - Set Loading
        ADD1_UI.setSubmitLoading(true);
        ADD1_UI.showAddingLoader();

        try {
            // 3. Handler - Process Submission
            const productData = await ADD1_Handler.processSubmission(context);

            // 4. Handler - Execute Add
            await ADD1_Handler.executeAdd(productData);

            console.log('[Add1] Product saved successfully.');
            window.ProductDebugConsole?.log('productAdd-submit', 'submit-success', {
                productKey: productData.product_key
            });

            // 5. UI - Success
            await ADD1_UI.showSuccessAlert(productData);

        } catch (error) {
            console.error('[Add1] Submission failed:', error);
            window.ProductDebugConsole?.error('productAdd-submit', 'submit-error', {
                message: error?.message || String(error)
            });
            ADD1_UI.showErrorAlert(error);
        }
    });

    // 6. UI Events - Attach Listeners
    ADD1_UI_Events.attachListeners({
        pickFilesBtn: add1_pickFilesBtn,
        takePhotoBtn: add1_takePhotoBtn,
        fileInput: add1_fileInput,
        productNameInput: add1_productNameInput,
        descriptionTextarea: add1_descriptionTextarea,
        sellerMessageTextarea: add1_sellerMessageTextarea,
        notesInput: add1_notesInput,
        quantityInput: add1_quantityInput,
        priceInput: add1_priceInput,
        originalPriceInput: add1_originalPriceInput,
        realPriceInput: add1_realPriceInput,
        heavyLoadCheckbox: add1_heavyLoadCheckbox,
        btnDiscard: document.getElementById('add1_btn_discard'),
        handler: ADD1_Handler,
        uiHelpers: ADD1_UI_Helpers,
        images: add1_images // Shared state
    });
};

/**
 * @function ADD1_collectDraftData
 * @description Compatible wrapper for collecting draft data.
 */
window.ADD1_collectDraftData = () => {
    const context = {
        images: add1_images,
        productNameInput: add1_productNameInput,
        descriptionTextarea: add1_descriptionTextarea,
        sellerMessageTextarea: add1_sellerMessageTextarea,
        notesInput: add1_notesInput,
        quantityInput: add1_quantityInput,
        priceInput: add1_priceInput,
        originalPriceInput: add1_originalPriceInput,
        realPriceInput: add1_realPriceInput,
        heavyLoadCheckbox: add1_heavyLoadCheckbox
    };
    return ADD1_Handler.collectDraftData(context);
};

/**
 * @function ADD1_saveDraft
 * @description Compatible wrapper for saving draft.
 */
window.ADD1_saveDraft = () => {
    const context = {
        images: add1_images,
        productNameInput: add1_productNameInput,
        descriptionTextarea: add1_descriptionTextarea,
        sellerMessageTextarea: add1_sellerMessageTextarea,
        notesInput: add1_notesInput,
        quantityInput: add1_quantityInput,
        priceInput: add1_priceInput,
        originalPriceInput: add1_originalPriceInput,
        realPriceInput: add1_realPriceInput,
        heavyLoadCheckbox: add1_heavyLoadCheckbox
    };
    return ADD1_Handler.saveDraft(context);
};

/**
 * @function ADD1_restoreDraft
 * @description Compatible wrapper for restoring draft.
 */
window.ADD1_restoreDraft = () => {
    const context = {
        images: add1_images,
        productNameInput: add1_productNameInput,
        descriptionTextarea: add1_descriptionTextarea,
        sellerMessageTextarea: add1_sellerMessageTextarea,
        notesInput: add1_notesInput,
        quantityInput: add1_quantityInput,
        priceInput: add1_priceInput,
        originalPriceInput: add1_originalPriceInput,
        realPriceInput: add1_realPriceInput,
        heavyLoadCheckbox: add1_heavyLoadCheckbox
    };
    return ADD1_Handler.restoreDraft(context, ADD1_UI_Helpers);
};

// Removed self-initialization to allow explicit control from HTML
