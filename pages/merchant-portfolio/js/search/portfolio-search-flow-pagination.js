/**
 * @file pages/merchant-portfolio/js/search/portfolio-search-flow-pagination.js
 * @description Pagination logic for merchant search results.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


window.portfolioLoadMoreSellerSearchResults = function () {
    const searchState = window.portfolioEnsureSellerSearchState();
    const store = window.PortfolioStore || null;
    if (!searchState.isActive) return false;

    const nextVisibleCount = Math.min(searchState.visibleCount + searchState.limit, searchState.totalMatched);
    if (nextVisibleCount <= searchState.visibleCount) {
        window.portfolioSyncSearchLoadMoreButton();
        return true;
    }

    console.log(`[Event] User Clicked: "Load More" for Search Results.`);
    console.time('[Runtime] Search Pagination Rendering');

    const nextBatch = searchState.results.slice(searchState.visibleCount, nextVisibleCount);
    if (store?.patchSellerSearch) {
        store.patchSellerSearch({ visibleCount: nextVisibleCount }, { source: 'merchant-search-load-more' });
    } else {
        searchState.visibleCount = nextVisibleCount;
    }

    console.log(`[Mirror][SearchPagination] Incremented visibleCount to ${nextVisibleCount}. Triggering centralized render.`);
    if (typeof window.portfolioRenderActiveSellerSearchResults === 'function') {
        window.portfolioRenderActiveSellerSearchResults();
    } else if (typeof window.portfolioRenderProducts === 'function') {
        // Fallback if centralized renderer is missing
        window.portfolioRenderProducts(nextBatch, true);
    }

    window.portfolioUpdateSellerSearchMeta();
    window.portfolioSyncSearchLoadMoreButton();

    console.timeEnd('[Runtime] Search Pagination Rendering');
    console.log(`[Status] New visibleCount: ${nextVisibleCount}`);

    // Update the persistent state with new visibleCount
    const user = window.PortfolioStore?.getState ? window.PortfolioStore.getState().activeUser : window.portfolioState?.activeUser;
    if (user && user.user_key) {
        window.portfolioSaveSearchStateToLocal(user.user_key);
    }

    return true;
};
