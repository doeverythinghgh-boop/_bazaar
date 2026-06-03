/**
 * @file pages/merchant-portfolio/js/fetch/core/fetch-core-main.js
 * @description Main entry point for product fetching orchestration.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 */

window.portfolioFetchProducts = async function (userKey, offset = 0, limit = 5, options = {}) {
    const PortfolioAPI = window.PortfolioAPI || {};
    const store = window.PortfolioStore || null;
    const grid = document.getElementById('portfolio-products-grid');
    const empty = document.getElementById('portfolio-empty');
    const loadMoreBtn = document.getElementById('btn-load-more-products');
    const actionsContainer = document.getElementById('portfolio-products-actions');

    const PAGE_SIZE = 5;
    if (!limit || limit < PAGE_SIZE) limit = PAGE_SIZE;

    if (typeof window.portfolioSyncSearchLoadMoreButton === 'function') {
        window.portfolioSyncSearchLoadMoreButton();
    }

    const { state, activeUser, specialtyViewModel, activeSpecialty, isPharmacy, isCarSales, isRealEstateSales } = window.portfolioResolveFetchContext ? window.portfolioResolveFetchContext(userKey, store, PortfolioAPI) : {};

    if (window.portfolioUpdateFetchButton) window.portfolioUpdateFetchButton(loadMoreBtn, true);
    if (grid && offset === 0 && !isPharmacy && window.portfolioInitFetchSkeleton) window.portfolioInitFetchSkeleton(grid, limit);
    if (empty) empty.style.display = 'none';

    if (userKey === 'guest_user') {
        if (grid && offset === 0 && !isPharmacy) grid.innerHTML = '';
        if (empty) empty.style.display = 'block';
        if (loadMoreBtn) loadMoreBtn.style.display = 'none';
        if (store?.patch) store.patch({ hasMoreProducts: false });
        return;
    }

    console.log(`[Mirror][Start] portfolioFetchProducts: Fetching for "${userKey}" (Offset: ${offset}, Limit: ${limit})...`);
    console.time('[Mirror][Runtime] portfolioFetchProducts');

    try {
        if (window.portfolioCheckCatalogAccess && !window.portfolioCheckCatalogAccess(specialtyViewModel, isPharmacy)) {
            // Do not hide section if a navigation restoration is in progress
            if (window.__portfolioRestorationActive) {
                console.log('[Mirror][Skip] Catalog access check deferred: restoration is active.');
            } else {
                if (grid && offset === 0) grid.innerHTML = '';
                const psNoAccess = document.getElementById('portfolio-products-section');
                if (psNoAccess) psNoAccess.style.display = 'none';
                if (actionsContainer) actionsContainer.style.display = 'none';
                if (loadMoreBtn) loadMoreBtn.style.display = 'none';
                return;
            }
        }

        if (isPharmacy && offset === 0) {
            const ps = document.getElementById('portfolio-products-section');
            if (ps) ps.style.display = 'block';
        }

        const products = (window.portfolioFetchProductData)
            ? await window.portfolioFetchProductData(userKey, offset, limit, {
                ...options,
                listingType: isRealEstateSales ? 'real_estate' : (isCarSales ? 'cars' : 'products'),
                mainCategory: activeSpecialty?.mainId || '',
                subCategory: activeSpecialty?.subId || ''
            }, PortfolioAPI)
            : [];

        if (Array.isArray(products) && (products.length > 0 || isPharmacy)) {
            const productsSection = document.getElementById('portfolio-products-section');
            if (productsSection) productsSection.style.display = 'block';

            if (grid && !isPharmacy) {
                grid.style.display = 'grid';
                if (offset === 0) grid.innerHTML = '';
            }

            const { hasMore } = (window.portfolioSyncProductState)
                ? window.portfolioSyncProductState(userKey, products, offset, limit, PortfolioAPI, store)
                : { hasMore: false };

            if (window.portfolioUpdateFetchUi) {
                window.portfolioUpdateFetchUi(hasMore, isPharmacy, specialtyViewModel);
            }
            return;
        }

        if (offset === 0) {
            // Clear skeleton cards that were injected in the loading phase.
            // Without this, the grid keeps showing the skeleton indefinitely.
            if (grid && !isPharmacy) {
                grid.innerHTML = '';
                grid.style.display = 'none';
            }
            if (loadMoreBtn) loadMoreBtn.style.display = 'none';
            const ps = document.getElementById('portfolio-products-section');
            if (ps) ps.style.display = 'block';
            if (empty) empty.style.display = 'block';
        } else if (loadMoreBtn) {
            loadMoreBtn.style.display = 'none';
        }

    } catch (error) {
        console.error('[Mirror][Error] Product fetch failed:', error);
    } finally {
        if (window.portfolioUpdateFetchButton) window.portfolioUpdateFetchButton(loadMoreBtn, false);
        console.timeEnd('[Mirror][Runtime] portfolioFetchProducts');
        console.log(`[Mirror][End] portfolioFetchProducts: Finished.`);
    }
};
