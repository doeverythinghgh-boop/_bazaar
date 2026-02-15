/**
 * @file app-i18n.js
 * @description Internationalization and Translation module for the Bazaar application.
 * Manages loading, merging, and applying translations to the UI.
 */

/**
 * @description Applies translations to all elements with data-lkey attribute and sets page direction.
 * @function applyAppTranslations
 */
window.applyAppTranslations = function () {
  var lang = window.app_language || 'ar';

  // Set HTML dir and lang attributes
  var htmlRoot = document.getElementById('index-html-root');
  if (htmlRoot) {
    htmlRoot.setAttribute('lang', lang);
    htmlRoot.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  }

  // Translate DOM elements
  document.querySelectorAll('[data-lkey]').forEach(function (el) {
    var key = el.getAttribute('data-lkey');
    el.textContent = window.langu(key);
  });

  // Translate DOM Titles
  document.querySelectorAll('[data-lkey-title]').forEach(function (el) {
    var key = el.getAttribute('data-lkey-title');
    el.setAttribute('title', window.langu(key));
  });

  // Translate Placeholders
  document.querySelectorAll('[data-lkey-placeholder]').forEach(function (el) {
    var key = el.getAttribute('data-lkey-placeholder');
    el.setAttribute('placeholder', window.langu(key));
  });

  // Translate Page Title
  document.title = window.langu('page_title');

  // Final step: Ensure session-specific texts are correct
  if (typeof setUserNameInIndexBar === 'function') {
    const el = document.getElementById("index-login-text");
    if (el) {
      setUserNameInIndexBar();
    }
  }
};

/**
 * @description Loads translation files from server and merges them into window.appTranslations.
 * @async
 * @function loadIndexTranslations
 */
window.loadIndexTranslations = async function () {
  console.log('🔄 [Translations] Start loading translation files...');
  try {
    var timestamp = Date.now();
    var files = [
      'general', 'index', 'login', 'user-dashboard', 'profile-modal',
      'notifications', 'cart', 'sales-movement', 'product-view', 'search',
      'productAdd', 'productEdit', 'productAdd2', 'productEdit2', 'productView2',
      'register', 'location'
    ];

    // Create an array of fetch promises
    var promises = files.map(function (file) {
      var url = new URL('/lang/' + file + '.json?t=' + timestamp, window.location.origin).href;
      return fetch(url)
        .then(function (response) {
          if (!response.ok) {
            console.warn('⚠️ [Translations] Failed to load ' + file + '.json (Status: ' + response.status + ')');
            return {};
          }
          return response.json();
        })
        .catch(function (error) {
          console.error('❌ [Translations] Error loading ' + file + '.json:', error);
          return {};
        });
    });

    // Wait for all to complete
    var results = await Promise.all(promises);

    // Merge results
    window.appTranslations = {};
    results.forEach(function (data) {
      Object.assign(window.appTranslations, data);
    });

    console.log('✅ [Translations] All translation files loaded and merged successfully.');
    if (window.applyAppTranslations) window.applyAppTranslations();

  } catch (e) {
    console.error('❌ [Translations] Critical error during translation loading:', e);
  }
};

/**
 * @description Toggles between Arabic and English languages, saves to localStorage, and reloads the page.
 * @function toggleAppLanguage
 */
window.toggleAppLanguage = function () {
  var currentLang = localStorage.getItem('app_language') || 'ar';
  var newLang = currentLang === 'ar' ? 'en' : 'ar';
  localStorage.setItem('app_language', newLang);
  window.app_language = newLang; // Sync global variable

  console.log('[اللغة] تم تغيير اللغة إلى: ' + (newLang === 'ar' ? 'العربية' : 'الإنجليزية'));

  // [Android Bridge] Sync language change with native app
  if (window.Android && typeof window.Android.onLanguageChanged === 'function') {
    window.Android.onLanguageChanged(newLang);
  }

  var alertTitle = window.langu('alert_lang_change_title');
  var alertText = window.langu('alert_lang_change_text');
  var confirmButtonText = window.langu('alert_confirm_btn');

  // Show SweetAlert2 with manual confirmation button
  Swal.fire({
    title: alertTitle,
    text: alertText,
    icon: 'info',
    showConfirmButton: true,
    confirmButtonText: confirmButtonText,
    allowOutsideClick: false,
    allowEscapeKey: false,
    customClass: {
      popup: 'swal-modern-mini-popup',
      title: 'swal-modern-mini-title',
      htmlContainer: 'swal-modern-mini-text',
      confirmButton: 'swal-modern-mini-confirm'
    }
  }).then(function (result) {
    if (result.isConfirmed) {
      window.location.reload(); // Reload to apply language changes safely
    }
  });
};
