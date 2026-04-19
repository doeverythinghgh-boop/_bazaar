/**
 * @file pages/merchant-portfolio/js/portfolio-profile-core.js
 * @description Profile settings and specialty resolution helpers.
 */

window.portfolioResolveProfileSettings = function (user) {
    let settings = {};
    try {
        settings = typeof user.settings === 'string' ? JSON.parse(user.settings || '{}') : (user.settings || {});
    } catch (e) {
        settings = {};
    }
    return settings;
};

window.portfolioResolveSpecialtyProfileData = function (user) {
    const specialtyViewModel = typeof window.resolvePortfolioSpecialtyViewModel === 'function'
        ? (user?.portfolio_view_model || window.resolvePortfolioSpecialtyViewModel(user))
        : null;
    const specialtyProfile = specialtyViewModel?.profile || user?.specialty_profile || (
        typeof window.buildBusinessSpecialtyProfile === 'function'
            ? window.buildBusinessSpecialtyProfile(user)
            : null
    );
    const specialtyDisplayMeta = typeof window.resolveBusinessSpecialtyDisplayMeta === 'function'
        ? window.resolveBusinessSpecialtyDisplayMeta(specialtyProfile || user)
        : null;
    const specialtyAccent = typeof window.resolveBusinessSpecialtyAccent === 'function'
        ? window.resolveBusinessSpecialtyAccent(specialtyProfile || user)
        : null;

    user.portfolio_view_model = specialtyViewModel || null;
    user.specialty_profile = specialtyProfile || null;

    return { specialtyViewModel, specialtyProfile, specialtyDisplayMeta, specialtyAccent };
};
