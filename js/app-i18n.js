/**
 * @file app-i18n.js
 * @description Internationalization and Translation module for the Bazaar application.
 * Manages loading, merging, and applying translations to the UI.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

/**
 * @description Syncs the application language from native environment or storage.
 * @function syncAppLanguageFromNative
 * @returns {string}
 */
export const syncAppLanguageFromNative = () => {
  if (typeof window.resolveInitialAppLanguage !== 'function') {
    return window.app_language || LocalDBStorage.getItem('app_language') || 'ar';
  }

  var resolvedLang = window.resolveInitialAppLanguage();
  window.app_language = resolvedLang;
  return resolvedLang;
};

/**
 * @description Applies the active language direction to the current document.
 * @function applyAppLanguageToDocument
 * @param {string} [lang]
 */
export const applyAppLanguageToDocument = (lang) => {
  var resolvedLang = lang || window.app_language || 'ar';
  var htmlRoot = document.documentElement;
  if (!htmlRoot) return;

  htmlRoot.setAttribute('lang', resolvedLang);
  htmlRoot.setAttribute('dir', resolvedLang === 'ar' ? 'rtl' : 'ltr');
};

/**
 * @description Applies translations to all elements with translation data attributes.
 * @function applyAppTranslations
 */
export const applyAppTranslations = () => {
  var lang = window.app_language || 'ar';

  if (typeof applyAppLanguageToDocument === 'function') {
    applyAppLanguageToDocument(lang);
  }

  document.querySelectorAll('[data-lkey]').forEach(function (el) {
    var key = el.getAttribute('data-lkey');
    var value = window.langu(key);
    if (typeof value === 'string' || typeof value === 'number') {
      el.textContent = value;
    }
  });

  document.querySelectorAll('[data-lkey-html]').forEach(function (el) {
    var key = el.getAttribute('data-lkey-html');
    var value = window.langu(key);
    if (typeof value === 'string') {
      el.innerHTML = value;
    }
  });

  document.querySelectorAll('[data-lkey-title]').forEach(function (el) {
    var key = el.getAttribute('data-lkey-title');
    var value = window.langu(key);
    if (typeof value === 'string' || typeof value === 'number') {
      el.setAttribute('title', value);
    }
  });

  document.querySelectorAll('[data-lkey-placeholder]').forEach(function (el) {
    var key = el.getAttribute('data-lkey-placeholder');
    var value = window.langu(key);
    if (typeof value === 'string' || typeof value === 'number') {
      el.setAttribute('placeholder', value);
    }
  });

  document.querySelectorAll('[data-lkey-alt]').forEach(function (el) {
    var key = el.getAttribute('data-lkey-alt');
    var value = window.langu(key);
    if (typeof value === 'string' || typeof value === 'number') {
      el.setAttribute('alt', value);
    }
  });

  document.querySelectorAll('[data-lkey-aria-label]').forEach(function (el) {
    var key = el.getAttribute('data-lkey-aria-label');
    var value = window.langu(key);
    if (typeof value === 'string' || typeof value === 'number') {
      el.setAttribute('aria-label', value);
    }
  });

  var pageTitle = window.langu('page_title');
  if (pageTitle && pageTitle !== 'page_title') {
    document.title = pageTitle;
  }

  if (typeof window.setUserNameInIndexBar === 'function') {
    var el = document.getElementById('index-login-text');
    if (el) {
      window.setUserNameInIndexBar();
    }
  }
};

/**
 * @description Loads translation files from server and merges them into window.appTranslations.
 * Uses an in-page promise cache to avoid duplicate fetches.
 * @async
 * @function loadIndexTranslations
 * @returns {Promise<object>}
 */
export const loadIndexTranslations = async () => {
  if (typeof syncAppLanguageFromNative === 'function') {
    syncAppLanguageFromNative();
  }

  if (window._translationsLoadPromise) {
    return window._translationsLoadPromise;
  }

  console.log('[Translations] Start loading translation files...');

  window._translationsLoadPromise = (async function () {
    try {
      var timestamp = Date.now();
      var files = ['core', 'identity', 'marketplace', 'product_mgmt', 'transactional', 'admin', 'pharmacy'];

      var promises = files.map(function (file) {
        var url = new URL('/lang/' + file + '.json?t=' + timestamp, window.location.origin).href;
        return fetch(url)
          .then(function (response) {
            if (!response.ok) {
              console.warn('[Translations] Failed to load ' + file + '.json (Status: ' + response.status + ')');
              return {};
            }
            return response.json();
          })
          .catch(function (error) {
            console.error('[Translations] Error loading ' + file + '.json:', error);
            return {};
          });
      });

      var results = await Promise.all(promises);

      window.appTranslations = window.appTranslations || {};
      results.forEach(function (data) {
        Object.assign(window.appTranslations, data);
      });

      console.log('[Translations] All translation files loaded and merged successfully.');

      if (typeof applyAppTranslations === 'function') {
        applyAppTranslations();
      }

      if (typeof window.syncSplashSlogansToAndroid === 'function') {
        window.syncSplashSlogansToAndroid();
      }

      return window.appTranslations;
    } catch (e) {
      console.error('[Translations] Critical error during translation loading:', e);
      return window.appTranslations || {};
    }
  })();

  return window._translationsLoadPromise;
};

/**
 * @description Toggles between Arabic and English languages, saves to LocalDBStorage, and reloads the page.
 * @function toggleAppLanguage
 */
export const toggleAppLanguage = () => {
  var currentLang = LocalDBStorage.getItem('app_language') || 'ar';
  var newLang = currentLang === 'ar' ? 'en' : 'ar';
  LocalDBStorage.setItem('app_language', newLang);
  window.app_language = newLang;

  console.log('[Language] Changed to: ' + newLang);

  if (window.BridgeManager && typeof window.BridgeManager.invoke === 'function') {
    window.BridgeManager.invoke('onLanguageChanged', newLang);
  }

  window.location.reload();
};

// Hybrid bridge
window.syncAppLanguageFromNative = syncAppLanguageFromNative;
window.applyAppLanguageToDocument = applyAppLanguageToDocument;
window.applyAppTranslations = applyAppTranslations;
window.loadIndexTranslations = loadIndexTranslations;
window.toggleAppLanguage = toggleAppLanguage;

console.log("[ESM Load] app-i18n.js: Hybrid bridge established.");
