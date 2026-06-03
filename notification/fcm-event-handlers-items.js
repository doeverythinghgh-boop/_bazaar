/**
 * @file notification/fcm-event-handlers-items.js
 * @description Product and service item notification event handlers.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

export async function notifyAdminOnNewItem(productData) {
    try {
        if (!(await window.shouldNotify?.('new-item-added', 'admin'))) return;
        const actingUserId = window.userSession?.idUser || '';
        const adminTokens = await window.getAdminTokens?.(actingUserId);
        if (!adminTokens?.length) return;

        await window.loadNotificationMessages?.();
        const itemType = (productData.serviceType === 2 || productData.isService) ? 'Service' : 'Product';
        const itemName = productData.productName || 'Unnamed';
        const itemKey = productData.product_key || 'N/A';
        const userKey = productData.user_key || 'N/A';
        const userName = window.userSession?.username || 'Anonymous User';

        const { title, body } = window.getMessageTemplate?.('new-item-added.admin', { itemType, itemName, itemKey, userName, userKey }) || {};
        if (title && body) {
            await window.sendNotificationsToTokens?.(adminTokens, title, body);
        }
    } catch (error) {
        console.error('[Notifications] New item notification failed:', error);
    }
}

export async function notifyAdminOnItemUpdate(productData) {
    try {
        if (!(await window.shouldNotify?.('item-updated', 'admin'))) return;
        const actingUserId = window.userSession?.idUser || '';
        const adminTokens = await window.getAdminTokens?.(actingUserId);
        if (!adminTokens?.length) return;

        await window.loadNotificationMessages?.();
        const itemType = (productData.serviceType === 2 || productData.isService) ? 'Service' : 'Product';
        const itemName = productData.productName || 'Unnamed';
        const itemKey = productData.product_key || 'N/A';
        const userName = window.userSession?.username || 'User';

        const { title, body } = window.getMessageTemplate?.('item-updated.admin', { itemType, itemName, itemKey, userName }) || {};
        if (title && body) {
            await window.sendNotificationsToTokens?.(adminTokens, title, body);
        }
    } catch (error) {
        console.error('[Notifications] Item update notification failed:', error);
    }
}

export async function notifyOnItemAccepted(productData) {
    try {
        const itemType = productData.isService ? 'Service' : 'Product';
        const itemName = productData.productName || 'Unnamed';
        const sellerKey = productData.user_key;
        await window.loadNotificationMessages?.();

        if (await window.shouldNotify?.('item-accepted', 'admin')) {
            const actingUserId = window.userSession?.idUser || '';
            const adminTokens = await window.getAdminTokens?.(actingUserId);
            if (adminTokens?.length > 0) {
                const { title, body } = window.getMessageTemplate?.('item-accepted.admin', { itemType, itemName }) || {};
                if (title && body) {
                    await window.sendNotificationsToTokens?.(adminTokens, title, body);
                }
            }
        }

        if (sellerKey && await window.shouldNotify?.('item-accepted', 'merchant')) {
            const sellerTokens = await window.getUsersTokens?.([sellerKey]);
            if (sellerTokens?.length > 0) {
                const { title, body } = window.getMessageTemplate?.('item-accepted.seller', { itemType, itemName }) || {};
                if (title && body) {
                    await window.sendNotificationsToTokens?.(sellerTokens, title, body);
                }
            }
        }
    } catch (error) {
        console.error('[Notifications] Item acceptance failed:', error);
    }
}

export async function notifyOnItemRejected(productData) {
    try {
        const itemType = productData.isService ? 'Service' : 'Product';
        const itemName = productData.productName || 'Unnamed';
        const sellerKey = productData.user_key;
        await window.loadNotificationMessages?.();

        if (await window.shouldNotify?.('item-rejected', 'admin')) {
            const actingUserId = window.userSession?.idUser || '';
            const adminTokens = await window.getAdminTokens?.(actingUserId);
            if (adminTokens?.length > 0) {
                const { title, body } = window.getMessageTemplate?.('item-rejected.admin', { itemType, itemName }) || {};
                if (title && body) {
                    await window.sendNotificationsToTokens?.(adminTokens, title, body);
                }
            }
        }

        if (sellerKey && await window.shouldNotify?.('item-rejected', 'merchant')) {
            const sellerTokens = await window.getUsersTokens?.([sellerKey]);
            if (sellerTokens?.length > 0) {
                const { title, body } = window.getMessageTemplate?.('item-rejected.seller', { itemType, itemName }) || {};
                if (title && body) {
                    await window.sendNotificationsToTokens?.(sellerTokens, title, body);
                }
            }
        }
    } catch (error) {
        console.error('[Notifications] Item rejection failed:', error);
    }
}

// Hybrid bridge
window.notifyAdminOnNewItem = notifyAdminOnNewItem;
window.notifyAdminOnItemUpdate = notifyAdminOnItemUpdate;
window.notifyOnItemAccepted = notifyOnItemAccepted;
window.notifyOnItemRejected = notifyOnItemRejected;

console.log("[ESM Load] fcm-event-handlers-items.js: Hybrid bridge established.");
