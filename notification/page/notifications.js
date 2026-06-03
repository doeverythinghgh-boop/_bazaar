/**
 * @file notifications.js
 * @description Core file for notifications page logic.
 *   Acts as a coordinator for UI, Logic, and Action modules.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

/**
 * @namespace NotificationPage
 * @description Main object responsible for managing the notifications page.
 */
export const NotificationPage = window.NotificationPage || {
    /**
     * @description Current state of the page.
     */
    state: {
        notifications: [],
        filteredNotifications: [],
        isLoading: false,
        hasError: false,
        errorMessage: '',
        totalCount: 0,
        stats: {
            total: 0,
            unread: 0,
            sent: 0,
            received: 0
        }
    },

    /**
     * @description Filter settings.
     */
    filters: {
        type: 'all',        // all, sent, received
        status: 'all',      // all, read, unread
        search: '',         // Search text
        sortBy: 'newest'    // newest, oldest
    },

    /**
     * @description Refresh settings.
     */
    refreshSettings: {
        autoRefresh: true,
        refreshInterval: 30000,
        refreshTimer: null
    },

    /**
     * @description DOM elements.
     */
    elements: {},

    hasMarkedCurrentOpenAsRead: false,

    isNotificationsPageOpen() {
        const path = String(window.location.pathname || '');
        return path.includes('/notification/page/notifications.html') || path.endsWith('/notifications.html');
    },

    async markAllAsReadOnOpen() {
        if (!this.isNotificationsPageOpen()) {
            return;
        }

        if (this.hasMarkedCurrentOpenAsRead) {
            return;
        }

        const unreadCount = Array.isArray(this.state.notifications)
            ? this.state.notifications.filter(notification => notification.status === 'unread').length
            : 0;

        if (unreadCount === 0) {
            this.hasMarkedCurrentOpenAsRead = true;
            console.log('[BADGE_DIAG] Notifications page opened with unreadCount=0. Badge should remain hidden.');
            if (window.GLOBAL_NOTIFICATIONS && typeof window.GLOBAL_NOTIFICATIONS.updateCounter === 'function') {
                await window.GLOBAL_NOTIFICATIONS.updateCounter(true);
            }
            return;
        }

        this.hasMarkedCurrentOpenAsRead = true;
        console.log(`[BADGE_DIAG] Notifications page is the active page. Scheduling mark-all-read for unreadCount=${unreadCount}.`);
        console.log(`[Notifications Core] Notifications page opened. Marking ${unreadCount} notifications as read.`);

        setTimeout(async () => {
            try {
                if (document.hidden || !this.isNotificationsPageOpen()) {
                    this.hasMarkedCurrentOpenAsRead = false;
                    console.log('[Notifications Core] Mark-all-read deferred because notifications page is not active.');
                    return;
                }

                await this.markAllAsRead(true);
                console.log('[BADGE_DIAG] markAllAsRead(true) completed from notifications page open.');

                if (window.GLOBAL_NOTIFICATIONS && typeof window.GLOBAL_NOTIFICATIONS.updateCounter === 'function') {
                    await window.GLOBAL_NOTIFICATIONS.updateCounter(true);
                }
            } catch (error) {
                this.hasMarkedCurrentOpenAsRead = false;
                console.error('[Notifications Core] Failed to mark notifications as read on page open:', error);
            }
        }, 500);
    },

    async syncVisiblePageUnreadState(reason = 'unknown') {
        if (!this.isNotificationsPageOpen() || document.hidden) {
            return;
        }

        const unreadCount = Array.isArray(this.state.notifications)
            ? this.state.notifications.filter(notification => notification.status === 'unread').length
            : 0;

        console.log(`[BADGE_DIAG] syncVisiblePageUnreadState called. reason=${reason} unreadCount=${unreadCount} hidden=${document.hidden}`);

        if (unreadCount > 0) {
            await this.markAllAsRead(true);
        }

        if (window.GLOBAL_NOTIFICATIONS && typeof window.GLOBAL_NOTIFICATIONS.updateCounter === 'function') {
            await window.GLOBAL_NOTIFICATIONS.updateCounter(true);
        }
    },

    /**
     * @description Page initialization.
     */
    async init() {
        console.log('[Notifications Core] Starting notification page initialization...');
        try {
            this.initElements();
            if (typeof this.loadSettings === 'function') this.loadSettings();
            if (typeof this.setupEventListeners === 'function') this.setupEventListeners();
            if (typeof this.setupGlobalCounter === 'function') this.setupGlobalCounter();

            if (typeof this.loadNotifications === 'function') await this.loadNotifications();
            await this.markAllAsReadOnOpen();

            if (typeof this.startAutoRefresh === 'function') this.startAutoRefresh();
            if (typeof this.initMasterToggle === 'function') this.initMasterToggle();

            console.log('[Notifications Core] Page initialized successfully.');
        } catch (error) {
            console.error('[Notifications Core] Initialization error:', error);
            if (typeof this.showError === 'function') {
                this.showError('Error initializing notifications page');
            }
        }
    },

    /**
     * @description Initialize DOM elements.
     */
    initElements() {
        try {
            this.elements = {
                container: document.getElementById('notifications-page-body'),
                list: document.getElementById('notifications-list'),
                stats: document.getElementById('notifications-stats'),
                emptyState: document.getElementById('empty-state'),
                loadingState: document.getElementById('loading-state'),
                errorState: document.getElementById('error-state'),

                filterType: document.getElementById('filter-type'),
                filterStatus: document.getElementById('filter-status'),
                searchInput: document.getElementById('search-input'),
                sortSelect: document.getElementById('sort-select'),
                refreshBtn: document.getElementById('refresh-btn'),
                autoRefreshToggle: document.getElementById('auto-refresh-toggle'),
                markAllReadBtn: document.getElementById('mark-all-read-btn'),
                clearFiltersBtn: document.getElementById('clear-filters-btn'),

                totalCountEl: document.getElementById('total-count'),
                unreadCountEl: document.getElementById('unread-count'),
                sentCountEl: document.getElementById('sent-count'),
                receivedCountEl: document.getElementById('received-count')
            };
        } catch (error) {
            console.error('[Notifications Core] Error initializing elements:', error);
        }
    }
};

// Hybrid bridge
window.NotificationPage = NotificationPage;

console.log("[ESM Load] notifications.js: Hybrid bridge established.");
