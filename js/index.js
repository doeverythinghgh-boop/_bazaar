/**
 * @file index.js
 * @description Main entry point and bootstrapper for the Bazaar application.
 * Orchestrates the initialization of all specialized modules (i18n, Theme, Nav, etc.)
 * after the DOM content is fully loaded.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


/**
 * @event DOMContentLoaded
 * @description Initializes the application on page load.
 * @async
 */
document.addEventListener("DOMContentLoaded", async function () {
  const pwaEnabled = !window.AppBehavior || window.AppBehavior.enablePWA !== false;
  // [1] Environment Check & Immediate Android Navigation
  const bootStart = performance.now();
  if (window.Android) {
    const bridgeReady = (typeof window.BridgeManager !== 'undefined');
    const params = new URLSearchParams(window.location.search);
    const targetPage = params.get('target');
    console.log(`[Boot] Native Android Detected. Bridge status: ${bridgeReady ? 'READY' : 'MISSING'}`);

    // [Android Core Logic] Skip splash.js entirely and navigate immediately.
    // This bypasses any leftover PWA failsafes or timers.
    if (targetPage) {
      console.log(`[Target] Android notification launch detected. Navigating to: ${targetPage}`);
      window.location.href = targetPage;
    } else {
      console.log("[Target] Android Route: Bypassing Splash.js logic. Navigating to home.html.");
      window.location.href = "/pages/home/home.html";
    }


    if (typeof syncSplashSlogansToAndroid === 'function') {
      syncSplashSlogansToAndroid();
    }

    const elapsed = (performance.now() - bootStart).toFixed(2);
    console.log(`[Boot] Android initialization sequence complete in ${elapsed}ms.`);
    return; // Stop execution here for Android
  }

  console.log("[Bridge] Standard Web / PWA Environment.");

  // [2] Core Initializations (PWA Only)
  if (typeof fetchAppCategories === 'function') await fetchAppCategories();
  if (typeof initAppTheme === 'function') window.initAppTheme();

  // [3] Preferences Setup
  if (!LocalDBStorage.getItem('app_language')) {
    LocalDBStorage.setItem('app_language', 'ar');
  }

  // [4] Translation Loading
  if (typeof loadIndexTranslations === 'function') await window.loadIndexTranslations();
  if (window.applyAppTranslations) window.applyAppTranslations();

  // [5] (Handled in Step 1/Bridge Sync section above for Android)

  // [6] Version Check and Config
  if (typeof loadNotificationConfig === 'function') await window.loadNotificationConfig();
  if (typeof startPeriodicVersionCheck === 'function') window.startPeriodicVersionCheck();
  if (typeof checkAppVersionAndClearData === 'function') {
    await checkAppVersionAndClearData();
  }

  // [7] Session & UI State
  if (typeof SessionManager !== 'undefined') SessionManager.init();
  if (typeof updateCartBadge === 'function') updateCartBadge();

  // [8] Default Navigation or Pending Action
  var pendingAction = LocalDBStorage.getItem('pendingAction');
  if (pendingAction) {
    LocalDBStorage.removeItem('pendingAction');
    switch (pendingAction) {
      case 'login': window.handleLoginButtonClick(); break;
      case 'search': window.handleSearchButtonClick(); break;
      case 'sales': document.getElementById("index-sales-movement-btn")?.click(); break;
      case 'notifications': window.handleNotificationsButtonClick(); break;
      case 'cart': document.getElementById("index-cart-btn")?.click(); break;
      default: window.handleHomeButtonClick();
    }
  } else if (!pwaEnabled) {
    console.log("[Index] PWA disabled. Navigating directly to home.html.");
    window.location.href = "/pages/home/home.html";
    return;
  } else {
    // Note: Redirection to home.html is now handled by splash.js after its animation completes.
    console.log("[Index] Waiting for splash screen completion before navigation.");
  }

  // [9] Bind Events & Logic
  if (typeof bindNavigationHandlers === 'function') window.bindNavigationHandlers();
  if (typeof checkImpersonationMode === 'function') checkImpersonationMode();
  if (typeof runHeaderScrollTutorial === 'function') window.runHeaderScrollTutorial();

  // [10] Set Home as Active
  var homeBtn = document.getElementById("index-home-btn");
  if (homeBtn && typeof setActiveButton === 'function') {
    window.setActiveButton(homeBtn);
  }

  // [11] Hide Splash Screen Trigger (PWA Only)
  if (typeof window.hideSplashScreen === 'function') {
    window.hideSplashScreen();
  }
});
