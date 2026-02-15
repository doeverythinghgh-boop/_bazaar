/**
 * @file orderStage/order-db-manager.js
 * @description Manages IndexedDB for local order storage. Uses the same 'bazaarAppDB' but increments version.
 */

var ORDER_DB_NAME = 'bazaarAppDB';
var ORDER_DB_VERSION = 5; // Unified with notification-db-manager.js
var ORDERS_STORE = 'ordersStore';

var orderDb;
var orderDbPromise;

/**
 * Initializes the database and creates ordersStore if needed.
 * This function is designed to work alongside notification-db-manager.js.
 */
async function orderInitDB() {
    if (orderDbPromise) return orderDbPromise;

    orderDbPromise = new Promise((resolve, reject) => {
        if (orderDb) return resolve(orderDb);

        try {
            const request = indexedDB.open(ORDER_DB_NAME, ORDER_DB_VERSION);

            request.onerror = (event) => {
                console.error('[OrderDB] Error opening DB:', event.target.error);
                reject('Failed to open Order Database.');
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                console.log('[OrderDB] Upgrading/Creating DB to version', ORDER_DB_VERSION);

                // Create ordersStore if missing
                if (!db.objectStoreNames.contains(ORDERS_STORE)) {
                    console.log(`[OrderDB] Creating object store: ${ORDERS_STORE}`);
                    const store = db.createObjectStore(ORDERS_STORE, { keyPath: 'order_key' });

                    // Create indexes for efficient searching
                    store.createIndex('created_at', 'created_at', { unique: false });
                    store.createIndex('user_key', 'user_key', { unique: false });
                    store.createIndex('role_context', 'role_context', { unique: false });
                    store.createIndex('order_status', 'order_status', { unique: false });
                }

                // If notifications store is missing (first time install), created it too to stay consistent
                // Note: notification-db-manager.js also handles this, but here ensures zero-crash
                if (!db.objectStoreNames.contains('notificationsLog')) {
                    console.log('[OrderDB] Creating object store: notificationsLog');
                    const nStore = db.createObjectStore('notificationsLog', { keyPath: 'id', autoIncrement: true });
                    nStore.createIndex('timestamp', 'timestamp', { unique: false });
                    nStore.createIndex('type', 'type', { unique: false });
                    nStore.createIndex('status', 'status', { unique: false });
                    nStore.createIndex('messageId', 'messageId', { unique: true });
                }
            };

            request.onsuccess = (event) => {
                orderDb = event.target.result;
                console.log('[OrderDB] Database opened successfully.');
                resolve(orderDb);
            };
        } catch (e) {
            console.error('[OrderDB] Unexpected exception:', e);
            reject(e);
        }
    });

    return orderDbPromise;
}

/**
 * Saves or updates an order in the local database.
 * @param {object} order - The full order object.
 * @param {string} roleContext - The context (buyer, seller, delivery, admin).
 */
async function orderSaveToLocalDB(order, roleContext) {
    const db = await orderInitDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([ORDERS_STORE], 'readwrite');
        const store = transaction.objectStore(ORDERS_STORE);

        // Enrich order with roleContext for filtering
        const orderToSave = {
            ...order,
            role_context: roleContext,
            last_sync_at: new Date().toISOString()
        };

        const request = store.put(orderToSave);

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = (event) => {
            console.error('[OrderDB] Save error:', event.target.error);
            reject(event.target.error);
        };
    });
}

/**
 * Gets orders from local DB based on role and optional filters.
 * @param {string} role - buyer, seller, delivery, admin.
 * @returns {Promise<Array>}
 */
async function orderGetLocal(role) {
    const db = await orderInitDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([ORDERS_STORE], 'readonly');
        const store = transaction.objectStore(ORDERS_STORE);
        const index = store.index('role_context');

        const request = index.getAll(role);

        request.onsuccess = () => {
            // Sort by created_at descending (newest first)
            const sorted = request.result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            resolve(sorted);
        };

        request.onerror = (event) => {
            console.error('[OrderDB] Fetch error:', event.target.error);
            reject(event.target.error);
        };
    });
}

/**
 * Finds the latest created_at timestamp for a specific role to use in partial sync.
 * @param {string} role 
 * @returns {Promise<string|null>}
 */
async function orderGetLastTimestamp(role) {
    const orders = await orderGetLocal(role);
    if (orders.length === 0) return null;
    return orders[0].created_at; // Since we sorted them by newest first
}

/**
 * Retrieves a single order by its order_key from the local database.
 * @param {string} orderKey 
 * @returns {Promise<object|null>}
 */
async function orderGetByKey(orderKey) {
    const db = await orderInitDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([ORDERS_STORE], 'readonly');
        const store = transaction.objectStore(ORDERS_STORE);
        const request = store.get(orderKey);

        request.onsuccess = () => {
            resolve(request.result || null);
        };

        request.onerror = (event) => {
            console.error('[OrderDB] Get order error:', event.target.error);
            reject(event.target.error);
        };
    });
}
