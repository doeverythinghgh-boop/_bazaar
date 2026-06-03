/**
 * @file app-config.js
 * @description Configuration and versioning management module for the Bazaar application.
 * Handles static notification policy bootstrapping and periodic update checks.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

/**
 * @description Initializes static notification policy state.
 * @async
 * @function loadNotificationConfig
 */
export const loadNotificationConfig = async () => {
  window.globalNotificationConfig = null;
  console.log('[Config] Notification delivery policy is static and loaded from code.');
};

/**
 * @description Performs a periodic version check to ensure PWA assets are fresh.
 * @async
 * @function startPeriodicVersionCheck
 */
export const startPeriodicVersionCheck = () => {
  if (window.AppBehavior && window.AppBehavior.enablePWA === false) return;
  if (window.Android) return; // Skip for Native Android

  setInterval(async function () {
    var lastCheck = LocalDBStorage.getItem('last_version_check_time');
    var now = Date.now();
    var ONE_HOUR = 60 * 60 * 1000;

    if (!lastCheck || (now - parseInt(lastCheck, 10)) > ONE_HOUR) {
      console.log("[VersionCheck] Hourly check triggered.");
      if (typeof window.checkAppVersionAndClearData === 'function') {
        await window.checkAppVersionAndClearData();
      }
    }
  }, 60 * 1000); // Check every minute if 1 hour passed
};

// Hybrid bridge
window.loadNotificationConfig = loadNotificationConfig;
window.startPeriodicVersionCheck = startPeriodicVersionCheck;

console.log("[ESM Load] app-config.js: Hybrid bridge established.");
