/**
 * @file app-theme.js
 * @description Theme management and visual identity module for the Bazaar application.
 * Handles Light/Dark mode switching and splash screen lifecycle.
 */

/**
 * @description Toggles between light and dark themes and saves preference to localStorage.
 * @function toggleAppTheme
 */
window.toggleAppTheme = function () {
  var isDark = document.body.classList.toggle('dark-theme');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');

  // Update Swal if open (sync with project rules for visual consistency)
  if (typeof Swal !== 'undefined' && Swal.isVisible()) {
    Swal.close();
  }
};

/**
 * @description Initializes the theme on page load based on saved preference.
 * @function initAppTheme
 */
window.initAppTheme = function () {
  if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-theme');
  }
};

/**
 * @description Hides the splash screen after the minimum required duration.
 * @function hideSplashScreen
 */
window.hideSplashScreen = function () {
  // Enforces 4s min duration as per project architecture note in index.js
  if (typeof window.hideSplashScreenOriginal === 'function') {
    window.hideSplashScreenOriginal();
  }
};
