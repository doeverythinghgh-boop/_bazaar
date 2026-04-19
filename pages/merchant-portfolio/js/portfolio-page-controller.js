/**
 * @file pages/merchant-portfolio/js/portfolio-page-controller.js
 * @description Page orchestrator for the merchant portfolio page.
 */

(function () {
    let sessionSyncBound = false;

    function getAPI() {
        return window.PortfolioAPI || {};
    }

    function getStore() {
        return window.PortfolioStore || null;
    }

    function getProductsController() {
        return window.portfolioProductsController || {};
    }

    function getRatingsController() {
        return window.portfolioRatingsController || {};
    }

    function ensurePortfolioState() {
        if (getStore()) return getStore().getState();
        if (!window.portfolioState) window.portfolioState = {};
        return window.portfolioState;
    }

    function bindReactiveControllers() {
        if (getProductsController().bindStore) getProductsController().bindStore();
        if (window.portfolioSearchController?.bindStore) window.portfolioSearchController.bindStore();
        if (getRatingsController().bindStore) getRatingsController().bindStore();
        bindSessionSync();
    }

    function getUserKey() {
        return getAPI().getUserKeyFromLocation
            ? getAPI().getUserKeyFromLocation()
            : (new URLSearchParams(window.location.search).get('user_key') || '');
    }

    function getCache(userKey) {
        return getAPI().loadCache ? getAPI().loadCache(userKey || getUserKey()) : null;
    }

    function getActiveUser() {
        return ensurePortfolioState().activeUser || getCache()?.user || null;
    }

    function getSpecialtyViewModel(user) {
        const targetUser = user || getActiveUser();
        if (!targetUser) return null;
        return getAPI().resolveSpecialtyViewModel ? getAPI().resolveSpecialtyViewModel(targetUser) : null;
    }

    function dedupeProducts(products) {
        return getProductsController().dedupeProducts
            ? getProductsController().dedupeProducts(products)
            : (Array.isArray(products) ? products : []);
    }

    function mergeProductSets(primaryProducts, secondaryProducts) {
        return getProductsController().mergeProductSets
            ? getProductsController().mergeProductSets(primaryProducts, secondaryProducts)
            : [...(Array.isArray(primaryProducts) ? primaryProducts : []), ...(Array.isArray(secondaryProducts) ? secondaryProducts : [])];
    }

    function setActiveUser(user, options = {}) {
        if (!user) return null;

        const nextUser = { ...user };
        if (typeof window.buildBusinessSpecialtyProfile === 'function' && !nextUser.specialty_profile) {
            nextUser.specialty_profile = window.buildBusinessSpecialtyProfile(nextUser);
        }
        if (getAPI().resolveSpecialtyViewModel) {
            nextUser.portfolio_view_model = nextUser.portfolio_view_model || getAPI().resolveSpecialtyViewModel(nextUser);
        }

        if (getStore()) {
            getStore().patch({
                activeUser: nextUser,
                merchant: nextUser,
                specialtyViewModel: nextUser.portfolio_view_model || null
            }, {
                source: 'page-controller'
            });
        } else {
            const state = ensurePortfolioState();
            state.activeUser = nextUser;
            state.merchant = nextUser;
            state.specialtyViewModel = nextUser.portfolio_view_model || null;
        }

        if (options.persist !== false && getAPI().saveCache) {
            const userKey = options.userKey || nextUser.user_key || getUserKey();
            if (userKey) {
                const cache = getCache(userKey) || {};
                getAPI().saveCache(userKey, {
                    ...cache,
                    user: nextUser
                });
            }
        }

        return nextUser;
    }

    function setAllProducts(products, options = {}) {
        if (getProductsController().setAllProducts) {
            return getProductsController().setAllProducts(products, options);
        }
        const state = ensurePortfolioState();
        state.allProducts = Array.isArray(products) ? products.slice() : [];
        return state.allProducts;
    }

    async function fetchAllProductsForUser(userKey) {
        if (getProductsController().fetchAllProductsForUser) {
            return getProductsController().fetchAllProductsForUser(userKey || getUserKey());
        }
        return [];
    }

    function syncDerivedUi() {
        if (typeof window.portfolioRefreshSellerSearch === 'function') {
            window.portfolioRefreshSellerSearch();
        }
        if (typeof window.renderCommercialFeaturedScroller === 'function') {
            window.renderCommercialFeaturedScroller();
        }
    }

    function rerenderProfile(user) {
        return getRatingsController().rerenderProfile
            ? getRatingsController().rerenderProfile(user || getActiveUser())
            : null;
    }

    function applyRatingsUpdate(targetUserKey, ratings) {
        return getRatingsController().applyRatingsUpdate
            ? getRatingsController().applyRatingsUpdate(targetUserKey, ratings)
            : null;
    }

    function bindSessionSync() {
        if (sessionSyncBound || typeof window === "undefined") return;
        sessionSyncBound = true;

        window.addEventListener(window.UserService?.events?.sessionChanged || "user-session-changed", function (event) {
            const nextUser = event?.detail?.user || null;
            const viewedUserKey = getUserKey();
            if (!nextUser || !viewedUserKey || String(nextUser.user_key || "") !== String(viewedUserKey)) {
                return;
            }

            const normalizedUser = window.UserService?.normalizeUser
                ? window.UserService.normalizeUser(nextUser)
                : nextUser;
            setActiveUser(normalizedUser, {
                userKey: viewedUserKey,
                persist: true
            });
        });
    }

    function showMainContainer() {
        const mainContainer = document.getElementById('portfolio-main-container');
        if (mainContainer) mainContainer.style.display = 'flex';
    }

    function hideMainLoader() {
        const mainLoader = document.getElementById('loader-container');
        if (mainLoader) {
            mainLoader.style.display = 'none';
        }
    }

    function showErrorState(message) {
        const errorContainer = document.getElementById('portfolio-error');
        const errorMessage = document.getElementById('portfolio-error-msg');
        if (errorMessage && message) {
            errorMessage.textContent = message;
        }
        if (errorContainer) {
            errorContainer.style.display = 'block';
        }
        if (getStore()) {
            getStore().patch({
                ui: {
                    error: message || 'portfolio_error'
                }
            }, {
                source: 'page-controller'
            });
        } else {
            ensurePortfolioState().ui.error = message || 'portfolio_error';
        }
        hideMainLoader();
    }

    function getScrollY() {
        return window.scrollY ||
            window.pageYOffset ||
            document.documentElement.scrollTop ||
            document.body.scrollTop ||
            (document.getElementById('portfolio-main-container')?.scrollTop || 0);
    }

    function restoreCachedScroll(cache) {
        if (!cache?.scrollY || cache.scrollY <= 10) {
            if (getStore()) {
                getStore().patch({ isFirstLoad: false }, { source: 'page-controller' });
            } else {
                ensurePortfolioState().isFirstLoad = false;
            }
            return;
        }

        const targetY = cache.scrollY;
        let restorationAttempts = 0;
        const restorationInterval = setInterval(function () {
            window.scrollTo(0, targetY);
            if (document.documentElement) document.documentElement.scrollTop = targetY;
            if (document.body) document.body.scrollTop = targetY;

            restorationAttempts += 1;
            const currentY = getScrollY();
            if (Math.abs(currentY - targetY) < 10 || restorationAttempts > 40) {
                clearInterval(restorationInterval);
                if (getStore()) {
                    getStore().patch({ isFirstLoad: false }, { source: 'page-controller' });
                } else {
                    ensurePortfolioState().isFirstLoad = false;
                }
            }
        }, 100);
    }

    function setupScrollPersistence(userKey) {
        const resolvedUserKey = userKey || getUserKey();
        if (!resolvedUserKey || !getAPI().saveCache) return;

        if (window._portfolioScrollHandler) {
            document.removeEventListener('scroll', window._portfolioScrollHandler, true);
        }
        if (window._portfolioBeforeUnloadHandler) {
            window.removeEventListener('beforeunload', window._portfolioBeforeUnloadHandler);
        }

        let scrollTimeout;
        const scrollHandler = function () {
            const currentY = getScrollY();
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(function () {
                if (!ensurePortfolioState().isFirstLoad) {
                    getAPI().saveCache(resolvedUserKey, { scrollY: Math.round(currentY) });
                }
            }, 300);
        };

        const beforeUnloadHandler = function () {
            const finalY = getScrollY();
            if (Math.round(finalY) > 0) {
                getAPI().saveCache(resolvedUserKey, { scrollY: Math.round(finalY) });
            }
        };

        window._portfolioScrollHandler = scrollHandler;
        window._portfolioBeforeUnloadHandler = beforeUnloadHandler;

        document.addEventListener('scroll', scrollHandler, { passive: true, capture: true });
        window.addEventListener('beforeunload', beforeUnloadHandler);
    }

    window.portfolioPageController = {
        bindReactiveControllers,
        ensurePortfolioState,
        getUserKey,
        getCache,
        getActiveUser,
        getSpecialtyViewModel,
        dedupeProducts,
        mergeProductSets,
        setActiveUser,
        setAllProducts,
        fetchAllProductsForUser,
        syncDerivedUi,
        rerenderProfile,
        applyRatingsUpdate,
        showMainContainer,
        hideMainLoader,
        showErrorState,
        restoreCachedScroll,
        setupScrollPersistence
    };
})();
