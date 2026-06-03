/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */
/**
 * @file pages/productEdit/js/edit/edit.ui.helpers.js
 * @description DOM utilities and reusable UI functions for Product Edit.
 */

window.EDIT_UI_Helpers = {
    /**
     * @function updateSubmitButtonState
     * @description Updates the submit button disabled state.
     */
    updateSubmitButtonState: (isChanged) => {
        const submitBtn = document.getElementById('edit_btn_submit');
        if (submitBtn) {
            // Requirement: Button must be clickable to show "no changes" message
            submitBtn.disabled = false;
            console.log(`[Edit] Change check: ${isChanged ? 'Changes detected.' : 'No changes detected.'}`);
        }
    },

    /**
     * @function populateForm
     * @description Populates the form with draft data.
     */
    populateForm: (draft, dom) => {
        if (!draft || !dom) return;

        if (dom.productNameInput) dom.productNameInput.value = draft.name || '';
        if (dom.descriptionTextarea) dom.descriptionTextarea.value = draft.description || '';
        if (dom.sellerMessageTextarea) dom.sellerMessageTextarea.value = draft.sellerMessage || '';
        if (dom.notesInput) dom.notesInput.value = draft.notes || '';
        if (dom.quantityInput) dom.quantityInput.value = draft.quantity || '';
        if (dom.priceInput) dom.priceInput.value = draft.price || '';
        if (dom.originalPriceInput) dom.originalPriceInput.value = draft.originalPrice || '';
        if (dom.realPriceInput) dom.realPriceInput.value = draft.realPrice || '';
        if (dom.heavyLoadCheckbox) dom.heavyLoadCheckbox.checked = !!draft.heavyLoad;

        // Trigger events for counters and draft sync
        [
            dom.productNameInput, dom.descriptionTextarea, dom.sellerMessageTextarea,
            dom.notesInput, dom.quantityInput, dom.priceInput,
            dom.originalPriceInput, dom.realPriceInput, dom.heavyLoadCheckbox
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

        // Clear current states
        if (typeof EDIT_images !== 'undefined') {
            EDIT_images.length = 0;
            const previews = document.getElementById('previews');
            if (previews) {
                const loader = document.getElementById('images-loading');
                previews.innerHTML = '';
                if (loader) previews.appendChild(loader);
            }
        }

        for (const img of draftImages) {
            const state = {
                id: img.id || (Date.now() + Math.random()),
                status: img.status,
                url: img.url,
                fileName: img.fileName,
                isExisting: img.isExisting === true && !img.isLocal,
                isLocal: !!img.isLocal
            };
            if (typeof EDIT_images !== 'undefined') EDIT_images.push(state);
            if (typeof EDIT_createPreviewItem === 'function') {
                EDIT_createPreviewItem(state, state.url || null);
            }
        }

        const loader = document.getElementById('images-loading');
        if (loader) loader.style.display = 'none';
    }
};
