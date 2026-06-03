/**
 * @file global-events.js
 * @description Event listeners for global notification updates.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

const GLOBAL_NOTIFICATIONS = window.GLOBAL_NOTIFICATIONS || {};

function isAndroidRuntime() {
    return !!window.Android ||
        (window.BridgeManager && typeof window.BridgeManager.isAndroid === 'function' && window.BridgeManager.isAndroid()) ||
        window.location.hostname === 'appassets.androidplatform.net';
}

export function setupEventListeners() {
    if (GLOBAL_NOTIFICATIONS.isListenersSetup) return;
    try {
        window.addEventListener('notificationLogAdded', async (event) => {
            try {
                console.log('[Global] New notification event received:', event.detail);

                if (event.detail && event.detail.type === 'received' && !isAndroidRuntime()) {
                    if (typeof window.playNotificationSound === 'function') {
                        window.playNotificationSound();
                    }
                }

                if (typeof GLOBAL_NOTIFICATIONS.updateCounter === 'function') {
                    await GLOBAL_NOTIFICATIONS.updateCounter();
                }

                if (event.detail.status === 'unread' && typeof GLOBAL_NOTIFICATIONS.showSystemNotification === 'function') {
                    GLOBAL_NOTIFICATIONS.showSystemNotification(event.detail);
                }
            } catch (innerError) {
                console.error('[Global] Error in log listener:', innerError);
            }
        });

        window.addEventListener('notificationStatusUpdated', async (event) => {
            try {
                console.log('[Global] Status updated event received:', event.detail);
                if (typeof GLOBAL_NOTIFICATIONS.updateCounter === 'function') {
                    await GLOBAL_NOTIFICATIONS.updateCounter();
                }
            } catch (innerError) {
                console.error('[Global] Error in status listener:', innerError);
            }
        });

        window.addEventListener('notificationDeleted', async (event) => {
            try {
                console.log('[Global] Notification deleted event received:', event.detail);
                if (typeof GLOBAL_NOTIFICATIONS.updateCounter === 'function') {
                    await GLOBAL_NOTIFICATIONS.updateCounter();
                }
            } catch (innerError) {
                console.error('[Global] Error in delete listener:', innerError);
            }
        });

        GLOBAL_NOTIFICATIONS.isListenersSetup = true;
        console.log('[Global] Notification event listeners established.');
    } catch (error) {
        console.error('[Global] Error setting up notification listeners:', error);
    }
}

// Attach to global object if not already present
GLOBAL_NOTIFICATIONS.setupEventListeners = setupEventListeners;
window.GLOBAL_NOTIFICATIONS = GLOBAL_NOTIFICATIONS;

// Auto-run listener setup
setupEventListeners();

console.log("[ESM Load] global-events.js: Hybrid bridge established.");
