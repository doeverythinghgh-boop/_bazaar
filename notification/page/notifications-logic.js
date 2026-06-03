/**
 * @file notifications-logic.js
 * @description Logic for filtering, statistics, and state management for the notifications page.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

const NotificationPage = window.NotificationPage || {};

export const NotificationLogic = {
    /**
     * @description Load settings from LocalDBStorage.
     */
    loadSettings() {
        try {
            const saved = LocalDBStorage.getItem('notification_settings');
            if (saved) {
                const settings = JSON.parse(saved);
                if (settings.filters) {
                    this.filters = { ...this.filters, ...settings.filters };
                    this.applyFilterValues();
                }
                if (settings.refreshSettings) {
                    this.refreshSettings.autoRefresh = settings.refreshSettings.autoRefresh;
                    this.updateAutoRefreshToggle();
                }
            }
        } catch (error) {
            console.warn('[Notifications Logic] Error loading settings:', error);
        }
    },

    /**
     * @description Save settings to LocalDBStorage.
     */
    saveSettings() {
        try {
            const settings = {
                filters: this.filters,
                refreshSettings: {
                    autoRefresh: this.refreshSettings.autoRefresh
                }
            };
            LocalDBStorage.setItem('notification_settings', JSON.stringify(settings));
        } catch (error) {
            console.warn('[Notifications Logic] Error saving settings:', error);
        }
    },

    /**
     * @description Apply filter values to DOM elements.
     */
    applyFilterValues() {
        try {
            if (this.elements.filterType) this.elements.filterType.value = this.filters.type;
            if (this.elements.filterStatus) this.elements.filterStatus.value = this.filters.status;
            if (this.elements.searchInput) this.elements.searchInput.value = this.filters.search;
            if (this.elements.sortSelect) this.elements.sortSelect.value = this.filters.sortBy;
        } catch (error) {
            console.error('[Notifications Logic] Error applying filter values:', error);
        }
    },

    /**
     * @description Update the auto-refresh toggle.
     */
    updateAutoRefreshToggle() {
        try {
            if (this.elements.autoRefreshToggle) {
                this.elements.autoRefreshToggle.checked = this.refreshSettings.autoRefresh;
                this.elements.autoRefreshToggle.nextElementSibling.textContent =
                    this.refreshSettings.autoRefresh ? window.langu('notif_status_enabled') : window.langu('notif_status_disabled');
            }
        } catch (error) {
            console.error('[Notifications Logic] Error updating auto-refresh toggle:', error);
        }
    },

    /**
     * @description Update page statistics.
     * @param {Array} notifications
     */
    updateStats(notifications) {
        try {
            const stats = {
                total: notifications.length,
                unread: notifications.filter(n => n.status === 'unread').length,
                sent: notifications.filter(n => n.type === 'sent').length,
                received: notifications.filter(n => n.type === 'received').length
            };

            this.state.stats = stats;

            if (this.elements.totalCountEl) this.elements.totalCountEl.textContent = stats.total;
            if (this.elements.unreadCountEl) this.elements.unreadCountEl.textContent = stats.unread;
            if (this.elements.sentCountEl) this.elements.sentCountEl.textContent = stats.sent;
            if (this.elements.receivedCountEl) this.elements.receivedCountEl.textContent = stats.received;

            if (window.GLOBAL_NOTIFICATIONS) {
                window.GLOBAL_NOTIFICATIONS.unreadCount = stats.unread;
                window.GLOBAL_NOTIFICATIONS.updateBrowserTitle();
                if (typeof window.GLOBAL_NOTIFICATIONS.notifyCountUpdate === 'function') {
                    window.GLOBAL_NOTIFICATIONS.notifyCountUpdate();
                }
            }
        } catch (error) {
            console.error('[Notifications Logic] Error updating statistics:', error);
        }
    },

    /**
     * @description Apply filters.
     */
    applyFilters() {
        try {
            let filtered = [...this.state.notifications];

            if (this.filters.type !== 'all') {
                filtered = filtered.filter(n => n.type === this.filters.type);
            }

            if (this.filters.status !== 'all') {
                filtered = filtered.filter(n => n.status === this.filters.status);
            }

            if (this.filters.search) {
                const searchTerm = this.filters.search.toLowerCase();
                filtered = filtered.filter(n =>
                    (n.title && n.title.toLowerCase().includes(searchTerm)) ||
                    (n.body && n.body.toLowerCase().includes(searchTerm)) ||
                    (n.relatedUser && n.relatedUser.name && n.relatedUser.name.toLowerCase().includes(searchTerm))
                );
            }

            filtered.sort((a, b) => {
                const dateA = new Date(a.timestamp);
                const dateB = new Date(b.timestamp);
                return this.filters.sortBy === 'newest' ? dateB - dateA : dateA - dateB;
            });

            this.state.filteredNotifications = filtered;
            if (typeof this.renderNotifications === 'function') {
                this.renderNotifications();
            }
        } catch (error) {
            console.error('[Notifications Logic] Error applying filters:', error);
        }
    },

    /**
     * @description Clear all filters.
     */
    clearFilters() {
        try {
            this.filters = {
                type: 'all',
                status: 'all',
                search: '',
                sortBy: 'newest'
            };
            this.applyFilterValues();
            this.applyFilters();
            this.saveSettings();
        } catch (error) {
            console.error('[Notifications Logic] Error clearing filters:', error);
        }
    },

    /**
     * @description Update page state.
     * @param {object} newState
     */
    setState(newState) {
        this.state = { ...this.state, ...newState };
    }
};

// Hybrid bridge
Object.assign(NotificationPage, NotificationLogic);
window.NotificationPage = NotificationPage;

console.log("[ESM Load] notifications-logic.js: Hybrid bridge established.");
