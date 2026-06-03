/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */
/**
 * @file pages/productEdit/js/edit/edit.main.js
 * @description Main entry point for Product Edit submission logic.
 */



/**
 * @function EDIT_initSubmitLogic
 * @description Initializes the submit event listener for the product edit form.
 */
window.EDIT_initSubmitLogic = function() {
    const dom = EDIT_getDomElements();
    const form = dom.form;

    if (!form) {
        console.error('[ProductEdit] Edit form is missing while binding submit.');
        window.ProductDebugConsole?.error('productEdit-submit', 'missing-form');
        return;
    }

    form.onsubmit = async (e) => {
        e.preventDefault();
        console.log('[ProductEdit] Submit event triggered for editing.');
        window.ProductDebugConsole?.log('productEdit-submit', 'submit-start');

        const currentProduct = (typeof ProductStateManager !== 'undefined')
            ? ProductStateManager.getCurrentProduct()
            : null;
        const selectedCategories = (typeof window.EDIT_getCurrentCategorySelection === 'function')
            ? window.EDIT_getCurrentCategorySelection(currentProduct)
            : ((typeof ProductStateManager !== 'undefined')
                ? ProductStateManager.getSelectedCategories()
                : { mainId: null, subId: null });

        if (typeof ProductStateManager !== 'undefined' && selectedCategories?.mainId && selectedCategories?.subId) {
            ProductStateManager.setSelectedCategories(selectedCategories.mainId, selectedCategories.subId);
        }

        const context = {
            form,
            uploaderEl: document.getElementById('image-uploader'),
            productNameInput: document.getElementById('product-name'),
            descriptionTextarea: document.getElementById('product-description'),
            sellerMessageTextarea: document.getElementById('merchant-message'),
            quantityInput: document.getElementById('product-quantity'),
            priceInput: document.getElementById('product-price'),
            notesInput: document.getElementById('product-notes'),
            originalPriceInput: document.getElementById('original-price'),
            realPriceInput: document.getElementById('real-price'),
            heavyLoadCheckbox: document.getElementById('heavy-load'),
            categoryDisplay: document.getElementById('edit_category_display'),
            selectedCategories,
            images: EDIT_images,
            originalImageNames: EDIT_originalImageNames
        };

        window.ProductDebugConsole?.snapshot('productEdit-submit', 'submit-context', {
            productKey: form.dataset.productKey || null,
            categories: context.selectedCategories,
            imageCount: Array.isArray(context.images) ? context.images.length : 0
        });

        // 1. Validation
        if (!EDIT_Validation.validateForm(context)) {
            console.warn('[ProductEdit] Validation failed. Submission aborted.');
            window.ProductDebugConsole?.warn('productEdit-submit', 'validation-failed');
            return;
        }

        window.ProductDebugConsole?.log('productEdit-submit', 'validation-passed');

        // 2. UI - Show Loader
        EDIT_UI.showUpdatingLoader();

        try {
            // 3. Handler - Process Submission
            const { hasDataChanged, productData, imagesToDelete } = await EDIT_Handler.processSubmission(context);

            if (!hasDataChanged) {
                console.log('[ProductEdit] No changes detected by the handler. Showing message to user.');
                window.ProductDebugConsole?.warn('productEdit-submit', 'no-meaningful-changes', {
                    productKey: productData.product_key
                });

                // Requirement: Show message "لم يتم اجراء اي تعديلات" and go back
                EDIT_UI.showNoChangesAlert('لم يتم اجراء اي تعديلات').then((result) => {
                    console.log('[ProductEdit] User acknowledged no changes. Returning to previous page.');
                    if (typeof containerGoBack === 'function') {
                        window.ProductDebugConsole?.log('productEdit-submit', 'navigate-back-container-no-change');
                        containerGoBack();
                    } else {
                        window.ProductDebugConsole?.log('productEdit-submit', 'navigate-back-history-no-change');
                        history.back();
                    }
                });
                return;
            }

            console.log('[ProductEdit] Changes detected. Proceeding with update.');

            // 4. Handler - Execute Update
            await EDIT_Handler.executeUpdate(productData, imagesToDelete);

            window.ProductDebugConsole?.log('productEdit-submit', 'submit-success', { productKey: productData.product_key });

            // 5. UI - Success
            await EDIT_UI.showSuccessAlert(productData);

        } catch (error) {
            console.error('[ProductEdit] Update failed:', error);
            window.ProductDebugConsole?.error('productEdit-submit', 'submit-error', {
                message: error?.message || String(error)
            });
            EDIT_UI.showErrorAlert(error);
        }
    };
};

/**
 * @function EDIT_attachEventListeners
 * @description Compatible wrapper for attaching UI event listeners.
 */
window.EDIT_attachEventListeners = function() {
    EDIT_UI_Events.attachListeners({
        dom: EDIT_getDomElements(),
        handler: EDIT_Handler,
        uiHelpers: EDIT_UI_Helpers
    });
};

/**
 * @function EDIT_collectDraftData
 * @description Compatible wrapper for collecting draft data.
 */
window.EDIT_collectDraftData = EDIT_Handler.collectDraftData;

/**
 * @function EDIT_saveDraft
 * @description Compatible wrapper for saving draft.
 */
window.EDIT_saveDraft = EDIT_Handler.saveDraft;

/**
 * @function EDIT_checkForChanges
 * @description Compatible wrapper for change detection.
 */
window.EDIT_checkForChanges = () => EDIT_Handler.checkForChanges(EDIT_UI_Helpers);

/**
 * @function EDIT_restoreDraft
 * @description Compatible wrapper for restoring draft.
 */
window.EDIT_restoreDraft = () => EDIT_Handler.restoreDraft(EDIT_UI_Helpers);

// Global listeners
EDIT_UI_Events.attachGlobalListeners();
