/**
 * @file notification/fcm-api.js
 * @description Turso token communication and Firestore delivery relations.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

export async function getAdminTokens(excludeKey = '') {
    try {
        const adminKeys = Array.isArray(window.ADMIN_IDS) ? window.ADMIN_IDS : [];
        const filteredKeys = excludeKey ? adminKeys.filter((key) => key !== excludeKey) : adminKeys;

        if (!filteredKeys || filteredKeys.length === 0) return [];

        return getUsersTokens(filteredKeys);
    } catch (error) {
        console.error("[Notifications] Failed to fetch admin tokens:", error);
        return [];
    }
}

async function ensureDb() {
    if (typeof window.ensureFirestoreDb !== 'function') {
        throw new Error("ensureFirestoreDb function is not loaded/available");
    }
    return window.ensureFirestoreDb();
}

async function tokenApiFetch(path, options = {}) {
    if (typeof window.apiFetch === 'function') {
        return window.apiFetch(path, options);
    }
    const response = await fetch(path, {
        method: options.method || 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: options.body ? JSON.stringify(options.body) : undefined
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new Error(payload?.error || payload?.message || `Request failed: ${response.status}`);
    return payload?.data ?? payload;
}

export async function getActiveDeliveryRelations(sellerKey) {
    try {
        const db = await ensureDb();
        const snap = await db.collection('supplier_deliveries')
            .where('seller_key', '==', sellerKey)
            .get();
        const relations = [];
        snap.forEach((doc) => {
            const relation = doc.data() || {};
            const deliveryKey = relation.delivery_key || relation.deliveryKey || relation.user_key;
            if (!deliveryKey || relation.is_active === false || relation.isActive === false) return;
            relations.push({ ...relation, delivery_key: deliveryKey });
        });
        console.log(`[Firestore] Successfully got getActiveDeliveryRelations for merchant ${sellerKey}.`, relations);
        return relations;
    } catch (error) {
        console.error(`[getActiveDeliveryRelations] for merchant ${sellerKey} failed:`, error);
        return [];
    }
}

export async function getActiveDeliveryKeysForSeller(sellerKey) {
    try {
        const deliveryUsers = await getActiveDeliveryRelations(sellerKey);
        return deliveryUsers.map((user) => user.delivery_key).filter(Boolean);
    } catch (error) {
        console.error('[Notifications] Error fetching delivery keys:', error);
        return [];
    }
}

export async function getTokensForActiveDelivery2Seller(sellerKey) {
    const deliveryKeys = await getActiveDeliveryKeysForSeller(sellerKey);
    return getUsersTokens(deliveryKeys);
}

export async function getUsersTokens(usersKeys) {
    if (!usersKeys || usersKeys.length === 0) return [];

    try {
        const uniqueKeys = [...new Set(usersKeys)].filter(Boolean);
        const payload = await tokenApiFetch(`/api/tokens?userKeys=${encodeURIComponent(uniqueKeys.join(','))}`);
        const rows = Array.isArray(payload)
            ? payload
            : (Array.isArray(payload?.tokens) ? payload.tokens : []);
        const tokens = rows.map((item) => {
            if (typeof item === "string") return item;
            return item?.fcm_token || item?.fcmToken || item?.token || "";
        }).filter((token) => typeof token === "string" && token && token !== "undefined" && token !== "null");
        const uniqueTokens = [...new Set(tokens)];
        console.log(`[FCM] Resolved ${uniqueTokens.length} token(s) for ${uniqueKeys.length} user(s).`);
        return uniqueTokens;
    } catch (error) {
        console.error('[FCM] Critical error during Turso token fetch:', error);
        return [];
    }
}

export function getLocalNotificationTokens() {
    const tokens = [
        LocalDBStorage.getItem("fcm_token"),
        LocalDBStorage.getItem("android_fcm_key")
    ].filter((token) => typeof token === "string" && token && token !== "undefined" && token !== "null");

    return [...new Set(tokens)];
}

function isAndroidRuntime() {
    return !!window.Android ||
        (window.BridgeManager && typeof window.BridgeManager.isAndroid === 'function' && window.BridgeManager.isAndroid()) ||
        window.location.hostname === 'appassets.androidplatform.net';
}

export async function getCurrentUserNotificationState() {
    const userKey = window.userSession?.user_key;
    const isGuest = !userKey || userKey === "guest_user";
    const isAndroid = isAndroidRuntime();
    const hasPermission = isAndroid || ('Notification' in window && Notification.permission === 'granted');
    const storedEnabled = LocalDBStorage.getItem('notifications_enabled') === 'true';
    const localTokens = getLocalNotificationTokens();

    if (isGuest) {
        return {
            isEnabled: false,
            hasPermission: false,
            storedEnabled: false,
            hasLocalToken: false,
            hasServerToken: false,
            localTokens: [],
            serverTokens: [],
            matchedServerToken: false
        };
    }

    let serverTokens = [];
    try {
        serverTokens = await getUsersTokens([userKey]);
    } catch (error) {
        console.error('[FCM] Failed to resolve current user token state:', error);
    }

    const hasLocalToken = localTokens.length > 0;
    const hasServerToken = serverTokens.length > 0;
    const matchedServerToken = hasLocalToken && serverTokens.some((token) => localTokens.includes(token));
    const isEnabled = hasPermission && storedEnabled && matchedServerToken;

    return {
        isEnabled,
        hasPermission,
        storedEnabled,
        hasLocalToken,
        hasServerToken,
        localTokens,
        serverTokens,
        matchedServerToken
    };
}

export async function syncCurrentUserNotificationState() {
    const state = await getCurrentUserNotificationState();

    // Do NOT automatically downgrade the user's explicit intent to 'false'
    // just because PWA is disabled or network tokens fail to match.
    const userIntent = LocalDBStorage.getItem('notifications_enabled');

    if (state.isEnabled) {
        LocalDBStorage.setItem('notifications_enabled', 'true');
    } else if (userIntent === 'false') {
        LocalDBStorage.setItem('notifications_enabled', 'false');
    }

    return state;
}

export async function sendTokenToServer(userKey, token, platform) {
    console.log("[FCM] Saving token to Firestore...");
    try {
        await tokenApiFetch('/api/tokens', {
            method: 'POST',
            body: { user_key: userKey, token, platform }
        });
        console.log("[FCM] Firestore successfully saved/updated the token.");
        return true;
    } catch (networkError) {
        console.error("[FCM] Firestore error while saving token:", networkError);
        return false;
    }
}

export async function deleteTokenFromServer(userKey = null, token = null) {
    if (!userKey && !token) return false;

    const logMsg = token
        ? `[FCM] Requesting specific token deletion: ${token.substring(0, 10)}...`
        : `[FCM] Requesting ALL tokens deletion for user: ${userKey}`;
    console.log(logMsg);

    try {
        await tokenApiFetch('/api/tokens', {
            method: 'DELETE',
            body: { user_key: userKey, token }
        });

        console.log("[FCM] Token deleted from Firestore successfully.");
        return true;
    } catch (error) {
        console.error("[FCM] Firestore error while attempting to delete token:", error);
        return false;
    }
}

// Hybrid bridge
window.getAdminTokens = getAdminTokens;
window.getUsersTokens = getUsersTokens;
window.getLocalNotificationTokens = getLocalNotificationTokens;
window.getCurrentUserNotificationState = getCurrentUserNotificationState;
window.syncCurrentUserNotificationState = syncCurrentUserNotificationState;
window.sendTokenToServer = sendTokenToServer;
window.deleteTokenFromServer = deleteTokenFromServer;
window.getActiveDeliveryKeysForSeller = getActiveDeliveryKeysForSeller;
window.getTokensForActiveDelivery2Seller = getTokensForActiveDelivery2Seller;

console.log("[ESM Load] fcm-api.js: Hybrid bridge established.");
