/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */
/**
 * @file pages/productEdit/js/edit/edit.ui.events.js
 * @description Event listeners for Product Edit UI.
 */

window.EDIT_UI_Events = {
    /**
     * @function attachListeners
     * @description Binds all UI event listeners.
     */
    attachListeners: (context) => {
        const { dom, handler, uiHelpers } = context;

        if (dom.form && dom.form.dataset.editListenersBound === 'true') return;
        if (dom.form) dom.form.dataset.editListenersBound = 'true';

        // Helper for input events
        const onInputChange = () => {
            handler.saveDraft();
            handler.checkForChanges(uiHelpers);
        };

        if (dom.pickFilesBtn) {
            dom.pickFilesBtn.onclick = () => {
                if (!dom.fileInput) return;
                dom.fileInput.removeAttribute('capture');
                dom.fileInput.click();
            };
        }

        if (dom.fileInput) {
            dom.fileInput.onchange = async (e) => {
                if (typeof EDIT_handleNewFiles === 'function') {
                    await EDIT_handleNewFiles(e.target.files);
                }
                onInputChange();
            };
        }

        [
            dom.productNameInput, dom.descriptionTextarea, dom.sellerMessageTextarea,
            dom.notesInput, dom.quantityInput, dom.priceInput,
            dom.originalPriceInput, dom.realPriceInput, dom.heavyLoadCheckbox
        ].forEach(el => {
            if (el) el.addEventListener('input', onInputChange);
            if (el) el.addEventListener('change', onInputChange);
        });

        window.ProductFormCore?.bindCounter(dom.productNameInput, 'product-name-char-counter', EDIT_clearError);
        window.ProductFormCore?.bindCounter(dom.descriptionTextarea, 'description-char-counter', EDIT_clearError);
        window.ProductFormCore?.bindCounter(dom.sellerMessageTextarea, 'merchant-message-char-counter', EDIT_clearError);
        window.ProductFormCore?.bindCounter(dom.notesInput, 'notes-char-counter', EDIT_clearError);

        window.ProductFormCore?.bindIntegerInput(dom.quantityInput, EDIT_clearError);
        window.ProductFormCore?.bindDecimalInput(dom.priceInput, EDIT_clearError);
        window.ProductFormCore?.bindDecimalInput(dom.originalPriceInput, null);
        window.ProductFormCore?.bindDecimalInput(dom.realPriceInput, null);

        if (dom.takePhotoBtn) {
            dom.takePhotoBtn.onclick = () => {
                const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);
                if (isMobile) {
                    if (dom.fileInput) {
                        dom.fileInput.setAttribute('capture', 'environment');
                        dom.fileInput.click();
                    }
                    return;
                }
                if (typeof EDIT_openDesktopCamera === 'function') {
                    EDIT_openDesktopCamera();
                }
            };
        }

        // Advanced Options Toggle
        const advancedToggle = document.getElementById('edit_advanced_options_toggle');
        const advancedContainer = document.getElementById('edit_advanced_options_container');
        if (advancedToggle && advancedContainer) {
            advancedToggle.addEventListener('click', () => {
                advancedContainer.classList.toggle('is-expanded');
            });
        }

        // Modern Uploader Click Trigger
        const uploaderContainer = document.getElementById('image-uploader');
        if (uploaderContainer && dom.pickFilesBtn) {
            uploaderContainer.addEventListener('click', (e) => {
                if (!e.target.closest('button') && !e.target.closest('.edit-product-modal__preview')) {
                    dom.pickFilesBtn.click();
                }
            });
        }
    },

    /**
     * @function attachGlobalListeners
     * @description Binds global window/document listeners.
     */
    attachGlobalListeners: () => {
        window.addEventListener('beforeunload', (e) => {
            if (typeof EDIT_images === 'undefined') return;
            if (!EDIT_images.some((img) => img.status === 'compressing' || img.status === 'pending')) return;
            e.preventDefault();
            e.returnValue = '';
        });
    }
};
