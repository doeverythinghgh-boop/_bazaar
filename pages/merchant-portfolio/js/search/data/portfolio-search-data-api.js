/**
 * @file portfolio-search-data-api.js
 * @description API data source fetching for merchant search.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

window.portfolioFetchSellerSearchSource = async function (userKey) {
    const activeUser = (window.PortfolioStore?.getState ? window.PortfolioStore.getState()?.activeUser : window.portfolioState?.activeUser) || null;
    const storeState = window.PortfolioStore?.getState ? window.PortfolioStore.getState() : window.portfolioState;
    const activeSpecialty = storeState?.activeSpecialty || null;
    const viewModel = activeSpecialty?.viewModel || (typeof window.resolvePortfolioSpecialtyViewModel === 'function' && activeUser
        ? (activeUser.portfolio_view_model || window.resolvePortfolioSpecialtyViewModel(activeUser))
        : null);
    const firstEntry = viewModel?.profile?.entries?.[0] || null;
    const isCarSales = activeSpecialty
        ? !!activeSpecialty.isCarSales
        : (String(firstEntry?.mainId || '') === '7' && String(firstEntry?.subId || '') === '1');

    if (isCarSales && typeof window.PortfolioAPI?.fetchCars === 'function') {
        return await window.PortfolioAPI.fetchCars({ userKey, limit: 100, offset: 0 });
    }

    if (activeSpecialty && !activeSpecialty.isPharmacy && typeof window.PortfolioAPI?.fetchProducts === 'function') {
        return await window.PortfolioAPI.fetchProducts({
            userKey,
            limit: 100,
            offset: 0,
            mainCategory: activeSpecialty.mainId,
            subCategory: activeSpecialty.subId
        });
    }

    if (window.portfolioPageController?.fetchAllProductsForUser) {
        return await window.portfolioPageController.fetchAllProductsForUser(userKey);
    }

    const params = new URLSearchParams();
    params.append('user_key', userKey);
    params.append('limit', '100');
    return await apiFetch(`/api/products?${params.toString()}`);
};
