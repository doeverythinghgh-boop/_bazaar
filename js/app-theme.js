/**
 * @file app-theme.js
 * @description Theme management and visual identity module for the Bazaar application.
 * Handles Light/Dark mode switching and splash screen lifecycle.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

/**
 * @description Toggles between light and dark themes and saves preference to LocalDBStorage.
 * @function toggleAppTheme
 */
export const toggleAppTheme = () => {
  var isDark = document.body.classList.toggle('dark-theme');
  LocalDBStorage.setItem('theme', isDark ? 'dark' : 'light');
  // Sync data-theme attribute for CSS compatibility (used by portfolio and other pages)
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');

  // Update Swal if open (sync with project rules for visual consistency)
  if (typeof Swal !== 'undefined' && Swal.isVisible()) {
    Swal.close();
  }
};

/**
 * @description Initializes the theme on page load based on saved preference.
 * @function initAppTheme
 */
export const initAppTheme = () => {
  if (LocalDBStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-theme');
    // Sync data-theme attribute for CSS compatibility (used by portfolio and other pages)
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
  }
};

/**
 * @description Hides the splash screen after the minimum required duration.
 * @function hideSplashScreen
 */
export const hideSplashScreen = () => {
  // Enforces 4s min duration as per project architecture note in index.js
  if (typeof window.hideSplashScreenOriginal === 'function') {
    window.hideSplashScreenOriginal();
  }
};

// Hybrid bridge
window.toggleAppTheme = toggleAppTheme;
window.initAppTheme = initAppTheme;
window.hideSplashScreen = hideSplashScreen;

console.log("[ESM Load] app-theme.js: Hybrid bridge established.");
