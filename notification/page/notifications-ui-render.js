/**
 * @file notifications-ui-render.js
 * @description Notification list rendering and item creation.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

const NotificationPage = window.NotificationPage || {};

export const NotificationUIRender = {
    updateToggleUI(isEnabled) {
        if (!this.elements.toggleTitle || !this.elements.toggleDesc) return;

        if (isEnabled) {
            this.elements.toggleTitle.textContent = window.langu('notification_enabled_title');
            this.elements.toggleTitle.style.color = 'var(--text-color-dark)';
            this.elements.toggleDesc.textContent = window.langu('notification_enabled_desc');
        } else {
            this.elements.toggleTitle.textContent = window.langu('notification_disabled_title');
            this.elements.toggleTitle.style.color = 'var(--text-color-medium)';
            this.elements.toggleDesc.textContent = window.langu('notification_disabled_desc');
        }
    },

    renderNotifications() {
        try {
            if (!this.elements.list) return;

            if (this.state.isLoading) {
                this.showLoading();
                return;
            }

            if (this.state.hasError) {
                this.showError();
                return;
            }

            if (this.state.filteredNotifications.length === 0) {
                this.showEmptyState();
                return;
            }

            this.hideAllStates();
            this.elements.list.innerHTML = '';

            let lastDateString = '';
            const fragment = document.createDocumentFragment();
            this.state.filteredNotifications.forEach((notification) => {
                const date = new Date(notification.timestamp);
                const locale = window.app_language === 'ar' ? 'ar-EG' : 'en-US';
                const dateString = date.toLocaleDateString(locale, {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                });

                if (dateString !== lastDateString) {
                    const divider = document.createElement('div');
                    const dividerKey = date.toISOString().slice(0, 10);
                    divider.id = `notifications-date-divider-${dividerKey}`;
                    divider.className = 'date-divider';
                    divider.innerHTML = `<span id="notifications-date-divider-label-${dividerKey}">${dateString}</span>`;
                    fragment.appendChild(divider);
                    lastDateString = dateString;
                }

                const notificationElement = this.createNotificationElement(notification);
                fragment.appendChild(notificationElement);
            });

            this.elements.list.appendChild(fragment);
        } catch (error) {
            console.error('[Notifications UI] Error rendering notifications:', error);
            this.showError(window.langu('notifications_init_error'));
        }
    },

    createNotificationElement(notification) {
        try {
            const element = document.createElement('div');
            const typeClass = notification.type === 'sent' ? 'sent' : 'received';
            const notificationId = String(notification.id || `generated-${Date.now()}`);
            element.className = `notification-item ${typeClass}`;
            element.dataset.id = notification.id;
            element.id = `notification-item-${notificationId}`;

            const date = new Date(notification.timestamp);
            const locale = window.app_language === 'ar' ? 'ar-EG' : 'en-US';
            const timeString = date.toLocaleTimeString(locale, {
                hour: '2-digit', minute: '2-digit', hour12: true
            });

            const senderName = this.resolveNotificationSenderName(notification);
            const statusClass = notification.status === 'read' ? 'read' : 'unread';
            const statusIcon = notification.status === 'read' ? 'fa-check-double' : 'fa-check';

            element.innerHTML = `
                <div id="notification-header-${notificationId}" class="notification-header">
                    <span id="notification-sender-${notificationId}" class="sender-name">${this.escapeHtml(senderName)}</span>
                </div>
                <div id="notification-body-${notificationId}" class="notification-body">
                    <p id="notification-body-text-${notificationId}">${this.renderNotificationBody(notification)}</p>
                </div>
                <div id="notification-meta-${notificationId}" class="notification-meta">
                    <span id="notification-time-${notificationId}" class="notification-time">${timeString}</span>
                    <span id="notification-status-${notificationId}" class="read-status ${statusClass}" title="${window.langu('notifications_status_tooltip')}">
                        <i id="notification-status-icon-${notificationId}" class="fas ${statusIcon}"></i>
                    </span>
                    <button id="notification-delete-${notificationId}" class="delete-notification-btn" title="${window.langu('notifications_delete_tooltip')}">
                        <i id="notification-delete-icon-${notificationId}" class="fas fa-trash-alt"></i>
                    </button>
                </div>
            `;

            const deleteBtn = element.querySelector('.delete-notification-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.deleteNotification(notification.id, element);
                });
            }

            const orderLink = element.querySelector('.notification-order-link');
            if (orderLink) {
                orderLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const orderKey = orderLink.dataset.orderKey || '';
                    if (orderKey) {
                        LocalDBStorage.setItem('current_viewing_order_key', orderKey);
                    }
                    window.location.href = orderLink.getAttribute('href');
                });
            }

            return element;
        } catch (error) {
            console.error('[Notifications UI] Error creating notification element:', error);
            const errDiv = document.createElement('div');
            errDiv.id = 'notifications-render-error-fallback';
            errDiv.textContent = window.langu('notifications_init_error');
            return errDiv;
        }
    }
};

// Hybrid bridge
Object.assign(NotificationPage, NotificationUIRender);
window.NotificationPage = NotificationPage;

console.log("[ESM Load] notifications-ui-render.js: Hybrid bridge established.");
