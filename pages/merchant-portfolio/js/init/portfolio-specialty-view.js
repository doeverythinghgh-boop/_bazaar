/**
 * @file pages/merchant-portfolio/js/init/portfolio-specialty-view.js
 * @description Specialty view application helpers for merchant portfolio.
 */

function applyPortfolioSpecialtyView(user) {
    const viewModel = user?.portfolio_view_model || (typeof window.resolvePortfolioSpecialtyViewModel === 'function'
        ? window.resolvePortfolioSpecialtyViewModel(user)
        : null);
    const specialtyProfile = viewModel?.profile || user?.specialty_profile || (typeof window.buildBusinessSpecialtyProfile === 'function'
        ? window.buildBusinessSpecialtyProfile(user)
        : null);
    const displayMeta = typeof window.resolveBusinessSpecialtyDisplayMeta === 'function'
        ? window.resolveBusinessSpecialtyDisplayMeta(specialtyProfile || user)
        : null;
    const accent = typeof window.resolveBusinessSpecialtyAccent === 'function'
        ? window.resolveBusinessSpecialtyAccent(specialtyProfile || user)
        : null;

    const productsSection = document.getElementById('portfolio-products-section');
    const featuredSection = document.getElementById('commercial-featured-section');
    const productsTitle = document.getElementById('portfolio-products-title');
    const featuredTitle = document.getElementById('commercial-featured-section-title');
    const searchPanelTitle = document.getElementById('portfolio-inline-search-title');
    const body = document.getElementById('port-body') || document.body;
    const mainContainer = document.getElementById('portfolio-main-container');

    if (!viewModel) return null;

    if (productsTitle && viewModel.catalogSectionTitle) {
        productsTitle.textContent = viewModel.catalogSectionTitle;
    }

    if (featuredTitle && viewModel.featuredSectionTitle) {
        featuredTitle.textContent = viewModel.featuredSectionTitle;
    }

    if (searchPanelTitle && viewModel.searchPanelTitle) {
        searchPanelTitle.textContent = viewModel.searchPanelTitle;
    }

    if (productsSection && (!viewModel.hasCatalogAccess || viewModel.showProductsSection === false)) {
        productsSection.style.display = 'none';
    }

    if (featuredSection && viewModel.showFeaturedSection === false) {
        featuredSection.style.display = 'none';
    }

    if (body) {
        body.dataset.primaryCategory = String(specialtyProfile?.primaryMainCategoryId || '');
        body.dataset.catalogPresentation = String(viewModel.catalogPresentation || '');
        body.dataset.businessMode = String(displayMeta?.modeBadgeLabel || '');
        body.dataset.behaviorType = String(specialtyProfile?.primaryBehavior?.typeKey || '');
        if (accent?.color) body.style.setProperty('--portfolio-specialty-accent', accent.color);
        if (accent?.soft) body.style.setProperty('--portfolio-specialty-accent-soft', accent.soft);
        if (accent?.border) body.style.setProperty('--portfolio-specialty-accent-border', accent.border);
    }

    if (mainContainer) {
        mainContainer.dataset.primaryCategory = String(specialtyProfile?.primaryMainCategoryId || '');
        mainContainer.dataset.catalogPresentation = String(viewModel.catalogPresentation || '');
        mainContainer.dataset.behaviorType = String(specialtyProfile?.primaryBehavior?.typeKey || '');
    }

    return viewModel;
}
