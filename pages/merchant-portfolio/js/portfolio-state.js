/**
 * RULE: All comments and documentation must be in English only.
 * WARNING: Hover effects are strictly prohibited on this page to ensure touch-device compatibility.
 */
/**
 * @file pages/merchant-portfolio/js/portfolio-state.js
 * @description Central reactive store and single source of truth for the merchant portfolio page.
 */

(function () {
    const listeners = new Set();

    const initialSellerSearchState = function () {
        return {
            isOpen: false,
            query: '',
            mainCategory: '',
            subCategory: '',
            sort: 'default',
            isActive: false,
            appliedQuery: '',
            appliedMainCategory: '',
            appliedSubCategory: '',
            appliedSort: 'default',
            limit: 5,
            visibleCount: 0,
            totalMatched: 0,
            results: [],
            isLoading: false
        };
    };

    const state = {
        merchant: null,
        products: [],
        cache: {
            user: null,
            products: [],
            offset: 0,
            scrollY: 0
        },
        productOffset: 0,
        productLimit: 5,
        hasMoreProducts: false,
        isFirstLoad: true,
        allProducts: [],
        activeUser: null,
        specialtyViewModel: null,
        showFeaturedOnly: false,
        sellerSearch: initialSellerSearchState(),
        ui: {
            error: null
        }
    };

    function merge(target, patch) {
        Object.keys(patch || {}).forEach(function (key) {
            if (
                patch[key] &&
                typeof patch[key] === 'object' &&
                !Array.isArray(patch[key]) &&
                target[key] &&
                typeof target[key] === 'object' &&
                !Array.isArray(target[key])
            ) {
                merge(target[key], patch[key]);
            } else {
                target[key] = patch[key];
            }
        });
        return target;
    }

    function notify(keys, meta) {
        const payload = {
            keys: Array.isArray(keys) ? keys.filter(Boolean) : [],
            meta: meta || {}
        };

        listeners.forEach(function (listener) {
            try {
                listener(state, payload);
            } catch (error) {
                console.error('[PortfolioStore] subscriber failed:', error);
            }
        });
    }

    function setStateValue(key, value, meta) {
        state[key] = value;
        notify([key], meta);
        return value;
    }

    const store = {
        getState: function () {
            return state;
        },
        set: function (key, value, meta) {
            return setStateValue(key, value, meta);
        },
        patch: function (patch, meta) {
            const changedKeys = Object.keys(patch || {});
            merge(state, patch || {});
            if (changedKeys.length > 0) {
                notify(changedKeys, meta);
            }
            return state;
        },
        subscribe: function (listener) {
            if (typeof listener !== 'function') {
                return function () { };
            }
            listeners.add(listener);
            return function unsubscribe() {
                listeners.delete(listener);
            };
        },
        setMerchant: function (merchant, meta) {
            const nextMerchant = merchant || null;
            state.merchant = nextMerchant;
            state.activeUser = nextMerchant;
            notify(['merchant', 'activeUser'], meta);
            return nextMerchant;
        },
        setProducts: function (products, options = {}) {
            const nextProducts = Array.isArray(products) ? products.slice() : [];
            state.products = nextProducts;
            state.allProducts = nextProducts;
            if (Number.isFinite(options.offset)) state.productOffset = options.offset;
            if (typeof options.hasMoreProducts === 'boolean') state.hasMoreProducts = options.hasMoreProducts;
            notify(['products', 'allProducts', 'productOffset', 'hasMoreProducts'], options.meta);
            return state.products;
        },
        setCacheSnapshot: function (payload, meta) {
            state.cache = merge({
                user: null,
                products: [],
                offset: 0,
                scrollY: 0
            }, payload || {});
            notify(['cache'], meta);
            return state.cache;
        },
        resetSellerSearch: function (meta) {
            state.sellerSearch = initialSellerSearchState();
            notify(['sellerSearch'], meta);
            return state.sellerSearch;
        },
        patchSellerSearch: function (patch, meta) {
            if (!state.sellerSearch || typeof state.sellerSearch !== 'object') {
                state.sellerSearch = initialSellerSearchState();
            }
            merge(state.sellerSearch, patch || {});
            notify(['sellerSearch'], meta);
            return state.sellerSearch;
        }
    };

    window.PortfolioStore = store;
    window.portfolioState = state;
})();
