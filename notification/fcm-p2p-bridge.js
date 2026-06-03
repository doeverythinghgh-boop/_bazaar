/**
 * @file notification/fcm-p2p-bridge.js
 * @description High-level notification sending via Android or Web P2P.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

export async function sendNotification(token, title, body) {
    if (!token || token === 'undefined' || token === 'null' || typeof token !== 'string') {
        console.error('[Notifications] Invalid token:', token);
        return { error: 'Invalid or missing token', tokenStatus: 'broken' };
    }

    const localTokens = [
        LocalDBStorage.getItem("fcm_token"),
        LocalDBStorage.getItem("android_fcm_key")
    ].filter(t => t && t !== 'undefined' && t !== 'null');

    if (localTokens.includes(token)) {
        console.warn(`[Notifications] Self-notification prevented.`);
        return { success: false, reason: 'self_notification_prevented' };
    }

    if (window.BridgeManager && typeof window.BridgeManager.invoke === 'function' && window.BridgeManager.isAndroid()) {
        console.log(`[FCM Bridge] Android P2P sending...`);
        const sent = window.BridgeManager.invoke("sendNotificationsToTokensP2P", JSON.stringify([token]), title, body);
        return sent ? { success: true, platform: 'android-p2p' } : { error: 'Android P2P bridge invocation failed' };
    } else if (typeof window.WebP2PNotification !== 'undefined') {
        console.log(`[FCM Bridge] Web P2P sending...`);
        return await window.WebP2PNotification.send(token, title, body);
    }

    console.warn('[FCM] No P2P bridge available.');
    return { error: 'P2P Notification failed.' };
}

export async function sendNotificationsToTokens(allTokens, title, body) {
    if (!Array.isArray(allTokens) || allTokens.length === 0) {
        console.warn('[FCM Bridge] Batch send skipped because no tokens were provided.');
        return { success: false, reason: 'no_tokens' };
    }

    if (typeof window.addNotificationLog === 'function') {
        window.addNotificationLog({
            type: 'sent',
            title: title,
            body: body,
            timestamp: new Date(),
            status: 'read',
            relatedUser: { name: 'User' }
        }).catch(e => console.error('[Notifications] Save failed:', e));
    }

    const localTokens = [
        LocalDBStorage.getItem("fcm_token"),
        LocalDBStorage.getItem("android_fcm_key")
    ].filter(t => t && t !== 'undefined' && t !== 'null');

    const validTokens = allTokens.filter(t =>
        t && typeof t === 'string' && !localTokens.includes(t)
    );

    console.log(`[FCM Bridge] Batch send requested. inputTokens=${allTokens.length}, validTokens=${validTokens.length}, localTokens=${localTokens.length}.`);

    if (validTokens.length === 0) {
        console.warn('[FCM Bridge] Batch send skipped because all tokens are invalid or local self tokens.');
        return { success: false, reason: 'no_remote_tokens' };
    }

    if (window.BridgeManager && typeof window.BridgeManager.invoke === 'function' && window.BridgeManager.isAndroid()) {
        console.log(`[FCM Bridge] Android P2P batch sending to ${validTokens.length} token(s).`);
        const sent = window.BridgeManager.invoke("sendNotificationsToTokensP2P", JSON.stringify(validTokens), title, body);
        return sent
            ? { success: true, platform: 'android-p2p', count: validTokens.length }
            : { success: false, platform: 'android-p2p', error: 'Android P2P bridge invocation failed' };
    } else if (typeof window.WebP2PNotification !== 'undefined') {
        try {
            console.log(`[FCM Bridge] Web P2P batch sending to ${validTokens.length} token(s).`);
            const result = await window.WebP2PNotification.sendBatch(validTokens, title, body);
            return { success: true, platform: 'web-p2p', count: validTokens.length, result };
        } catch (e) {
            console.error('[FCM Bridge] Web P2P Error:', e);
            return { success: false, platform: 'web-p2p', error: e?.message || String(e) };
        }
    }

    console.warn('[Notifications] No P2P bridge active.');
    return { success: false, reason: 'no_p2p_bridge' };
}

export function onAndroidP2PTokenInvalid(token, errorJson = "") {
    if (!token || typeof token !== "string") return;
    console.warn("[FCM Bridge] Android reported an invalid FCM token. Cleaning it from storage.", token.substring(0, 12) + "...");
    if (typeof window.deleteTokenFromServer === "function") {
        window.deleteTokenFromServer(null, token).catch((error) => {
            console.error("[FCM Bridge] Failed to clean invalid Android token:", error);
        });
    }
    if (errorJson) {
        console.warn("[FCM Bridge] Android invalid-token response:", errorJson);
    }
}

export function onAndroidP2PSendResult(resultJson = "{}") {
    try {
        const result = JSON.parse(resultJson);
        if (result?.success) {
            console.log("[FCM Bridge] Android P2P delivery confirmed.", result);
        } else {
            console.warn("[FCM Bridge] Android P2P delivery failed.", result);
        }
    } catch (error) {
        console.warn("[FCM Bridge] Android P2P result was not valid JSON:", resultJson);
    }
}

// Hybrid bridge
window.sendNotification = sendNotification;
window.sendNotificationsToTokens = sendNotificationsToTokens;
window.onAndroidP2PTokenInvalid = onAndroidP2PTokenInvalid;
window.onAndroidP2PSendResult = onAndroidP2PSendResult;

console.log("[ESM Load] fcm-p2p-bridge.js: Hybrid bridge established.");
