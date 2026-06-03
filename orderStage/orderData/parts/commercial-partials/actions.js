/**
 * @file orderStage/orderData/parts/commercial-partials/actions.js
 * @description Renders the workflow actions for the commercial provider.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


window.OrderData_Commercial_Actions = {
    render: function (orderData, statusObj, context = {}) {
        const hasSpecialService = (orderData.order_items || []).some(item => item.serviceType == 2);
        if (hasSpecialService) {
            return '<div id="order_seller_special_msg" style="margin-top:20px; padding:10px; color:#666; font-style:italic; text-align:center;">هذا الطلب خدمة خاصة ويتم إدارته عبر التواصل المباشر.</div>';
        }

        const stepId = parseInt(statusObj.step_id) || 1;
        const productSummaryHTML = window.OrderData_Commercial_Summary ? window.OrderData_Commercial_Summary.render(orderData, statusObj, context) : '';

        // [Logic] Define Global Handler for Review Confirmation if not exists
        if (!window.orderConfirmReviewStage) {
            window.orderConfirmReviewStage = function (checkbox) {
                if (!checkbox.checked) return;
                Swal.fire({
                    title: 'اعتماد المراجعة',
                    html: '<span class="swal-modern-mini-text" style="display:block; color:#c0392b;">تنبيه: سيتم إرسال حالة الخدمات.<br>لن تتمكن من تعديل "توفر الخدمات" بعد هذه الخطوة.</span>',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'تاكيد',
                    cancelButtonText: 'تراجع',
                    confirmButtonColor: '#27ae60',
                    cancelButtonColor: '#95a5a6',
                    reverseButtons: true,
                    buttonsStyling: false,
                    customClass: {
                        popup: 'swal-modern-mini-popup',
                        title: 'swal-modern-mini-title',
                        confirmButton: 'swal-modern-mini-confirm',
                        cancelButton: 'swal-modern-mini-cancel'
                    }
                }).then((result) => {
                    if (result.isConfirmed) {
                        window.orderUpdateStep(2);
                    } else {
                        checkbox.checked = false;
                    }
                });
            };
        }

        const createCheck = (id, label, isChecked, isDisabled, targetStep, isSpecialReview = false, extraContent = '') => `
            <label id="label_${id}" style="display: flex; flex-direction: column; padding: 12px; background: ${isChecked ? '#f0fdf4' : (isDisabled ? '#f9f9f9' : '#fff')}; border: 1px solid ${isChecked ? '#bbf7d0' : (isDisabled ? '#eee' : '#ddd')}; border-radius: 12px; cursor: ${isDisabled ? 'default' : 'pointer'}; margin-bottom: 10px; opacity: ${isDisabled && !isChecked ? '0.6' : '1'}; transition: all 0.2s;">
                <div style="display: flex; align-items: center; gap: 10px; width: 100%;">
                    <input type="checkbox" id="${id}"
                        ${isChecked ? 'checked' : ''} 
                        ${isDisabled ? 'disabled' : ''} 
                        onchange="${isSpecialReview ? 'window.orderConfirmReviewStage(this)' : `if(this.checked){ window.orderUpdateStep(${targetStep}) }`}"
                        style="width: 20px; height: 20px; accent-color: #27ae60; cursor: ${isDisabled ? 'default' : 'pointer'};">
                    <span id="span_${id}" style="font-weight: bold; color: ${isChecked ? '#166534' : (isDisabled ? '#999' : '#333')}; font-size: 0.95em;">
                        ${label}
                    </span>
                    ${isChecked ? `<i id="icon_${id}" class="fas fa-check-circle" style="color: #27ae60; margin-right: auto;"></i>` : ''}
                </div>
                ${extraContent}
            </label>
        `;

        let html = '<div id="order_seller_actions_container" style="margin-top:20px; border-top: 1px solid #eee; padding-top:15px; display: flex; flex-direction: column;">';
        html += '<div id="order_seller_actions_title" style="font-size: 0.85em; color: #666; margin-bottom: 12px; font-weight: bold;"><i id="order_seller_tasks_icon" class="fas fa-clipboard-list"></i> قائمة مهام مقدم الخدمة:</div>';

        html += createCheck('chk_review', '1. تم مراجعة الطلب وتجهيز الخدمات', stepId >= 2, stepId >= 2, 2, true, productSummaryHTML);
        html += createCheck('chk_shipping', '2. تم تسليم الخدمات لمندوب الشحن', stepId >= 3, stepId !== 2, 3);

        html += '</div>';
        return html;
    }
};
