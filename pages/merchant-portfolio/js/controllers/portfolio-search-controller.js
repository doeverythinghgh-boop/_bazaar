/**
 * @file pages/merchant-portfolio/js/controllers/portfolio-search-controller.js
 * @description Search-specific controller bindings for reactive UI updates.
 */

(function () {
    let isBound = false;

    function getStore() {
        return window.PortfolioStore || null;
    }

    function bindStore() {
        if (isBound || !getStore()) return;
        isBound = true;

        getStore().subscribe(function (state, payload) {
            if (payload.keys.includes('sellerSearch')) {
                if (typeof window.portfolioUpdateSellerSearchMeta === 'function') {
                    window.portfolioUpdateSellerSearchMeta();
                }
                if (typeof window.portfolioUpdateSellerSearchButtonState === 'function') {
                    window.portfolioUpdateSellerSearchButtonState();
                }
                if (typeof window.portfolioSyncSearchLoadMoreButton === 'function') {
                    window.portfolioSyncSearchLoadMoreButton();
                }
            }

            if (payload.keys.includes('activeUser') && state.activeUser && typeof window.portfolioRefreshSellerSearchControls === 'function') {
                window.portfolioRefreshSellerSearchControls(state.activeUser);
            }
        });
    }

    window.portfolioSearchController = {
        bindStore
    };
})();
