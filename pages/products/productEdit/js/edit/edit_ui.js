/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */
/**
 * @file pages/productEdit/js/edit/edit.ui.js
 * @description UI manipulation and alerts for Product Edit.
 */

window.EDIT_UI = {
    /**
     * @function showUpdatingLoader
     * @description Shows the SweetAlert loading spinner for update process.
     */
    showUpdatingLoader: () => {
        Swal.fire({
            title: window.langu('edit_swal_updating_title'),
            text: window.langu('edit_swal_updating_text'),
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            },
            buttonsStyling: false,
            customClass: {
                popup: 'swal-modern-mini-popup',
                title: 'swal-modern-mini-title',
                htmlContainer: 'swal-modern-mini-text'
            }
        });
    },

    /**
     * @function showNoChangesAlert
     * @description Shows an alert when no changes were detected.
     */
    showNoChangesAlert: (customMessage) => {
        console.log('[ProductEdit UI] Showing no changes alert:', customMessage || 'Default message');
        return Swal.fire({
            title: customMessage || window.langu('edit_swal_no_changes_title'),
            text: customMessage ? '' : window.langu('edit_swal_no_changes_text'),
            showConfirmButton: true,
            confirmButtonText: window.langu('alert_confirm_btn'),
            didOpen: () => {
                Swal.hideLoading();
            },
            buttonsStyling: false,
            customClass: {
                popup: 'swal-modern-mini-popup',
                title: 'swal-modern-mini-title',
                htmlContainer: 'swal-modern-mini-text',
                confirmButton: 'swal-modern-mini-confirm'
            }
        });
    },

    /**
     * @function showSuccessAlert
     * @description Shows success alert and handles redirection.
     */
    showSuccessAlert: async (productData) => {
        return Swal.fire({
            title: window.langu('gen_swal_success_title'),
            text: window.langu('edit_swal_success_text'),
            timer: 2000,
            showConfirmButton: false,
            buttonsStyling: false,
            customClass: {
                popup: 'swal-modern-mini-popup',
                title: 'swal-modern-mini-title',
                htmlContainer: 'swal-modern-mini-text'
            }
        }).then(async () => {
            // Clear draft on successful update
            if (typeof window.ProductDraftManager !== 'undefined' && typeof EDIT_collectDraftData === 'function') {
                const draftData = await EDIT_collectDraftData();
                const key = window.ProductDraftManager.generateKey(draftData.providerKey, draftData.productKey, draftData.mainId, draftData.subId);
                window.ProductDraftManager.clearDraft(key);
                console.log('[Edit] Draft cleared after successful update.');
            }

            const targetUrl = window.ProductRoutes?.buildProductViewUrl
                ? window.ProductRoutes.buildProductViewUrl(productData)
                : `/pages/products/productView/productView.html?product_key=${productData.product_key}&provider_key=${productData.user_key}`;
            console.log('[Edit] Redirecting to:', targetUrl);
            window.location.href = targetUrl;
        });
    },

    /**
     * @function showErrorAlert
     * @description Shows error alert for submission failures.
     */
    showErrorAlert: (error) => {
        Swal.fire({
            title: window.langu('gen_swal_error_title'),
            text: `${window.langu('edit_swal_update_failed_text')} ${error.message}`,
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
