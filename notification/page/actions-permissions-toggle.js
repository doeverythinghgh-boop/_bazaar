/**
 * @file notification/page/actions-permissions-toggle.js
 * @description Notification permission toggle initialization and enable/disable flows.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

const NotificationPage = window.NotificationPage || {};

function invokeNative(methodName, ...args) {
    if (window.BridgeManager && typeof window.BridgeManager.invoke === 'function') {
        return window.BridgeManager.invoke(methodName, ...args);
    }
    return false;
}

export const ActionsPermissionsToggle = {
    async initMasterToggle() {
        console.log('[Notifications] Initializing master toggle...');
        try {
            if (!this.elements.masterToggle) return;

            const state = typeof window.getCurrentUserNotificationState === 'function'
                ? await window.getCurrentUserNotificationState()
                : { isEnabled: LocalDBStorage.getItem('notifications_enabled') === 'true' };

            const isEnabled = !!state.isEnabled;
            this.elements.masterToggle.checked = isEnabled;
            if (typeof this.updateToggleUI === 'function') this.updateToggleUI(isEnabled);
        } catch (error) {
            console.error('[Notifications] Error initializing master toggle:', error);
        }
    },

    async toggleNotificationsStatus(isEnabled, options = {}) {
        console.log(`[Notifications] Requesting status change to: ${isEnabled ? 'Enable' : 'Disable'}`);
        try {
            if (isEnabled) {
                await this.enableNotifications();
            } else {
                await this.disableNotifications(options);
            }
        } catch (error) {
            console.error('[Notifications] Error toggling notification status:', error);
            if (this.elements.masterToggle) {
                this.elements.masterToggle.checked = !isEnabled;
            }
        }
    },

    async enableNotifications() {
        console.log('[Notifications] Starting enable flow...');
        try {
            if ('Notification' in window) {
                const currentPermission = Notification.permission;
                if (currentPermission === 'denied') {
                    if (invokeNative('requestNotificationPermission')) {
                        Swal.fire({
                            title: window.langu('notifications_sys_permission_required'),
                            text: window.langu('notifications_sys_permission_text'),
                            confirmButtonText: window.langu('alert_confirm_btn'),
                            buttonsStyling: false,
                            customClass: {
                                popup: 'swal-modern-mini-popup',
                                title: 'swal-modern-mini-title',
                                htmlContainer: 'swal-modern-mini-text',
                                confirmButton: 'swal-modern-mini-confirm'
                            }
                        });
                        if (this.elements.masterToggle) this.elements.masterToggle.checked = false;
                        return;
                    }

                    Swal.fire({
                        title: window.langu('notifications_blocked_title'),
                        html: window.langu('notifications_blocked_text'),
                        confirmButtonText: window.langu('alert_confirm_btn'),
                        buttonsStyling: false,
                        customClass: {
                            popup: 'swal-modern-mini-popup',
                            title: 'swal-modern-mini-title',
                            htmlContainer: 'swal-modern-mini-text',
                            confirmButton: 'swal-modern-mini-confirm'
                        }
                    });
                    if (this.elements.masterToggle) this.elements.masterToggle.checked = false;
                    return;
                }
            }

            if (typeof window.askForNotificationPermission === 'function') {
                await window.askForNotificationPermission();
            }

            if (window.BridgeManager?.isAndroid?.()) {
                try {
                    console.log('[Notifications] Running native notification readiness check before setupFCM...');
                    invokeNative('onNotificationsEnabled');
                } catch (error) {
                    console.error('[Notifications] Error calling onNotificationsEnabled before setupFCM:', error);
                }
            }

            if ('Notification' in window) {
                const permission = await Notification.requestPermission();
                if (permission === 'denied') {
                    throw new Error('Notification permission denied by user.');
                }
            }

            Swal.fire({
                title: window.langu('notifications_enabling'),
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading(),
                buttonsStyling: false,
                customClass: {
                    popup: 'swal-modern-mini-popup',
                    title: 'swal-modern-mini-title'
                }
            });

            if (typeof window.setupFCM !== 'function') {
                throw new Error('Notification system configuration is missing (setupFCM not found).');
            }

            await window.setupFCM();

            if (window.BridgeManager?.isAndroid?.()) {
                try {
                    invokeNative('onNotificationsEnabled');
                } catch (error) {
                    console.error('[Notifications] Error calling onNotificationsEnabled:', error);
                }
            }

            LocalDBStorage.removeItem('notifications_user_disabled');
            LocalDBStorage.setItem('notifications_enabled', 'true');

            if (typeof window.syncCurrentUserNotificationState === 'function') {
                await window.syncCurrentUserNotificationState();
            }

            if (typeof this.updateToggleUI === 'function') this.updateToggleUI(true);

            const nativeReport = typeof this.getNativeNotificationReadinessReport === 'function' ? this.getNativeNotificationReadinessReport() : null;
            const issueDialogShown = typeof this.showNativeNotificationIssueDialog === 'function' ? await this.showNativeNotificationIssueDialog(nativeReport) : false;

            if (!issueDialogShown) {
                Swal.fire({
                    title: window.langu('notifications_enabled_success'),
                    text: window.langu('notifications_enabled_desc'),
                    timer: 2000,
                    showConfirmButton: false,
                    buttonsStyling: false,
                    customClass: {
                        popup: 'swal-modern-mini-popup',
                        title: 'swal-modern-mini-title',
                        htmlContainer: 'swal-modern-mini-text'
                    }
                });
            }
        } catch (error) {
            console.error('[Notifications] Enable failed:', error);
            Swal.fire({
                title: window.langu('failed_operation_title'),
                text: error.message || window.langu('unexpected_error'),
                confirmButtonText: window.langu('alert_confirm_btn'),
                buttonsStyling: false,
                customClass: {
                    popup: 'swal-modern-mini-popup',
                    title: 'swal-modern-mini-title',
                    htmlContainer: 'swal-modern-mini-text',
                    confirmButton: 'swal-modern-mini-confirm'
                }
            });
            if (this.elements.masterToggle) this.elements.masterToggle.checked = false;
        }
    },

    async disableNotifications(options = {}) {
        console.log('[Notifications] Starting disable flow...');
        try {
            if (!options.skipConfirm) {
                const result = await Swal.fire({
                    title: window.langu('notifications_disable_confirm_title'),
                    text: window.langu('notifications_disable_confirm_text'),
                    showCancelButton: true,
                    buttonsStyling: false,
                    customClass: {
                        popup: 'swal-modern-mini-popup',
                        title: 'swal-modern-mini-title',
                        htmlContainer: 'swal-modern-mini-text',
                        confirmButton: 'swal-modern-mini-confirm',
                        cancelButton: 'swal-modern-mini-cancel'
                    },
                    confirmButtonText: window.langu('logout_confirm_btn'),
                    cancelButtonText: window.langu('alert_cancel_btn')
                });

                if (!result.isConfirmed) {
                    if (this.elements.masterToggle) this.elements.masterToggle.checked = true;
                    return;
                }
            }

            const userKey = window.userSession?.user_key;
            if (userKey && typeof window.deleteTokenFromServer === 'function') {
                await window.deleteTokenFromServer(userKey);
            }

            if (window.BridgeManager?.isAndroid?.()) {
                try {
                    invokeNative('onNotificationsDisabled');
                } catch (error) {
                    console.error('[Notifications] Error calling onNotificationsDisabled:', error);
                }
            }

            LocalDBStorage.removeItem('fcm_token');
            LocalDBStorage.removeItem('android_fcm_key');
            LocalDBStorage.setItem('notifications_user_disabled', 'true');
            LocalDBStorage.setItem('notifications_enabled', 'false');

            if (typeof window.syncCurrentUserNotificationState === 'function') {
                await window.syncCurrentUserNotificationState();
            }

            if (typeof this.updateToggleUI === 'function') this.updateToggleUI(false);
            Swal.fire({
                title: window.langu('notifications_disabled_success'),
                text: window.langu('notifications_disabled_desc'),
                timer: 2000,
                showConfirmButton: false,
                buttonsStyling: false,
                customClass: {
                    popup: 'swal-modern-mini-popup',
                    title: 'swal-modern-mini-title',
                    htmlContainer: 'swal-modern-mini-text'
                }
            });
        } catch (error) {
            console.error('[Notifications] Error disabling notifications:', error);
        }
    }
};

// Hybrid bridge
Object.assign(NotificationPage, ActionsPermissionsToggle);
window.NotificationPage = NotificationPage;

console.log("[ESM Load] actions-permissions-toggle.js: Hybrid bridge established.");
