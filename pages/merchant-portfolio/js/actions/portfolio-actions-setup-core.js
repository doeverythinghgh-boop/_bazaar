/**
 * RULE: All comments and documentation must be in English only.
 * WARNING: Hover effects are strictly prohibited on this page to ensure touch-device compatibility.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
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
