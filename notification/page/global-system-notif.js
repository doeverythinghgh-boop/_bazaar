/**
 * @file global-system-notif.js
 * @description System/Browser notification management.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

const GLOBAL_NOTIFICATIONS = window.GLOBAL_NOTIFICATIONS || {};

/**
 * @description Show system notification.
 */
export function showSystemNotification(notification) {
    try {
        if (!("Notification" in window)) return;

        if (Notification.permission === "granted") {
            createNotification(notification);
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    createNotification(notification);
                }
            });
        }
    } catch (error) {
        console.error('[Global] System notification error:', error);
    }
}

/**
 * @description Create system notification.
 */
export function createNotification(notification) {
    try {
        const title = notification.title || 'New Notification';
        const body = notification.body || notification.message || 'You have a new notification';

        const notif = new Notification(title, {
            body: body,
            icon: '/favicon.ico',
            tag: `notification_${notification.id || Date.now()}`,
            requireInteraction: false
        });

        notif.onclick = function () {
            window.focus();
            this.close();
            if (window.location.pathname.includes('notifications')) {
                window.location.reload();
            } else {
                window.location.href = '/notification/page/notifications.html';
            }
        }.bind(notif);

        setTimeout(() => notif.close(), 5000);
    } catch (error) {
        console.error('[Global] Error creating notification:', error);
    }
}

// Attach to global object
GLOBAL_NOTIFICATIONS.showSystemNotification = showSystemNotification;
GLOBAL_NOTIFICATIONS.createNotification = createNotification;
window.GLOBAL_NOTIFICATIONS = GLOBAL_NOTIFICATIONS;

// Final bootstrap
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (window.GLOBAL_NOTIFICATIONS.init) window.GLOBAL_NOTIFICATIONS.init();
    });
} else {
    if (window.GLOBAL_NOTIFICATIONS.init) window.GLOBAL_NOTIFICATIONS.init();
}

console.log("[ESM Load] global-system-notif.js: Hybrid bridge established.");
