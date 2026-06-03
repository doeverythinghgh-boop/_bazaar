/**
 * @file notification/fcm-android-bridge.js
 * @description Native Android bridge callbacks and persistent saving logic.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

export function saveNotificationFromAndroid(notificationJson) {
    console.log('[Dev] Single notification received from Android');
    console.log('[Dev] Raw JSON string:', notificationJson);

    try {
        const notificationData = JSON.parse(notificationJson);
        console.log('[Dev] JSON parsed successfully', notificationData);
        saveNotificationBatchFromAndroid(JSON.stringify([notificationData]));
    } catch (error) {
        console.error('[Dev] JSON Parse Error - Single Notification');
        console.error('[Dev] Error details:', error.message);
        console.error('[Dev] Problematic JSON string:', notificationJson);
    }
}

export function saveNotificationBatchFromAndroid(batchJson) {
    console.log('[FCM Android] Batch received:', batchJson);
    console.log('[Dev] Batch size (chars):', batchJson.length);

    try {
        const notifications = JSON.parse(batchJson);
        console.log(`[BADGE_DIAG] saveNotificationBatchFromAndroid parsed batch. count=${Array.isArray(notifications) ? notifications.length : 'invalid'}`);
        console.log('[Dev] Batch JSON parsed successfully', `${notifications.length} notifications`);

        if (!Array.isArray(notifications)) {
            console.error('[Dev] Invalid batch format: Expected array');
            return;
        }

        if (typeof window.addNotificationLog !== 'function') {
            console.error("[Auth] addNotificationLog not found.");
            return;
        }

        const promises = notifications.map(notif => {
            const uniqueSuffix = Math.random().toString(36).substring(2, 7);
            const fallbackId = `android_${Date.now()}_${uniqueSuffix}`;
            const defaultSenderName = window.app_language === 'ar' ? 'بازار السويس' : 'Suez Bazaar';

            return window.addNotificationLog({
                messageId: notif.messageId || fallbackId,
                type: 'received',
                title: notif.title || 'Bazaar',
                body: notif.body || '',
                timestamp: notif.timestamp ? new Date(notif.timestamp) : new Date(),
                status: 'unread',
                relatedUser: { key: 'system', name: defaultSenderName },
                payload: notif,
            });
        });

        Promise.all(promises).then(() => {
            console.log(`[FCM] Saved ${notifications.length} notifications`);
            if (window.GLOBAL_NOTIFICATIONS) {
                console.log(`[BADGE_DIAG] Batch persisted to LocalDB. Triggering counter sync for ${notifications.length} notifications.`);
                window.GLOBAL_NOTIFICATIONS.updateCounter(true);
            }
        }).catch(err => {
            console.error("[FCM] Error saving batch:", err);
        });
    } catch (error) {
        console.error('[Dev] JSON Parse Error - Batch');
        console.error('[Dev] Error details:', error.message);
        console.error('[Dev] Problematic JSON string:', batchJson);
    }
}

export async function askForNotificationPermission() {
    try {
        if (window.BridgeManager && typeof window.BridgeManager.invoke === "function") {
            console.log("[Dev] Requesting permission from Android...");
            window.BridgeManager.invoke("requestNotificationPermission");
        }
    } catch (error) {
        console.error('[Notifications] Error:', error);
    }
}

export function onUserLoggedOutAndroid() {
    try {
        if (window.BridgeManager && typeof window.BridgeManager.invoke === "function") {
            const userKey = window.userSession?.user_key || '';
            window.BridgeManager.invoke("onUserLoggedOut", userKey);
            LocalDBStorage.removeItem("android_fcm_key");
            console.log("[Auth] Android key deleted.");
        }
    } catch (error) {
        console.error('[Auth] Error in Android logout:', error);
    }
}

window._fcmTokenResolvers = window._fcmTokenResolvers || [];

export function onAndroidFcmReceived(token) {
    if (token) {
        console.log("[Bridge] Token received from Android");
        LocalDBStorage.setItem("android_fcm_key", token);
        const userKey = window.userSession?.user_key;
        const notificationsUserDisabled = LocalDBStorage.getItem("notifications_user_disabled") === "true";
        if (!notificationsUserDisabled && userKey && userKey !== "guest_user" && typeof window.sendTokenToServer === "function") {
            window.sendTokenToServer(userKey, token, "android").then((saved) => {
                if (saved) {
                    LocalDBStorage.removeItem("notifications_user_disabled");
                    LocalDBStorage.setItem("notifications_enabled", "true");
                }
            }).catch((error) => {
                console.error("[Android FCM] Failed to save refreshed token:", error);
            });
        }
        const resolvers = window._fcmTokenResolvers;
        window._fcmTokenResolvers = [];
        resolvers.forEach(resolve => resolve(token));
    }
}

export function waitForFcmKey(callback, timeout = 15000) {
    return new Promise((resolve, reject) => {
        const token = LocalDBStorage.getItem("android_fcm_key");
        if (token) {
            if (callback) callback(token);
            return resolve(token);
        }
        
        const resolver = (t) => {
            if (callback) callback(t);
            resolve(t);
        };
        
        window._fcmTokenResolvers.push(resolver);
        
        setTimeout(() => {
            if (!LocalDBStorage.getItem("android_fcm_key")) {
                const index = window._fcmTokenResolvers.indexOf(resolver);
                if (index > -1) {
                    window._fcmTokenResolvers.splice(index, 1);
                }
                console.warn("[Android FCM] Timeout waiting for token");
                reject("timeout");
            }
        }, timeout);
    });
}

// Hybrid bridge
window.saveNotificationFromAndroid = saveNotificationFromAndroid;
window.saveNotificationBatchFromAndroid = saveNotificationBatchFromAndroid;
window.askForNotificationPermission = askForNotificationPermission;
window.onUserLoggedOutAndroid = onUserLoggedOutAndroid;
window.waitForFcmKey = waitForFcmKey;
window.onAndroidFcmReceived = onAndroidFcmReceived;

console.log("[ESM Load] fcm-android-bridge.js: Hybrid bridge established.");
