/**
 * @file orderStage/order-sync-manager.js
 * @description Logic for partial syncing of orders based on history.
 */

const OrderSyncManager = {
    /**
     * Syncs new orders from server for a specific role.
     * @param {string} role - buyer, seller, delivery, admin.
     * @returns {Promise<Array>} - The new orders received.
     */
    orderSync: async (role) => {
        try {
            console.log(`[OrderSync] Starting sync for role: ${role}`);

            // 1. Get last timestamp
            const lastTimestamp = await orderGetLastTimestamp(role);
            console.log(`[OrderSync] Last local order date: ${lastTimestamp || 'No history'}`);

            // 2. Fetch from server
            const userKey = userSession.user_key;
            let apiRole = 'purchaser';
            if (role === 'seller') apiRole = 'seller';
            if (role === 'delivery') apiRole = 'delivery';
            if (role === 'admin') apiRole = 'admin';

            // Now used the optimized API with after_date
            let url = `${baseURL}/api/user-all-orders?user_key=${userKey}&role=${apiRole}`;
            if (lastTimestamp) {
                url += `&after_date=${encodeURIComponent(lastTimestamp)}`;
            }

            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const serverOrders = await response.json();
            console.log(`[OrderSync] Received ${serverOrders.length} orders from server.`);

            // 3. Save to local DB
            const savePromises = serverOrders.map(order => orderSaveToLocalDB(order, role));
            await Promise.all(savePromises);

            console.log('[OrderSync] Sync completed successfully.');
            return serverOrders;

        } catch (error) {
            console.error('[OrderSync] Sync failed:', error);
            throw error;
        }
    }
};
