/**
 * @file pages/register/js/draft-manager/config.js
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

(function() {
    'use strict';
    window.DraftManagerInternals = window.DraftManagerInternals || {};

    window.DraftManagerInternals.REG_DRAFT_KEY = 'register_form_draft';
    window.DraftManagerInternals.PROFILE_DRAFT_KEY = 'profile_wizard_draft';

    window.DraftManagerInternals.getDraftKey = function() {
        const mode = window.regWizard?.mode || 'REGISTER';
        return mode === 'PROFILE' ? window.DraftManagerInternals.PROFILE_DRAFT_KEY : window.DraftManagerInternals.REG_DRAFT_KEY;
    };

    window.DraftManagerInternals.debounce = function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };

    window.DraftManagerInternals.looksLikePhoneAutofill = function(value) {
        const raw = String(value || "").trim();
        const digits = raw.replace(/\D/g, "");
        if (!digits) return false;

        const hasLetters = /[a-zA-Z\u0600-\u06FF]/.test(raw);
        return !hasLetters && digits.length >= 10 && digits.length <= 15;
    };
})();
