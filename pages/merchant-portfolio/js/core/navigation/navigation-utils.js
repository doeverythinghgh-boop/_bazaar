/**
 * @file pages/merchant-portfolio/js/core/navigation/navigation-utils.js
 * @description Helper utilities for portfolio navigation and scroll tracking.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 */

(function () {
    const STORAGE_KEY_PREFIX = 'pp_nav_state_';

    window.portfolioGetStorageKey = function (userKey) {
        return STORAGE_KEY_PREFIX + userKey;
    };

    window.portfolioGetPortfolioScrollY = function () {
        const values = [
            window.scrollY,
            window.pageYOffset,
            document.documentElement?.scrollTop,
            document.body?.scrollTop,
            document.getElementById('port-body')?.scrollTop,
            document.getElementById('portfolio-main-container')?.scrollTop
        ].map((value) => Number(value) || 0);

        return Math.max(...values);
    };

    window.portfolioReadLocalNavigationState = function (userKey) {
        const saved = LocalDBStorage.getItem(window.portfolioGetStorageKey(userKey));
        return saved ? JSON.parse(saved) : null;
    };

    window.portfolioImproveRestoredScroll = function (userKey, state, fallbackState) {
        if (!state || typeof state !== 'object') return state;

        const currentScroll = Number(state.scroll || state.scrollY || 0);
        const fallbackScroll = Number(fallbackState?.scroll || fallbackState?.scrollY || 0);
        if (currentScroll <= 0 && fallbackScroll > 0) {
            state.scroll = fallbackScroll;
            state.scrollY = fallbackScroll;
        }

        const activeSubId = state.activeSubCategoryId || fallbackState?.activeSubCategoryId || null;
        if ((Number(state.scroll || state.scrollY || 0) <= 0) && activeSubId && window.portfolioPersistence) {
            const subData = window.portfolioPersistence.get(userKey, 'pharmacy_sub_state', `subcat_${activeSubId}`, 0);
            const subScroll = Number(subData?.scrollY || 0);
            if (subScroll > 0) {
                state.scroll = subScroll;
                state.scrollY = subScroll;
            }
        }

        return state;
    };
})();
