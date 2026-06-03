/**
 * @file orderStage/orderData/parts/buyer-partials/workflow.js
 * @description Renders the interactive workflow checklist for the buyer.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


window.OrderData_Buyer_Workflow = {
    render: function (orderData, statusObj) {
        const lang = LocalDBStorage.getItem('app_language') || 'ar';
        const hasSpecialService = (orderData.order_items || []).some(item => item.serviceType == 2);

        if (hasSpecialService) {
            return '<div style="margin-top:20px; padding:10px; color:#666; font-style:italic; text-align:center;">هذا الطلب خدمة خاصة. يرجى مراجعة التفاصيل مع الإدارة.</div>';
        }

        const stepId = parseInt(statusObj.step_id) || 1;

        const createCheck = (id, label, isChecked, isDisabled, targetStep, isDestructive = false) => `
            <label id="label_${id}" style="display: flex; align-items: center; gap: 10px; padding: 12px; background: ${isChecked ? (isDestructive ? '#fef2f2' : '#f0fdf4') : (isDisabled ? '#f9f9f9' : '#fff')}; border: 1px solid ${isChecked ? (isDestructive ? '#fecaca' : '#bbf7d0') : (isDisabled ? '#eee' : '#ddd')}; border-radius: 8px; cursor: ${isDisabled ? 'default' : 'pointer'}; margin-bottom: 8px; opacity: ${isDisabled && !isChecked ? '0.6' : '1'}; transition: all 0.2s;">
                <input type="checkbox" id="${id}"
                    ${isChecked ? 'checked' : ''} 
                    ${isDisabled ? 'disabled' : ''} 
                    onchange="if(this.checked){ window.orderUpdateStep(${targetStep}) }"
                    style="width: 18px; height: 18px; accent-color: ${isDestructive ? '#dc2626' : '#27ae60'}; cursor: ${isDisabled ? 'default' : 'pointer'};">
                <span id="span_${id}" style="font-weight: bold; color: ${isChecked ? (isDestructive ? '#b91c1c' : '#166534') : (isDestructive ? '#dc2626' : (isDisabled ? '#999' : '#333'))};">
                    ${label}
                </span>
                ${isChecked ? `<i id="icon_${id}" class="fas ${isDestructive ? 'fa-times-circle' : 'fa-check-circle'}" style="margin-right: auto; color: ${isDestructive ? '#dc2626' : '#27ae60'};"></i>` : ''}
            </label>
        `;

        let html = '<div id="order_buyer_actions_container" style="margin-top:20px; border-top: 1px solid #eee; padding-top:15px; display: flex; flex-direction: column;">';
        html += '<div id="order_buyer_actions_title" style="font-size: 0.85em; color: #666; margin-bottom: 10px; font-weight: bold;"><i id="order_buyer_tasks_icon" class="fas fa-tasks"></i> إجراءات المشتري:</div>';

        if (stepId === 5 || stepId < 3) {
            html += createCheck('chk_buyer_cancel', 'إلغاء الطلب بالكامل', stepId === 5, stepId === 5, 5, true);
        }

        if (stepId !== 5) {
            const isRecieved = stepId >= 4;
            const canConfirm = stepId === 3;

            html += createCheck('chk_buyer_receipt', 'تأكيد استلام الطلب والاغلاق', isRecieved, !canConfirm, 4, false);

            if (canConfirm) {
                html += createCheck('chk_buyer_refuse', 'رفض استلام الطلب (إلغاء)', false, false, 5, true);
            }
        }

        if (stepId === 4) {
            const ratingText = lang === 'ar'
                ? '<i class="fas fa-comment-dots"></i> <b>يسعدنا دائماً سماع رأيكم!</b> لتقييم الخدمات، يرجى الضغط على زر <b style="color: #2196F3;">\'التفاصيل\'</b> بجانب كل منتج لمشاركة تقييمكم الخاص.'
                : '<i class="fas fa-comment-dots"></i> <b>Your feedback matters!</b> To rate the products, please click the <b style="color: #2196F3;">\'Details\'</b> button next to each item to share your review.';

            html += `
                <div id="order_buyer_rating_box" style="margin-top: 10px; padding: 15px; background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; text-align: center;">
                    <div id="order_buyer_rating_title" style="font-weight: normal; font-size: 0.9em; line-height: 1.6; color: #92400e;">
                        ${ratingText}
                    </div>
                </div>
            `;
        }

        html += '</div>';
        return html;
    }
};
