/**
 * @file notification/fcm-main-setup.js
 * @description Main entry point for FCM initialization.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

export let isSettingUpFCM = false;

export async function checkGoogleConnectivity() {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const response = await fetch('https://www.gstatic.com/generate_204', {
            mode: 'no-cors',
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        return true;
    } catch (e) {
        console.error("[Dev] Failed to connect to gstatic.com");
        return false;
    }
}

export async function resetFCM() {
    console.log("[FCM Tool] Cleanup...");
    try {
        LocalDBStorage.removeItem("fcm_token");
        LocalDBStorage.removeItem("notifications_enabled");
        LocalDBSession.removeItem("fcm_token_setup_done");
        if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (let r of registrations) await r.unregister();
        }
        if ('caches' in window) {
            const keys = await caches.keys();
            for (let k of keys) await caches.delete(k);
        }
        if (typeof window.Swal !== 'undefined') {
            window.Swal.fire({
                icon: 'success',
                title: 'Cleanup successful',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 1500
            }).then(() => {
                window.location.reload();
            });
        } else {
            alert("Cleanup successful.");
            window.location.reload();
        }
    } catch (e) { console.error("Cleanup error:", e); }
}

function isAndroidRuntime() {
    if (window.BridgeManager && typeof window.BridgeManager.isAndroid === "function" && window.BridgeManager.isAndroid()) {
        return true;
    }

    const host = window.location && window.location.hostname;
    return !!window.Android ||
        host === "appassets.androidplatform.net";
}

export async function setupFCM() {
    const isAndroid = isAndroidRuntime();

    if (!isAndroid && window.AppBehavior && window.AppBehavior.enablePWA === false) {
        console.log("[FCM] Web setup skipped because PWA is disabled.");
        return false;
    }

    const session = window.userSession;
    // 🛑 BLOCK GUEST: Do not run FCM setup for guests (neither Web nor Android)
    if (session && session.user_key === 'guest_user') {
        console.log("[FCM] Guest user detected. Skipping FCM setup.");
        return;
    }

    if (isSettingUpFCM) return;
    isSettingUpFCM = true;

    const MAX_RETRIES = 3;
    let attempt = 0;
    let success = false;

    while (attempt < MAX_RETRIES && !success) {
        attempt++;
        try {
            if (typeof window.userSession === 'undefined' || window.userSession === null || !window.userSession.user_key) break;
            const currentUserId = window.userSession.user_key;

            if (isAndroid) {
                if (typeof window.setupFirebaseAndroid === 'function') {
                    await window.setupFirebaseAndroid(currentUserId);
                    success = true;
                } else {
                    console.error("[FCM] setupFirebaseAndroid not found.");
                    break;
                }
            } else {
                if (typeof window.setupFirebaseWeb === 'function') {
                    await window.setupFirebaseWeb(currentUserId);
                    success = true;
                } else {
                    console.error("[FCM] setupFirebaseWeb not found.");
                    break;
                }
            }

            if (success) {
                LocalDBSession.setItem("fcm_token_setup_done", "1");
                if (typeof window.syncCurrentUserNotificationState === 'function') {
                    await window.syncCurrentUserNotificationState();
                }
            }
        } catch (error) {
            const isTimeout = String(error?.message || error || '').toLowerCase() === 'timeout';
            const log = isTimeout ? console.warn : console.error;
            log(`[FCM] Attempt #${attempt} failed:`, error);
            if (attempt < MAX_RETRIES) await new Promise(r => setTimeout(r, attempt * 3000));
        }
    }
    isSettingUpFCM = false;
    return success;
}

// Hybrid bridge
window.setupFCM = setupFCM;
window.resetFCM = resetFCM;
window.checkGoogleConnectivity = checkGoogleConnectivity;

console.log("[ESM Load] fcm-main-setup.js: Hybrid bridge established.");
