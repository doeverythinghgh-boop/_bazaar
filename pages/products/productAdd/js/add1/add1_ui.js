/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */
/**
 * @file pages/productAdd/js/add1/add1.ui.js
 * @description UI manipulation and alerts for Product Add.
 */

window.ADD1_UI = {
    /**
     * @function setSubmitLoading
     * @description Updates the submit button state with premium icons and text.
     * @param {boolean} isLoading - Whether the form is currently submitting.
     */
    setSubmitLoading: (isLoading) => {
        window.ProductDebugConsole?.snapshot('productAdd-submit', 'set-submit-loading', { isLoading });

        if (!add1_btnSubmit) return;
        const submitBtnText = add1_btnSubmit.querySelector('span');
        const submitBtnIcon = add1_btnSubmit.querySelector('i');

        if (isLoading) {
            add1_btnSubmit.disabled = true;
            if (submitBtnText) submitBtnText.textContent = window.langu('add1_submit_btn_saving');
            if (submitBtnIcon) submitBtnIcon.className = 'fas fa-spinner fa-spin';
            add1_btnSubmit.style.opacity = '0.7';
        } else {
            add1_btnSubmit.disabled = false;
            if (submitBtnText) submitBtnText.textContent = window.langu('add1_submit_btn_ready');
            if (submitBtnIcon) submitBtnIcon.className = 'fas fa-arrow-left';
            add1_btnSubmit.style.opacity = '1';
        }
    },

    /**
     * @function showAddingLoader
     * @description Shows the SweetAlert loader for the addition process.
     */
    showAddingLoader: () => {
        Swal.fire({
            title: window.langu('add1_swal_adding_title'),
            text: window.langu('add1_swal_uploading_text'),
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); },
            buttonsStyling: false,
            customClass: {
                popup: 'swal-modern-mini-popup',
                title: 'swal-modern-mini-title',
                htmlContainer: 'swal-modern-mini-text'
            }
        });
    },

    /**
     * @function showSuccessAlert
     * @description Shows success alert and handles cleanup/redirection.
     */
    showSuccessAlert: (productData) => {
        const isApproved = productData.is_approved === 1;
        const textKey = isApproved ? 'add1_swal_success_auto_text' : 'add1_swal_success_text';

        return Swal.fire({
            title: window.langu('gen_swal_success_title'),
            text: window.langu(textKey),
            confirmButtonText: window.langu('alert_confirm_btn'),
            buttonsStyling: false,
            customClass: {
                popup: 'swal-modern-mini-popup',
                title: 'swal-modern-mini-title',
                htmlContainer: 'swal-modern-mini-text',
                confirmButton: 'swal-modern-mini-confirm'
            }
        }).then(async () => {
            window.ProductDebugConsole?.log('productAdd-submit', 'success-cleanup-start');
            ADD1_UI.setSubmitLoading(false);

            // Clear draft on successful addition
            if (typeof window.ProductDraftManager !== 'undefined' && typeof ADD1_collectDraftData === 'function') {
                const draftData = await ADD1_collectDraftData();
                const key = window.ProductDraftManager.generateKey(draftData.providerKey, 'new', draftData.mainId, draftData.subId);
                window.ProductDraftManager.clearDraft(key);
                console.log('[Add1] Draft cleared after successful addition.');
            }

            if (window.ProductStateManager) {
                ProductStateManager.setProductForView(productData);
                ProductStateManager.setSelectedCategories(null, null);
                ProductStateManager.setFormScopeFilter(null);
            }

            add1_form.reset();
            add1_previewsEl.innerHTML = '';
            add1_images.length = 0;

            window.ProductFormSubmitCore.resetCounters([
                'add1_product_name_char_counter',
                'add1_description_char_counter',
                'add1_seller_message_char_counter',
                'add1_notes_char_counter'
            ]);

            const targetUrl = window.ProductRoutes?.buildProductViewUrl
                ? window.ProductRoutes.buildProductViewUrl(productData, { providerKey: userSession.user_key })
                : `/pages/products/productView/productView.html?product_key=${productData.product_key}&provider_key=${userSession.user_key}`;
            console.log('[Add1] Redirecting to:', targetUrl);
            window.location.href = targetUrl;
        });
    },

    /**
     * @function showErrorAlert
     * @description Shows error alert for submission failures.
     */
    showErrorAlert: (error) => {
        ADD1_UI.setSubmitLoading(false);
        Swal.fire({
            title: window.langu('gen_swal_error_title'),
            text: window.langu('add1_swal_error_text'),
            confirmButtonText: window.langu('alert_confirm_btn'),
            buttonsStyling: false,
            customClass: {
                popup: 'swal-modern-mini-popup',
                title: 'swal-modern-mini-title',
                htmlContainer: 'swal-modern-mini-text',
                confirmButton: 'swal-modern-mini-confirm'
            }
        });
    }
};
