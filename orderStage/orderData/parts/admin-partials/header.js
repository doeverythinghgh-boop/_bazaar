/**
 * @file orderStage/orderData/parts/admin-partials/header.js
 * @description Generates the header section for the Super Admin view.
 */
window.OrderData_Admin_Header = {
    render: function (order) {
        return `
            <div id="order_header" class="order_header">
                <h3 id="order_title"><i class="fas fa-file-invoice"></i> تفاصيل الطلب الشاملة (Super Admin)</h3>
                <div id="order_header_meta" class="order_header_meta">
                    <span id="order_meta_key">رقم الطلب: #${order.order_key}</span>
                    <span id="order_meta_date">تاريخ الإنشاء: ${order.created_at}</span>
                </div>
            </div>
        `;
    }
};
