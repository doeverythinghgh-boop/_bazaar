/**
 * @file global-counter.js
 * @description Global unread notification counter and UI badge management.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

export const GLOBAL_NOTIFICATIONS = {
    unreadCount: 0,
    lastOpenedTime: null,
    updateTimeout: null,
    onCountUpdate: null,

    /**
     * @description Update counter from LocalDB (with Debounce for accuracy).
     */
    updateCounter: async function (forceImmediate = false) {
        if (this.updateTimeout) {
            clearTimeout(this.updateTimeout);
        }
        console.log(`[BADGE_DIAG] updateCounter requested. forceImmediate=${forceImmediate} currentUnread=${this.unreadCount}`);

        const runUpdate = async () => {
            try {
                let count = 0;
                let countSource = 'none';
                if (typeof window.countUnreadNotifications === 'function') {
                    count = await window.countUnreadNotifications();
                    countSource = 'countUnreadNotifications';
                } else if (typeof window.getNotificationLogs === 'function') {
                    const allNotifications = await window.getNotificationLogs('all', 1000);
                    count = allNotifications.filter(n => n.status === 'unread').length;
                    countSource = 'getNotificationLogs';
                }

                const hasChanged = this.unreadCount !== count;
                const previousCount = this.unreadCount;
                this.unreadCount = count;
                console.log(`[BADGE_DIAG] Counter resolved. source=${countSource} previous=${previousCount} next=${count} changed=${hasChanged}`);

                console.log(`[Global] Counter update: ${this.unreadCount} unread notifications`);

                this.notifyCountUpdate();
                this.updateBrowserTitle();

                if (hasChanged || forceImmediate) {
                    console.log(`[Global] Counter synchronized: ${this.unreadCount} notifications`);
                }
            } catch (error) {
                console.error('[Global] Error updating counter:', error);
            } finally {
                this.updateTimeout = null;
            }
        };

        if (forceImmediate) {
            await runUpdate();
        } else {
            this.updateTimeout = setTimeout(runUpdate, 50);
        }
    },

    /**
     * @description Reset counter when opening notifications page.
     */
    resetCounter: function () {
        try {
            this.setLastOpenedTime(new Date());
            this.updateCounter(true);
        } catch (error) {
            console.error('[Global] Error resetting counter:', error);
        }
    },

    /**
     * @description Update browser title with count.
     */
    updateBrowserTitle: function () {
        try {
            const baseTitle = document.title.replace(/^\(\d+\)\s*/, '');
            if (this.unreadCount > 0) {
                document.title = `(${this.unreadCount}) ${baseTitle}`;
            } else {
                document.title = baseTitle;
            }
        } catch (error) {
            console.error('[Global] Error updating title:', error);
        }
    },

    /**
     * @description Load/Save timestamps for opening.
     */
    getLastOpenedTime: function () {
        try {
            const stored = LocalDBStorage.getItem('notifications_last_opened');
            return stored ? new Date(stored) : null;
        } catch (error) {
            return null;
        }
    },

    setLastOpenedTime: function (date) {
        try {
            this.lastOpenedTime = date;
            LocalDBStorage.setItem('notifications_last_opened', date.toISOString());
        } catch (error) {
            console.error('[Global] Error saving timestamp:', error);
        }
    },

    /**
     * @description Notify and Update UI Badge.
     */
    notifyCountUpdate: function () {
        this.updateNotificationBadge();
        if (typeof this.onCountUpdate === 'function') {
            try {
                this.onCountUpdate(this.unreadCount);
            } catch (error) {
                console.error('[Global] Callback error:', error);
            }
        }
    },

    updateNotificationBadge: function () {
        try {
            const badge = document.getElementById('notifications-badge');
            if (!badge) {
                console.warn(`[BADGE_DIAG] updateNotificationBadge skipped. notifications-badge not found. unread=${this.unreadCount}`);
                return;
            }

            if (this.unreadCount > 0) {
                badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
                badge.style.display = 'flex';
                console.log(`[BADGE_DIAG] Badge shown. text=${badge.textContent} unread=${this.unreadCount}`);
            } else {
                badge.style.display = 'none';
                badge.textContent = '0';
                console.log('[BADGE_DIAG] Badge hidden because unread=0.');
            }
        } catch (error) {
            console.error('[Global] Error updating badge:', error);
        }
    },

    /**
     * @description System Initialization.
     */
    init: async function () {
        try {
            this.lastOpenedTime = this.getLastOpenedTime();
            console.log(`[BADGE_DIAG] GLOBAL_NOTIFICATIONS.init starting. lastOpenedTime=${this.lastOpenedTime ? this.lastOpenedTime.toISOString() : 'null'}`);
            await this.updateCounter(true);
            console.log('[Global] Notification system ready');

            if (window.BridgeManager && typeof window.BridgeManager.signalReady === 'function') {
                console.log('[BADGE_DIAG] GLOBAL_NOTIFICATIONS.init signaling BridgeManager.signalReady().');
                window.BridgeManager.signalReady('notifications_ready');
            }
        } catch (error) {
            console.error('[Global] Init error:', error);
        }
    }
};

// Hybrid bridge
window.GLOBAL_NOTIFICATIONS = GLOBAL_NOTIFICATIONS;

window.updateGlobalNotificationCount = async function () {
    if (!window.GLOBAL_NOTIFICATIONS || typeof window.GLOBAL_NOTIFICATIONS.updateCounter !== 'function') {
        console.warn('[BADGE_DIAG] updateGlobalNotificationCount aborted. GLOBAL_NOTIFICATIONS.updateCounter missing.');
        return;
    }

    console.log('[BADGE_DIAG] updateGlobalNotificationCount delegating to GLOBAL_NOTIFICATIONS.updateCounter(true).');
    await window.GLOBAL_NOTIFICATIONS.updateCounter(true);
};

console.log("[ESM Load] global-counter.js: Hybrid bridge established.");
