/**
 * @file pages/merchant-portfolio/js/search/portfolio-search-flow-restore.js
 * @description Restoration logic for merchant search from persistent storage.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


window.portfolioRestoreSearchFromLocal = async function (userKey) {
    if (!userKey) return;
    const saved = window.portfolioLoadSearchStateFromLocal(userKey);
    if (!saved) return;

    console.log(`[Diagnostic] Restoring Search State from Local: "${saved.appliedQuery}"`);
    const searchState = window.portfolioEnsureSellerSearchState();
    const store = window.PortfolioStore || null;

    // 1. Populate search state in memory
    const nextState = {
        query: saved.query,
        appliedQuery: saved.appliedQuery,
        mainCategory: saved.mainCategory,
        appliedMainCategory: saved.appliedMainCategory || saved.mainCategory || '',
        subCategory: saved.subCategory,
        appliedSubCategory: saved.appliedSubCategory || saved.subCategory || '',
        sort: saved.sort,
        appliedSort: saved.appliedSort || saved.sort || 'default',
        isActive: !!saved.isActive,
        visibleCount: saved.visibleCount,
        totalMatched: saved.totalMatched
    };

    if (store?.patchSellerSearch) {
        store.patchSellerSearch(nextState, { source: 'restore-from-local' });
    } else {
        Object.assign(searchState, nextState);
    }

    // 1.5 Update Displays (Input text, buttons) - Always do this
    if (typeof window.portfolioUpdateSellerSearchTriggerDisplays === 'function') {
        const user = store?.getState ? store.getState().activeUser : window.portfolioState?.activeUser;
        window.portfolioUpdateSellerSearchTriggerDisplays(user);
    }
    window.portfolioUpdateSellerSearchButtonState();

    if (!saved.isActive) {
        console.log(`[Diagnostic] Search state restored (Inactive). Texts preserved.`);
        return;
    }

    // 2. Fetch results from cache (using the same logic as Execute)
    const criteria = {
        query: saved.appliedQuery,
        mainCategory: saved.appliedMainCategory || saved.mainCategory || '',
        subCategory: saved.appliedSubCategory || saved.subCategory || '',
        sort: saved.appliedSort || saved.sort || 'default'
    };

    const cacheKeyParams = `${criteria.query}_${criteria.mainCategory}_${criteria.subCategory}_${criteria.sort}`;
    const results = window.portfolioPersistence?.get(userKey, 'search', cacheKeyParams, 0);

    if (results) {
        console.log(`[Diagnostic] Search results found in cache. Rendering...`);
        // If it was a pharmacy unified search
        if (typeof window.portfolioRenderPharmacySearchResults === 'function') {
            window.portfolioRenderPharmacySearchResults(results);
        } else {
            // Generic fallback
            if (store?.patchSellerSearch) {
                store.patchSellerSearch({ results: results, totalMatched: results.length }, { source: 'restore-from-local-results' });
            } else {
                searchState.results = results;
                searchState.totalMatched = results.length;
            }
            window.portfolioRenderActiveSellerSearchResults();
        }

        window.portfolioUpdateSellerSearchButtonState();

        // 4. Restore Scroll Position
        if (saved.scrollY > 0) {
            console.log(`[Diagnostic] Restoring search scroll position: ${saved.scrollY}px`);
            setTimeout(() => {
                window.scrollTo({ top: saved.scrollY, behavior: 'instant' });
                if (document.documentElement) document.documentElement.scrollTop = saved.scrollY;
                if (document.body) document.body.scrollTop = saved.scrollY;
                const portBody = document.getElementById('port-body');
                if (portBody) portBody.scrollTop = saved.scrollY;
                const mainContainer = document.getElementById('portfolio-main-container');
                if (mainContainer) mainContainer.scrollTop = saved.scrollY;
            }, 150);
        }
    } else {
        console.log(`[Diagnostic] Search meta found but results expired. Search will not be restored.`);
        window.portfolioClearSearchStateFromLocal(userKey);
    }
};
