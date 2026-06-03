/**
 * @file page-controller-core.js
 * @description Core orchestration and assembly for the portfolio page controller.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

(function() {
    let sessionSyncBound = false;

    function bindReactiveControllers() {
        if (window.portfolioProductsController?.bindStore) window.portfolioProductsController.bindStore();
        if (window.portfolioSearchController?.bindStore) window.portfolioSearchController.bindStore();
        if (window.portfolioRatingsController?.bindStore) window.portfolioRatingsController.bindStore();
        bindSessionSync();
    }

    function bindSessionSync() {
        if (sessionSyncBound || typeof window === "undefined") return;
        sessionSyncBound = true;

        const stateUtil = window.portfolioPageControllerState;
        const productsUtil = window.portfolioPageControllerProducts;

        window.addEventListener(window.UserService?.events?.sessionChanged || "user-session-changed", function (event) {
            const nextUser = event?.detail?.user || null;
            const viewedUserKey = stateUtil.getUserKey();
            if (!nextUser || !viewedUserKey || String(nextUser.user_key || "") !== String(viewedUserKey)) {
                return;
            }

            const normalizedUser = window.UserService?.normalizeUser
                ? window.UserService.normalizeUser(nextUser)
                : nextUser;
            productsUtil.setActiveUser(normalizedUser, {
                userKey: viewedUserKey,
                persist: true
            });
        });
    }

    window.portfolioPageController = {
        bindReactiveControllers,
        ensurePortfolioState: () => window.portfolioPageControllerState.ensurePortfolioState(),
        getUserKey: () => window.portfolioPageControllerState.getUserKey(),
        getCache: (userKey) => window.portfolioPageControllerState.getCache(userKey),
        getActiveUser: () => window.portfolioPageControllerState.getActiveUser(),
        getSpecialtyViewModel: (user) => window.portfolioPageControllerState.getSpecialtyViewModel(user),
        dedupeProducts: (products) => window.portfolioPageControllerProducts.dedupeProducts(products),
        mergeProductSets: (p, s) => window.portfolioPageControllerProducts.mergeProductSets(p, s),
        setActiveUser: (u, o) => window.portfolioPageControllerProducts.setActiveUser(u, o),
        setAllProducts: (p, o) => window.portfolioPageControllerProducts.setAllProducts(p, o),
        fetchAllProductsForUser: (u) => window.portfolioPageControllerProducts.fetchAllProductsForUser(u),
        syncDerivedUi: () => window.portfolioPageControllerUI.syncDerivedUi(),
        rerenderProfile: (user) => window.portfolioRatingsController?.rerenderProfile ? window.portfolioRatingsController.rerenderProfile(user || window.portfolioPageControllerState.getActiveUser()) : null,
        applyRatingsUpdate: (t, r) => window.portfolioRatingsController?.applyRatingsUpdate ? window.portfolioRatingsController.applyRatingsUpdate(t, r) : null,
        showMainContainer: () => window.portfolioPageControllerUI.showMainContainer(),
        hideMainLoader: () => window.portfolioPageControllerUI.hideMainLoader(),
        showErrorState: (m) => window.portfolioPageControllerUI.showErrorState(m),
        restoreCachedScroll: (c) => window.portfolioPageControllerScroll.restoreCachedScroll(c),
        setupScrollPersistence: (u) => window.portfolioPageControllerScroll.setupScrollPersistence(u)
    };
})();
