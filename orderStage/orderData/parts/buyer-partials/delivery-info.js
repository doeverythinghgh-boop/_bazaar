/**
 * @file orderStage/orderData/parts/buyer-partials/delivery-info.js
 * @description Renders the delivery information section for the buyer.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


window.OrderData_Buyer_DeliveryInfo = {
    render: function (orderData) {
        const items = orderData.order_items || [];
        const platformItems = items.filter(item => item.seller_is_delivered == 0 || item.seller_is_delivered === null || item.seller_is_delivered === undefined);

        if (platformItems.length === 0) return '';

        // Collect unique deliveries
        const deliveries = [];
        const seenKeys = new Set();
        platformItems.forEach(item => {
            (item.supplier_delivery || []).forEach(del => {
                if (!seenKeys.has(del.delivery_key)) {
                    seenKeys.add(del.delivery_key);
                    deliveries.push(del);
                }
            });
        });

        if (deliveries.length > 0) {
            return `
                <div id="order_buyer_delivery_info" class="order_role_delivery_info" style="margin-top: 15px; padding: 15px; background: #f0f7ff; border-radius: 12px; border: 1px solid #d0e7ff;">
                    <h4 id="order_buyer_delivery_title" style="margin: 0 0 10px 0; color: #0056b3;"><i id="order_buyer_delivery_icon" class="fas fa-truck"></i> معلومات مندوب التوصيل</h4>
                    ${deliveries.map((del, dIdx) => `
                        <div id="order_buyer_del_item_${dIdx}" class="order_delivery_item" style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                            <div id="order_buyer_del_name_box_${dIdx}" style="flex: 1;">
                                <div id="order_buyer_del_name_${dIdx}" style="font-weight: bold; color: #333;">${del.delivery_name}</div>
                                <div id="order_buyer_del_desc_${dIdx}" style="font-size: 0.9em; color: #666;">سيتواصل معك المندوب لتنسيق موعد التسليم</div>
                            </div>
                            ${window.orderFormatPhone(del.delivery_phone)}
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            return `
                <div id="order_buyer_no_delivery" class="order_role_delivery_info" style="margin-top: 15px; padding: 15px; background: #fffbeb; border-radius: 12px; border: 1px solid #fde68a; color: #92400e;">
                    <i id="order_buyer_wait_icon" class="fas fa-hourglass-half"></i> جاري تخصيص مندوب لتوصيل طلبك عبر المنصة.
                </div>
            `;
        }
    }
};
