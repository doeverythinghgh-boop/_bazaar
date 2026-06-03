/**
 * @file orderStage/orderData/js/stepper.js
 * @description Logic for the Order Workflow Stepper handling.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


window.OrderData_Stepper = {
    /**
     * Renders the stepper UI based on status.
     * @param {object} statusObj
     */
    render: function (statusObj) {
        const orderKey = LocalDBStorage.getItem('current_viewing_order_key');
        orderGetByKey(orderKey).then(orderData => {
            if (!orderData) return;

            const hasSpecialService = (orderData.order_items || []).some(item => item.serviceType == 2);
            if (hasSpecialService) {
                const existing = document.getElementById('order_stepper_main');
                if (existing) existing.remove();
                return;
            }

            const stepId = parseInt(statusObj.step_id || 0);
            const isRTL = document.dir === 'rtl' || document.documentElement.dir === 'rtl';
            const arrowIcon = isRTL ? 'fa-chevron-left' : 'fa-chevron-right';

            const styleId = 'order_stepper_dynamic_css';
            if (!document.getElementById(styleId)) {
                const style = document.createElement('style');
                style.id = styleId;
                style.innerHTML = `
                    @keyframes stepper-pulse {
                        0% { box-shadow: 0 0 0 0 rgba(33, 150, 243, 0.4); transform: scale(1); }
                        70% { box-shadow: 0 0 0 6px rgba(33, 150, 243, 0); transform: scale(1.05); }
                        100% { box-shadow: 0 0 0 0 rgba(33, 150, 243, 0); transform: scale(1); }
                    }
                    .stepper-active-circle {
                        animation: stepper-pulse 2s infinite;
                        border: 1px solid #fff;
                    }
                `;
                document.head.appendChild(style);
            }

            const steps = [
                { id: 1, name: 'المراجعة', icon: 'fa-clipboard-check' },
                { id: 2, name: 'الشحن', icon: 'fa-truck-loading' },
                { id: 3, name: 'التسليم', icon: 'fa-hand-holding-heart' }
            ];

            let stepperHTML = `<div id="order_stepper_main" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding: 10px; background: #fff; border-radius: 12px; box-shadow: 0 5px 15px rgba(0,0,0,0.05); border: 1px solid #f0f0f0;">`;

            steps.forEach((s, idx) => {
                const isCompleted = s.id < stepId;
                const isCurrent = s.id === stepId;
                const isPending = s.id > stepId;

                let bgColor = '#edf2f7';
                let iconColor = '#a0aec0';
                if (isCompleted) { bgColor = '#2ecc71'; iconColor = '#fff'; }
                if (isCurrent) { bgColor = '#2196F3'; iconColor = '#fff'; }

                stepperHTML += `
                    <div id="order_stepper_step_${s.id}" style="flex: 1; display: flex; flex-direction: column; align-items: center; position: relative;">
                        <!-- Small Circle -->
                        <div id="order_stepper_circle_${s.id}" class="${isCurrent ? 'stepper-active-circle' : ''}" 
                             style="width: 28px; height: 28px; background: ${bgColor}; color: ${iconColor}; border-radius: 50%; display: flex; align-items: center; justify-content: center; z-index: 2; margin-bottom: 4px; transition: all 0.3s ease;">
                            <i id="order_stepper_icon_${s.id}" class="fas ${s.icon}" style="font-size: 0.75rem;"></i>
                        </div>
                        
                        <!-- Small Label -->
                        <span id="order_stepper_label_${s.id}" style="font-size: 0.65rem; color: ${isPending ? '#a0aec0' : '#2d3748'}; font-weight: ${isCurrent ? 'bold' : '500'};">
                            ${s.name}
                        </span>

                        <!-- Connector -->
                        ${idx < steps.length - 1 ? `
                            <div id="order_stepper_conn_${s.id}" style="position: absolute; top: 14px; ${isRTL ? 'right' : 'left'}: 50%; width: 100%; z-index: 1; display: flex; align-items: center; justify-content: center;">
                                <i id="order_stepper_conn_icon_${s.id}" class="fas ${arrowIcon}" style="font-size: 10px; color: ${isCompleted ? '#2ecc71' : '#e2e8f0'};"></i>
                            </div>
                        ` : ''}
                    </div>
                `;
            });
            stepperHTML += `</div>`;

            const nav = document.getElementById('order_nav_container');
            if (nav) {
                const existing = document.getElementById('order_stepper_main');
                if (existing) existing.remove();
                nav.insertAdjacentHTML('afterend', stepperHTML);
            }
        });
    },

    /**
     * Updates the global step_id.
     * @param {number} nextStep
     */
    updateStep: async function (nextStep) {
        const orderKey = LocalDBStorage.getItem('current_viewing_order_key');
        if (!orderKey) return;

        try {
            let order = await orderGetByKey(orderKey);
            const statusObj = parseOrderStatus(order.order_status);
            statusObj.step_id = nextStep;
            statusObj.last_updated = new Date().toISOString();
            order.order_status = statusObj;

            await orderSaveToLocalDB(order, order.role_context || 'admin');

            console.log(`[OrderData] Ensuring Firestore database connection...`);
            const db = await window.ensureFirestoreDb();
            console.log(`[OrderData] Updating step to ${nextStep} in Firestore for order ${orderKey}...`);
            await db.collection('orders').doc(orderKey).update({
                current_step_id: String(nextStep),
                status_last_updated: statusObj.last_updated,
                order_status: statusObj
            });
            console.log(`[OrderData] Firestore step update successful for order ${orderKey}`);

            const user = window.userSession || (typeof UserService !== 'undefined' ? UserService.get() : null) || {};
            const actingUserId = user?.user_key || '';
            const userName = user?.username || user?.name || '';

            // 1. Identify common recipients
            const sellerKeys = Array.from(new Set(
                (order.order_items || []).map(item => item?.seller_key).filter(Boolean)
            ));
            const deliveryKeys = Array.from(new Set(
                [
                    ...(order.delivery_keys || []),
                    ...(order.order_items || []).flatMap(item => (item.supplier_delivery || []).map(d => d.delivery_key || d.deliveryKey || d.user_key))
                ].filter(Boolean)
            ));
            const buyerKey = order.user_key || '';
            const orderId = order.order_key || orderKey;

            // 2. Map standard steps to their IDs and Names
            const stepConfigs = {
                '2': { id: 'step-confirmed', name: 'قيد التجهيز' },
                '3': { id: 'step-shipped',   name: 'جاري الشحن' },
                '4': { id: 'step-delivered', name: 'تم التسليم' }
            };

            const config = stepConfigs[String(nextStep)];

            // 3. Dispatch Notifications
            if (nextStep === 5 && typeof window.notifyOnSubStepActivation === 'function') {
                await window.notifyOnSubStepActivation({
                    stepId: 'step-cancelled',
                    stepName: 'إلغاء الطلب',
                    buyerKey,
                    sellerKeys,
                    deliveryKeys, // Added delivery notifications for cancellation
                    orderId,
                    userName,
                    actingUserId
                });
            } else if (config && typeof window.notifyOnStepActivation === 'function') {
                await window.notifyOnStepActivation({
                    stepId: config.id,
                    stepName: config.name,
                    buyerKey,
                    sellerKeys,
                    deliveryKeys,
                    orderId,
                    userName,
                    actingUserId
                });
            }

            console.log('[OrderData] Refreshing UI in-place...');
            window.OrderData_Stepper.render(statusObj);

            const capabilities = typeof window.resolveUserCapabilities === 'function'
                ? window.resolveUserCapabilities(user)
                : null;
            const isSuperAdmin = !!capabilities?.isSuperAdmin;
            const isAdmin = !!capabilities?.isAdmin;
            const context = { isSuperAdmin, isAdmin };

            if (isSuperAdmin && window.OrderData_Admin) {
                const container = document.getElementById('order_admaindata');
                window.OrderData_Admin.orderRender(order, container);
            }

            if (window.OrderData_Buyer) window.OrderData_Buyer.orderRender(order, context);
            if (window.OrderData_Commercial) window.OrderData_Commercial.orderRender(order, context);
            if (window.OrderData_Delivery) window.OrderData_Delivery.orderRender(order, context);
            if (window.OrderData_Products) window.OrderData_Products.orderRender(order);

        } catch (e) {
            console.error('[OrderData] Step Update Failed:', e);
            window.location.reload();
        }
    },

    /**
     * Intercepts updates from Admin to show a Modern Mini confirmation.
     * @param {number} nextStep
     */
    adminConfirmUpdateStep: function (nextStep) {
        const stepLabels = {
            '0': '0- معلق (Pending)',
            '1': '1- المراجعة (Review)',
            '2': '2- الشحن (Shipping)',
            '3': '3- التسليم (Delivery)',
            '4': '4- مكتمل (Completed)',
            '5': '5- ملغي (Cancelled)'
        };

        const targetLabel = stepLabels[nextStep] || `المرحلة ${nextStep}`;

        Swal.fire({
            title: 'تأكيد تغيير المرحلة؟',
            html: `<span class="swal-modern-mini-text" style="display:block;">أنت على وشك تغيير حالة الطلب إلى:<br><b style="color:#2196F3;">${targetLabel}</b><br>سيتم المزامنة مع السيرفر فوراً.</span>`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'تأكيد التغيير',
            cancelButtonText: 'إلغاء',
            confirmButtonColor: '#2196F3',
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
                this.updateStep(nextStep);
            } else {
                // Refresh stepper to revert radio button selection in UI
                const orderKey = LocalDBStorage.getItem('current_viewing_order_key');
                orderGetByKey(orderKey).then(order => {
                    if (order) {
                        const statusObj = parseOrderStatus(order.order_status);
                        this.render(statusObj);
                    }
                });
            }
        });
    }
};

window.orderRenderStepper = window.OrderData_Stepper.render;
window.orderUpdateStep = window.OrderData_Stepper.updateStep;
window.orderAdminConfirmUpdateStep = window.OrderData_Stepper.adminConfirmUpdateStep.bind(window.OrderData_Stepper);
