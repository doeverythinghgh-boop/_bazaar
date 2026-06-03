/**
 * @file pages/merchant-portfolio/js/controllers/portfolio-products-controller.js
 * @description Product-specific controller helpers and reactive rendering bindings.
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

    function getAPI() {
        return window.PortfolioAPI || {};
    }

    function getStore() {
        return window.PortfolioStore || null;
    }

    function getUserKey() {
        return getAPI().getUserKeyFromLocation
            ? getAPI().getUserKeyFromLocation()
            : (new URLSearchParams(window.location.search).get('user_key') || '');
    }

    function dedupeProducts(products) {
        const seen = new Set();
        return (Array.isArray(products) ? products : []).filter(function (product) {
            const productId = String(product?.product_key || product?.id || '');
            if (!productId || seen.has(productId)) return false;
            seen.add(productId);
            return true;
        });
    }

    function mergeProductSets(primaryProducts, secondaryProducts) {
        return dedupeProducts([
            ...(Array.isArray(primaryProducts) ? primaryProducts : []),
            ...(Array.isArray(secondaryProducts) ? secondaryProducts : [])
        ]);
    }

    function persistProducts(userKey, state) {
        if (!getAPI().saveCache) return;
        const resolvedUserKey = userKey || getUserKey();
        if (!resolvedUserKey) return;

        const cache = getAPI().loadCache ? (getAPI().loadCache(resolvedUserKey) || {}) : {};
        getAPI().saveCache(resolvedUserKey, {
            ...cache,
            products: Array.isArray(state.allProducts) ? state.allProducts.slice() : [],
            offset: state.productOffset,
            activeSpecialty: state.activeSpecialty || null
        });
    }

    function setAllProducts(products, options = {}) {
        const store = getStore();
        const state = store ? store.getState() : window.portfolioState;
        const normalizedProducts = dedupeProducts(products);
        const nextOffset = Number.isFinite(options.productOffset)
            ? options.productOffset
            : (options.resetOffset ? normalizedProducts.length : state?.productOffset || 0);
        const nextHasMore = typeof options.hasMoreProducts === 'boolean'
            ? options.hasMoreProducts
            : !!state?.hasMoreProducts;

        if (store) {
            store.patch({
                products: normalizedProducts,
                allProducts: normalizedProducts,
                productOffset: nextOffset,
                hasMoreProducts: nextHasMore
            }, {
                source: 'products-controller',
                renderMode: options.renderMode || 'replace',
                renderedProducts: Array.isArray(options.renderedProducts) ? options.renderedProducts.slice() : normalizedProducts.slice(),
                skipCatalogRender: !!options.skipCatalogRender
            });
        } else if (window.portfolioState) {
            window.portfolioState.products = normalizedProducts;
            window.portfolioState.allProducts = normalizedProducts;
            window.portfolioState.productOffset = nextOffset;
            window.portfolioState.hasMoreProducts = nextHasMore;
        }

        if (options.persist !== false) {
            persistProducts(options.userKey, store ? store.getState() : window.portfolioState);
        }

        return normalizedProducts;
    }

    async function fetchAllProductsForUser(userKey) {
        if (!getAPI().fetchAllProductsForUser) return [];
        return dedupeProducts(await getAPI().fetchAllProductsForUser(userKey || getUserKey()));
    }

    function syncCatalogRender(state, payload) {
        if (payload.meta?.skipCatalogRender || typeof window.portfolioRenderProducts !== 'function') return;

        if (payload.keys.includes('showFeaturedOnly')) {
            window.portfolioRenderProducts(state.allProducts || [], false);
            return;
        }

        if (payload.keys.includes('allProducts')) {
            if (state?.sellerSearch?.isActive && payload.meta?.source !== 'merchant-search-reset') return;
            const append = payload.meta?.renderMode === 'append';
            const products = append
                ? (Array.isArray(payload.meta?.renderedProducts) ? payload.meta.renderedProducts : [])
                : (state.allProducts || []);
            window.portfolioRenderProducts(products, append);
        }
    }

    function bindStore() {
        if (isBound || !getStore()) return;
        isBound = true;

        getStore().subscribe(function (state, payload) {
            if (payload.keys.some(function (key) { return ['allProducts', 'showFeaturedOnly'].includes(key); })) {
                syncCatalogRender(state, payload);
            }
        });
    }

    window.portfolioProductsController = {
        dedupeProducts,
        mergeProductSets,
        setAllProducts,
        fetchAllProductsForUser,
        bindStore
    };
})();
