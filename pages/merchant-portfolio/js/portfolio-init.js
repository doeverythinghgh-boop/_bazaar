/**
 * RULE: All comments and documentation must be in English only.
 * WARNING: Hover effects are strictly prohibited on this page to ensure touch-device compatibility.
 */
/**
 * @file pages/merchant-portfolio/js/portfolio-init.js
 * @description Entry point for initializing the merchant portfolio page.
 */

async function initPortfolio() {
    const controller = window.portfolioPageController;
    const hideMainLoader = controller?.hideMainLoader || function () { };
    if (controller?.bindReactiveControllers) controller.bindReactiveControllers();

    const userKey = portfolioResolveUserKeyOrThrow();
    portfolioConfigureScrollRestoration();
    portfolioConfigureSweetAlertForPage();

    try {
        if (typeof fetchAppCategories === 'function') {
            await fetchAppCategories();
        }

        const cache = controller?.getCache ? controller.getCache(userKey) : window.portfolioCache.load(userKey);
        portfolioApplyCachedUser(cache, controller, userKey, hideMainLoader);

        const userData = await portfolioFetchUser(userKey);
        if (!userData && (!cache || !cache.user)) {
            const L = (key, fallback) => (typeof window.langu === 'function' ? window.langu(key) : null) || fallback;
            Swal.fire(L('port_fetch_error_title', 'خطأ'), L('port_fetch_error_text', 'لم يتم العثور على بيانات التاجر'), 'error').then(() => {
                window.location.href = '/index.html';
            });
            return;
        }

        portfolioApplyResolvedUser(userData, cache, controller, userKey);

        if (controller?.setupScrollPersistence) {
            controller.setupScrollPersistence(userKey);
        }

        // Show main profile instantly, allow products to load progressively
        if (controller?.showMainContainer) controller.showMainContainer();
        hideMainLoader();

        if (!portfolioApplyCachedProducts(cache, controller, userKey)) {
            if (window.PortfolioStore?.patch) {
                window.PortfolioStore.patch({ isFirstLoad: false }, { source: 'init' });
            } else if (window.portfolioState) {
                window.portfolioState.isFirstLoad = false;
            }
            await window.portfolioFetchProducts(userKey, 0, 5);

            if (controller?.syncDerivedUi) controller.syncDerivedUi();
        }

    } catch (error) {
        console.error('[Portfolio] Error:', error);
        if (controller?.showErrorState) controller.showErrorState();
        else hideMainLoader();
    }
}

window.initPortfolio = initPortfolio;
