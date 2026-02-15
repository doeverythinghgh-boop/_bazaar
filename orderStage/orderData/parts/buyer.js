/**
 * @file orderStage/orderData/parts/buyer.js
 * @description Renders logic for the purchaser view.
 */

window.OrderData_Buyer = {
    /**
     * Populates the buyer section with relevant order data.
     * @param {object} orderData 
     * @param {object} context - UI context containing isAdmin/isSuperAdmin flags.
     */
    orderRender: function (orderData, context = {}) {
        console.log('[OrderData:Buyer] Rendering...', { orderData, context });
        const el = document.getElementById('order_role_buyer');
        if (el && el.style.display !== 'none') {
            const contentEl = el.querySelector('.order_role_content');
            if (!contentEl) return;

            // 0. Parse Status
            const statusObj = typeof parseOrderStatus === 'function' ? parseOrderStatus(orderData.order_status) : {};

            // 1. Check if any item uses platform delivery
            const items = orderData.order_items || [];
            if (items.length === 0) {
                console.warn('[OrderData:Buyer] No items found in orderData');
                contentEl.innerHTML = '<div id="order_buyer_no_items" style="padding:15px; color:#666;">لا توجد تفاصيل منتجات للعرض حالياً.</div>';
                return;
            }
            const platformItems = items.filter(item => item.seller_is_delivered == 0 || item.seller_is_delivered === null || item.seller_is_delivered === undefined);

            console.log('[OrderData:Buyer] Platform filtering:', { total: items.length, platform: platformItems.length });

            let deliverySectionHTML = '';
            if (platformItems.length > 0) {
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
                    deliverySectionHTML = `
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
                    deliverySectionHTML = `
                        <div id="order_buyer_no_delivery" class="order_role_delivery_info" style="margin-top: 15px; padding: 15px; background: #fffbeb; border-radius: 12px; border: 1px solid #fde68a; color: #92400e;">
                            <i id="order_buyer_wait_icon" class="fas fa-hourglass-half"></i> جاري تخصيص مندوب لتوصيل طلبك عبر المنصة.
                        </div>
                    `;
                }
            }

            contentEl.innerHTML = `
                ${deliverySectionHTML}
                ${this.renderWorkflowActions(orderData, statusObj)}
            `;
        }
    },

    /**
     * @description BUYER WORKFLOW ACTIONS (EN):
     * Implements a "Roadmap Checklist" pattern for standard orders.
     * 
     * [Logic Overview]:
     * - Service Check: If "Special Service" (Type 2), standard actions are disabled.
     * - Cancel Option: Always visible if cancellable (Step < 3) or if already cancelled (Step 5).
     *   > Designed as "Destructive" (Red).
     * - Receipt Option: Persistent visibility to show the "End Goal".
     *   > Disabled (Pending): If Step < 3 (Goods not yet with courier).
     *   > Active (Clickable): If Step == 3 (Courier at door).
     *   > Checked (Completed): If Step >= 4 (Already Received).
     */
    renderWorkflowActions: function (orderData, statusObj) {
        // [Logic] Check Service Type: Skip standard workflow for custom services (Type 2)
        const hasSpecialService = (orderData.order_items || []).some(item => item.serviceType == 2);

        if (hasSpecialService) {
            return '<div style="margin-top:20px; padding:10px; color:#666; font-style:italic; text-align:center;">هذا الطلب خدمة خاصة. يرجى مراجعة التفاصيل مع الإدارة.</div>';
        }

        const stepId = parseInt(statusObj.step_id) || 1;

        // [Helper] Checkbox Generator: Creates a styled interactive toggle for workflow steps
        const createCheck = (id, label, isChecked, isDisabled, targetStep, isDestructive = false) => `
            <label id="label_${id}" style="display: flex; align-items: center; gap: 10px; padding: 12px; background: ${isChecked ? (isDestructive ? '#fef2f2' : '#f0fdf4') : (isDisabled ? '#f9f9f9' : '#fff')}; border: 1px solid ${isChecked ? (isDestructive ? '#fecaca' : '#bbf7d0') : (isDisabled ? '#eee' : '#ddd')}; border-radius: 8px; cursor: ${isDisabled ? 'default' : 'pointer'}; margin-bottom: 8px; opacity: ${isDisabled && !isChecked ? '0.6' : '1'}; transition: all 0.2s;">
                <input type="checkbox" id="${id}"
                    ${isChecked ? 'checked' : ''} 
                    ${isDisabled ? 'disabled' : ''} 
                    onchange="if(this.checked){ window.orderUpdateStep(${targetStep}) }"
                    style="width: 18px; height: 18px; accent-color: ${isDestructive ? '#dc2626' : '#27ae60'}; cursor: ${isDisabled ? 'default' : 'pointer'};">
                <span id="span_${id}" style="font-weight: bold; color: ${isChecked ? (isDestructive ? '#b91c1c' : '#166534') : (isDestructive ? '#dc2626' : (isDisabled ? '#999' : '#333'))};">
                    ${label}
                </span>
                ${isChecked ? `<i id="icon_${id}" class="fas ${isDestructive ? 'fa-times-circle' : 'fa-check-circle'}" style="margin-right: auto; color: ${isDestructive ? '#dc2626' : '#27ae60'};"></i>` : ''}
            </label>
        `;

        let html = '<div id="order_buyer_actions_container" style="margin-top:20px; border-top: 1px solid #eee; padding-top:15px; display: flex; flex-direction: column;">';

        html += '<div id="order_buyer_actions_title" style="font-size: 0.85em; color: #666; margin-bottom: 10px; font-weight: bold;"><i id="order_buyer_tasks_icon" class="fas fa-tasks"></i> إجراءات المشتري:</div>';

        // 1. Cancel Option (Destructive Action)
        // [Rule]: Visible if cancelled (for history) or if cancellable (pre-delivery).
        if (stepId === 5 || stepId < 3) {
            html += createCheck(
                'chk_buyer_cancel',
                'إلغاء الطلب بالكامل',
                stepId === 5, // Checked if cancelled
                stepId === 5, // Disabled if already cancelled (final state)
                5,            // Target: 5 (Cancelled Status)
                true          // Destructive style (Red)
            );
        }

        // 2. Receipt Option (Progression Action)
        // [Rule]: Always visible as a roadmap item.
        if (stepId !== 5) { // Hide receipt option if cancelled, otherwise show roadmap
            const isRecieved = stepId >= 4;
            const canConfirm = stepId === 3; // Trigger: Only allowed when Step is 3 (Delivery)

            html += createCheck(
                'chk_buyer_receipt',
                'تأكيد استلام الطلب والاغلاق',
                isRecieved,
                !canConfirm, // Disabled if not logically the next step (either done or too early)
                4,
                false
            );
        }

        // Ratings Section (Post-Completion)
        // [Rule]: Only appears after successful receipt (Step 4).
        if (stepId === 4) {
            html += `
                <div id="order_buyer_rating_box" style="margin-top: 10px; padding: 15px; background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; text-align: center;">
                    <div id="order_buyer_rating_title" style="font-weight: bold; margin-bottom: 5px; color: #92400e;">شكراً لتعاملك معنا!</div>
                    <button id="order_buyer_rate_btn" class="order_rate_btn" style="background: #fbbf24; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer; font-weight: bold; color: #78350f;">
                        <i id="order_buyer_rate_icon" class="fas fa-star"></i> تقييم التجربة
                    </button>
                </div>
            `;
        }

        html += '</div>';
        return html;
    }
};
