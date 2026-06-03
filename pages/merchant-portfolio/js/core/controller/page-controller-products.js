/**
 * @file page-controller-products.js
 * @description Product manipulation and fetching for the portfolio page controller.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

(function() {
    window.portfolioPageControllerProducts = {
        getProductsController: function() { return window.portfolioProductsController || {}; },

        dedupeProducts: function(products) {
            return this.getProductsController().dedupeProducts
                ? this.getProductsController().dedupeProducts(products)
                : (Array.isArray(products) ? products : []);
        },

        mergeProductSets: function(primaryProducts, secondaryProducts) {
            return this.getProductsController().mergeProductSets
                ? this.getProductsController().mergeProductSets(primaryProducts, secondaryProducts)
                : [...(Array.isArray(primaryProducts) ? primaryProducts : []), ...(Array.isArray(secondaryProducts) ? secondaryProducts : [])];
        },

        setActiveUser: function(user, options = {}) {
            if (!user) return null;
            const stateUtil = window.portfolioPageControllerState;
            const api = stateUtil?.getAPI() || {};
            const store = stateUtil?.getStore() || null;

            const nextUser = { ...user };
            if (typeof window.buildBusinessSpecialtyProfile === 'function' && !nextUser.specialty_profile) {
                nextUser.specialty_profile = window.buildBusinessSpecialtyProfile(nextUser);
            }
            if (api.resolveSpecialtyViewModel) {
                nextUser.portfolio_view_model = nextUser.portfolio_view_model || api.resolveSpecialtyViewModel(nextUser);
            }

            if (store) {
                const currentState = store.getState ? store.getState() : {};
                store.patch({
                    activeUser: nextUser,
                    merchant: nextUser,
                    specialtyViewModel: currentState?.activeSpecialty?.viewModel || nextUser.portfolio_view_model || null
                }, {
                    source: 'page-controller'
                });
            } else {
                const state = stateUtil.ensurePortfolioState();
                state.activeUser = nextUser;
                state.merchant = nextUser;
                state.specialtyViewModel = nextUser.portfolio_view_model || null;
            }

            if (options.persist !== false && api.saveCache) {
                const userKey = options.userKey || nextUser.user_key || stateUtil.getUserKey();
                if (userKey) {
                    const cache = stateUtil.getCache(userKey) || {};
                    api.saveCache(userKey, {
                        ...cache,
                        user: nextUser
                    });
                }
            }

            return nextUser;
        },

        setAllProducts: function(products, options = {}) {
            if (this.getProductsController().setAllProducts) {
                return this.getProductsController().setAllProducts(products, options);
            }
            const state = window.portfolioPageControllerState.ensurePortfolioState();
            state.allProducts = Array.isArray(products) ? products.slice() : [];
            return state.allProducts;
        },

        fetchAllProductsForUser: async function(userKey) {
            if (this.getProductsController().fetchAllProductsForUser) {
                return this.getProductsController().fetchAllProductsForUser(userKey || window.portfolioPageControllerState.getUserKey());
            }
            return [];
        }
    };
})();
