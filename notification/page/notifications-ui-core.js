/**
 * @file notifications-ui-core.js
 * @description Notification UI helper utilities for sender/body formatting.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

const NotificationPage = window.NotificationPage || {};

export const NotificationUICore = {
    getDefaultNotificationSenderName() {
        return window.app_language === 'ar' ? 'بازار السويس' : 'Suez Bazaar';
    },

    resolveNotificationSenderName(notification) {
        if (notification.type === 'sent') {
            return window.langu('notifications_sender_you');
        }

        const rawCandidate = String(notification?.relatedUser?.name || '').trim();
        const candidateName = rawCandidate.replace(/^["'\s]+|["'\s]+$/g, '').trim();
        const normalizedName = candidateName.toLowerCase();
        const normalizedToken = normalizedName.replace(/[^a-z]/g, '');
        const blockedNames = new Set([
            'admin',
            'admins',
            'administrator',
            'administration',
            'system',
            'systems',
            'user',
            'users'
        ]);

        if (candidateName && !blockedNames.has(normalizedName) && !blockedNames.has(normalizedToken)) {
            return candidateName;
        }

        return this.getDefaultNotificationSenderName();
    },

    buildOrderDataUrl(orderKey) {
        if (!orderKey) return '/orderStage/orderData/order-data.html';
        return `/orderStage/orderData/order-data.html?order_key=${encodeURIComponent(orderKey)}`;
    },

    extractOrderKeyFromText(text) {
        if (!text) return '';
        const match = text.match(/#([A-Za-z0-9_-]+)/);
        return match ? match[1] : '';
    },

    renderNotificationBody(notification) {
        const rawText = notification.body || notification.title || '';
        const lines = String(rawText).split(/\r?\n/);
        const orderKey = this.extractOrderKeyFromText(lines[0] || '');
        const notificationId = this.escapeHtml(String(notification.id || 'unknown'));

        return lines.map((line, index) => {
            const safeLine = this.escapeHtml(line);
            if (index === 0 && orderKey) {
                const href = this.buildOrderDataUrl(orderKey);
                return `<a id="notification-order-link-${notificationId}" href="${href}" class="notification-order-link" data-order-key="${this.escapeHtml(orderKey)}">${safeLine}</a>`;
            }
            return `<span id="notification-body-line-${notificationId}-${index}">${safeLine}</span>`;
        }).join('<br>');
    },

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    formatTimeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);

        if (diffDay > 0) return window.langu('time_days_ago').replace('{n}', diffDay);
        if (diffHour > 0) return window.langu('time_hours_ago').replace('{n}', diffHour);
        if (diffMin > 0) return window.langu('time_minutes_ago').replace('{n}', diffMin);
        return window.langu('time_now');
    }
};

// Hybrid bridge
Object.assign(NotificationPage, NotificationUICore);
window.NotificationPage = NotificationPage;

console.log("[ESM Load] notifications-ui-core.js: Hybrid bridge established.");
