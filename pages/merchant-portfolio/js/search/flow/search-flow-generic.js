/**
 * @file pages/merchant-portfolio/js/search/flow/search-flow-generic.js
 * @description Generic merchant search execution logic.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 */

(function () {
    window.portfolioExecuteGenericSearchPath = async function (user, criteria, initialVisibleCount, searchState, store) {
        let filteredProducts = null;
        const cacheKeyParams = `${criteria.query}_${criteria.mainCategory}_${criteria.subCategory}_${criteria.sort}`;

        if (window.portfolioPersistence) {
            filteredProducts = window.portfolioPersistence.get(user.user_key, 'generic_search', cacheKeyParams, 0);
        }

        if (!filteredProducts) {
            console.log(`[Status] Generic search cache miss.`);
            const fetchedProducts = (typeof window.portfolioFetchSellerSearchSource === 'function')
                ? await window.portfolioFetchSellerSearchSource(user.user_key)
                : [];

            filteredProducts = (typeof window.portfolioFilterSellerProducts === 'function')
                ? window.portfolioFilterSellerProducts(fetchedProducts, criteria)
                : [];

            if (window.portfolioPersistence && filteredProducts && filteredProducts.length > 0) {
                window.portfolioPersistence.save(user.user_key, 'generic_search', cacheKeyParams, 0, filteredProducts);
            }
        }

        const nextVisibleCount = Math.min(initialVisibleCount, filteredProducts.length);
        if (store?.patchSellerSearch) {
            store.patchSellerSearch({
                results: filteredProducts,
                totalMatched: filteredProducts.length,
                visibleCount: nextVisibleCount
            }, { source: 'merchant-search-execute-results' });
        } else {
            searchState.results = filteredProducts;
            searchState.totalMatched = filteredProducts.length;
            searchState.visibleCount = nextVisibleCount;
        }

        if (typeof window.portfolioRenderActiveSellerSearchResults === 'function') {
            window.portfolioRenderActiveSellerSearchResults();
        }

        if (typeof window.portfolioUpdateSellerSearchButtonState === 'function') {
            window.portfolioUpdateSellerSearchButtonState();
        }

        // SAVE STATE for later restoration
        if (typeof window.portfolioSaveSearchStateToLocal === 'function') {
            window.portfolioSaveSearchStateToLocal(user.user_key);
        }
    };
})();
