/**
 * @file notification/fcm-config.js
 * @description Static notification policy and message template logic for FCM.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

export const STATIC_NOTIFICATION_POLICY = {
    purchase: { admin: true, merchant: true, buyer: true, delivery: true },
    'step-review': { admin: true, merchant: true, buyer: true, delivery: true },
    'step-confirmed': { admin: true, merchant: true, buyer: true, delivery: true },
    'step-shipped': { admin: true, merchant: true, buyer: true, delivery: true },
    'step-delivered': { admin: true, merchant: true, buyer: true, delivery: true },
    'step-cancelled': { admin: true, merchant: true, buyer: true, delivery: true },
    'step-rejected': { admin: true, merchant: true, buyer: true, delivery: true },
    'step-returned': { admin: true, merchant: true, buyer: true, delivery: true },
    'new-item-added': { admin: true, merchant: true, buyer: false, delivery: false },
    'item-updated': { admin: true, merchant: true, buyer: false, delivery: false },
    'item-accepted': { admin: true, merchant: true, buyer: false, delivery: false }
};

let notificationMessages = null;

/**
 * Fetches and caches notification templates from `notification_messages.json`.
 */
export async function loadNotificationMessages() {
    if (notificationMessages) return notificationMessages;
    try {
        const timestamp = new Date().getTime();
        const response = await fetch(`/notification/notification_messages.json?t=${timestamp}`);

        if (response.ok) {
            notificationMessages = await response.json();
            window.notificationMessages = notificationMessages;
            console.log('[Notifications] Messages loaded locally successfully.');
            return notificationMessages;
        } else {
            console.error('[Notifications] Failed to load local messages file:', response.status);
        }
    } catch (e) {
        console.error('[Notifications] Error fetching local messages file:', e);
    }
    return null;
}

/**
 * Extracts a message template and replaces placeholders with provided values.
 */
export function getMessageTemplate(path, placeholders = {}) {
    if (!notificationMessages) return { title: 'Notification', body: '' };

    const keys = path.split('.');
    let template = notificationMessages;
    for (const key of keys) {
        template = template ? template[key] : null;
    }

    if (!template) return { title: 'Notification', body: '' };

    let body = template.body || '';
    let title = template.title || '';

    Object.keys(placeholders).forEach(key => {
        const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
        body = body.replace(regex, placeholders[key]);
        title = title.replace(regex, placeholders[key]);
    });

    return { title, body };
}

/**
 * Determines if a notification is permitted for a specific event and role.
 * Notification delivery is now fixed in code and no longer depends on external settings.
 */
export async function shouldNotify(eventKey, role) {
    const eventPolicy = STATIC_NOTIFICATION_POLICY[eventKey];
    if (eventPolicy && eventPolicy[role] !== undefined) {
        return eventPolicy[role];
    }

    console.warn(`[Notifications] Static policy missing for ${eventKey}.${role}, assuming TRUE.`);
    return true;
}

// Hybrid bridge
window.STATIC_NOTIFICATION_POLICY = STATIC_NOTIFICATION_POLICY;
window.shouldNotify = shouldNotify;
window.loadNotificationMessages = loadNotificationMessages;
window.getMessageTemplate = getMessageTemplate;

console.log("[ESM Load] fcm-config.js: Hybrid bridge established.");
