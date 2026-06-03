/**
 * @file orderStage/orderData/parts/admin-partials/delivery-assignment.js
 * @description Manual delivery assignment panel for Super Admins.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


window.OrderData_Admin_DeliveryAssignment = {
    render: function (order) {
        if (!order) return '';

        return `
            <div id="order_sec_assignment" class="order_section" style="border-left: 4px solid #27ae60;">
                <div id="order_title_assignment" class="order_section_title">
                    <i class="fas fa-truck-loading"></i> تخصيص مندوب التوصيل (نظام التطبيع الجديد)
                </div>
                <div id="order_cont_assignment" class="order_section_content">
                    <div id="order_assignment_desc" style="font-size: 0.85em; color: #666; margin-bottom: 15px;">
                        يمكنك هنا ربط هذا الطلب بمندوب محدد يدوياً. سيظهر هذا الطلب للمندوب المختار فقط في صفحة "تحركات المبيعات".
                    </div>
                    
                    <div id="order_assignment_controls" style="display: flex; gap: 10px; flex-wrap: wrap; background: #f8fafc; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0;">
                         <div style="flex: 1; min-width: 250px;">
                            <label style="display: block; font-size: 0.8em; color: #64748b; margin-bottom: 5px;">اختر المندوب:</label>
                            <select id="order_assignment_select" style="width: 100% !important; padding: 10px; border-radius: 8px; border: 1px solid #cbd5e1; outline: none; background: #fff;">
                                <option value="">جاري تحميل القائمة...</option>
                            </select>
                            <input id="order_assignment_manual_key" type="text" placeholder="أو اكتب معرف المندوب يدوياً"
                                   style="width: 100% !important; margin-top: 8px; padding: 10px; border-radius: 8px; border: 1px solid #cbd5e1; outline: none; background: #fff;">
                         </div>
                         <div style="display: flex; align-items: flex-end;">
                            <button id="order_assignment_btn" onclick="window.OrderData_Admin_DeliveryAssignment.handleAssign('${order.order_key}')" 
                                    style="padding: 10px 20px; background: #27ae60; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; transition: all 0.2s;">
                                <i class="fas fa-user-plus"></i> إسناد المندوب
                            </button>
                         </div>
                    </div>

                    <div id="order_assignment_status" style="margin-top: 15px; font-size: 0.85em;">
                         <!-- Success/Error messages -->
                    </div>
                </div>
            </div>
        `;
    },

    init: async function (order) {
        const select = document.getElementById('order_assignment_select');
        if (!select) return;

        try {
            const candidates = new Map();
            (order.delivery_keys || []).forEach((key) => {
                if (key) candidates.set(key, { user_key: key, username: key, phone: '' });
            });
            (order.order_items || []).forEach((item) => {
                (item.supplier_delivery || []).forEach((delivery) => {
                    const key = delivery.delivery_key || delivery.deliveryKey || delivery.user_key;
                    if (key) {
                        candidates.set(key, {
                            user_key: key,
                            username: delivery.delivery_name || delivery.username || key,
                            phone: delivery.delivery_phone || delivery.phone || ''
                        });
                    }
                });
            });

            try {
                const deliveryUsers = typeof window.apiFetch === 'function'
                    ? await window.apiFetch('/api/users?mode=delivery_users&limit=200')
                    : await fetch('/api/users?mode=delivery_users&limit=200').then((response) => response.json());
                const deliveryList = Array.isArray(deliveryUsers) ? deliveryUsers : (deliveryUsers?.data || []);
                (Array.isArray(deliveryList) ? deliveryList : []).forEach((user) => {
                    const key = user.user_key;
                    if (key) candidates.set(key, { ...user, user_key: key });
                });
            } catch (tursoListError) {
                console.warn('[AssignmentUI] Turso courier list is unavailable, manual assignment remains enabled:', tursoListError);
            }

            const users = Array.from(candidates.values());

            if (users.length === 0) {
                select.innerHTML = '<option value="">لا توجد قائمة متاحة، استخدم الإدخال اليدوي</option>';
                return;
            }

            select.innerHTML = '<option value="">-- اختر مندوباً من القائمة --</option>' +
                users.map(u => `<option value="${u.user_key}">${u.username} (${u.phone || 'بدون هاتف'})</option>`).join('');

        } catch (e) {
            console.error('[AssignmentUI] Failed to load couriers:', e);
            select.innerHTML = '<option value="">تعذر تحميل القائمة، استخدم الإدخال اليدوي</option>';
        }
    },

    handleAssign: async function (orderKey) {
        const select = document.getElementById('order_assignment_select');
        const manualInput = document.getElementById('order_assignment_manual_key');
        const btn = document.getElementById('order_assignment_btn');
        const statusDiv = document.getElementById('order_assignment_status');
        const deliveryKey = (select.value || manualInput?.value || '').trim();

        if (!deliveryKey) {
            Swal.fire('تنبيه', 'يرجى اختيار مندوب أولاً', 'warning');
            return;
        }

        try {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإسناد...';

            console.log(`[AssignmentUI] Starting Firestore delivery assignment for order ${orderKey}...`);
            if (typeof window.ensureFirestoreDb !== 'function') {
                throw new Error("ensureFirestoreDb function is not loaded/available");
            }

            const db = await window.ensureFirestoreDb();
            const docRef = db.collection('orders').doc(orderKey);
            const docSnap = await docRef.get();

            if (!docSnap.exists) {
                throw new Error("Order not found in Firestore");
            }

            const orderData = docSnap.data();
            const deliveryKeys = orderData.delivery_keys || [];
            if (!deliveryKeys.includes(deliveryKey)) {
                deliveryKeys.push(deliveryKey);
            }

            const orderItems = Array.isArray(orderData.order_items) ? orderData.order_items : [];
            const updatedItems = orderItems.map((item) => {
                const deliveries = Array.isArray(item.supplier_delivery) ? item.supplier_delivery : [];
                if (deliveries.some((delivery) => (delivery.delivery_key || delivery.deliveryKey || delivery.user_key) === deliveryKey)) {
                    return item;
                }
                return {
                    ...item,
                    supplier_delivery: [
                        ...deliveries,
                        { delivery_key: deliveryKey, delivery_name: deliveryKey, delivery_phone: '' }
                    ]
                };
            });

            // Update document in Firestore directly
            await docRef.update({ delivery_keys: deliveryKeys, order_items: updatedItems });
            console.log(`[AssignmentUI] Successfully updated delivery_keys to ${JSON.stringify(deliveryKeys)} in Firestore.`);

            // Synchronize with local LocalDB
            const localOrder = await orderGetByKey(orderKey);
            if (localOrder) {
                localOrder.delivery_keys = deliveryKeys;
                localOrder.order_items = updatedItems;
                await orderSaveToLocalDB(localOrder, localOrder.role_context || 'admin');
                console.log(`[AssignmentUI] Synchronized local LocalDB cache with new delivery courier.`);
            }

            Swal.fire({
                title: 'تم الإسناد بنجاح',
                text: 'تم ربط المندوب بهذا الطلب بنظام التطبيع الجديد.',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });

            statusDiv.innerHTML = '<span style="color: #27ae60;"><i class="fas fa-check-circle"></i> تم إسناد المندوب بنجاح لهذا الطلب.</span>';

        } catch (e) {
            console.error('[AssignmentUI] Assignment failed:', e);
            Swal.fire('خطأ', 'فشل في إسناد المندوب للطلب.', 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-user-plus"></i> إسناد المندوب';
        }
    }
};
