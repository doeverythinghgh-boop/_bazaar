/**
 * @file orderStage/orderData/js/item-actions.js
 * @description Logic for actions on individual order items (Availability updates).
 */

window.OrderData_ItemActions = {
    /**
     * Updates the availability of a specific product in the order.
     * 
     * [LOGIC OVERVIEW - LOCAL FIRST & SYNC DEFERRED]
     * 1. This function performs a LOCAL ONLY update to IndexedDB.
     *    - It does NOT sync with the server immediately to allow the seller to batch updates.
     *    - Sync happens when the seller confirms the "Review Stage" (Step 1 -> 2).
     * 
     * 2. [LOCKING MECHANISM]:
     *    - If the order has passed the Review Stage (Step >= 2), modification is STRICTLY FORBIDDEN.
     *    - This prevents data inconsistencies after the order has been handed over to shipping.
     * 
     * @param {string} productKey 
     * @param {boolean} isAvailable 
     */
    updateAvailability: async function (productKey, isAvailable) {
        if (!productKey) return;

        const orderKey = localStorage.getItem('current_viewing_order_key');
        if (!orderKey) return;

        // 1. Get current order data from IndexedDB
        let order = await orderGetByKey(orderKey);
        if (!order) {
            console.error('[OrderData] Order not found in local DB:', orderKey);
            return;
        }

        const statusObj = parseOrderStatus(order.order_status);
        const currentStep = parseInt(statusObj.step_id) || 0;

        // [Logic] Lock Check: Cannot modify items after Step 1 (Review) is completed
        if (currentStep >= 2) {
            // [REVERT] Immediately revert UI state before showing alert to provide instant feedback
            if (window.OrderData_Products) window.OrderData_Products.orderRender(order);

            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'error',
                    title: 'عذراً',
                    text: 'لا يمكن تعديل حالة المنتجات بعد اعتماد المراجعة.',
                    confirmButtonText: 'موافق',
                    confirmButtonColor: '#2196F3',
                    buttonsStyling: false,
                    customClass: {
                        popup: 'swal-modern-mini-popup',
                        title: 'swal-modern-mini-title',
                        confirmButton: 'swal-modern-mini-confirm'
                    }
                });
            }
            
            return;
        }

        // 2. Confirm Action (Modern Mini Dialog) - Only if not locked
        if (typeof Swal !== 'undefined') {
            const result = await Swal.fire({
                title: isAvailable ? 'إتاحة المنتج؟' : 'إخفاء المنتج؟',
                html: isAvailable
                    ? '<span class="swal-modern-mini-text" style="display:block;">بعد تاكيد مرحله المراجعة. سيظهر كـ "متوفر".</span>'
                    : '<span class="swal-modern-mini-text" style="display:block;">بعد تاكيد مرحله المراجعة. سيظهر كـ "غير متوفر".</span>',
                showCancelButton: true,
                confirmButtonText: 'تاكيد',
                cancelButtonText: 'تراجع',
                confirmButtonColor: isAvailable ? '#27ae60' : '#e74c3c',
                cancelButtonColor: '#95a5a6',
                reverseButtons: true,
                focusCancel: true,
                customClass: {
                    popup: 'swal-modern-mini-popup',
                    title: 'swal-modern-mini-title',
                    confirmButton: 'swal-modern-mini-confirm',
                    cancelButton: 'swal-modern-mini-cancel'
                }
            });

            if (!result.isConfirmed) {
                // Revert UI Change
                if (window.OrderData_Products) window.OrderData_Products.orderRender(order);
                return;
            }
        }

        try {
            // 3. Update Status Object
            if (!statusObj.unavailable_product_keys) statusObj.unavailable_product_keys = [];

            if (isAvailable) {
                statusObj.unavailable_product_keys = statusObj.unavailable_product_keys.filter(k => k !== productKey);
            } else {
                if (!statusObj.unavailable_product_keys.includes(productKey)) {
                    statusObj.unavailable_product_keys.push(productKey);
                }
            }

            // Log for audit
            statusObj.last_updated = new Date().toISOString();
            order.order_status = JSON.stringify(statusObj);

            // 4. Save to Local DB ONLY (No Server Sync here)
            await orderSaveToLocalDB(order, order.role_context || 'admin');
            console.log(`[OrderData] Item ${productKey} availability updated locally to: ${isAvailable}`);

            // 5. Trigger UI Refresh
            if (window.OrderData_Products) window.OrderData_Products.orderRender(order);

            const userStr = localStorage.getItem('loggedInUser');
            const user = userStr ? JSON.parse(userStr) : {};
            const isSuperAdmin = (window.SUPER_ADMIN_KEY && user.user_key === window.SUPER_ADMIN_KEY);
            const isAdmin = (typeof ADMIN_IDS !== 'undefined' && ADMIN_IDS.includes(user.user_key));
            const context = { isSuperAdmin, isAdmin };

            if (window.OrderData_Seller) window.OrderData_Seller.orderRender(order, context);
            if (window.OrderData_Buyer) window.OrderData_Buyer.orderRender(order, context);

            if (isSuperAdmin && window.OrderData_Admin) {
                const container = document.getElementById('order_admaindata');
                window.OrderData_Admin.orderRender(order, container);
            }

        } catch (e) {
            console.error('[OrderData] Update Item Availability Error:', e);
        }
    }
};

window.orderUpdateItemAvailability = window.OrderData_ItemActions.updateAvailability;
