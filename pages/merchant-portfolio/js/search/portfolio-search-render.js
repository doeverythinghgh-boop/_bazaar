/**
 * @file pages/merchant-portfolio/js/portfolio-search-render.js
 * @description Handles rendering and visual restoration of merchant search results.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


window.portfolioRenderActiveSellerSearchResults = function () {
    const searchState = window.portfolioEnsureSellerSearchState();
    const visibleProducts = searchState.results.slice(0, searchState.visibleCount);
    const activeUser = window.portfolioPageController?.getActiveUser?.() || window.portfolioState?.activeUser || null;
    const activeSpecialty = window.portfolioActiveSpecialty?.getActive ? window.portfolioActiveSpecialty.getActive() : null;
    const isPharmacy = activeSpecialty ? !!activeSpecialty.isPharmacy : !!window.portfolioIsPharmacyUser?.(activeUser);

    console.log(`[Mirror][SearchRender] Rendering search results. Visible: ${searchState.visibleCount}, Context: ${isPharmacy ? 'Pharmacy' : 'Generic'}`);

    if (typeof window.portfolioRenderPharmacySearchResults === 'function' && isPharmacy) {
        window.portfolioRenderPharmacySearchResults(searchState.results);
        return;
    }

    if (typeof window.portfolioRenderProducts === 'function') {
        window.portfolioRenderProducts(visibleProducts, false);
    }

    window.portfolioUpdateSellerSearchMeta();
    window.portfolioSyncSearchLoadMoreButton();
};

window.portfolioRestoreDefaultProductGrid = function (navigationState) {
    console.log(`[Pharmacy Search] Resetting storefront to default category view.`);

    // Restore visibility of main category cards and subcategories row for Pharmacy
    const grid = document.getElementById('portfolio-products-grid');
    const preNav = navigationState || window.portfolioPreSearchNavState || null;
    const activeUser = window.portfolioPageController?.getActiveUser?.() || window.portfolioState?.activeUser || null;
    const activeSpecialty = window.portfolioActiveSpecialty?.getActive ? window.portfolioActiveSpecialty.getActive() : null;
    const isPharmacy = activeSpecialty ? !!activeSpecialty.isPharmacy : (typeof window.portfolioIsPharmacyUser === 'function' && window.portfolioIsPharmacyUser(activeUser));

    if (isPharmacy && preNav?.activeCategoryId && typeof window.portfolioRenderPharmacyCatalog === 'function' && grid) {
        const productsTitle = document.getElementById('portfolio-products-title');
        if (preNav.productsTitleHtml && productsTitle) {
            productsTitle.innerHTML = preNav.productsTitleHtml;
        }

        const state = window.PortfolioStore?.getState ? window.PortfolioStore.getState() : window.portfolioState;
        if (state) {
            state.showFeaturedOnly = !!preNav.showFeaturedOnly;
            const toggle = document.getElementById('filter-featured-toggle-switch');
            if (toggle) {
                if (state.showFeaturedOnly) toggle.classList.add('active');
                else toggle.classList.remove('active');
            }
        }

        const pharmacyResults = document.getElementById('pharmacy-filtered-products-container');
        if (pharmacyResults) pharmacyResults.remove();

        window.pharmacyActiveCategoryId = null;
        window.pharmacyActiveSubCategoryId = null;
        window.pharmacyRestoringState = {
            activeCategoryId: preNav.activeCategoryId,
            activeSubCategoryId: preNav.activeSubCategoryId,
            visibleCount: preNav.visibleCount,
            gridScroll: preNav.gridScroll,
            rowScroll: preNav.rowScroll,
            scroll: preNav.scroll ?? preNav.scrollY,
            scrollY: preNav.scrollY
        };

        window.portfolioRenderPharmacyCatalog({ isPharmacy: true, append: false, grid }).then(() => {
            if (typeof window.portfolioSyncSearchLoadMoreButton === 'function') {
                window.portfolioSyncSearchLoadMoreButton();
            }
            if (preNav.scrollY !== undefined || preNav.scroll !== undefined) {
                const targetTop = preNav.scroll ?? preNav.scrollY ?? 0;
                setTimeout(() => {
                    window.scrollTo({ left: preNav.scrollX || 0, top: targetTop, behavior: 'instant' });
                }, 120);
            }
        });
        return;
    }

    if (grid) {
        const categoryCards = grid.querySelectorAll('.pharmacy-category-card');
        categoryCards.forEach(card => card.style.display = '');
    }
    const subRow = document.getElementById('pharmacy-subcats-row');
    if (subRow) {
        // Only show if we have an active category selected, otherwise keep hidden
        if (window.pharmacyActiveCategoryId) {
            subRow.style.display = 'flex';
        } else {
            subRow.style.display = 'none';
        }
    }

    // Explicitly remove pharmacy search results containers if they exist
    const pharmacyResults = document.getElementById('pharmacy-filtered-products-container');
    if (pharmacyResults) pharmacyResults.remove();

    const pharmacyResultsTitle = document.querySelector('.pharmacy-search-results-title');
    if (pharmacyResultsTitle) pharmacyResultsTitle.remove();

    // Reset grid display
    if (grid) {
        grid.style.display = 'flex';
    }

    const baseProducts = window.portfolioGetBaseProductsForSearch();

    // Restore Title and Featured State if available
    if (preNav) {
        if (preNav.productsTitleHtml) {
            const titleEl = document.getElementById('portfolio-products-title');
            if (titleEl) titleEl.innerHTML = preNav.productsTitleHtml;
        }

        const state = window.PortfolioStore?.getState ? window.PortfolioStore.getState() : window.portfolioState;
        if (state) {
            state.showFeaturedOnly = preNav.showFeaturedOnly;
            // Sync toggle UI
            const toggle = document.getElementById('filter-featured-toggle-switch');
            if (toggle) {
                if (state.showFeaturedOnly) toggle.classList.add('active');
                else toggle.classList.remove('active');
            }
        }
    }

    if (typeof window.portfolioRenderProducts === 'function') {
        window.portfolioRenderProducts(baseProducts, false);
    }

    // Restore scroll after a short delay to allow rendering to settle
    if (preNav && (preNav.scrollX !== undefined || preNav.scrollY !== undefined)) {
        setTimeout(() => {
            window.scrollTo({
                left: preNav.scrollX || 0,
                top: preNav.scrollY || 0,
                behavior: 'smooth'
            });
        }, 100);
    }

    window.portfolioSyncSearchLoadMoreButton();
}

