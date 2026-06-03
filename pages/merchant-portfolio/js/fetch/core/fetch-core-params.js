/**
 * @file pages/merchant-portfolio/js/fetch/core/fetch-core-params.js
 * @description Parameter resolution and validation for product fetching.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 */

(function () {
    window.portfolioResolveFetchContext = function (userKey, store, PortfolioAPI) {
        const state = store?.getState ? store.getState() : window.portfolioState;
        const existingCacheUser = PortfolioAPI.loadCache ? PortfolioAPI.loadCache(userKey) : null;
        const activeUser = state?.activeUser || existingCacheUser?.user || null;

        const activeSpecialty = state?.activeSpecialty || null;
        const specialtyViewModel = activeSpecialty?.viewModel || (window.portfolioResolveFetchSpecialty ? window.portfolioResolveFetchSpecialty(activeUser) : null);
        const isPharmacy = activeSpecialty
            ? !!activeSpecialty.isPharmacy
            : (window.portfolioDetectPharmacyFromUser ? window.portfolioDetectPharmacyFromUser(activeUser, specialtyViewModel) : false);
        const firstEntry = specialtyViewModel?.profile?.entries?.[0] || null;
        const isCarSales = activeSpecialty
            ? !!activeSpecialty.isCarSales
            : (String(firstEntry?.mainId || '') === '7' && String(firstEntry?.subId || '') === '1');
        const isRealEstateSales = activeSpecialty
            ? !!activeSpecialty.isRealEstateSales
            : (String(firstEntry?.mainId || '') === '16');

        return { state, activeUser, specialtyViewModel, activeSpecialty, isPharmacy, isCarSales, isRealEstateSales };
    };

    window.portfolioCheckCatalogAccess = function (specialtyViewModel, isPharmacy) {
        if (specialtyViewModel && ((!isPharmacy && !specialtyViewModel.hasCatalogAccess) || specialtyViewModel.showProductsSection === false)) {
            console.log(`[Mirror][Skip] Catalog access denied or disabled for this profile.`);
            return false;
        }
        return true;
    };
})();
