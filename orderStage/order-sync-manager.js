/**
 * @file orderStage/order-sync-manager.js
 * @description Compatibility shim for the old partial-sync entry point.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


const OrderSyncManager = {
    /**
     * Firestore real-time listeners now sync orders for a specific role.
     * @param {string} role - buyer, commercial, delivery, admin.
     * @returns {Promise<Array>} - The new orders received.
     */
    orderSync: async (role) => {
        try {
            console.log(`[OrderSync] Sync for role: ${role} is now handled dynamically in real-time by Firestore.`);
            return [];
        } catch (error) {
            console.error('[OrderSync] Sync failed:', error);
            throw error;
        }
    }
};
