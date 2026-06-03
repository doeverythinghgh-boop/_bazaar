/**
 * @file pages/merchant-portfolio/js/search/ui/portfolio-search-ui-state.js
 * @description Management of UI states (loading, active buttons) for merchant search.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

window.portfolioUpdateSellerSearchButtonState = function () {
    const searchState = window.portfolioEnsureSellerSearchState();
    const elements = window.portfolioGetSellerSearchTriggerElements();
    if (!elements.toggleButton) return;

    const iconEl = elements.toggleButton.querySelector('i');

    if (searchState.isOpen) {
        elements.toggleButton.classList.add('active');
        if (iconEl) {
            iconEl.className = searchState.isLoading ? 'fas fa-spinner fa-spin' : 'fas fa-times';
        }
    } else {
        if (searchState.isActive) {
            elements.toggleButton.classList.add('active');
        } else {
            elements.toggleButton.classList.remove('active');
        }
        if (iconEl) {
            iconEl.className = searchState.isLoading ? 'fas fa-spinner fa-spin' : 'fas fa-search';
        }
    }
};

window.portfolioSetSellerSearchLoading = function (isLoading) {
    const searchState = window.portfolioEnsureSellerSearchState();
    const store = window.PortfolioStore || null;
    const elements = window.portfolioGetSellerSearchTriggerElements();
    if (store?.patchSellerSearch) {
        store.patchSellerSearch({ isLoading: !!isLoading }, { source: 'merchant-search-loading' });
    } else {
        searchState.isLoading = !!isLoading;
    }

    if (elements.searchButton) {
        elements.searchButton.disabled = !!isLoading;
    }

    if (elements.clearButton) {
        elements.clearButton.disabled = !!isLoading;
    }

    window.portfolioUpdateSellerSearchButtonState();
    if (typeof window.portfolioSyncSearchLoadMoreButton === 'function') {
        window.portfolioSyncSearchLoadMoreButton();
    }
};

window.portfolioUpdateSellerSearchMeta = function () {
    // Deprecated: Meta element was removed by user request
};
