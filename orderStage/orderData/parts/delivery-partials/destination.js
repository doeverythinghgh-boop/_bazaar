/**
 * @file orderStage/orderData/parts/delivery-partials/destination.js
 * @description Renders the buyer's destination address for the courier.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


window.OrderData_Delivery_Destination = {
    render: function (orderData) {
        return `
            <div id="order_delivery_buyer_section" class="order_delivery_section" style="padding: 15px; background: #fff; border-radius: 12px; border: 1px solid #eee; margin-bottom: 20px;">
                <h4 id="order_delivery_buyer_title" style="margin: 0 0 15px 0; color: #2196F3; border-bottom: 2px solid #e3f2fd; padding-bottom: 8px;">
                    <i id="order_delivery_buyer_icon" class="fas fa-user-tag"></i> بيانات المشتري (مكان التوصيل)
                </h4>
                <div id="order_delivery_buyer_grid" style="display: grid; grid-template-columns: 1fr auto; gap: 10px; align-items: start;">
                    <div id="order_delivery_buyer_info_box">
                        <div id="order_delivery_buyer_name" style="font-weight: bold; font-size: 1.1em;">${orderData.user_name || 'غير متوفر'}</div>
                        <div id="order_delivery_buyer_addr" style="color: #666; margin-top: 5px;"><i id="order_delivery_buyer_loc_icon" class="fas fa-map-marker-alt"></i> ${orderData.user_address || 'غير متوفر'}</div>
                    </div>
                    <div id="order_delivery_buyer_contact_box" style="display: flex; flex-direction: column; gap: 8px;">
                        ${window.orderFormatPhone(orderData.user_phone)}
                        ${window.orderFormatLocation(orderData.user_location, orderData.user_name)}
                    </div>
                </div>
            </div>
        `;
    }
};
