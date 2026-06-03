/**
 * @file orderStage/orderData/parts/admin.js
 * @description Master renderer for Super Admin view (Aggregator).
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


window.OrderData_Admin = {
    render: function (order, container) {
        if (!order || !container || container.style.display === 'none') return;
        if (window.OrderData_UI?.setCurrentOrderData) {
            window.OrderData_UI.setCurrentOrderData(order);
        }

        const statusObj = parseOrderStatus(order.order_status);
        const items = order.order_items || [];

        // Generate Items HTML using the partial
        const itemKeys = new Set(items.map((item) => String(item.product_key || item.product_id || '')));
        const pharmacyItems = Array.isArray(order.pharmacy_products)
            ? order.pharmacy_products.filter((item) => !itemKeys.has(String(item.product_id || item.product_key || '')))
            : [];
        const itemsHTML = items.map((item, idx) =>
            window.OrderData_Admin_ItemsList.renderRow(item, idx, order)
        ).join('') + pharmacyItems.map((item, idx) =>
            window.OrderData_Admin_ItemsList.renderPharmacyRow(item, idx)
        ).join('');

        // Combine all partials
        container.innerHTML = `
            ${window.OrderData_Admin_Header.render(order)}
            ${window.OrderData_Admin_BuyerInfo.render(order)}
            ${window.OrderData_Admin_ItemsList.render(order, itemsHTML)}
            ${window.OrderData_Admin_GridInfo.render(order, statusObj)}
            ${window.OrderData_Admin_DeliveryAssignment ? window.OrderData_Admin_DeliveryAssignment.render(order) : ''}
            ${window.OrderData_Admin_Tokens ? window.OrderData_Admin_Tokens.render(order) : ''}
            ${window.OrderData_Admin_Permissions.render()}
            ${!items.some(it => it.serviceType == 2) ? window.OrderData_Admin_WorkflowGuide.render(statusObj) : ''}
            ${window.OrderData_Admin_RawData.render(order, statusObj)}
        `;
    },

    // Bridge for compatibility
    orderRender: function (order, container) {
        this.render(order, container);
        if (window.OrderData_Admin_DeliveryAssignment && typeof window.OrderData_Admin_DeliveryAssignment.init === 'function') {
            window.OrderData_Admin_DeliveryAssignment.init(order);
        }
    }
};
