/**
 * @file pages/merchant-portfolio/js/actions/portfolio-action-setup-helpers.js
 * @description Action setup helpers for merchant portfolio page.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


function portfolioSyncActionSetupState(user) {
    const nextSpecialtyView = typeof window.resolvePortfolioSpecialtyViewModel === 'function'
        ? (user?.portfolio_view_model || window.resolvePortfolioSpecialtyViewModel(user))
        : null;

    if (window.PortfolioStore?.patch) {
        const currentState = window.PortfolioStore.getState();
        if (currentState?.specialtyViewModel !== nextSpecialtyView) {
            window.PortfolioStore.patch({
                specialtyViewModel: nextSpecialtyView
            }, {
                source: 'actions-setup'
            });
        }
        return;
    }

    if (!window.portfolioState) window.portfolioState = {};
    window.portfolioState.activeUser = user;
    if (nextSpecialtyView) {
        window.portfolioState.specialtyViewModel = nextSpecialtyView;
    }
}

function portfolioResolveCurrentSessionUser() {
    return typeof SessionManager !== 'undefined' ? SessionManager.getUser() : null;
}

function portfolioSetupCoreActions(user, currentUser) {
    if (typeof window.portfolioSetupContactActions === 'function') {
        window.portfolioSetupContactActions(user);
    }

    if (typeof window.portfolioSetupRatingAction === 'function') {
        window.portfolioSetupRatingAction(user, currentUser);
    }

    if (typeof window.portfolioSetupProductToolbarActions === 'function') {
        window.portfolioSetupProductToolbarActions(user, currentUser);
    }
}
