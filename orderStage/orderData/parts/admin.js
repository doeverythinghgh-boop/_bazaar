/**
 * @file orderStage/orderData/parts/admin.js
 * @description Master renderer for Super Admin view (Aggregator).
 */

window.OrderData_Admin = {
    render: function (order, container) {
        if (!order || !container || container.style.display === 'none') return;

        const statusObj = parseOrderStatus(order.order_status);
        const items = order.order_items || [];

        // Generate Items HTML using the partial
        const itemsHTML = items.map((item, idx) =>
            window.OrderData_Admin_ItemsList.renderRow(item, idx, order)
        ).join('');

        // Combine all partials
        container.innerHTML = `
            ${window.OrderData_Admin_Header.render(order)}
            ${window.OrderData_Admin_BuyerInfo.render(order)}
            ${window.OrderData_Admin_ItemsList.render(order, itemsHTML)}
            ${window.OrderData_Admin_GridInfo.render(order, statusObj)}
            ${window.OrderData_Admin_Tokens ? window.OrderData_Admin_Tokens.render(order) : ''}
            ${window.OrderData_Admin_Permissions.render()}
            ${!items.some(it => it.serviceType == 2) ? window.OrderData_Admin_WorkflowGuide.render(statusObj) : ''}
            ${window.OrderData_Admin_RawData.render(order, statusObj)}
        `;
    },

    // Bridge for compatibility
    orderRender: function (order, container) {
        this.render(order, container);
    }
};
