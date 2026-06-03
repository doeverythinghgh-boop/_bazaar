/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */
/**
 * @file pages/productAdd/js/add1/add1.ui.events.js
 * @description Event listeners for Product Add UI.
 */

window.ADD1_UI_Events = {
    /**
     * @function attachListeners
     * @description Binds all UI event listeners.
     */
    attachListeners: (context) => {
        const {
            pickFilesBtn, takePhotoBtn, fileInput,
            productNameInput, descriptionTextarea, sellerMessageTextarea,
            notesInput, quantityInput, priceInput,
            originalPriceInput, realPriceInput, heavyLoadCheckbox,
            btnDiscard, handler, uiHelpers
        } = context;

        if (pickFilesBtn) {
            pickFilesBtn.addEventListener('click', () => {
                try {
                    fileInput.removeAttribute('capture');
                    fileInput.click();
                } catch (error) {
                    console.error('[Add1] Error picking files:', error);
                }
            });
        }

        if (takePhotoBtn) {
            takePhotoBtn.addEventListener('click', () => {
                try {
                    const tempInput = document.createElement('input');
                    tempInput.type = 'file';
                    tempInput.accept = 'image/*';
                    tempInput.style.display = 'none';
                    tempInput.setAttribute('capture', 'environment');
                    document.body.appendChild(tempInput);

                    tempInput.addEventListener('change', async (e) => {
                        if (e.target.files && e.target.files.length > 0) {
                            if (typeof add1_handleNewFiles === 'function') {
                                await add1_handleNewFiles(e.target.files);
                            }
                            handler.saveDraft(context);
                        }
                        if (tempInput.parentNode) tempInput.parentNode.removeChild(tempInput);
                    });

                    setTimeout(() => { tempInput.click(); }, 100);
                } catch (error) {
                    console.error('[Add1] Error in camera trigger:', error);
                }
            });
        }

        if (fileInput) {
            fileInput.addEventListener('change', async (e) => {
                if (typeof add1_handleNewFiles === 'function') {
                    await add1_handleNewFiles(e.target.files);
                }
                handler.saveDraft(context);
            });
        }

        // Counter and input bindings
        window.ProductFormCore?.bindCounter(productNameInput, 'add1_product_name_char_counter', add1_clearError);
        window.ProductFormCore?.bindCounter(descriptionTextarea, 'add1_description_char_counter', add1_clearError);
        window.ProductFormCore?.bindCounter(sellerMessageTextarea, 'add1_seller_message_char_counter', add1_clearError);
        window.ProductFormCore?.bindCounter(notesInput, 'add1_notes_char_counter', add1_clearError);

        window.ProductFormCore?.bindIntegerInput(quantityInput, add1_clearError);
        window.ProductFormCore?.bindDecimalInput(priceInput, add1_clearError);
        window.ProductFormCore?.bindDecimalInput(originalPriceInput, null);
        window.ProductFormCore?.bindDecimalInput(realPriceInput, null);

        // Input listeners for real-time saving
        [
            productNameInput, descriptionTextarea, sellerMessageTextarea,
            notesInput, quantityInput, priceInput,
            originalPriceInput, realPriceInput, heavyLoadCheckbox
        ].forEach(el => {
            if (el) {
                el.addEventListener('input', () => {
                    console.log(`[Add1] Input change detected on ${el.id || el.name}. Triggering draft save.`);
                    handler.saveDraft(context);
                });
            }
        });

        // Advanced Options Toggle
        const advancedToggle = document.getElementById('add1_advanced_options_toggle');
        const advancedContainer = document.getElementById('add1_advanced_options_container');
        if (advancedToggle && advancedContainer) {
            advancedToggle.addEventListener('click', () => {
                advancedContainer.classList.toggle('is-expanded');
            });
        }

        // Modern Uploader Click Trigger
        const uploaderContainer = document.getElementById('add1_image_uploader');
        if (uploaderContainer && pickFilesBtn) {
            uploaderContainer.addEventListener('click', (e) => {
                if (!e.target.closest('button') && !e.target.closest('.add1_product_modal__preview')) {
                    pickFilesBtn.click();
                }
            });
        }

        // Discard button
        if (btnDiscard) {
            btnDiscard.addEventListener('click', () => {
                handler.handleDiscard(context, uiHelpers);
            });
        }
    }
};
