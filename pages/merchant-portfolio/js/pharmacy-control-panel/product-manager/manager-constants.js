/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */
(function() {
    if (!window.PharmacyProductManagerModule) return;
    window.PharmacyProductManagerModule.constants = {
        BADGE_TEXT: 'مخصص',
        BADGE_STYLE: 'font-size: 0.7rem; background: var(--primary); color: white; padding: 1px 6px; border-radius: 4px; margin-inline-start: 6px; font-weight: normal; vertical-align: middle;',
        ITEM_BG_CUSTOM: 'rgba(37,99,235,0.05)',
        ITEM_BG_DEFAULT: 'rgba(0,0,0,0.02)',
        ITEM_BORDER_CUSTOM: '1px solid rgba(37,99,235,0.1)'
    };
    console.log("[Pharmacy-Manager] Constants loaded.");
})();
