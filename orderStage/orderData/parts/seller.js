/**
 * @file orderStage/orderData/parts/seller.js
 * @description Renders logic for the seller view.
 */

window.OrderData_Seller = {
    /**
     * Populates the seller section with relevant order data.
     * @param {object} orderData 
     * @param {object} context - UI context containing isAdmin/isSuperAdmin flags.
     */
    orderRender: function (orderData, context = {}) {
        console.log('[OrderData:Seller] Rendering...', { orderData, context });
        const el = document.getElementById('order_role_seller');
        if (el && el.style.display !== 'none') {
            const contentEl = el.querySelector('.order_role_content');
            if (!contentEl) return;

            // 0. Parse Status
            const statusObj = typeof parseOrderStatus === 'function' ? parseOrderStatus(orderData.order_status) : {};

            const isAuth = context.isSuperAdmin || context.isAdmin;

            // Get logged in user to filter items for this specific seller
            const userStr = localStorage.getItem('loggedInUser');
            const currentUser = userStr ? JSON.parse(userStr) : null;
            if (!currentUser && !isAuth) {
                console.warn('[OrderData:Seller] No current user found in localStorage');
                return;
            }

            // 1. Filter items belonging to this seller (or all if admin)
            const myItems = (orderData.order_items || []).filter(item => isAuth || item.seller_key === currentUser.user_key);
            console.log('[OrderData:Seller] Filtering items:', { myKey: currentUser?.user_key, count: myItems.length, admin: isAuth });

            // 2. Check if platform delivery is active for any items shown
            const usePlatformDelivery = myItems.some(item => item.seller_is_delivered == 0 || item.seller_is_delivered === null || item.seller_is_delivered === undefined);

            let deliverySectionHTML = '';
            if (usePlatformDelivery) {
                // Collect unique deliveries assigned to items
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
                    deliverySectionHTML = `
                        <div id="order_seller_delivery_info" class="order_role_delivery_info" style="margin-top: 15px; padding: 15px; background: #f0f7ff; border-radius: 12px; border: 1px solid #d0e7ff;">
                            <h4 id="order_seller_delivery_title" style="margin: 0 0 10px 0; color: #0056b3;"><i id="order_seller_delivery_icon" class="fas fa-truck"></i> مندوب الاستلام (Bazaar Delivery)</h4>
                            <p id="order_seller_delivery_desc" style="font-size: 0.9em; color: #666; margin-bottom: 10px;">سيأتي المندوب لاستلام الطلب من البائع وتسليمه للعميل:</p>
                            ${deliveries.map((del, dIdx) => `
                                <div id="order_seller_del_item_${dIdx}" class="order_delivery_item" style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                                    <div id="order_seller_del_name_box_${dIdx}" style="flex: 1;">
                                        <div id="order_seller_del_name_${dIdx}" style="font-weight: bold; color: #333;">${del.delivery_name}</div>
                                        <div id="order_seller_del_sub_desc_${dIdx}" style="font-size: 0.85em; color: #666;">سيقوم المندوب بالتواصل معك قريباً</div>
                                    </div>
                                    ${window.orderFormatPhone(del.delivery_phone)}
                                </div>
                            `).join('')}
                        </div>
                    `;
                } else {
                    deliverySectionHTML = `
                         <div id="order_seller_no_delivery" class="order_role_delivery_info" style="margin-top: 15px; padding: 15px; background: #fff7ed; border-radius: 12px; border: 1px solid #ffedd5; color: #9a3412;">
                            <i id="order_seller_clock_icon" class="fas fa-clock"></i> جاري تخصيص مندوب من Bazaar لاستلام المنتجات. لا داعي للقلق بشأن التوصيل.
                        </div>
                    `;
                }
            } else if (myItems.length > 0) {
                deliverySectionHTML = `
                    <div id="order_seller_self_delivery" style="margin-top: 15px; padding: 15px; background: #f0fdf4; border-radius: 12px; border: 1px solid #dcfce7; color: #166534;">
                        <i id="order_seller_check_icon" class="fas fa-check-circle"></i> البائع مسؤول عن التوصيل الخاص بمنتجاته في هذا الطلب.
                    </div>
                `;
            }

            contentEl.innerHTML = `
                ${deliverySectionHTML}
                ${this.renderWorkflowActions(orderData, statusObj)}
            `;
        }
    },

    /**
     * @description SELLER WORKFLOW ACTIONS (EN):
     * Implements a "Roadmap Checklist" pattern for standard orders.
     * 
     * [Logic Overview]:
     * - Service Check: If "Special Service" (Type 2), standard actions are disabled.
     * - Checkbox 1 (Review): 
     *   > Enabled: If Step == 1 (Ready to review).
     *   > Checked/Disabled: If Step >= 2 (Already reviewed).
     * - Checkbox 2 (Shipping):
     *   > Visible: Always (for roadmap context).
     *   > Enabled: If Step == 2 (Goods ready).
     *   > Checked/Disabled: If Step >= 3 (Already shipped).
     *   > Disabled (Pending): If Step < 2 (Review not done yet).
     */
    renderWorkflowActions: function (orderData, statusObj) {
        // [Logic] Check Service Type: Skip for Type 2
        const hasSpecialService = (orderData.order_items || []).some(item => item.serviceType == 2);

        if (hasSpecialService) {
            return '<div id="order_seller_special_msg" style="margin-top:20px; padding:10px; color:#666; font-style:italic; text-align:center;">هذا الطلب خدمة خاصة ويتم إدارته عبر التواصل المباشر.</div>';
        }

        const stepId = parseInt(statusObj.step_id) || 1;

        // [Logic] Gather product summary for the current seller
        const userStr = localStorage.getItem('loggedInUser');
        const currentUser = userStr ? JSON.parse(userStr) : null;
        const isAuth = (window.SUPER_ADMIN_KEY && currentUser?.user_key === window.SUPER_ADMIN_KEY) || 
                       (typeof ADMIN_IDS !== 'undefined' && ADMIN_IDS.includes(currentUser?.user_key));
        
        const myItems = (orderData.order_items || []).filter(item => isAuth || item.seller_key === currentUser?.user_key);
        const unavailableKeys = statusObj.unavailable_product_keys || [];
        
        const available = myItems.filter(it => !unavailableKeys.includes(it.product_key));
        const unavailable = myItems.filter(it => unavailableKeys.includes(it.product_key));

        const productSummaryHTML = `
            <div id="order_seller_review_summary" style="margin-top: 10px; display: flex; flex-wrap: wrap; gap: 6px;">
                ${available.map((it, idx) => `
                    <span id="order_seller_sum_avail_${idx}" style="font-size: 0.75em; background: #f0fdf4; color: #166534; padding: 3px 8px; border-radius: 6px; border: 1px solid #bbf7d0; display: flex; align-items: center; gap: 4px; font-weight: 500;">
                        <i class="fas fa-check" style="font-size: 0.8em;"></i> ${it.product_name}
                    </span>
                `).join('')}
                ${unavailable.map((it, idx) => `
                    <span id="order_seller_sum_unavail_${idx}" style="font-size: 0.75em; background: #fef2f2; color: #991b1b; padding: 3px 8px; border-radius: 6px; border: 1px solid #fecaca; display: flex; align-items: center; gap: 4px; font-weight: 500; text-decoration: line-through; opacity: 0.75;">
                        <i class="fas fa-times" style="font-size: 0.8em;"></i> ${it.product_name}
                    </span>
                `).join('')}
            </div>
        `;

        // [Logic] Define Global Handler for Review Confirmation if not exists
        if (!window.orderConfirmReviewStage) {
            window.orderConfirmReviewStage = function (checkbox) {
                if (!checkbox.checked) return;

                Swal.fire({
                    title: 'اعتماد المراجعة',
                    html: '<span class="swal-modern-mini-text" style="display:block; color:#c0392b;">تنبيه: سيتم إرسال حالة المنتجات.<br>لن تتمكن من تعديل "توفر المنتجات" بعد هذه الخطوة.</span>',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'تاكيد',
                    cancelButtonText: 'تراجع',
                    confirmButtonColor: '#27ae60',
                    cancelButtonColor: '#95a5a6',
                    reverseButtons: true,
                    focusCancel: true,
                    buttonsStyling: false,
                    customClass: {
                        popup: 'swal-modern-mini-popup',
                        title: 'swal-modern-mini-title',
                        confirmButton: 'swal-modern-mini-confirm',
                        cancelButton: 'swal-modern-mini-cancel'
                    }
                }).then((result) => {
                    if (result.isConfirmed) {
                        window.orderUpdateStep(2);
                    } else {
                        checkbox.checked = false;
                    }
                });
            };
        }

        // [Helper] Checkbox Generator
        const createCheck = (id, label, isChecked, isDisabled, targetStep, isSpecialReview = false, extraContent = '') => `
            <label id="label_${id}" style="display: flex; flex-direction: column; padding: 12px; background: ${isChecked ? '#f0fdf4' : (isDisabled ? '#f9f9f9' : '#fff')}; border: 1px solid ${isChecked ? '#bbf7d0' : (isDisabled ? '#eee' : '#ddd')}; border-radius: 12px; cursor: ${isDisabled ? 'default' : 'pointer'}; margin-bottom: 10px; opacity: ${isDisabled && !isChecked ? '0.6' : '1'}; transition: all 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                <div style="display: flex; align-items: center; gap: 10px; width: 100%;">
                    <input type="checkbox" id="${id}"
                        ${isChecked ? 'checked' : ''} 
                        ${isDisabled ? 'disabled' : ''} 
                        onchange="${isSpecialReview ? 'window.orderConfirmReviewStage(this)' : `if(this.checked){ window.orderUpdateStep(${targetStep}) }`}"
                        style="width: 20px; height: 20px; accent-color: #27ae60; cursor: ${isDisabled ? 'default' : 'pointer'};">
                    <span id="span_${id}" style="font-weight: bold; color: ${isChecked ? '#166534' : (isDisabled ? '#999' : '#333')}; font-size: 0.95em;">
                        ${label}
                    </span>
                    ${isChecked ? `<i id="icon_${id}" class="fas fa-check-circle" style="color: #27ae60; margin-right: auto;"></i>` : ''}
                </div>
                ${extraContent}
            </label>
        `;

        let html = '<div id="order_seller_actions_container" style="margin-top:20px; border-top: 1px solid #eee; padding-top:15px; display: flex; flex-direction: column;">';

        html += '<div id="order_seller_actions_title" style="font-size: 0.85em; color: #666; margin-bottom: 12px; font-weight: bold;"><i id="order_seller_tasks_icon" class="fas fa-clipboard-list"></i> قائمة مهام البائع:</div>';

        // 1. Review Stage (Step 1 -> 2)
        html += createCheck(
            'chk_review',
            '1. تم مراجعة الطلب وتجهيز المنتجات',
            stepId >= 2,
            stepId >= 2,
            2,
            true, // isSpecialReview
            productSummaryHTML
        );

        // 2. Shipping Stage (Step 2 -> 3)
        html += createCheck(
            'chk_shipping',
            '2. تم تسليم المنتجات لمندوب الشحن',
            stepId >= 3,
            stepId !== 2,
            3
        );

        html += '</div>';
        return html;
    }
};
