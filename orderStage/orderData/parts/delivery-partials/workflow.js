/**
 * @file orderStage/orderData/parts/delivery-partials/workflow.js
 * @description Renders the workflow actions for the delivery representative.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


window.OrderData_Delivery_Workflow = {
    render: function (orderData, statusObj, context = {}) {
        const stepId = parseInt(statusObj.step_id) || 1;

        const createCheck = (id, label, isChecked, isDisabled, targetStep) => `
            <label id="label_${id}" style="display: flex; align-items: center; gap: 10px; padding: 12px; background: ${isChecked ? '#f0fdf4' : (isDisabled ? '#f9f9f9' : '#fff')}; border: 1px solid ${isChecked ? '#bbf7d0' : (isDisabled ? '#eee' : '#ddd')}; border-radius: 8px; cursor: ${isDisabled ? 'default' : 'pointer'}; margin-bottom: 8px; opacity: ${isDisabled && !isChecked ? '0.6' : '1'}; transition: all 0.2s;">
                <input type="checkbox" id="${id}"
                    ${isChecked ? 'checked' : ''} 
                    ${isDisabled ? 'disabled' : ''} 
                    onchange="if(this.checked){ window.orderUpdateStep(${targetStep}) }"
                    style="width: 18px; height: 18px; accent-color: #27ae60; cursor: ${isDisabled ? 'default' : 'pointer'};">
                <span id="span_${id}" style="font-weight: bold; color: ${isChecked ? '#166534' : (isDisabled ? '#999' : '#333')};">
                    ${label}
                </span>
                ${isChecked ? `<i id="icon_${id}" class="fas fa-check-circle" style="color: #27ae60; margin-right: auto;"></i>` : ''}
            </label>
        `;

        let html = '<div id="order_delivery_actions_wrapper" style="margin-top:20px; border-top: 1px solid #eee; padding-top:15px; display: flex; flex-direction: column;">';
        html += '<div id="order_delivery_tasks_title" style="font-size: 0.85em; color: #666; margin-bottom: 10px; font-weight: bold;"><i id="order_delivery_tasks_icon" class="fas fa-clipboard-list"></i> قائمة مهام المندوب:</div>';

        html += createCheck('chk_delivery_pickup', '1. تم استلام الخدمات من مقدم الخدمة وبدء التحرك', stepId >= 3, stepId !== 2, 3);
        html += createCheck('chk_delivery_complete', '2. تسليم الطلب للعميل (بانتظار تأكيد المشتري)', stepId >= 4, !(stepId === 3 && (context.isSuperAdmin || context.isAdmin)), 4);

        if (stepId === 4) {
            html += `
                <div id="order_delivery_success_msg" style="margin-top: 10px; padding: 12px; background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; border-radius: 8px; font-size: 0.9em; text-align: center;">
                    <i id="order_delivery_success_icon" class="fas fa-check-circle"></i> تم إنهاء هذه المهمة وتسليم الطلب بنجاح.
                </div>
            `;
        } else if (stepId === 3) {
            html += `
                <div id="order_delivery_wait_hint" style="margin-top: 5px; font-size: 0.8em; color: #666; text-align: center;">
                    <i id="order_delivery_info_icon" class="fas fa-info-circle"></i> بانتظار العميل للضغط على "تأكيد الاستلام" لإغلاق الطلب.
                </div>
            `;
        }

        html += '</div>';
        return html;
    }
};
