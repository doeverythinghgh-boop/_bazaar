/**
 * RULE: All comments and documentation must be in English only.
 * WARNING: Hover effects are strictly prohibited on this page to ensure touch-device compatibility.
 */
/**
 * @file pages/merchant-portfolio/js/portfolio-actions-setup-core.js
 * @description Orchestrates action setup for the merchant portfolio page.
 */

window.portfolioSetupActions = function (user) {
    portfolioSyncActionSetupState(user);
    const currentUser = portfolioResolveCurrentSessionUser();
    portfolioSetupCoreActions(user, currentUser);
};
