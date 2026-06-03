/**
 * @file notifications-ui-states.js
 * @description Notification page loading, error, and empty-state helpers.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

const NotificationPage = window.NotificationPage || {};

export const NotificationUIStates = {
    showLoading() {
        this.hideAllStates();
        if (this.elements.loadingState) {
            this.elements.loadingState.style.display = 'block';
        }
        if (this.elements.list) {
            this.elements.list.style.display = 'none';
        }
    },

    showError(message) {
        this.hideAllStates();
        if (this.elements.errorState) {
            this.elements.errorState.style.display = 'block';
            if (message && this.elements.errorState.querySelector('.error-message')) {
                this.elements.errorState.querySelector('.error-message').textContent = message;
            }
        }
        if (this.elements.list) {
            this.elements.list.style.display = 'none';
        }
    },

    showEmptyState() {
        this.hideAllStates();
        if (this.elements.emptyState) {
            this.elements.emptyState.style.display = 'block';
        }
        if (this.elements.list) {
            this.elements.list.style.display = 'none';
        }
    },

    hideAllStates() {
        if (this.elements.loadingState) this.elements.loadingState.style.display = 'none';
        if (this.elements.errorState) this.elements.errorState.style.display = 'none';
        if (this.elements.emptyState) this.elements.emptyState.style.display = 'none';
        if (this.elements.list) this.elements.list.style.display = 'flex';
    }
};

// Hybrid bridge
Object.assign(NotificationPage, NotificationUIStates);
window.NotificationPage = NotificationPage;

console.log("[ESM Load] notifications-ui-states.js: Hybrid bridge established.");
