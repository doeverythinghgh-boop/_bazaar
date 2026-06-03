/**
 * @file page-controller-ui.js
 * @description UI interaction and synchronization for the portfolio page controller.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

(function() {
    window.portfolioPageControllerUI = {
        syncDerivedUi: function() {
            if (typeof window.portfolioRefreshSellerSearch === 'function') {
                window.portfolioRefreshSellerSearch();
            }
            if (typeof window.renderCommercialFeaturedScroller === 'function') {
                window.renderCommercialFeaturedScroller();
            }
        },

        showMainContainer: function() {
            const mainContainer = document.getElementById('portfolio-main-container');
            if (mainContainer) mainContainer.style.display = 'flex';
        },

        hideMainLoader: function() {
            const mainLoader = document.getElementById('loader-container');
            if (mainLoader) mainLoader.style.display = 'none';
            const miniLoader = document.getElementById('portfolio-mini-loader');
            if (miniLoader) miniLoader.style.display = 'none';
        },

        showErrorState: function(message) {
            const errorContainer = document.getElementById('portfolio-error');
            const errorMessage = document.getElementById('portfolio-error-msg');
            if (errorMessage && message) {
                errorMessage.textContent = message;
            }
            if (errorContainer) {
                errorContainer.style.display = 'block';
            }
            const stateUtil = window.portfolioPageControllerState;
            const store = stateUtil?.getStore();
            if (store) {
                store.patch({
                    ui: {
                        error: message || 'portfolio_error'
                    }
                }, {
                    source: 'page-controller'
                });
            } else if (stateUtil) {
                stateUtil.ensurePortfolioState().ui.error = message || 'portfolio_error';
            }
            this.hideMainLoader();
        }
    };
})();
