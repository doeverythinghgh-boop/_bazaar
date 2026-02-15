/**
 * @file app-config.js
 * @description Configuration and versioning management module for the Bazaar application.
 * Handles fetching global settings and periodic update checks.
 */

/**
 * @description Loads global notification configurations from the server (R2 or Local fallback).
 * @async
 * @function loadNotificationConfig
 */
window.loadNotificationConfig = async function () {
  try {
    var r2Url = typeof getPublicR2FileUrl === 'function' ? getPublicR2FileUrl('notification_config.json') : null;
    var timestamp = new Date().getTime();
    var response = null;

    if (r2Url) {
      response = await fetch(r2Url + '?t=' + timestamp);
    }

    if (response && response.ok) {
      window.globalNotificationConfig = await response.json();
      console.log('✅ [Config] Notification settings loaded from R2 successfully.');
    } else {
      // Fallback to local file if R2 fails
      console.warn('⚠️ [Config] Loading from R2 failed, trying local fallback...');
      var localResponse = await fetch('/notification/notification_config.json?t=' + timestamp);
      if (localResponse.ok) {
        window.globalNotificationConfig = await localResponse.json();
        console.log('✅ [Config] Notification settings loaded from local file successfully.');
      } else {
        console.error('❌ [Config] Local fallback failed too (Status: ' + localResponse.status + ')');
      }
    }
  } catch (error) {
    console.error('❌ [Config] Critical error during notification config loading:', error);
  }
};

/**
 * @description Performs a periodic version check to ensure PWA assets are fresh.
 * @async
 * @function startPeriodicVersionCheck
 */
window.startPeriodicVersionCheck = function () {
  if (window.Android) return; // Skip for Native Android

  setInterval(async function () {
    var lastCheck = localStorage.getItem('last_version_check_time');
    var now = Date.now();
    var ONE_HOUR = 60 * 60 * 1000;

    if (!lastCheck || (now - parseInt(lastCheck)) > ONE_HOUR) {
      console.log("[VersionCheck] Hourly check triggered.");
      if (typeof checkAppVersionAndClearData === 'function') {
        await checkAppVersionAndClearData();
      }
    }
  }, 60 * 1000); // Check every minute if 1 hour passed
};
