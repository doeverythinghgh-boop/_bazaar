/**
 * @file pages/merchant-portfolio/js/search/flow/search-flow-main.js
 * @description Main entry point for merchant search execution flow.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 */

(function () {
    window.portfolioExecuteSellerSearch = async function (user) {
        if (!user?.user_key) return;

        const searchState = window.portfolioEnsureSellerSearchState();
        const store = window.PortfolioStore || null;
        const activeSpecialty = window.portfolioActiveSpecialty?.getActive ? window.portfolioActiveSpecialty.getActive() : null;
        const isPharmacy = activeSpecialty ? !!activeSpecialty.isPharmacy : (window.portfolioIsPharmacyUser ? window.portfolioIsPharmacyUser(user) : false);

        const criteria = {
            query: String(searchState.query || '').trim(),
            mainCategory: String(activeSpecialty?.mainId || searchState.mainCategory || '').trim(),
            subCategory: String(activeSpecialty?.subId || searchState.subCategory || '').trim(),
            sort: searchState.sort || 'default'
        };

        if (typeof window.portfolioHasSellerSearchCriteria === 'function' && !window.portfolioHasSellerSearchCriteria(criteria)) {
            if (typeof window.portfolioResetSellerSearch === 'function') window.portfolioResetSellerSearch();
            return;
        }

        try {
            console.log(`[Event] Executing Search: "${criteria.query}" (Sort: ${criteria.sort})`);
            console.time('[Runtime] Search Execution');

            const userKey = new URLSearchParams(window.location.search).get('user_key');

            // 1. Capture Context
            if (typeof window.portfolioCapturePreSearchContext === 'function') {
                window.portfolioCapturePreSearchContext(userKey, searchState, store);
            }

            // 2. Set State to Active
            if (store?.patchSellerSearch) {
                store.patchSellerSearch({
                    isActive: true,
                    appliedQuery: criteria.query,
                    appliedMainCategory: criteria.mainCategory,
                    appliedSubCategory: criteria.subCategory,
                    appliedSort: criteria.sort
                }, { source: 'merchant-search-execute-start' });
            } else {
                searchState.isActive = true;
                searchState.appliedQuery = criteria.query;
                searchState.appliedMainCategory = criteria.mainCategory;
                searchState.appliedSubCategory = criteria.subCategory;
                searchState.appliedSort = criteria.sort;
            }

            if (typeof window.portfolioSetSellerSearchLoading === 'function') {
                window.portfolioSetSellerSearchLoading(true);
            }

            const PAGE_SIZE = 5;
            const restoringVisibleCount = window.pharmacyRestoringState?.isSearchResult
                ? Number(window.pharmacyRestoringState.visibleCount)
                : 0;
            const initialVisibleCount = Number.isFinite(restoringVisibleCount) && restoringVisibleCount > 0
                ? restoringVisibleCount
                : PAGE_SIZE;

            searchState.limit = PAGE_SIZE;

            // 3. UI Preparation
            if (typeof window.portfolioCloseSellerSearchPanelSafely === 'function') {
                window.portfolioCloseSellerSearchPanelSafely();
            }

            const productsSection = document.getElementById('portfolio-products-section');
            const actionsContainer = document.getElementById('portfolio-products-actions');
            if (productsSection) productsSection.style.display = 'block';
            if (actionsContainer) actionsContainer.style.display = 'flex';

            // 4. Branch Logic (Pharmacy vs Generic)
            if (isPharmacy && typeof window.portfolioExecutePharmacySearchPath === 'function') {
                await window.portfolioExecutePharmacySearchPath(user, criteria, initialVisibleCount, searchState, store);
            } else if (typeof window.portfolioExecuteGenericSearchPath === 'function') {
                await window.portfolioExecuteGenericSearchPath(user, criteria, initialVisibleCount, searchState, store);
            }

            console.timeEnd('[Runtime] Search Execution');
        } catch (error) {
            console.error('[Portfolio] Merchant search failed:', error);
            if (typeof Swal !== 'undefined') {
                const L = (key, fallback) => (typeof window.portfolioSellerSearchL === 'function') ? window.portfolioSellerSearchL(key) : fallback;
                Swal.fire({
                    title: L('port_fetch_error_title', 'Error'),
                    text: L('port_search_execute_error', 'Unable to perform search right now. Please try again.'),
                    icon: 'error',
                    buttonsStyling: false,
                    customClass: {
                        popup: 'swal-modern-mini-popup',
                        title: 'swal-modern-mini-title',
                        confirmButton: 'swal-modern-mini-confirm'
                    }
                });
            }
        } finally {
            if (typeof window.portfolioSetSellerSearchLoading === 'function') {
                window.portfolioSetSellerSearchLoading(false);
            }
        }
    };
})();
