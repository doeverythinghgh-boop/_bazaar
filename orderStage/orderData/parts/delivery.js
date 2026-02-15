/**
 * @file orderStage/orderData/parts/delivery.js
 * @description Renders logic for the courier view.
 */

window.OrderData_Delivery = {
    /**
     * Populates the delivery section with relevant order data.
     * @param {object} orderData 
     */
    /**
     * Populates the delivery section with relevant order data.
     * @param {object} orderData 
     * @param {object} context - UI context containing isAdmin/isSuperAdmin flags.
     */
    orderRender: function (orderData, context = {}) {
        console.log('[OrderData:Delivery] Rendering...', { orderData, context });
        const el = document.getElementById('order_role_delivery');
        if (el && el.style.display !== 'none') {
            const contentEl = el.querySelector('.order_role_content');
            if (!contentEl) return;

            // 0. Parse Status
            const statusObj = typeof parseOrderStatus === 'function' ? parseOrderStatus(orderData.order_status) : {};

            const isAuth = context.isSuperAdmin || context.isAdmin;

            // 1. Buyer Profile (The Delivery Destination)
            const buyerHTML = `
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

            // 2. Sellers (Pickup Locations)
            const userStr = localStorage.getItem('loggedInUser');
            const currentUser = userStr ? JSON.parse(userStr) : null;
            
            let sellersHTML = '';
            if (currentUser || isAuth) {
                const mySellers = new Map();
                const currentKey = currentUser ? currentUser.user_key : null;

                (orderData.order_items || []).forEach(item => {
                    const isMyItem = (item.supplier_delivery || []).some(del => del.delivery_key === currentKey) || isAuth;
                    if (isMyItem && !mySellers.has(item.seller_key)) {
                        mySellers.set(item.seller_key, {
                            name: item.seller_name,
                            phone: item.seller_phone,
                            location: item.seller_location
                        });
                    }
                });

                if (mySellers.size > 0) {
                    sellersHTML = `
                        <div id="order_delivery_sellers_section" class="order_delivery_section" style="padding: 15px; background: #fff; border-radius: 12px; border: 1px solid #eee;">
                            <h4 id="order_delivery_sellers_title" style="margin: 0 0 15px 0; color: #e91e63; border-bottom: 2px solid #fce4ec; padding-bottom: 8px;">
                                <i id="order_delivery_sellers_icon" class="fas fa-store"></i> بيانات الموردين (أماكن استلام المنتجات)
                            </h4>
                            <div id="order_delivery_sellers_list" style="display: flex; flex-direction: column; gap: 15px;">
                                ${Array.from(mySellers.values()).map((seller, sIdx) => `
                                    <div id="order_delivery_seller_item_${sIdx}" style="display: grid; grid-template-columns: 1fr auto; gap: 10px; padding: 10px; background: #fafafa; border-radius: 8px;">
                                        <div id="order_delivery_seller_name_box_${sIdx}">
                                            <div id="order_delivery_seller_name_${sIdx}" style="font-weight: bold;">${seller.name}</div>
                                        </div>
                                        <div id="order_delivery_seller_contact_box_${sIdx}" style="display: flex; gap: 8px;">
                                            ${window.orderFormatPhone(seller.phone)}
                                            ${window.orderFormatLocation(seller.location, seller.name)}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `;
                }
            }

            contentEl.innerHTML = `
                <div id="order_delivery_content_wrapper" style="display: flex; flex-direction: column; gap: 10px;">
                    ${buyerHTML}
                    ${sellersHTML}
                </div>
                ${this.renderWorkflowActions(orderData, statusObj)}
            `;
        }
    },

    /**
     * @description COURIER WORKFLOW ACTIONS:
     * Implements a "Roadmap Checklist" pattern for delivery representatives.
     */
    renderWorkflowActions: function (orderData, statusObj) {
        const stepId = parseInt(statusObj.step_id) || 1;

        // [Helper] Checkbox Generator
        const createCheck = (id, label, isChecked, isDisabled, targetStep) => `
            <label id="label_${id}" style="display: flex; align-items: center; gap: 10px; padding: 12px; background: ${isChecked ? '#f0fdf4' : (isDisabled ? '#f9f9f9' : '#fff')}; border: 1px solid ${isChecked ? '#bbf7d0' : (isDisabled ? '#eee' : '#ddd')}; border-radius: 8px; cursor: ${isDisabled ? 'default' : 'pointer'}; margin-bottom: 8px; opacity: ${isDisabled && !isChecked ? '0.6' : '1'}; transition: all 0.2s;">
                <input type="checkbox" id="${id}"
                    ${isChecked ? 'checked' : ''} 
                    ${isDisabled ? 'disabled' : ''} 
                    onchange="if(this.checked){ window.orderUpdateStep(${targetStep}) }"
                    style="width: 18px; height: 18px; accent-color: #27ae60; cursor: ${isDisabled ? 'default' : 'pointer'};">
                <span id="span_${id}" style="font-weight: bold; color: ${isChecked ? '#166534' : (isDisabled ? '#999' : '#333')};">
                    ${label}
                </span>
                ${isChecked ? `<i id="icon_${id}" class="fas fa-check-circle" style="color: #27ae60; margin-right: auto;"></i>` : ''}
            </label>
        `;

        let html = '<div id="order_delivery_actions_wrapper" style="margin-top:20px; border-top: 1px solid #eee; padding-top:15px; display: flex; flex-direction: column;">';

        html += '<div id="order_delivery_tasks_title" style="font-size: 0.85em; color: #666; margin-bottom: 10px; font-weight: bold;"><i id="order_delivery_tasks_icon" class="fas fa-clipboard-list"></i> قائمة مهام المندوب:</div>';

        // 1. Pickup Stage (Step 2 -> 3)
        html += createCheck(
            'chk_delivery_pickup',
            '1. تم استلام المنتجات من البائع وبدء التحرك',
            stepId >= 3,
            stepId !== 2, // Enabled ONLY if step is 2
            3
        );

        // 2. Delivery Stage (Step 3 -> 4)
        // [Note] Buyer usually confirms this, but we show it as a roadmap step for courier.
        html += createCheck(
            'chk_delivery_complete',
            '2. تسليم الطلب للعميل (بانتظار تأكيد المشتري)',
            stepId >= 4,
            true, // Disabled: Driven by Buyer's confirmation or Admin
            4
        );

        // Success Message (Step 4)
        if (stepId === 4) {
             html += `
                <div id="order_delivery_success_msg" style="margin-top: 10px; padding: 12px; background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; border-radius: 8px; font-size: 0.9em; text-align: center;">
                    <i id="order_delivery_success_icon" class="fas fa-check-circle"></i> تم إنهاء هذه المهمة وتسليم الطلب بنجاح.
                </div>
            `;
        } else if (stepId === 3) {
            html += `
                <div id="order_delivery_wait_hint" style="margin-top: 5px; font-size: 0.8em; color: #666; text-align: center;">
                    <i id="order_delivery_info_icon" class="fas fa-info-circle"></i> بانتظار العميل للضغط على "تأكيد الاستلام" لإغلاق الطلب.
                </div>
            `;
        }

        html += '</div>';
        return html;
    }
};
