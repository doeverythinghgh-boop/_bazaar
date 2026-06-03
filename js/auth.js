/**
 * @file js/auth.js
 * @description Manages authentication state and user login.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

/**
 * @description Logs out the user by removing their data from local storage and redirecting to `index.html`.
 * @function logout
 * @async
 */
export async function logout() {
  if (typeof Swal === 'undefined') {
    console.error("[Auth] Swal is not available for logout confirmation.");
    if (window.SessionManager) await window.SessionManager.logout();
    return;
  }

  Swal.fire({
    title: window.langu ? window.langu("logout_confirm_title") : "Logout",
    text: window.langu ? window.langu("logout_confirm_text") : "Are you sure you want to log out?",
    showCancelButton: true,
    confirmButtonText: window.langu ? window.langu("logout_confirm_btn") : "Yes",
    cancelButtonText: window.langu ? window.langu("alert_cancel_btn") : "Cancel",
    showLoaderOnConfirm: true,
    customClass: {
      popup: 'swal-modern-mini-popup',
      title: 'swal-modern-mini-title',
      htmlContainer: 'swal-modern-mini-text',
      confirmButton: 'swal-modern-mini-confirm',
      cancelButton: 'swal-modern-mini-cancel'
    },
    buttonsStyling: false,
    preConfirm: async () => {
      if (window.SessionManager?.logout) {
        await window.SessionManager.logout();
      } else {
        console.error("[Auth] SessionManager.logout is not available.");
      }
    },
    allowOutsideClick: () => !Swal.isLoading(),
  });
}

// Hybrid bridge
window.logout = logout;

console.log("[ESM Load] auth.js: Hybrid bridge established.");
