/**
 * @file notification/fcm-android-setup.js
 * @description Android-specific FCM initialization sequence.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

export async function setupFirebaseAndroid(userId) {
    console.log("[Dev] Android FCM Setup...");
    const hasNativeBridge = !!window.Android ||
        (window.BridgeManager && typeof window.BridgeManager.isAndroid === "function" && window.BridgeManager.isAndroid()) ||
        window.location?.hostname === "appassets.androidplatform.net";

    if (!hasNativeBridge) {
        console.warn("[FCM] Android setup skipped because native bridge is unavailable.");
        return false;
    }

    try {
        if (window.BridgeManager && typeof window.BridgeManager.invoke === "function") {
            window.BridgeManager.invoke("onUserLoggedIn", userId);
        }
    } catch (e) {
        console.error("Android bridge error:", e);
    }

    const persistAndroidTokenState = async (token) => {
        if (!token) return false;
        LocalDBStorage.setItem("android_fcm_key", token);
        const saved = await window.sendTokenToServer?.(userId, token, "android");
        if (saved) {
            LocalDBStorage.removeItem("notifications_user_disabled");
            LocalDBStorage.setItem("notifications_enabled", "true");
        } else {
            console.warn("[FCM] Android token was received but could not be saved. Keeping previous notification preference.");
        }
        return !!saved;
    };

    const existingToken = LocalDBStorage.getItem("android_fcm_key");

    if (!existingToken) {
        if (typeof window.waitForFcmKey === 'function') {
            const newToken = await window.waitForFcmKey(null, 10000);
            await persistAndroidTokenState(newToken);
        }
    } else {
        await persistAndroidTokenState(existingToken);
    }
}

// Hybrid bridge
window.setupFirebaseAndroid = setupFirebaseAndroid;

console.log("[ESM Load] fcm-android-setup.js: Hybrid bridge established.");
