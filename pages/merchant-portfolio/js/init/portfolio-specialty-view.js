/**
 * @file pages/merchant-portfolio/js/init/portfolio-specialty-view.js
 * @description Specialty view application helpers for merchant portfolio.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
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

    const firstEntry = specialtyProfile?.entries?.[0] || null;
    const isCarSales = String(firstEntry?.mainId || '') === '7' && String(firstEntry?.subId || '') === '1';
    const isRealEstateSales = String(firstEntry?.mainId || '') === '16';

    if (productsTitle && viewModel.catalogSectionTitle) {
        if (isCarSales) productsTitle.textContent = 'إعلانات السيارات';
        else if (isRealEstateSales) productsTitle.textContent = 'إعلانات العقارات';
        else productsTitle.textContent = viewModel.catalogSectionTitle;
    }

    if (featuredTitle && viewModel.featuredSectionTitle) {
        if (isCarSales) featuredTitle.textContent = 'سيارات مميزة';
        else if (isRealEstateSales) featuredTitle.textContent = 'عقارات مميزة';
        else featuredTitle.textContent = viewModel.featuredSectionTitle;
    }

    if (searchPanelTitle && viewModel.searchPanelTitle) {
        if (isCarSales) searchPanelTitle.textContent = 'بحث داخل السيارات';
        else if (isRealEstateSales) searchPanelTitle.textContent = 'بحث داخل العقارات';
        else searchPanelTitle.textContent = viewModel.searchPanelTitle;
    }

    let isPharmacy = false;
    if (specialtyProfile?.entries) {
        isPharmacy = specialtyProfile.entries.some((entry) => String(entry.subId) === '204');
    }
    if (!isPharmacy && user?.business_category) {
        const bc = user.business_category;
        if (typeof bc === 'string') {
            isPharmacy = bc.includes('204');
        } else if (Array.isArray(bc)) {
            isPharmacy = bc.some(c => String(c) === '204');
        }
    }

    if (productsSection) {
        if ((!isPharmacy && !viewModel.hasCatalogAccess) || viewModel.showProductsSection === false) {
            // Do not hide section if navigation restoration is actively running
            if (window.__portfolioRestorationActive) {
                console.log('[Diagnostic] applyPortfolioSpecialtyView: Keeping portfolio-products-section visible (restoration active).');
            } else {
                productsSection.style.display = 'none';
            }
        } else {
            productsSection.style.display = 'block';
        }
    }


    if (featuredSection && viewModel.showFeaturedSection === false) {
        featuredSection.style.display = 'none';
    }

    if (body) {
        body.dataset.primaryCategory = String(specialtyProfile?.primaryMainCategoryId || '');
        body.dataset.catalogPresentation = String(viewModel.catalogPresentation || '');
        body.dataset.businessMode = String(displayMeta?.modeBadgeLabel || '');
        body.dataset.behaviorType = String(specialtyProfile?.primaryBehavior?.typeKey || '');
        body.dataset.listingType = isCarSales ? 'cars' : (isRealEstateSales ? 'real_estate' : 'products');
        if (accent?.color) body.style.setProperty('--portfolio-specialty-accent', accent.color);
        if (accent?.soft) body.style.setProperty('--portfolio-specialty-accent-soft', accent.soft);
        if (accent?.border) body.style.setProperty('--portfolio-specialty-accent-border', accent.border);
    }

    if (mainContainer) {
        mainContainer.dataset.primaryCategory = String(specialtyProfile?.primaryMainCategoryId || '');
        mainContainer.dataset.catalogPresentation = String(viewModel.catalogPresentation || '');
        mainContainer.dataset.behaviorType = String(specialtyProfile?.primaryBehavior?.typeKey || '');
        mainContainer.dataset.listingType = isCarSales ? 'cars' : (isRealEstateSales ? 'real_estate' : 'products');
    }

    return viewModel;
}
