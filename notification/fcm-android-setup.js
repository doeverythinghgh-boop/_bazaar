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

import {
    isAndroidRuntime,
    requestNativeNotificationSetup,
    flushPendingAndroidFcmTokenToServer,
    startAndroidNotificationWatchdog,
} from './fcm-android-runtime.js';

export async function setupFirebaseAndroid(userId) {
    console.log("[Dev] Android FCM Setup...");

    if (!isAndroidRuntime()) {
        console.warn("[FCM] Android setup skipped because native bridge is unavailable.");
        return false;
    }

    startAndroidNotificationWatchdog();

    if (LocalDBStorage.getItem("notifications_user_disabled") === "true") {
        LocalDBStorage.setItem("notifications_enabled", "false");
        console.log("[FCM] Android setup skipped because user explicitly disabled notifications.");
        return false;
    }

    await requestNativeNotificationSetup(userId);

    const existingToken = LocalDBStorage.getItem("android_fcm_key");
    if (!existingToken && typeof window.waitForFcmKey === 'function') {
        try {
            const newToken = await window.waitForFcmKey(null, 10000);
            if (newToken) {
                LocalDBStorage.setItem("android_fcm_key", newToken);
            }
        } catch (error) {
            console.warn("[FCM] Timed out waiting for Android FCM token:", error);
        }
    }

    const flushed = await flushPendingAndroidFcmTokenToServer(userId);
    if (flushed) {
        window.refreshSettingsNotificationState?.();
    }
    return flushed;
}

// Hybrid bridge
window.setupFirebaseAndroid = setupFirebaseAndroid;

console.log("[ESM Load] fcm-android-setup.js: Hybrid bridge established.");
