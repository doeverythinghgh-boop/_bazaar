/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */
window.SWAL_UTILITY = {
    /**
     * Shows a localized alert.
     * @param {object} options - { titleKey, textKey, text, icon, fallbackTitle, fallbackText }
     */
    alert: async function (options = {}) {
        const hasSwal = typeof window.Swal !== 'undefined' && typeof window.Swal.fire === 'function';
        const hasLangu = typeof window.langu === 'function';

        const title = options.titleKey && hasLangu ? window.langu(options.titleKey) : (options.fallbackTitle || "");
        const text = options.text || (options.textKey && hasLangu ? window.langu(options.textKey) : (options.fallbackText || ""));
        const okText = hasLangu ? window.langu('gen_ok') : 'حسنًا';

        if (!hasSwal) {
            console.warn("[SWAL_UTILITY] Swal missing, falling back to native alert.");
            alert(text || "Alert");
            return;
        }

        return window.Swal.fire({
            title: title || undefined,
            text: text,
            icon: options.icon || 'info',
            confirmButtonText: okText,
            buttonsStyling: false,
            customClass: {
                popup: 'swal-modern-mini-popup',
                title: 'swal-modern-mini-title',
                htmlContainer: 'swal-modern-mini-text',
                confirmButton: 'swal-modern-mini-confirm'
            }
        });
    },

    /**
     * Shows a localized confirmation dialog.
     * @param {object} options - { titleKey, textKey, icon, confirmButtonTextKey, cancelButtonTextKey }
     */
    confirm: async function (options = {}) {
        const hasSwal = typeof window.Swal !== 'undefined' && typeof window.Swal.fire === 'function';
        const hasLangu = typeof window.langu === 'function';

        const title = options.titleKey && hasLangu ? window.langu(options.titleKey) : (options.fallbackTitle || "");
        const text = options.text || (options.textKey && hasLangu ? window.langu(options.textKey) : (options.fallbackText || ""));
        const confirmText = options.confirmButtonTextKey && hasLangu ? window.langu(options.confirmButtonTextKey) : 'تأكيد';
        const cancelText = options.cancelButtonTextKey && hasLangu ? window.langu(options.cancelButtonTextKey) : 'إلغاء';

        if (!hasSwal) {
            console.warn("[SWAL_UTILITY] Swal missing, falling back to native confirm.");
            return confirm(text || "Are you sure?");
        }

        const result = await window.Swal.fire({
            title: title || undefined,
            text: text,
            icon: options.icon || 'question',
            showCancelButton: true,
            confirmButtonText: confirmText,
            cancelButtonText: cancelText,
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

        return !!result.isConfirmed;
    }
};
