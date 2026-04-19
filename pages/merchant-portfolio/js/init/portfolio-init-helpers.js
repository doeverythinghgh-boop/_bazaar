/**
 * @file pages/merchant-portfolio/js/init/portfolio-init-helpers.js
 * @description Initialization helpers for merchant portfolio bootstrap flow.
 */

function portfolioConfigureScrollRestoration() {
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }
}

function portfolioConfigureSweetAlertForPage() {
    if (typeof Swal === 'undefined') return;

    const swalConfig = {
        heightAuto: false,
        scrollbarPadding: false
    };
    window.Swal = Swal.mixin(swalConfig);
}

function portfolioResolveUserKeyOrThrow() {
    const userKey = new URLSearchParams(window.location.search).get('user_key');
    if (!userKey) {
        const errorBox = document.getElementById('portfolio-error');
        if (errorBox) errorBox.style.display = 'block';
        throw new Error('Merchant key is missing from URL');
    }
    return userKey;
}

function portfolioApplyCachedUser(cache, controller, userKey, hideMainLoader) {
    if (!(cache && cache.user)) return false;

    applyPortfolioSpecialtyView(cache.user);
    if (controller?.setActiveUser) controller.setActiveUser(cache.user, { userKey: userKey, persist: true });
    if (typeof window.initFeaturedState === 'function') {
        window.initFeaturedState(cache.user);
    }
    if (controller?.showMainContainer) controller.showMainContainer();
    hideMainLoader();
    return true;
}

function portfolioApplyResolvedUser(userData, cache, controller, userKey) {
    if (userData) {
        applyPortfolioSpecialtyView(userData);
        if (controller?.setActiveUser) controller.setActiveUser(userData, { userKey: userKey, persist: true });
        if (typeof window.initFeaturedState === 'function') {
            window.initFeaturedState(userData);
        }
        return userData;
    }

    if (cache?.user && controller?.setActiveUser) {
        controller.setActiveUser(cache.user, { userKey: userKey, persist: true });
        return cache.user;
    }

    return null;
}

function portfolioApplyCachedProducts(cache, controller, userKey) {
    if (!(cache && cache.products && cache.products.length > 0)) return false;
    const store = window.PortfolioStore || null;
    const state = store?.getState ? store.getState() : window.portfolioState;
    const productLimit = state?.productLimit || 5;

    if (controller?.setAllProducts) {
        controller.setAllProducts(cache.products, {
            userKey: userKey,
            productOffset: Number.isFinite(cache.offset) ? cache.offset : cache.products.length,
            hasMoreProducts: cache.products.length >= productLimit,
            renderMode: 'replace',
            renderedProducts: cache.products
        });
    } else if (typeof window.portfolioState !== 'undefined') {
        window.portfolioState.allProducts = cache.products;
        window.portfolioState.hasMoreProducts = cache.products.length >= productLimit;
    }

    if (controller?.syncDerivedUi) {
        controller.syncDerivedUi();
    }

    const activeViewModel = cache.user?.portfolio_view_model || applyPortfolioSpecialtyView(cache.user);
    const productsSection = document.getElementById('portfolio-products-section');
    if (productsSection && activeViewModel?.hasCatalogAccess && activeViewModel?.showProductsSection !== false) {
        productsSection.style.display = 'block';
    }

    const actionsContainer = document.getElementById('portfolio-products-actions');
    if (actionsContainer) {
        actionsContainer.style.display = activeViewModel?.hasCatalogAccess ? 'flex' : 'none';
    }

    const loadMoreBtn = document.getElementById('btn-load-more-products');
    const searchCommercialBtn = document.getElementById('btn-portfolio-search-commercial');

    if (searchCommercialBtn) {
        searchCommercialBtn.style.display = activeViewModel?.allowSearchWithinCatalog === false ? 'none' : 'flex';
    }
    if (loadMoreBtn && cache.products.length >= productLimit) {
        loadMoreBtn.style.display = 'flex';
    }

    if (controller?.restoreCachedScroll) controller.restoreCachedScroll(cache);
    else if (store?.patch) {
        store.patch({ isFirstLoad: false }, { source: 'init-cache' });
    } else if (window.portfolioState) {
        window.portfolioState.isFirstLoad = false;
    }

    if (store?.patch) {
        store.patch({
            productOffset: Number.isFinite(cache.offset) ? cache.offset : cache.products.length
        }, {
            source: 'init-cache'
        });
    } else if (window.portfolioState) {
        window.portfolioState.productOffset = cache.offset;
    }
    return true;
}
