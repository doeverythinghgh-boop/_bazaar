/**
 * @file pages/merchant-portfolio/js/portfolio-profile-core.js
 * @description Profile settings and specialty resolution helpers.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


window.portfolioResolveProfileSettings = function (user) {
    let settings = {};
    try {
        settings = typeof user.settings === 'string' ? JSON.parse(user.settings || '{}') : (user.settings || {});
    } catch (error) {
        if (window.PortfolioErrorUtils?.log) {
            window.PortfolioErrorUtils.log("PortfolioProfileCore", "Failed to parse profile settings; defaulting to empty object.", error);
        } else {
            console.error("[PortfolioProfileCore] Failed to parse profile settings.", error);
        }
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
