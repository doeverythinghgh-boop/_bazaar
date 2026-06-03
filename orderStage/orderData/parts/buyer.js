/**
 * @file orderStage/orderData/parts/buyer.js
 * @description Master renderer for the purchaser view.
 * Uses specialized partials for SRP compliance.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


window.OrderData_Buyer = {
    /**
     * Populates the buyer section with relevant order data.
     */
    orderRender: function (orderData, context = {}) {
        console.log('[OrderData:Buyer] Rendering master...', { orderData, context });

        const el = document.getElementById('order_role_buyer');
        if (!el || el.style.display === 'none') return;

        const contentEl = el.querySelector('.order_role_content');
        if (!contentEl) return;

        const statusObj = typeof parseOrderStatus === 'function' ? parseOrderStatus(orderData.order_status) : {};

        // 1. Initial State Check
        const items = orderData.order_items || [];
        if (items.length === 0) {
            contentEl.innerHTML = '<div id="order_buyer_no_items" style="padding:15px; color:#666;">لا توجد تفاصيل خدمات للعرض حالياً.</div>';
            return;
        }

        // 2. Build UI from Partials
        const deliveryHTML = window.OrderData_Buyer_DeliveryInfo ? window.OrderData_Buyer_DeliveryInfo.render(orderData) : '';
        const workflowHTML = window.OrderData_Buyer_Workflow ? window.OrderData_Buyer_Workflow.render(orderData, statusObj) : '';

        contentEl.innerHTML = `
            ${deliveryHTML}
            ${workflowHTML}
        `;
    }
};
