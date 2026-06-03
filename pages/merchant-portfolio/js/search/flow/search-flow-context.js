/**
 * @file pages/merchant-portfolio/js/search/flow/search-flow-context.js
 * @description Logic for capturing and preserving state before a search starts.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 */

(function () {
    window.portfolioCapturePreSearchContext = function (userKey, searchState, store) {
        if (window.portfolioIsSellerSearchActive && window.portfolioIsSellerSearchActive()) {
            return;
        }

        const productsTitle = document.getElementById('portfolio-products-title');
        const state = store?.getState ? store.getState() : window.portfolioState;

        const preNav = {
            activeCategoryId: window.pharmacyActiveCategoryId || null,
            activeSubCategoryId: window.pharmacyActiveSubCategoryId || null,
            productsTitleHtml: productsTitle ? productsTitle.innerHTML : null,
            showFeaturedOnly: !!state?.showFeaturedOnly,
            visibleCount: window.pharmacyUIBase?.state?.visibleCount || searchState.visibleCount || 5,
            gridScroll: Math.round(document.getElementById('portfolio-products-grid')?.scrollLeft || 0),
            rowScroll: Math.round(document.getElementById('pharmacy-subcats-row')?.scrollLeft || 0),
            scrollX: window.scrollX,
            scrollY: window.scrollY,
            scroll: window.scrollY
        };

        window.portfolioPreSearchNavState = preNav;
        if (typeof window.portfolioSavePreSearchStateToLocal === 'function') {
            window.portfolioSavePreSearchStateToLocal(userKey, preNav);
        }
        console.log(`[Search] Pre-search state captured and persisted.`, preNav);
    };
})();
