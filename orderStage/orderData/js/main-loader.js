/**
 * @file orderStage/orderData/js/main-loader.js
 * @description Final initialization and data orchestration for Order Data.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


(async function initOrderDataMain() {
    console.log('[OrderData] Orchestrating modules...');

    function getCurrentOrderKey() {
        const params = new URLSearchParams(window.location.search);
        const queryOrderKey = params.get('order_key');
        const storedOrderKey = LocalDBStorage.getItem('current_viewing_order_key');
        const resolvedOrderKey = queryOrderKey || storedOrderKey || '';

        if (resolvedOrderKey) {
            LocalDBStorage.setItem('current_viewing_order_key', resolvedOrderKey);
        }

        return resolvedOrderKey;
    }

    function getRoleFetchPlan(context) {
        const activeOrderRole = (context.activeOrderRole || LocalDBStorage.getItem('current_viewing_order_role') || '').replace('merchant', 'commercial');
        const roleDefinitions = {
            admin: { firestoreRole: 'admin', localRole: 'admin' },
            buyer: { firestoreRole: 'buyer', localRole: 'buyer' },
            commercial: { firestoreRole: 'commercial', localRole: 'commercial' },
            delivery: { firestoreRole: 'delivery', localRole: 'delivery' }
        };

        if (roleDefinitions[activeOrderRole]) {
            return [roleDefinitions[activeOrderRole]];
        }

        const roles = [];
        if (context.isSuperAdmin || context.isAdmin) roles.push({ firestoreRole: 'admin', localRole: 'admin' });
        if (context.isBuyer) roles.push({ firestoreRole: 'buyer', localRole: 'buyer' });
        if (context.isCommercial) roles.push({ firestoreRole: 'commercial', localRole: 'commercial' });
        if (context.isDelivery) roles.push({ firestoreRole: 'delivery', localRole: 'delivery' });
        return roles;
    }

    async function fetchOrderFromFirestore(orderKey, context) {
        const userKey = context.user && context.user.user_key;
        if (!orderKey || !userKey) return null;

        const rolePlan = getRoleFetchPlan(context);
        for (const role of rolePlan) {
            try {
                console.log(`[OrderData] Fetching order ${orderKey} directly from Firestore for role ${role.localRole}...`);
                if (typeof window.ensureFirestoreDb !== 'function') {
                    throw new Error("ensureFirestoreDb function is not loaded/available");
                }
                const db = await window.ensureFirestoreDb();
                const docRef = db.collection('orders').doc(orderKey);
                const docSnap = await docRef.get();

                if (docSnap.exists) {
                    const rawOrderData = docSnap.data();
                    const orderData = typeof orderNormalizeRecord === 'function'
                        ? orderNormalizeRecord(rawOrderData)
                        : rawOrderData;
                    console.log(`[OrderData] Order ${orderKey} found in Firestore. Saving to LocalDB...`);
                    await orderSaveToLocalDB(orderData, role.localRole);
                    LocalDBStorage.setItem('current_viewing_order_role', role.localRole);
                    return orderData;
                } else {
                    console.warn(`[OrderData] Order ${orderKey} not found in Firestore.`);
                }
            } catch (error) {
                console.warn(`[OrderData] Firestore fetch failed for role ${role.firestoreRole}:`, error);
            }
        }

        return null;
    }

    function showOrderLoadError(message) {
        const targets = [
            document.getElementById('order_content_products'),
            document.getElementById('order_content_buyer'),
            document.getElementById('order_content_commercial'),
            document.getElementById('order_content_delivery'),
            document.getElementById('order_loading_msg')
        ].filter(Boolean);

        targets.forEach((el) => {
            el.textContent = message;
        });
    }

    const orderKey = getCurrentOrderKey();
    const container = document.getElementById('order_admaindata');
    if (!orderKey || !container) return;

    // 1. Initialize Navigation (Back button & Badge)
    if (window.OrderData_Navigation) {
        window.OrderData_Navigation.orderInit();
    }

    // 2. Determine Visibility and Permissions
    if (window.OrderData_RoleManager) {
        const context = window.OrderData_RoleManager.init();
        window.OrderData_RoleManager.applyVisibility(context);

        // 3. Data Fetching and Rendering
        try {
            let orderData = await orderGetByKey(orderKey, context.activeOrderRole);
            if (!orderData) {
                console.warn('[OrderData] No local data found for key, trying Firestore:', orderKey);
                orderData = await fetchOrderFromFirestore(orderKey, context);
            }
            if (!orderData) {
                console.error('[OrderData] No data found for key:', orderKey);
                showOrderLoadError('تعذر تحميل بيانات الطلب.');
                return;
            }

            const { isSuperAdmin, isAdmin, activeOrderRole } = context;
            const statusObj = parseOrderStatus(orderData.order_status);

            // Render visual progression
            if (window.OrderData_Stepper) {
                window.OrderData_Stepper.render(statusObj);
            }

            if (activeOrderRole === 'admin' && (isSuperAdmin || isAdmin) && window.OrderData_Admin) {
                window.OrderData_Admin.orderRender(orderData, container);
            }

            if (window.OrderData_Buyer) window.OrderData_Buyer.orderRender(orderData, context);
            if (window.OrderData_Commercial) window.OrderData_Commercial.orderRender(orderData, context);
            if (window.OrderData_Delivery) window.OrderData_Delivery.orderRender(orderData, context);
            if (window.OrderData_Products) window.OrderData_Products.orderRender(orderData, context);

        } catch (error) {
            console.error('[OrderData] Orchestration Error:', error);
            showOrderLoadError('حدث خطأ أثناء تحميل بيانات الطلب.');
        }
    }
})();
