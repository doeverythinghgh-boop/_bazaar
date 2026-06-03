/**
 * @file orderStage/orderData/parts/delivery.js
 * @description Master renderer for the courier/delivery view.
 * Uses specialized partials for SRP compliance.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


window.OrderData_Delivery = {
    /**
     * Populates the delivery section with relevant order data.
     */
    orderRender: function (orderData, context = {}) {
        console.log('[OrderData:Delivery] Rendering master...', { orderData, context });

        const el = document.getElementById('order_role_delivery');
        if (!el || el.style.display === 'none') return;

        const contentEl = el.querySelector('.order_role_content');
        if (!contentEl) return;

        const statusObj = typeof parseOrderStatus === 'function' ? parseOrderStatus(orderData.order_status) : {};

        // 1. Build UI from Partials
        const destinationHTML = window.OrderData_Delivery_Destination ? window.OrderData_Delivery_Destination.render(orderData) : '';
        const pickupsHTML = window.OrderData_Delivery_Pickups ? window.OrderData_Delivery_Pickups.render(orderData, context) : '';
        const workflowHTML = window.OrderData_Delivery_Workflow ? window.OrderData_Delivery_Workflow.render(orderData, statusObj, context) : '';

        contentEl.innerHTML = `
            <div id="order_delivery_content_wrapper" style="display: flex; flex-direction: column; gap: 10px;">
                ${destinationHTML}
                ${pickupsHTML}
            </div>
            ${workflowHTML}
        `;
    }
};
