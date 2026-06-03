/**
 * @file pages/merchant-portfolio/js/search/ui/portfolio-search-ui-events.js
 * @description Global UI event handlers for merchant search.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

window.portfolioHandleGlobalLoadMoreClick = async function (event) {
    const searchState = window.portfolioEnsureSellerSearchState();
    const userKey = new URLSearchParams(window.location.search).get('user_key');
    const store = window.PortfolioStore || null;
    const PAGE_SIZE = 5;

    console.log(`[LoadMore] Global click detected. Context:`, {
        searchActive: searchState.isActive,
        pharmacySub: window.pharmacyActiveSubCategoryId
    });

    if (searchState.isActive) {
        console.log(`[LoadMore] Handling Search Pagination...`);
        const nextVisible = (searchState.visibleCount || 0) + PAGE_SIZE;
        const total = searchState.totalMatched || 0;
        const finalVisible = Math.min(nextVisible, total);

        if (store?.patchSellerSearch) {
            store.patchSellerSearch({ visibleCount: finalVisible }, { source: 'global-load-more-search' });
        } else {
            searchState.visibleCount = finalVisible;
        }

        // Re-render search results
        if (typeof window.portfolioRenderPharmacySearchResults === 'function' && window.portfolioIsPharmacyUser?.(window.portfolioPageController?.getActiveUser?.())) {
            const cacheKeyParams = `${searchState.appliedQuery}_${searchState.appliedMainCategory}_${searchState.appliedSubCategory}_${searchState.appliedSort}`;
            const results = window.portfolioPersistence?.get(userKey, 'search', cacheKeyParams, 0);
            if (results) window.portfolioRenderPharmacySearchResults(results);
        } else {
            if (typeof window.portfolioRenderActiveSellerSearchResults === 'function') {
                window.portfolioRenderActiveSellerSearchResults();
            }
        }

        if (typeof window.portfolioSaveSearchStateToLocal === 'function') {
            window.portfolioSaveSearchStateToLocal(userKey);
        }
        if (typeof window.portfolioSaveNavigationState === 'function') {
            window.portfolioSaveNavigationState(userKey);
        }
        return;
    }

    if (window.pharmacyActiveSubCategoryId) {
        console.log(`[LoadMore] Handling Pharmacy Sub-Category Pagination...`);
        const subPagination = typeof window.portfolioGetActivePharmacySubPagination === 'function'
            ? window.portfolioGetActivePharmacySubPagination(userKey)
            : null;
        if (subPagination) {
            const { cacheKey, subData, ingredients, visibleCount } = subPagination;
            const nextCount = Math.min(ingredients.length, visibleCount + PAGE_SIZE);
            subData.visibleCount = nextCount;
            subData.scrollY = typeof window.portfolioGetSearchScrollY === 'function'
                ? Math.round(window.portfolioGetSearchScrollY())
                : Math.round(window.scrollY || document.documentElement.scrollTop || 0);
            window.portfolioPersistence.save(userKey, 'pharmacy_sub_state', cacheKey, 0, subData);
            if (window.pharmacyUIBase?.state) window.pharmacyUIBase.state.visibleCount = nextCount;

            const container = document.getElementById('pharmacy-filtered-products-container');
            if (container && typeof window.pharmacyUISubRenderer?.renderSubCategoryContent === 'function') {
                window.pharmacyUISubRenderer.renderSubCategoryContent(container, ingredients, nextCount, 0, { id: window.pharmacyActiveSubCategoryId }, cacheKey, userKey);
            }

            if (typeof window.portfolioSaveNavigationState === 'function') {
                window.portfolioSaveNavigationState(userKey);
            }
        }
        return;
    }

    // Default: Standard Catalog Pagination
    console.log(`[LoadMore] Handling Standard Catalog Pagination...`);
    if (typeof window.portfolioFetchProducts === 'function') {
        const state = window.PortfolioStore?.getState ? window.PortfolioStore.getState() : window.portfolioState;
        const currentCount = state?.allProducts?.length || 0;
        window.portfolioFetchProducts(userKey, currentCount, PAGE_SIZE, true);
    }
};
