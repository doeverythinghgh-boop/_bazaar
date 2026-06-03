/**
 * @file pages/merchant-portfolio/js/portfolio-render-products.js
 * @description Orchestrates merchant portfolio product rendering.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


function portfolioResolveRenderContext() {
    const PortfolioAPI = window.PortfolioAPI || {};
    const state = window.PortfolioStore?.getState ? window.PortfolioStore.getState() : window.portfolioState;
    const userKey = new URLSearchParams(window.location.search).get('user_key');
    const cache = PortfolioAPI.loadCache ? PortfolioAPI.loadCache(userKey) : null;
    const activeUser = state?.activeUser || cache?.user || null;
    const specialtyViewModel = state?.activeSpecialty?.viewModel || (PortfolioAPI.resolveSpecialtyViewModel
        ? (activeUser?.portfolio_view_model || (activeUser ? PortfolioAPI.resolveSpecialtyViewModel(activeUser) : null))
        : null);
    let isPharmacy = false;
    if (state?.activeSpecialty) {
        isPharmacy = !!state.activeSpecialty.isPharmacy;
    } else if (specialtyViewModel?.profile?.entries) {
        isPharmacy = specialtyViewModel.profile.entries.some((entry) => String(entry.subId) === '204');
    }
    if (!state?.activeSpecialty && !isPharmacy && activeUser?.business_category) {
        const bc = activeUser.business_category;
        if (typeof bc === 'string') {
            isPharmacy = bc.includes('204');
        } else if (Array.isArray(bc)) {
            isPharmacy = bc.some(c => String(c) === '204');
        }
    }

    return { specialtyViewModel, isPharmacy };
}

async function renderActualProducts(products, append, grid, specialtyViewModel, isPharmacy = false) {
    const state = window.PortfolioStore?.getState ? window.PortfolioStore.getState() : window.portfolioState;
    portfolioApplyBaseGridState(grid, append);

    const productsToRender = portfolioGetProductsToRender(products, state);
    const fullCatalogProducts = portfolioGetProductsToRender(state?.allProducts || productsToRender, state);
    portfolioRenderEmptyState(grid, productsToRender, append, specialtyViewModel);

    const permissions = {
        ...portfolioGetRenderPermissions(),
        showManagementActions: isPharmacy || grid?.dataset?.managementSurface === 'true'
    };
    const shouldVirtualize = grid.id === 'portfolio-products-grid' && (
        fullCatalogProducts.length > 80 ||
        grid.dataset?.portfolioVirtualized === 'true'
    );
    if (shouldVirtualize) {
        portfolioVirtualRender(grid, fullCatalogProducts, specialtyViewModel, permissions);
        return;
    }

    portfolioClearVirtualization(grid);
    await portfolioAppendProductCards(grid, productsToRender, specialtyViewModel, permissions);
}

function portfolioRenderProducts(products, append = false) {
    const grid = document.getElementById('portfolio-products-grid');
    if (!grid) return;

    const renderContext = portfolioResolveRenderContext();

    if (typeof window.portfolioRenderPharmacyCatalog === 'function') {
        window.portfolioRenderPharmacyCatalog({
            isPharmacy: renderContext.isPharmacy,
            append,
            grid
        }).then((handled) => {
            if (!handled) {
                renderActualProducts(products, append, grid, renderContext.specialtyViewModel, renderContext.isPharmacy).catch((error) => {
                    console.error('[Portfolio] Product render failed:', error);
                });
            }
        }).catch((error) => {
            console.error('[Portfolio] Pharmacy render fallback:', error);
            renderActualProducts(products, append, grid, renderContext.specialtyViewModel, renderContext.isPharmacy).catch((renderError) => {
                console.error('[Portfolio] Product render failed:', renderError);
            });
        });
        return;
    }

    renderActualProducts(products, append, grid, renderContext.specialtyViewModel, renderContext.isPharmacy).catch((error) => {
        console.error('[Portfolio] Product render failed:', error);
    });
}

window.portfolioRenderProducts = portfolioRenderProducts;
