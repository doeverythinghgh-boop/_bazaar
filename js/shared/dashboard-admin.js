/**
 * @file js/shared/dashboard-admin.js
 * @description Admin panel logic and specialized admin actions for the dashboard.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


/**
 * @description Handles the click event on the Admin Panel button.
 *   Loads the admin panel page into the main container.
 * @function handleAdminPanelClick
 * @returns {void}
 */
window.handleAdminPanelClick = function () {
    window.location.href = "/pages/ADMIN/adminHub.html";
};
