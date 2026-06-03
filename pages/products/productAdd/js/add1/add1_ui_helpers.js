/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */
/**
 * @file pages/productAdd/js/add1/add1.ui.helpers.js
 * @description DOM utilities and reusable UI functions for Product Add.
 */

window.ADD1_UI_Helpers = {
    /**
     * @function populateForm
     * @description Populates the form with draft data.
     */
    populateForm: (draft, context) => {
        if (!draft || !context) return;

        const {
            productNameInput, descriptionTextarea, sellerMessageTextarea,
            notesInput, quantityInput, priceInput, originalPriceInput,
            realPriceInput, heavyLoadCheckbox
        } = context;

        if (productNameInput) productNameInput.value = draft.name || '';
        if (descriptionTextarea) descriptionTextarea.value = draft.description || '';
        if (sellerMessageTextarea) sellerMessageTextarea.value = draft.sellerMessage || '';
        if (notesInput) notesInput.value = draft.notes || '';
        if (quantityInput) quantityInput.value = draft.quantity || '';
        if (priceInput) priceInput.value = draft.price || '';
        if (originalPriceInput) originalPriceInput.value = draft.originalPrice || '';
        if (realPriceInput) realPriceInput.value = draft.realPrice || '';
        if (heavyLoadCheckbox) heavyLoadCheckbox.checked = !!draft.heavyLoad;

        // Trigger events for counters and draft sync
        [
            productNameInput, descriptionTextarea, sellerMessageTextarea,
            notesInput, quantityInput, priceInput,
            originalPriceInput, realPriceInput, heavyLoadCheckbox
        ].forEach(el => {
            if (el) {
                el.dispatchEvent(new Event('input'));
                el.dispatchEvent(new Event('change'));
            }
        });
    },

    /**
     * @function restoreImages
     * @description Restores images from draft.
     */
    restoreImages: (draftImages) => {
        if (!Array.isArray(draftImages)) return;

        // Clear existing preview items first to avoid duplicates
        const previewsEl = document.getElementById('add1_previews');
        if (previewsEl) previewsEl.innerHTML = '';
        if (typeof window.add1_images !== 'undefined') window.add1_images.length = 0;

        for (const img of draftImages) {
            if (img.url) {
                // Mark as 'existing' so validator accepts it without needing compressedBlob
                const state = {
                    id: img.id || (Date.now() + Math.random()),
                    status: 'uploaded',    // ← shows 'current image' label in preview
                    url: img.url,
                    isExisting: true,      // bypasses compressedBlob requirement in validator
                    isLocal: !!img.isLocal // marks Base64 images for re-upload on submit
                };
                if (typeof window.add1_images !== 'undefined') window.add1_images.push(state);
                if (typeof add1_createPreviewItem === 'function') add1_createPreviewItem(state, img.url);
            }
        }
    },

    /**
     * @function resetUI
     * @description Resets the UI elements after discard.
     */
    resetUI: () => {
        if (window.ProductStateManager) {
            ProductStateManager.setSelectedCategories(null, null);
            ProductStateManager.setFormScopeFilter(null);
        }

        if (window.containerGoBack) {
            const container = document.getElementById('index-productAdd-container');
            if (container) {
                container.removeAttribute('data-page-url');
                container.innerHTML = '';
            }
            containerGoBack();
        } else {
            history.back();
        }
    }
};
