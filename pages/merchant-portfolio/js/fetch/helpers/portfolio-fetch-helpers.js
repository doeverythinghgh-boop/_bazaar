/**
 * @file portfolio-fetch-helpers.js
 * @description Helpers for product fetching (Specialty resolution, Pharmacy detection).
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

window.portfolioResolveFetchSpecialty = function (activeUser) {
    const PortfolioAPI = window.PortfolioAPI || {};
    return PortfolioAPI.resolveSpecialtyViewModel
        ? PortfolioAPI.resolveSpecialtyViewModel(activeUser)
        : (activeUser?.portfolio_view_model || null);
};

window.portfolioDetectPharmacyFromUser = function (activeUser, specialtyViewModel) {
    let isPharmacy = false;
    if (specialtyViewModel?.profile?.entries) {
        isPharmacy = specialtyViewModel.profile.entries.some((entry) => String(entry.subId) === '204');
    }
    if (!isPharmacy && activeUser?.business_category) {
        const bc = activeUser.business_category;
        if (typeof bc === 'string') {
            isPharmacy = bc.includes('204');
        } else if (Array.isArray(bc)) {
            isPharmacy = bc.some(c => String(c) === '204');
        }
    }
    return isPharmacy;
};
