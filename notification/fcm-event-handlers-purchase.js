/**
 * @file notification/fcm-event-handlers-purchase.js
 * @description Purchase-related notification event handlers.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

function formatPurchaseNotificationDate(rawDate) {
    const date = rawDate ? new Date(rawDate) : new Date();
    if (Number.isNaN(date.getTime())) {
        return formatPurchaseNotificationDate(new Date());
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const rawHours = date.getHours();
    const hours12 = rawHours % 12 || 12;
    const hours = String(hours12).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const period = rawHours >= 12 ? 'PM' : 'AM';
    return `${year}-${month}-${day} ${hours}:${minutes} ${period}`;
}

function buildPurchaseOrderNotification(order) {
    const orderId = order.id || order.order_key || 'N/A';
    const orderDate = formatPurchaseNotificationDate(order.created_at || order.createdAt || order.timestamp);
    return {
        title: 'طلب شراء جديد',
        body: `طلب جديد رقم #${orderId}\nتاريخ الطلب: ${orderDate}`
    };
}

export async function handlePurchaseNotifications(order) {
    console.log('[Notifications] Processing purchase:', order.id);
    try {
        const promises = [];
        if (await window.shouldNotify?.('purchase', 'admin')) promises.push(notifyAdminOnPurchase(order));
        if (await window.shouldNotify?.('purchase', 'merchant')) promises.push(notifySellersOnPurchase(order));
        if (await window.shouldNotify?.('purchase', 'buyer')) promises.push(notifyBuyerOnPurchase(order));
        if (await window.shouldNotify?.('purchase', 'delivery')) promises.push(notifyDeliveryOnPurchase(order));
        await Promise.all(promises);
    } catch (error) {
        console.error('[Notifications] Error in handlePurchaseNotifications:', error);
    }
}

export async function notifyAdminOnPurchase(order) {
    try {
        const adminTokens = await window.getAdminTokens?.();
        console.log(`[Notifications] Admin purchase tokens resolved: ${adminTokens?.length || 0}.`);
        if (adminTokens?.length > 0) {
            const { title, body } = buildPurchaseOrderNotification(order);
            await window.sendNotificationsToTokens?.(adminTokens, title, body);
        }
    } catch (error) {
        console.error('[Notifications] Admin purchase notification failed:', error);
    }
}

export async function notifySellersOnPurchase(order) {
    const items = Array.isArray(order.order_items) ? order.order_items : order.items;
    if (!items || !Array.isArray(items)) return;
    const sellersMap = new Map();
    items.forEach((item) => {
        const sellerKey = item.seller_key;
        if (sellerKey) {
            if (!sellersMap.has(sellerKey)) sellersMap.set(sellerKey, []);
            sellersMap.get(sellerKey).push(item.product_name || item.productName || item.name || 'product');
        }
    });
    for (const [sellerKey] of sellersMap) {
        try {
            const sellerTokens = await window.getUsersTokens?.([sellerKey]);
            console.log(`[Notifications] Merchant ${sellerKey} purchase tokens resolved: ${sellerTokens?.length || 0}.`);
            if (sellerTokens?.length > 0) {
                const { title, body } = buildPurchaseOrderNotification(order);
                await window.sendNotificationsToTokens?.(sellerTokens, title, body);
            }
        } catch (error) {
            console.error(`[Notifications] Merchant ${sellerKey} notification failed:`, error);
        }
    }
}

export async function notifyBuyerOnPurchase(order) {
    try {
        if (!order.user_key) return;
        await window.loadNotificationMessages?.();
        const tokens = await window.getUsersTokens?.([order.user_key]);
        console.log(`[Notifications] Buyer ${order.user_key} purchase tokens resolved: ${tokens?.length || 0}.`);
        if (tokens?.length > 0) {
            const { title, body } = window.getMessageTemplate?.('purchase.buyer', { orderId: order.id || order.order_key || 'N/A' }) || {};
            if (title && body) {
                await window.sendNotificationsToTokens?.(tokens, title, body);
            }
        }
    } catch (error) {
        console.error('[Notifications] Buyer purchase notification failed:', error);
    }
}

export async function notifyDeliveryOnPurchase(order) {
    try {
        await window.loadNotificationMessages?.();
        const deliveryKeys = Array.from(new Set([
            ...(Array.isArray(order.delivery_keys) ? order.delivery_keys : []),
            ...((Array.isArray(order.order_items) ? order.order_items : order.items || [])
                .flatMap((item) => (item.supplier_delivery || []).map((delivery) => delivery.delivery_key || delivery.deliveryKey || delivery.user_key)))
        ].filter(Boolean)));
        if (!deliveryKeys.length) return;

        const deliveryTokens = await window.getUsersTokens?.(deliveryKeys);
        console.log(`[Notifications] Delivery purchase tokens resolved: ${deliveryTokens?.length || 0} for ${deliveryKeys.length} delivery user(s).`);
        if (deliveryTokens?.length > 0) {
            const { title, body } = window.getMessageTemplate?.('purchase.delivery', { orderId: order.id || order.order_key || 'N/A' }) || {};
            if (title && body) {
                await window.sendNotificationsToTokens?.(deliveryTokens, title, body);
            }
        }
    } catch (error) {
        console.error('[Notifications] Delivery purchase notification failed:', error);
    }
}

// Hybrid bridge
window.handlePurchaseNotifications = handlePurchaseNotifications;
window.notifyAdminOnPurchase = notifyAdminOnPurchase;
window.notifySellersOnPurchase = notifySellersOnPurchase;
window.notifyBuyerOnPurchase = notifyBuyerOnPurchase;
window.notifyDeliveryOnPurchase = notifyDeliveryOnPurchase;

console.log("[ESM Load] fcm-event-handlers-purchase.js: Hybrid bridge established.");
