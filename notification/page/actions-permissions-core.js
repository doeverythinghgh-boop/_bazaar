/**
 * @file notification/page/actions-permissions-core.js
 * @description Notification permissions copy and native readiness helpers.
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

function invokeNativeForResult(methodName, ...args) {
    if (window.BridgeManager && typeof window.BridgeManager.invokeForResult === 'function') {
        return window.BridgeManager.invokeForResult(methodName, ...args);
    }
    return null;
}

export const ActionsPermissionsCore = {
    getNotificationIssueDialogText(report) {
        const isAr = (LocalDBStorage.getItem('app_language') || 'ar') === 'ar';
        const issues = Array.isArray(report?.issues) ? report.issues : [];

        if (issues.includes('permission')) {
            return {
                title: isAr ? 'إذن الإشعارات مطلوب' : 'Notification permission needed',
                text: isAr ? 'فعّل إذن الإشعارات من إعدادات التطبيق.' : 'Enable notification permission in app settings.',
                openText: isAr ? 'فتح' : 'Open',
                ignoreText: isAr ? 'تجاهل' : 'Ignore'
            };
        }

        if (issues.includes('app_notifications')) {
            return {
                title: isAr ? 'إشعارات التطبيق متوقفة' : 'App notifications are off',
                text: isAr ? 'شغّل إشعارات التطبيق من إعدادات النظام.' : 'Turn on app notifications in system settings.',
                openText: isAr ? 'فتح' : 'Open',
                ignoreText: isAr ? 'تجاهل' : 'Ignore'
            };
        }

        if (issues.includes('channel_missing') || issues.includes('channel_config')) {
            return {
                title: isAr ? 'قناة الإشعارات تحتاج ضبط' : 'Notification channel needs setup',
                text: isAr ? 'افتح إعدادات الإشعارات واضبط الصوت والاهتزاز.' : 'Open notification settings and enable sound and vibration.',
                openText: isAr ? 'فتح' : 'Open',
                ignoreText: isAr ? 'تجاهل' : 'Ignore'
            };
        }

        return {
            title: isAr ? 'تحقق من إعدادات الإشعارات' : 'Check notification settings',
            text: isAr ? 'هناك إعداد يمنع الإشعارات. افتح الإعدادات للمراجعة.' : 'A setting is blocking notifications. Open settings to review it.',
            openText: isAr ? 'فتح' : 'Open',
            ignoreText: isAr ? 'تجاهل' : 'Ignore'
        };
    },

    getNativeNotificationReadinessReport() {
        try {
            const raw = invokeNativeForResult('getNotificationReadinessReport');
            return raw ? JSON.parse(raw) : null;
        } catch (error) {
            console.error('[Notifications] Failed to get native readiness report:', error);
            return null;
        }
    },

    async showNativeNotificationIssueDialog(report) {
        if (!report || report.ok) {
            return false;
        }

        const copy = this.getNotificationIssueDialogText(report);
        const result = await Swal.fire({
            title: copy.title,
            text: copy.text,
            showCancelButton: true,
            confirmButtonText: copy.openText,
            cancelButtonText: copy.ignoreText,
            reverseButtons: true,
            buttonsStyling: false,
            customClass: {
                popup: 'swal-modern-mini-popup',
                title: 'swal-modern-mini-title',
                htmlContainer: 'swal-modern-mini-text',
                confirmButton: 'swal-modern-mini-confirm',
                cancelButton: 'swal-modern-mini-cancel'
            }
        });

        if (result.isConfirmed) {
            invokeNative('openNotificationSettings', report.openTarget || 'app');
        }

        return true;
    }
};

// Hybrid bridge
Object.assign(NotificationPage, ActionsPermissionsCore);
window.NotificationPage = NotificationPage;

console.log("[ESM Load] actions-permissions-core.js: Hybrid bridge established.");
