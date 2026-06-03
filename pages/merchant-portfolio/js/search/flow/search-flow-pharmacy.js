/**
 * @file pages/merchant-portfolio/js/search/flow/search-flow-pharmacy.js
 * @description Pharmacy-specific search execution logic.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 */

(function () {
    window.portfolioExecutePharmacySearchPath = async function (user, criteria, initialVisibleCount, searchState, store) {
        // 1. Try to get from persistence
        let results = null;
        const cacheKeyParams = `${criteria.query}_${criteria.mainCategory}_${criteria.subCategory}_${criteria.sort}`;
        if (window.portfolioPersistence) {
            console.time('[Runtime] Search Cache Lookup');
            results = window.portfolioPersistence.get(user.user_key, 'search', cacheKeyParams, 0);
            console.timeEnd('[Runtime] Search Cache Lookup');
        }

        if (!results) {
            console.log(`[Status] Search cache miss. Fetching from API...`);
            if (typeof window.portfolioSearchPharmacyUnified === 'function') {
                results = await window.portfolioSearchPharmacyUnified(user.user_key, criteria);
                if (window.portfolioPersistence && results && results.length > 0) {
                    window.portfolioPersistence.save(user.user_key, 'search', cacheKeyParams, 0, results);
                }
            }
        } else {
            console.log(`[Status] Search results restored from cache.`);
        }

        // Hide main category cards and subcategories row
        const grid = document.getElementById('portfolio-products-grid');
        if (grid) {
            const categoryCards = grid.querySelectorAll('.pharmacy-category-card');
            categoryCards.forEach(card => card.style.display = 'none');
            grid.style.display = 'flex'; // Ensure grid is visible for results
        }
        const subRow = document.getElementById('pharmacy-subcats-row');
        if (subRow) subRow.style.display = 'none';

        // Update State
        const nextVisibleCount = Math.min(initialVisibleCount, Array.isArray(results) ? results.length : 0);
        if (store?.patchSellerSearch) {
            store.patchSellerSearch({
                results: Array.isArray(results) ? results : [],
                totalMatched: Array.isArray(results) ? results.length : 0,
                visibleCount: nextVisibleCount
            }, { source: 'pharmacy-search-execute-results' });
        } else {
            searchState.results = Array.isArray(results) ? results : [];
            searchState.totalMatched = Array.isArray(results) ? results.length : 0;
            searchState.visibleCount = nextVisibleCount;
        }

        if (typeof window.portfolioRenderPharmacySearchResults === 'function') {
            window.portfolioRenderPharmacySearchResults(results);
        }

        // SAVE STATE for later restoration
        if (typeof window.portfolioSaveSearchStateToLocal === 'function') {
            window.portfolioSaveSearchStateToLocal(user.user_key);
        }
    };
})();
