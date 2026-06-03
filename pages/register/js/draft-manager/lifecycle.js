/**
 * @file pages/register/js/draft-manager/lifecycle.js
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

    let lifecycleSaveBound = false;

    window.DraftManagerInternals.showRecoverBanner = function() {
        const banner = document.getElementById('reg-recover-banner');
        if (banner) {
            banner.classList.add('visible');
            setTimeout(() => banner.classList.remove('visible'), 4000);
        }
    };

    window.DraftManagerInternals.bindLifecycleSaveOnce = function() {
        if (lifecycleSaveBound) return;
        const saveImmediately = () => window.DraftManagerInternals.persistDraftNow();
        window.addEventListener("pagehide", saveImmediately);
        window.addEventListener("beforeunload", saveImmediately);
        window.addEventListener("pageshow", (event) => {
            const navEntry = window.performance?.getEntriesByType?.("navigation")?.[0];
            const isBackForward = event.persisted || navEntry?.type === "back_forward";
            if (!isBackForward) return;
            setTimeout(() => window.DraftManagerInternals.restoreSavedDraft({ skipBanner: true }), 120);
        });
        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "hidden") window.DraftManagerInternals.persistDraftNow();
        });
        lifecycleSaveBound = true;
    };

    window.DraftManagerInternals.init = function(options = {}) {
        window.DraftManagerInternals.bindLifecycleSaveOnce();
        return window.DraftManagerInternals.restoreSavedDraft(options);
    };
})();
