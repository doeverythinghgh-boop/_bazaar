/**
 * @file orderStage/orderData/parts/admin-partials/header.js
 * @description Generates the header section for the Super Admin view.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
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
