/**
 * @file portfolio-actions-featured.js
 * @description Handler for toggling featured products view.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

window.portfolioHandleFeaturedToggle = async function(user, filterFeaturedBtn) {
    const store = window.PortfolioStore || null;

    const setFeaturedBtnLoading = function (isLoading) {
        const icon = document.getElementById('filter-featured-icon');
        if (isLoading) {
            filterFeaturedBtn.disabled = true;
            filterFeaturedBtn.style.opacity = '0.7';
            filterFeaturedBtn.style.pointerEvents = 'none';
            if (icon) {
                icon.classList.remove('fa-crown');
                icon.classList.add('fa-spinner', 'fa-spin');
            }
        } else {
            filterFeaturedBtn.disabled = false;
            filterFeaturedBtn.style.opacity = '';
            filterFeaturedBtn.style.pointerEvents = '';
            if (icon) {
                icon.classList.remove('fa-spinner', 'fa-spin');
                icon.classList.add('fa-crown');
            }
        }
    };

    setFeaturedBtnLoading(true);
    const state = store?.getState ? store.getState() : (window.portfolioState || (window.portfolioState = {}));
    state.showFeaturedOnly = !state.showFeaturedOnly;
    if (store?.patch) {
        store.patch({ showFeaturedOnly: state.showFeaturedOnly });
    }

    const currentLoadMoreBtn = document.getElementById('btn-load-more-products');
    const searchCommercialBtn = document.getElementById('portfolio-merchant-search-fab-btn');

    try {
        if (state.showFeaturedOnly) {
            filterFeaturedBtn.classList.add('active');
            if (currentLoadMoreBtn) currentLoadMoreBtn.style.display = 'none';
            if (searchCommercialBtn) searchCommercialBtn.style.display = 'none';
            if (typeof window.portfolioResetSellerSearch === 'function') {
                window.portfolioResetSellerSearch({ closePanel: true });
            }

            if (typeof window.portfolioFetchAllFeaturedProducts === 'function') {
                const allFeatured = await window.portfolioFetchAllFeaturedProducts(user.user_key);
                if (typeof window.portfolioRenderProducts === 'function') {
                    window.portfolioRenderProducts(allFeatured, false);
                }
            }
        } else {
            filterFeaturedBtn.classList.remove('active');
            if (currentLoadMoreBtn && state.allProducts && state.allProducts.length >= (state.productLimit || 5)) {
                currentLoadMoreBtn.style.display = 'flex';
            }
            if (searchCommercialBtn && state.allProducts && state.allProducts.length > 0) {
                searchCommercialBtn.style.display = 'flex';
            }

            if (state.allProducts && typeof window.portfolioRenderProducts === 'function') {
                window.portfolioRenderProducts(state.allProducts, false);
            }
        }
    } finally {
        setFeaturedBtnLoading(false);
    }
};
