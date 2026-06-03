/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */
async function salesMovement_fetchOrdersForRole(role) {
    try {
        console.log("[SalesMovement] Fetching role from local DB (Firestore handles real-time syncing):", role);
        var localOrders = await orderGetLocal(role);
        return Array.isArray(localOrders) ? localOrders : [];
    } catch (error) {
        console.error("[SalesMovement] Fetch failed for role:", role, error);
        return [];
    }
}

async function salesMovement_loadAllOrders() {
    try {
        console.log("[SalesMovement] Loading all orders with Firestore real-time synchronization...");
        var rolePlan = salesMovement_getRolePlan();
        if (rolePlan.length === 0) {
            salesMovement_displayGroupedOrders({});
            return;
        }

        salesMovement_showLoading();

        // 1. Load initial local orders from LocalDB to show them instantly (UX enhancement)
        var localResults = await Promise.all(rolePlan.map(function (role) {
            return orderGetLocal(role).catch(function () { return []; });
        }));

        var initialGroupedOrders = {};
        rolePlan.forEach(function (role, index) {
            initialGroupedOrders[role] = localResults[index];
        });

        window.salesMovement_currentGroupedOrders = initialGroupedOrders;

        if (localResults.some(function (orders) { return orders.length > 0; })) {
            salesMovement_displayGroupedOrders(initialGroupedOrders);
        }

        var user = salesMovement_getCurrentUser();
        if (!user) {
            console.warn("[SalesMovement] No active user session found. Real-time sync skipped.");
            salesMovement_displayGroupedOrders(initialGroupedOrders);
            return;
        }

        // 2. Ensure Firestore DB connection
        if (typeof window.ensureFirestoreDb !== 'function') {
            throw new Error("ensureFirestoreDb function is not loaded/available");
        }

        console.log("[SalesMovement] Connecting to Firestore...");
        var db = await window.ensureFirestoreDb();
        console.log("[SalesMovement] Firestore connection established.");

        // 3. Manage real-time Firestore listeners for each role
        window.salesMovement_firestoreListeners = window.salesMovement_firestoreListeners || {};

        rolePlan.forEach(function (role) {
            // Unsubscribe existing listener for this role to prevent duplicates
            if (typeof window.salesMovement_firestoreListeners[role] === 'function') {
                console.log(`[SalesMovement] Unsubscribing existing Firestore listener for role: ${role}`);
                window.salesMovement_firestoreListeners[role]();
                delete window.salesMovement_firestoreListeners[role];
            }

            // Build query based on role
            var query = db.collection('orders');
            if (role === 'buyer') {
                query = query.where('user_key', '==', user.user_key);
            } else if (role === 'commercial') {
                query = query.where('seller_keys', 'array-contains', user.user_key);
            } else if (role === 'delivery') {
                query = query.where('delivery_keys', 'array-contains', user.user_key);
            } else if (role === 'admin') {
                // Admin views all orders, no filters needed
            } else {
                console.warn(`[SalesMovement] Unknown role: ${role}, skipping Firestore listener.`);
                return;
            }

            console.log(`[SalesMovement] Establishing real-time Firestore listener for role: ${role}`);

            var unsubscribe = query.onSnapshot(async function (querySnapshot) {
                try {
                    console.log(`[SalesMovement] Real-time updates received for role: ${role}`);
                    var ordersList = [];
                    querySnapshot.forEach(function (doc) {
                        var orderData = doc.data();
                        ordersList.push(typeof orderNormalizeRecord === 'function' ? orderNormalizeRecord(orderData) : orderData);
                    });

                    console.log(`[SalesMovement] Firestore returned ${ordersList.length} orders for role: ${role}. Updating LocalDB...`);

                    // Save all orders to local LocalDB to keep offline/cache store updated
                    await Promise.all(ordersList.map(function (order) {
                        return orderSaveToLocalDB(order, role);
                    }));

                    // Load complete, correctly-sorted/structured orders from local LocalDB
                    var updatedLocalOrders = await orderGetLocal(role);

                    window.salesMovement_currentGroupedOrders = window.salesMovement_currentGroupedOrders || {};
                    window.salesMovement_currentGroupedOrders[role] = updatedLocalOrders;

                    console.log(`[SalesMovement] Displaying updated orders for role: ${role}`);
                    salesMovement_displayGroupedOrders(window.salesMovement_currentGroupedOrders);
                } catch (snapErr) {
                    console.error(`[SalesMovement] Error processing Firestore update for role ${role}:`, snapErr);
                }
            }, function (error) {
                console.error(`[SalesMovement] Firestore listener error for role ${role}:`, error);
            });

            window.salesMovement_firestoreListeners[role] = unsubscribe;
        });

    } catch (salesMovement_error) {
        console.error("[SalesMovement] Failed to initialize real-time orders load:", salesMovement_error);
        salesMovement_displayGroupedOrders({});
    }
}

async function salesMovement_refreshOrderBeforeOpen(orderKey, role) {
    var user = salesMovement_getCurrentUser();
    if (!user || !orderKey || !salesMovement_ROLE_DEFINITIONS[role]) {
        return orderGetByKey(orderKey, role);
    }

    try {
        console.log(`[SalesMovement] Refreshing order ${orderKey} from Firestore for role ${role}...`);

        if (typeof window.ensureFirestoreDb !== 'function') {
            throw new Error("ensureFirestoreDb function is not loaded/available");
        }
        var db = await window.ensureFirestoreDb();
        var docRef = db.collection('orders').doc(orderKey);
        var docSnap = await docRef.get();

        if (docSnap.exists) {
            var rawUpdatedOrder = docSnap.data();
            var updatedOrder = typeof orderNormalizeRecord === 'function' ? orderNormalizeRecord(rawUpdatedOrder) : rawUpdatedOrder;
            console.log(`[SalesMovement] Order ${orderKey} found in Firestore. Saving to LocalDB...`);
            await orderSaveToLocalDB(updatedOrder, role);
            return updatedOrder;
        } else {
            console.warn(`[SalesMovement] Order ${orderKey} not found in Firestore.`);
        }
    } catch (err) {
        console.error("[SalesMovement] Failed to refresh order from Firestore before opening:", err);
    }

    return orderGetByKey(orderKey, role);
}

var salesMovement_isProcessingProductKey = false;

async function salesMovement_checkProductKeyChanges() {
    try {
        if (salesMovement_isProcessingProductKey) {
            return;
        }

        var currentProductKey = LocalDBStorage.getItem("productKeyFromStepReview");
        if (currentProductKey === null || currentProductKey === "" || typeof currentProductKey === "undefined") {
            return;
        }

        salesMovement_isProcessingProductKey = true;
        LocalDBStorage.setItem("productKeyFromStepReview", "");

        try {
            var activeOrderKey = LocalDBStorage.getItem("current_viewing_order_key");
            var activeOrder = activeOrderKey && typeof orderGetByKey === "function" ? await orderGetByKey(activeOrderKey) : null;
            var product = (activeOrder?.order_items || []).find(function (item) {
                return item.product_key === currentProductKey;
            });
            if (!product) throw new Error("Product snapshot not found in local order cache");
            var productDataForModal = mapProductData(product);
            loadProductView(productDataForModal, { showAddToCart: false });
        } catch (fetchError) {
            console.error("[SalesMovement] Failed to load product snapshot from step review:", fetchError);
        } finally {
            setTimeout(function () {
                salesMovement_isProcessingProductKey = false;
            }, 1000);
        }
    } catch (salesMovement_error) {
        console.error("[SalesMovement] Product key watcher failed:", salesMovement_error);
        salesMovement_isProcessingProductKey = false;
    }
}
