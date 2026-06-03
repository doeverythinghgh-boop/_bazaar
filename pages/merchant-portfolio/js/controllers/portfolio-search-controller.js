/**
 * @file pages/merchant-portfolio/js/controllers/portfolio-search-controller.js
 * @description Search-specific controller bindings for reactive UI updates.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
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
