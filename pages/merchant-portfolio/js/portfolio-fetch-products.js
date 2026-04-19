/**
 * RULE: All comments and documentation must be in English only.
 * WARNING: Hover effects are strictly prohibited on this page to ensure touch-device compatibility.
 */
/**
 * @file pages/merchant-portfolio/js/portfolio-fetch-products.js
 * @description Handles merchant product fetching and pagination.
 */

window.portfolioFetchProducts = async function (userKey, offset = 0, limit = 5) {
    const PortfolioAPI = window.PortfolioAPI || {};
    const store = window.PortfolioStore || null;
    const grid = document.getElementById('portfolio-products-grid');
    const empty = document.getElementById('portfolio-empty');
    const loadMoreBtn = document.getElementById('btn-load-more-products');

    if (loadMoreBtn) {
        loadMoreBtn.disabled = true;
        loadMoreBtn.innerHTML = (window.langu('search_loading_status') || 'جاري التحميل...') + ' <i class="fas fa-spinner fa-spin"></i>';
    }

    if (grid && offset === 0) {
        const prodSec = document.getElementById('portfolio-products-section');
        if (prodSec) prodSec.style.display = 'block';
        grid.style.display = 'grid';
        grid.innerHTML = '';
        for (let i = 0; i < limit; i += 1) {
            grid.insertAdjacentHTML('beforeend', `
                <div class="product-skeleton-card skeleton-container">
                    <div class="skeleton-img skeleton-item"></div>
                    <div class="skeleton-text skeleton-item"></div>
                    <div class="skeleton-price skeleton-item"></div>
                </div>
            `);
        }
    }
    if (empty) empty.style.display = 'none';

    if (userKey === 'guest_user') {
        if (grid && offset === 0) grid.innerHTML = '';
        if (empty) empty.style.display = 'block';
        if (loadMoreBtn) loadMoreBtn.style.display = 'none';
        if (store?.patch) {
            store.patch({ hasMoreProducts: false }, { source: 'fetch-products' });
        } else if (window.portfolioState) {
            window.portfolioState.hasMoreProducts = false;
        }
        return;
    }

    try {
        const existingCacheUser = PortfolioAPI.loadCache ? PortfolioAPI.loadCache(userKey) : null;
        const state = store?.getState ? store.getState() : window.portfolioState;
        const activeUser = state?.activeUser || existingCacheUser?.user || null;
        const specialtyViewModel = PortfolioAPI.resolveSpecialtyViewModel
            ? PortfolioAPI.resolveSpecialtyViewModel(activeUser)
            : (activeUser?.portfolio_view_model || null);
        const productsSection = document.getElementById('portfolio-products-section');
        const actionsContainer = document.getElementById('portfolio-products-actions');
        const searchCommercialBtn = document.getElementById('btn-portfolio-search-commercial');
        const isPharmacy = specialtyViewModel?.profile?.entries?.some((entry) => String(entry.subId) === '204') ||
            (activeUser && typeof activeUser.business_category === 'string' && activeUser.business_category.includes('"204"'));

        if (specialtyViewModel && (!specialtyViewModel.hasCatalogAccess || specialtyViewModel.showProductsSection === false)) {
            if (grid && offset === 0) grid.innerHTML = '';
            if (productsSection) productsSection.style.display = 'none';
            if (actionsContainer) actionsContainer.style.display = 'none';
            if (searchCommercialBtn) searchCommercialBtn.style.display = 'none';
            if (loadMoreBtn) loadMoreBtn.style.display = 'none';
            if (empty) empty.style.display = 'none';
            if (store?.patch) {
                store.patch({ hasMoreProducts: false }, { source: 'fetch-products' });
            } else if (window.portfolioState) {
                window.portfolioState.hasMoreProducts = false;
            }
            return;
        }

        const products = PortfolioAPI.fetchProducts
            ? await PortfolioAPI.fetchProducts({ userKey: userKey, limit: limit, offset: offset })
            : [];

        if (Array.isArray(products) && (products.length > 0 || isPharmacy)) {
            if (productsSection) productsSection.style.display = 'block';

            if (grid) {
                grid.style.display = 'grid';
                if (offset === 0) grid.innerHTML = '';
            }

            const existingCache = (PortfolioAPI.loadCache ? PortfolioAPI.loadCache(userKey) : null) || { products: [] };
            const updatedProducts = offset === 0
                ? products
                : (window.portfolioPageController?.mergeProductSets
                    ? window.portfolioPageController.mergeProductSets(existingCache.products, products)
                    : [...existingCache.products, ...products]);

            if (window.portfolioPageController?.setAllProducts) {
                window.portfolioPageController.setAllProducts(updatedProducts, {
                    userKey: userKey,
                    productOffset: offset + products.length,
                    hasMoreProducts: products.length === limit,
                    renderMode: offset > 0 ? 'append' : 'replace',
                    renderedProducts: products
                });
            }

            if (PortfolioAPI.saveCache) {
                PortfolioAPI.saveCache(userKey, {
                    ...existingCache,
                    products: updatedProducts,
                    offset: offset + products.length,
                    isExpanded: true
                });
            }

            if (store?.patch) {
                store.patch({
                    isFirstLoad: false,
                    productOffset: offset + products.length,
                    hasMoreProducts: products.length === limit
                }, {
                    source: 'fetch-products'
                });
            } else if (window.portfolioState) {
                window.portfolioState.isFirstLoad = false;
                window.portfolioState.productOffset = offset + products.length;
                window.portfolioState.hasMoreProducts = products.length === limit;
            }

            if (window.portfolioPageController?.syncDerivedUi) {
                window.portfolioPageController.syncDerivedUi();
            }

            if (actionsContainer) actionsContainer.style.display = 'flex';
            if (searchCommercialBtn) {
                searchCommercialBtn.style.display = specialtyViewModel?.allowSearchWithinCatalog === false ? 'none' : 'flex';
            }
            if (loadMoreBtn) {
                loadMoreBtn.style.display = products.length === limit ? 'flex' : 'none';
            }
            return;
        }

        if (offset === 0) {
            if (productsSection) productsSection.style.display = 'none';
            if (empty) empty.style.display = 'block';
            if (window.portfolioPageController?.setAllProducts) {
                window.portfolioPageController.setAllProducts([], {
                    userKey: userKey,
                    productOffset: 0,
                    hasMoreProducts: false,
                    renderMode: 'replace',
                    renderedProducts: []
                });
            }
            if (PortfolioAPI.saveCache) {
                const cacheInfo = (PortfolioAPI.loadCache ? PortfolioAPI.loadCache(userKey) : null) || {};
                cacheInfo.products = [];
                cacheInfo.offset = 0;
                PortfolioAPI.saveCache(userKey, cacheInfo);
            }
        } else if (loadMoreBtn) {
            loadMoreBtn.style.display = 'none';
        }
        if (store?.patch) {
            store.patch({ hasMoreProducts: false }, { source: 'fetch-products' });
        } else if (window.portfolioState) {
            window.portfolioState.hasMoreProducts = false;
        }
    } catch (error) {
        console.error('[Portfolio] Product fetch failed:', error);
    } finally {
        if (loadMoreBtn) {
            loadMoreBtn.disabled = false;
            loadMoreBtn.innerHTML = window.langu('search_modal_load_more') || 'عرض المزيد';
        }
    }
};
