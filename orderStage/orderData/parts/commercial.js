/**
 * @file orderStage/orderData/parts/commercial.js
 * @description Master renderer for the service-provider/commercial view.
 * Uses specialized partials for SRP compliance.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


window.OrderData_Commercial = {
    /**
     * Populates the service-provider section with relevant order data.
     */
    orderRender: function (orderData, context = {}) {
        console.log('[OrderData:Commercial] Rendering master...', { orderData, context });
        const el = document.getElementById('order_role_commercial');
        if (!el || el.style.display === 'none') return;

        const contentEl = el.querySelector('.order_role_content');
        if (!contentEl) return;

        const statusObj = typeof parseOrderStatus === 'function' ? parseOrderStatus(orderData.order_status) : {};

        // 1. Initial Logic (Filtering and Delivery Header logic)
        const currentUser = window.userSession || (typeof UserService !== 'undefined' ? UserService.get() : null);
        const trueIsAdmin = context.trueIsAdmin || context.trueIsSuperAdmin;
        const simulatedSellerKey = context.simulatedSellerKey;
        const isSimulatingCommercial = context.isSimulating && context.activeOrderRole === 'commercial';

        const myItems = (orderData.order_items || []).filter(item => {
            if (isSimulatingCommercial && simulatedSellerKey) return item.seller_key === simulatedSellerKey;
            return trueIsAdmin || item.seller_key === currentUser?.user_key;
        });

        if (myItems.length === 0) return;

        // 2. Delivery Header Logic (Platform vs Self)
        const usePlatformDelivery = myItems.some(item => item.seller_is_delivered == 0 || item.seller_is_delivered === null || item.seller_is_delivered === undefined);
        let deliveryHeaderHTML = '';

        if (usePlatformDelivery) {
            const deliveries = [];
            const seenKeys = new Set();
            myItems.forEach(item => {
                if (item.seller_is_delivered == 0 || item.seller_is_delivered === null || item.seller_is_delivered === undefined) {
                    (item.supplier_delivery || []).forEach(del => {
                        if (!seenKeys.has(del.delivery_key)) {
                            seenKeys.add(del.delivery_key);
                            deliveries.push(del);
                        }
                    });
                }
            });

            if (deliveries.length > 0) {
                deliveryHeaderHTML = `
                    <div id="order_seller_delivery_info" class="order_role_delivery_info" style="margin-top: 15px; padding: 15px; background: #f0f7ff; border-radius: 12px; border: 1px solid #d0e7ff;">
                        <h4 id="order_seller_delivery_title" style="margin: 0 0 10px 0; color: #0056b3;"><i id="order_seller_delivery_icon" class="fas fa-truck"></i> مندوب الاستلام (Bazaar Delivery)</h4>
                        ${deliveries.map((del, dIdx) => `
                            <div id="order_seller_del_item_${dIdx}" class="order_delivery_item" style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                                <div id="order_seller_del_name_box_${dIdx}" style="flex: 1;">
                                    <div id="order_seller_del_name_${dIdx}" style="font-weight: bold; color: #333;">${del.delivery_name}</div>
                                </div>
                                ${window.orderFormatPhone(del.delivery_phone)}
                            </div>
                        `).join('')}
                    </div>
                `;
            } else {
                deliveryHeaderHTML = `
                     <div id="order_seller_no_delivery" class="order_role_delivery_info" style="margin-top: 15px; padding: 15px; background: #fff7ed; border-radius: 12px; border: 1px solid #ffedd5; color: #9a3412;">
                        <i id="order_seller_clock_icon" class="fas fa-clock"></i> جاري تخصيص مندوب من Bazaar لاستلام الخدمات.
                    </div>
                `;
            }
        } else {
            deliveryHeaderHTML = `
                <div id="order_seller_self_delivery" style="margin-top: 15px; padding: 15px; background: #f0fdf4; border-radius: 12px; border: 1px solid #dcfce7; color: #166534;">
                    <i id="order_seller_check_icon" class="fas fa-check-circle"></i> مقدم الخدمة مسؤول عن التوصيل الخاص بخدماته.
                </div>
            `;
        }

        // 3. Render Actions from Partial
        const actionsHTML = window.OrderData_Commercial_Actions ? window.OrderData_Commercial_Actions.render(orderData, statusObj, context) : '';

        contentEl.innerHTML = `
            ${deliveryHeaderHTML}
            ${actionsHTML}
        `;
    }
};
