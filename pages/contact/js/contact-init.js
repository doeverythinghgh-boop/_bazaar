/**
 * @file pages/contact/js/contact-init.js
 * @description Main entry point for contact page initialization.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


document.addEventListener('DOMContentLoaded', async function () {
    console.log("[Contact] Initializing page components...");

    // 1. Theme
    if (typeof initAppTheme === 'function') window.initAppTheme();

    // 2. Translations (CRITICAL: Load before header)
    if (typeof loadIndexTranslations === 'function') {
        await window.loadIndexTranslations();
    }

    // 3. Session
    if (typeof SessionManager !== 'undefined') SessionManager.init();

    // 4. Header (Depends on translations)
    if (typeof AppHeader !== 'undefined' && AppHeader.init) {
        // Pass empty for activeBtnId since Contact is not in main header
        await AppHeader.init('header-injection-point', '');
    }

    // 5. Apply translations to existing elements
    if (typeof applyAppTranslations === 'function') applyAppTranslations();
    if (typeof window.langu === 'function') {
        document.title = window.langu('contact_page_title') || 'Suez Bazaar - Contact Us';
    }

    // 6. Initialize logic-heavy sections
    if (typeof contact_initFaq === 'function') contact_initFaq();
    if (typeof contact_initTabs === 'function') contact_initTabs();
    if (typeof contact_initForm === 'function') contact_initForm();
    if (typeof contact_initAnimations === 'function') contact_initAnimations();

    console.log("[Contact] Initialization complete.");
});
