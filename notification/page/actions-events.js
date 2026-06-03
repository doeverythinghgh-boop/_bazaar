/**
 * @file actions-events.js
 * @description Event listeners and global counter setup for the notifications page.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

const NotificationPage = window.NotificationPage || {};

export const ActionsEvents = {
    /**
     * @description Setup event listeners.
     */
    setupEventListeners() {
        try {
            if (this.elements.filterType) {
                this.elements.filterType.addEventListener('change', (e) => {
                    this.filters.type = e.target.value;
                    this.applyFilters();
                    this.saveSettings();
                });
            }

            if (this.elements.filterStatus) {
                this.elements.filterStatus.addEventListener('change', (e) => {
                    this.filters.status = e.target.value;
                    this.applyFilters();
                    this.saveSettings();
                });
            }

            if (this.elements.searchInput) {
                let searchTimeout;
                this.elements.searchInput.addEventListener('input', (e) => {
                    clearTimeout(searchTimeout);
                    searchTimeout = setTimeout(() => {
                        this.filters.search = e.target.value.trim();
                        this.applyFilters();
                        this.saveSettings();
                    }, 300);
                });
            }

            if (this.elements.sortSelect) {
                this.elements.sortSelect.addEventListener('change', (e) => {
                    this.filters.sortBy = e.target.value;
                    this.applyFilters();
                    this.saveSettings();
                });
            }

            if (this.elements.refreshBtn) {
                this.elements.refreshBtn.addEventListener('click', () => {
                    this.refreshNotifications();
                });
            }

            if (this.elements.autoRefreshToggle) {
                this.elements.autoRefreshToggle.addEventListener('change', (e) => {
                    this.refreshSettings.autoRefresh = e.target.checked;
                    if (this.refreshSettings.autoRefresh) {
                        this.startAutoRefresh();
                    } else {
                        this.stopAutoRefresh();
                    }
                    this.updateAutoRefreshToggle();
                    this.saveSettings();
                });
            }

            if (this.elements.markAllReadBtn) {
                this.elements.markAllReadBtn.addEventListener('click', () => {
                    this.markAllAsRead();
                });
            }

            if (this.elements.clearFiltersBtn) {
                this.elements.clearFiltersBtn.addEventListener('click', () => {
                    this.clearFilters();
                });
            }

            if (this.elements.masterToggle) {
                this.elements.masterToggle.addEventListener('change', async (e) => {
                    await this.toggleNotificationsStatus(e.target.checked);
                });
            }

            window.addEventListener('notificationLogAdded', async (event) => {
                try {
                    console.log('[Notifications Action] New notification event:', event.detail);
                    if (!this.state || !this.elements || !this.elements.list) return;
                    await this.refreshNotifications();
                    await this.syncVisiblePageUnreadState('notificationLogAdded');
                    if (!document.hidden && event.detail && event.detail.type === 'received') {
                        console.info(window.langu('notifications_new_received'));
                    }
                } catch (innerError) {
                    console.error('[Notifications Action] Error receiving new notification:', innerError);
                }
            });

            document.addEventListener('visibilitychange', () => {
                try {
                    if (!document.hidden) {
                        this.refreshNotifications().then(() => this.syncVisiblePageUnreadState('visibilitychange'));
                    }
                } catch (innerError) {
                    console.error('[Notifications Action] Error change visibility state:', innerError);
                }
            });

            window.addEventListener('notificationDeleted', (event) => {
                console.log('[Notifications Action] Notification deleted:', event.detail.id);
                this.refreshNotifications();
            });
        } catch (error) {
            console.error('[Notifications Action] Error setting up event listeners:', error);
        }
    },

    /**
     * @description Setup global counter.
     */
    setupGlobalCounter() {
        try {
            if (window.GLOBAL_NOTIFICATIONS) {
                window.GLOBAL_NOTIFICATIONS.onCountUpdate = (count) => {
                    if (this.elements.unreadCountEl) this.elements.unreadCountEl.textContent = count;
                };
            }
        } catch (error) {
            console.error('[Notifications Action] Error setting up global counter:', error);
        }
    }
};

// Hybrid bridge
Object.assign(NotificationPage, ActionsEvents);
window.NotificationPage = NotificationPage;

console.log("[ESM Load] actions-events.js: Hybrid bridge established.");
