/**
 * @file pages/cardPackage/js/cartPackage-ui-delivery-modal-main.js
 * @description UI logic for delivery details modal.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


function showDeliveryDetails(deliveryResult) {
    if (!deliveryResult || !deliveryResult.costBreakdown) {
        Swal.fire({
            title: window.langu('alert_error_title') || 'خطأ',
            text: window.langu('cart_no_details') || 'لا توجد تفاصيل متاحة للعرض.',
            confirmButtonText: window.langu('alert_confirm_btn'),
            buttonsStyling: false,
            customClass: {
                popup: 'swal-modern-mini-popup',
                title: 'swal-modern-mini-title',
                htmlContainer: 'swal-modern-mini-text',
                confirmButton: 'swal-modern-mini-confirm'
            }
        });
        return;
    }

    const metrics = buildDeliveryDetailsMetrics(deliveryResult);
    const detailsHTML = renderDeliveryDetailsHtml(deliveryResult, metrics);

    Swal.fire({
        html: detailsHTML,
        confirmButtonText: window.langu('alert_confirm_btn'),
        showCloseButton: true,
        buttonsStyling: false,
        customClass: {
            popup: 'swal-modern-mini-popup',
            title: 'swal-modern-mini-title',
            htmlContainer: 'swal-modern-mini-text',
            confirmButton: 'swal-modern-mini-confirm'
        }
    });
}
