/**
 * @file pages/register/js/register-role-helpers.js
 * @description Account role and authenticated redirect helpers for the registration page.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

/**
 * @description Returns the selected account type from the role form.
 * @returns {number}
 */
function registerGetSelectedAccountType() {
    const roles = (window.UserFormService && typeof window.UserFormService.getSelectedAccountType === 'function')
        ? window.UserFormService.getSelectedAccountType('.role-checkbox', 1)
        : (window.ACCOUNT_ROLES?.BUYER || 1);

    return roles | 1;
}

/**
 * @description Returns true if the selected account type is a business role.
 * @returns {boolean}
 */
function registerHasBusinessRole() {
    if (window.UserFormService && typeof window.UserFormService.isBusinessAccount === 'function') {
        return window.UserFormService.isBusinessAccount(registerGetSelectedAccountType());
    }

    return registerGetSelectedAccountType() > (window.ACCOUNT_ROLES?.BUYER || 1);
}

/**
 * @description Returns true if the given account type has access to a business portfolio.
 * @param {number|string} accountType
 * @returns {boolean}
 */
function registerHasBusinessPortfolioAccess(accountType) {
    const roles = parseInt(accountType || window.ACCOUNT_ROLES?.BUYER || 1, 10) || 1;
    return !!(
        typeof window.checkRole === 'function' &&
        window.checkRole(roles, window.ACCOUNT_ROLES?.SERVICE_PROVIDER || 32)
    );
}

/**
 * @description Resolves the correct post-authentication redirect URL for the given user.
 * @param {object} user
 * @returns {string}
 */
function registerResolveAuthenticatedRedirect(user) {
    if (typeof window.resolveUserLandingPage === 'function') {
        return window.resolveUserLandingPage(user);
    }

    if (!user || user.user_key === 'guest_user') {
        return '/pages/home/home.html';
    }

    if (registerHasBusinessPortfolioAccess(user.account_type)) {
        return `/pages/merchant-portfolio/merchant-portfolio.html?user_key=${user.user_key}`;
    }

    return '/pages/home/home.html';
}

// Hybrid bridge — preserve global access for legacy scripts during transition
window.registerGetSelectedAccountType  = registerGetSelectedAccountType;
window.registerHasBusinessRole         = registerHasBusinessRole;
window.registerHasBusinessPortfolioAccess = registerHasBusinessPortfolioAccess;
window.registerResolveAuthenticatedRedirect = registerResolveAuthenticatedRedirect;

console.log('[ESM Load] register-role-helpers.js: Hybrid bridge established.');
