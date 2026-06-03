/**
 * @file orderStage/orderData/parts/delivery-partials/pickups.js
 * @description Renders the supplier pickup locations for the courier.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


window.OrderData_Delivery_Pickups = {
    render: function (orderData, context = {}) {
        const currentUser = window.userSession || (typeof UserService !== 'undefined' ? UserService.get() : null);
        const trueIsAdmin = context.trueIsAdmin || context.trueIsSuperAdmin;
        const simulatedDeliveryKey = context.simulatedDeliveryKey;
        const isSimulatingDelivery = context.isSimulating && context.activeOrderRole === 'delivery';

        const mySellers = new Map();
        const currentKey = currentUser ? currentUser.user_key : null;

        (orderData.order_items || []).forEach(item => {
            const deliveries = item.supplier_delivery || [];
            const assignedToOrder = (orderData.delivery_keys || []).includes(currentKey)
                || (isSimulatingDelivery && simulatedDeliveryKey && (orderData.delivery_keys || []).includes(simulatedDeliveryKey));
            const isPlatformDelivery = item.seller_is_delivered == 0 || item.seller_is_delivered === null || item.seller_is_delivered === undefined;
            const isMyItem = (deliveries.length === 0 && isPlatformDelivery && (assignedToOrder || trueIsAdmin)) || deliveries.some(del => {
                if (isSimulatingDelivery && simulatedDeliveryKey) return del.delivery_key === simulatedDeliveryKey;
                return del.delivery_key === currentKey || trueIsAdmin;
            });

            if (isMyItem && !mySellers.has(item.seller_key)) {
                mySellers.set(item.seller_key, {
                    name: item.seller_name,
                    phone: item.seller_phone,
                    location: item.seller_location
                });
            }
        });

        if (mySellers.size === 0) return '';

        return `
            <div id="order_delivery_sellers_section" class="order_delivery_section" style="padding: 15px; background: #fff; border-radius: 12px; border: 1px solid #eee;">
                <h4 id="order_delivery_sellers_title" style="margin: 0 0 15px 0; color: #e91e63; border-bottom: 2px solid #fce4ec; padding-bottom: 8px;">
                    <i id="order_delivery_sellers_icon" class="fas fa-store"></i> بيانات الموردين (أماكن استلام الخدمات)
                </h4>
                <div id="order_delivery_sellers_list" style="display: flex; flex-direction: column; gap: 15px;">
                    ${Array.from(mySellers.values()).map((merchant, sIdx) => `
                        <div id="order_delivery_seller_item_${sIdx}" style="display: grid; grid-template-columns: 1fr auto; gap: 10px; padding: 10px; background: #fafafa; border-radius: 8px;">
                            <div id="order_delivery_seller_name_box_${sIdx}">
                                <div id="order_delivery_seller_name_${sIdx}" style="font-weight: bold;">${merchant.name}</div>
                            </div>
                            <div id="order_delivery_seller_contact_box_${sIdx}" style="display: flex; gap: 8px;">
                                ${window.orderFormatPhone(merchant.phone)}
                                ${window.orderFormatLocation(merchant.location, merchant.name)}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
};
