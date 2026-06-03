/**
 * @file pages/merchant-portfolio/js/fetch/core/fetch-core-sync.js
 * @description State and UI synchronization after product fetching.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 */

(function () {
    window.portfolioSyncProductState = function (userKey, products, offset, limit, PortfolioAPI, store) {
        const existingCache = (PortfolioAPI.loadCache ? PortfolioAPI.loadCache(userKey) : null) || { products: [] };
        const updatedProducts = offset === 0
            ? products
            : (window.portfolioPageController?.mergeProductSets
                ? window.portfolioPageController.mergeProductSets(existingCache.products, products)
                : [...existingCache.products, ...products]);

        const newOffset = offset + products.length;
        const hasMore = products.length === limit;

        if (window.portfolioPageController?.setAllProducts) {
            window.portfolioPageController.setAllProducts(updatedProducts, {
                userKey: userKey,
                productOffset: newOffset,
                hasMoreProducts: hasMore,
                renderMode: offset > 0 ? 'append' : 'replace',
                renderedProducts: products
            });
        }

        if (PortfolioAPI.saveCache) {
            PortfolioAPI.saveCache(userKey, {
                ...existingCache,
                products: updatedProducts,
                offset: newOffset,
                activeSpecialty: store?.getState ? (store.getState()?.activeSpecialty || null) : (window.portfolioState?.activeSpecialty || null),
                isExpanded: true
            });
        }

        if (store?.patch) {
            store.patch({
                isFirstLoad: false,
                productOffset: newOffset,
                hasMoreProducts: hasMore
            }, { source: 'fetch-products' });
        } else if (window.portfolioState) {
            window.portfolioState.isFirstLoad = false;
            window.portfolioState.productOffset = newOffset;
            window.portfolioState.hasMoreProducts = hasMore;
        }

        if (window.portfolioPageController?.syncDerivedUi) {
            window.portfolioPageController.syncDerivedUi();
        }

        return { newOffset, hasMore };
    };

    window.portfolioUpdateFetchUi = function (hasMore, isPharmacy, specialtyViewModel) {
        const loadMoreBtn = document.getElementById('btn-load-more-products');
        const actionsContainer = document.getElementById('portfolio-products-actions');
        const searchCommercialBtn = document.getElementById('portfolio-merchant-search-fab-btn');

        const searchState = typeof window.portfolioEnsureSellerSearchState === 'function'
            ? window.portfolioEnsureSellerSearchState()
            : null;
        const pharmacyContextOwnsPagination = !!(isPharmacy && (window.pharmacyActiveSubCategoryId || searchState?.isActive));

        if (actionsContainer && !pharmacyContextOwnsPagination) actionsContainer.style.display = 'flex';
        if (searchCommercialBtn) {
            searchCommercialBtn.style.display = specialtyViewModel?.allowSearchWithinCatalog === false ? 'none' : 'flex';
        }
        if (loadMoreBtn && !pharmacyContextOwnsPagination) {
            loadMoreBtn.style.display = hasMore ? 'flex' : 'none';
        }
        if (pharmacyContextOwnsPagination && typeof window.portfolioSyncSearchLoadMoreButton === 'function') {
            window.portfolioSyncSearchLoadMoreButton();
        }
    };
})();
