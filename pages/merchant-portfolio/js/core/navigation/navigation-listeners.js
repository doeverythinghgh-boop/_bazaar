/**
 * @file pages/merchant-portfolio/js/core/navigation/navigation-listeners.js
 * @description Event listeners for automatic navigation state saving.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 */

(function () {
    // Auto-save on scroll (Debounced)
    let navScrollTimeout;
    const autoSave = (reason = 'auto') => {
        const userKey = new URLSearchParams(window.location.search).get('user_key');
        if (userKey) {
            window.portfolioLastNavSaveReason = reason;
            if (typeof window.portfolioSaveNavigationState === 'function') {
                window.portfolioSaveNavigationState(userKey);
            }
        }
    };

    window.addEventListener('scroll', () => {
        if (!window.portfolioNavigationRestorationComplete) {
            // Log ignored scroll events during restoration to help debugging
            const currentScroll = Math.round(window.portfolioGetPortfolioScrollY ? window.portfolioGetPortfolioScrollY() : 0);
            if (currentScroll > 0) {
                console.log(`[Diagnostic] NavigationState: Ignoring scroll event (${currentScroll}px) because restoration is not marked complete.`);
            }
            return;
        }
        clearTimeout(navScrollTimeout);
        navScrollTimeout = setTimeout(() => autoSave('scroll_debounce'), 300);
    }, { passive: true });

    document.addEventListener('scroll', () => {
        if (!window.portfolioNavigationRestorationComplete) return;
        clearTimeout(navScrollTimeout);
        navScrollTimeout = setTimeout(() => autoSave('document_scroll_debounce'), 300);
    }, { passive: true, capture: true });

    // CRITICAL: Save on departure (Any reason)
    window.addEventListener('pagehide', () => {
        console.log('[Mirror][Event] Page Hide detected. Force-saving navigation state.');
        autoSave('page_hide');
    });

    window.addEventListener('beforeunload', () => {
        console.log('[Mirror][Event] Page Unload/Refresh detected. Force-saving navigation state.');
        autoSave('before_unload');
    });

    window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            console.log('[Mirror][Event] Visibility Hidden. Saving state.');
            autoSave('visibility_change');
        }
    });
})();
