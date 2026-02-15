/**
 * @file js/tools.js
 * @description Provides general helper functions for text and number formatting, session management, local storage interaction, and triggering alerts.
 */

/**
 * @description Checks for an original admin session (originalAdminSession) in local storage.
 *   If found, displays a watermark indicating that the admin is browsing as another user.
 * @function checkImpersonationMode
 * @returns {void}
 */
function checkImpersonationMode() {
  const isImpersonating = SessionManager.isImpersonating();

  if (isImpersonating) {
    // If found, create HTML element for watermark and add to page.
    if (!document.querySelector(".admin-watermark")) {
      const watermark = document.createElement("div");
      watermark.className = "admin-watermark";
      watermark.innerHTML = `
            <i class="fas fa-user-shield"></i>
            <span>${langu('admin_mode_watermark')}</span>
            `;
      document.body.appendChild(watermark);
    }
  } else {
    const watermark = document.querySelector(".admin-watermark");
    if (watermark) {
      watermark.remove();
    }
  }
}

/**
 * @description Converts Hindi digits (0-9) to English digits (0-9) in a string.
 *   Useful for processing user inputs that may contain digits in either format.
 * @function normalizeDigits
 * @param {string} str - String that may contain digits.
 * @returns {string} - String after converting digits to English format.
 */
function normalizeDigits(str) {
  if (!str) return "";
  const easternArabicNumerals = /[\u0660-\u0669]/g; // Eastern Arabic (Hindi) numerals range
  return str.replace(easternArabicNumerals, (d) => d.charCodeAt(0) - 0x0660);
}

/**
 * @description Sanitizes and normalizes Arabic text by removing diacritics and unifying character forms (Hamzas and Taa Marbuta).
 *   Very useful for search and comparison operations to ensure text matching regardless of diacritics.
 * @function normalizeArabicText
 * @param {string} text - Arabic text to sanitize.
 * @returns {string} - Text after removing diacritics and unifying characters.
 */
function normalizeArabicText(text) {
  if (!text) return "";

  // Remove diacritics
  text = text.replace(/[\u064B-\u0652]/g, "");

  // Unify Hamzas (أ، إ، آ) to ا
  text = text.replace(/[آأإ]/g, "ا");

  // Convert Taa Marbuta (ة) to Ha (ه)
  text = text.replace(/ة/g, "ه");

  // Unify Ya (ي / ى) to ي
  text = text.replace(/[ى]/g, "ي");

  // Remove Tatweel (ـــ)
  text = text.replace(/ـ+/g, "");

  // Remove duplicate spaces
  text = text.replace(/\s+/g, " ").trim();

  return text;
}



/**
 * @function showError
 * @description Displays an error message below the specified input field and adds an error class to it.
 * @param {HTMLInputElement} input - Input element where the error occurred.
 * @param {string} message - Error message to display.
 * @returns {void}
 */
const showError = (input, message) => {
  // Find the element dedicated to displaying the error message.
  const errorDiv = document.getElementById(`${input.id}-error`);
  // Add CSS class to change input style (e.g., change border color to red).
  input.classList.add("input-error");
  // Set error message text.
  errorDiv.textContent = message;
};

/**
 * @function clearError
 * @description Removes the error message from below the specified input field and removes the error class from it.
 * @param {HTMLInputElement} input - Input element to clear error from.
 * @returns {void}
 */
const clearError = (input) => {
  // Find error message element.
  const errorDiv = document.getElementById(`${input.id}-error`);
  // Remove error class from input field.
  input.classList.remove("input-error");
  // Clear error message text.
  errorDiv.textContent = "";
};
/**
 * @description Updates login text in the top bar of the page.
 *   If a user is logged in, displays their name (truncated if long).
 *   If not, displays "Login".
 * @function setUserNameInIndexBar
 * @returns {void}
 */
function setUserNameInIndexBar() {
  try {
    let loginTextElement = document.getElementById("index-login-text");
    if (!loginTextElement) return;

    const loginIcon = document.getElementById("index-login-icon");
    const loginBtn = document.getElementById("index-login-btn");

    if (window.userSession && window.userSession.username) {
      let displayName = window.userSession.username;
      if (displayName.length > 8) {
        displayName = displayName.substring(0, 8) + "...";
      }
      loginTextElement.textContent = displayName;

      // Handle Avatar Image
      if (window.userSession.user_image) {
        // Hide default icon
        if (loginIcon) loginIcon.style.display = "none";

        // Check for existing avatar img or create one
        let userImg = document.getElementById("index-login-avatar");
        if (!userImg) {
          userImg = document.createElement("img");
          userImg.id = "index-login-avatar";
          userImg.className = "index-user-avatar";
          if (loginBtn && loginIcon) {
            loginBtn.insertBefore(userImg, loginIcon);
          }
        }

        const avatarUrl = (typeof getPublicR2FileUrl === "function")
          ? getPublicR2FileUrl(window.userSession.user_image)
          : window.userSession.user_image;

        userImg.src = avatarUrl;
        userImg.style.display = "inline-block";
      } else {
        // Show default icon and hide avatar img if exists
        if (loginIcon) {
          loginIcon.style.display = "inline-block";
          if (window.userSession.is_guest) {
            loginIcon.classList.remove("fa-user-circle");
            loginIcon.classList.add("fa-user-tag");
          } else {
            loginIcon.classList.add("fa-user-circle");
            loginIcon.classList.remove("fa-user-tag");
          }
        }
        const userImg = document.getElementById("index-login-avatar");
        if (userImg) userImg.style.display = "none";
      }
    } else {
      loginTextElement.textContent = (typeof window.langu === 'function')
        ? window.langu("login_text")
        : "تسجيل الدخول";

      if (loginIcon) {
        loginIcon.style.display = "inline-block";
        loginIcon.classList.add("fa-user-circle");
        loginIcon.classList.remove("fa-user-tag");
      }
      const userImg = document.getElementById("index-login-avatar");
      if (userImg) userImg.style.display = "none";
    }
  } catch (error) {
    console.warn("[setUserNameInIndexBar] Caught error:", error);
  }
}
/**
 * @description Clears all locally stored browser data related to the application,
 *   including `localStorage`, `sessionStorage`, and wiping `IndexedDB` databases.
 *   Typically used for full logout or app cleanup.
 * @function clearAllBrowserData
 * @async
 * @returns {Promise<boolean>} - Promise returning `true` on completion.
 * @throws {Error} - If there's an error clearing localStorage, sessionStorage, or IndexedDB.
 */
async function clearAllBrowserData() {
  // -----------------------------
  // 1) Clear localStorage
  // -----------------------------
  try {
    localStorage.clear();
  } catch (e) {
    console.warn("فشل مسح localStorage:", e);
  }

  // -----------------------------
  // 2) Clear sessionStorage
  // -----------------------------
  try {
    sessionStorage.clear();
  } catch (e) {
    console.warn("فشل مسح sessionStorage:", e);
  }



  // -----------------------------
  // 3) Clear IndexedDB
  // -----------------------------
  try {
    if ("indexedDB" in window) {
      const dbs = (await indexedDB.databases?.()) || [];

      for (const db of dbs) {
        if (db && db.name) {
          try {
            indexedDB.deleteDatabase(db.name);
          } catch (dbErr) {
            console.warn(`فشل حذف قاعدة البيانات IndexedDB "${db.name}":`, dbErr);
          }
        }
      }
    }
  } catch (e) {
    console.warn("فشل مسح IndexedDB:", e);
  }

  return true;
}

/**
 * @description Performs a comprehensive "Hard Reset" of the application data.
 * Clears localStorage, sessionStorage, Cookies, Service Workers, Cache Storage, and IndexedDB.
 * Finally reloads the application.
 * @function appHardReset
 * @async
 * @returns {Promise<void>}
 */
async function appHardReset() {
  console.warn("☢️ [HardReset] INITIALIZING NUCLEAR CLEANUP...");

  try {
    // 0. Notify other tabs via BroadcastChannel (if supported)
    if ('BroadcastChannel' in window) {
      try {
        const bc = new BroadcastChannel('suez_bazaar_reset_channel');
        bc.postMessage({ action: 'HARD_RESET_NOW' });
        console.log("📡 [HardReset] Wipe signal sent to other tabs.");
      } catch (e) {
        console.warn("[HardReset] BC signal failed.", e);
      }
    }

    // 1. Kill all Background Processes
    // Stop all intervals and timeouts to prevent them from writing to storage during wipe
    let highestTimeoutId = setTimeout(() => { }, 0);
    for (let i = 0; i < highestTimeoutId; i++) {
      clearTimeout(i);
      clearInterval(i);
    }
    console.log("✅ [HardReset] Background processes killed.");

    // 2. Stop Media Streams (Camera/Mic)
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        // Get all possible tracks and stop them
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true }).catch(() => null);
        if (stream) {
          stream.getTracks().forEach(track => {
            track.stop();
            console.log(`✅ [HardReset] Media track stopped: ${track.kind}`);
          });
        }
      } catch (e) { /* ignore */ }
    }

    // 3. Clear Local & Session Storage
    localStorage.clear();
    sessionStorage.clear();
    console.log("✅ [HardReset] Storage cleared.");

    // 4. Clear Cookies (All paths and domains)
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + window.location.hostname;
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=." + window.location.hostname;
    }
    console.log("✅ [HardReset] Cookies cleared.");

    // 5. Unregister Service Workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
        console.log(`✅ [HardReset] SW unregistered: ${registration.scope}`);
      }
    }

    // 6. Clear Cache Storage
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      console.log("✅ [HardReset] Cache storage cleared.");
    }

    // 7. Delete all IndexedDB databases
    if ("indexedDB" in window) {
      if (typeof indexedDB.databases === 'function') {
        try {
          const dbs = (await indexedDB.databases()) || [];
          for (const db of dbs) {
            if (db && db.name) {
              indexedDB.deleteDatabase(db.name);
              console.log(`✅ [HardReset] DB deleted: ${db.name}`);
            }
          }
        } catch (e) { console.warn("[HardReset] DB.databases() failed.", e); }
      } else {
        // Fallback for browsers without .databases() - common DB names in project
        ['suez_bazaar_db', 'notifications_db', 'firebase-messaging-database', 'fcm_token_details_db', 'keyval-store'].forEach(dbName => {
          indexedDB.deleteDatabase(dbName);
        });
      }
    }

    // 8. Clear Origin Private File System (OPFS)
    if (navigator.storage && navigator.storage.getDirectory) {
      try {
        const root = await navigator.storage.getDirectory();
        // @ts-ignore - Browsing through results
        for await (const name of root.keys()) {
          await root.removeEntry(name, { recursive: true });
        }
        console.log("✅ [HardReset] OPFS cleared.");
      } catch (e) {
        console.warn("[HardReset] OPFS wipe failed or empty.", e);
      }
    }

    // 9. Wipe Global Memory Variables (Sensitive data prevention)
    delete window.userSession;
    delete window.appTranslations;
    delete window.SessionManager;
    delete window.AppHeader;
    console.log("✅ [HardReset] Global memory cleared.");

    // 10. Reset History State
    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, '', window.location.origin);
      console.log("✅ [HardReset] History state reset.");
    }

    console.log("🏁 [HardReset] THE END. Atomic reboot initiated...");

    // 11. Final Redirection (Replace to prevent 'Back' button issues)
    window.location.replace("/index.html?nuclear_reset=" + Date.now());

  } catch (error) {
    console.error("❌ [HardReset] Critical error during wipe:", error);
    window.location.replace("/index.html?error_reset=true");
  }
}

/**
 * @description Setup Cross-Tab listener for Nuclear Reset.
 * Ensures that if one tab initiates a Hard Reset, all other tabs self-destruct.
 */
if ('BroadcastChannel' in window) {
  try {
    const resetChannel = new BroadcastChannel('suez_bazaar_reset_channel');
    resetChannel.onmessage = (event) => {
      if (event.data && event.data.action === 'HARD_RESET_NOW') {
        console.warn("🛑 [RemoteReset] Received wipe signal from another tab. Self-destructing...");
        localStorage.clear();
        sessionStorage.clear();
        window.location.replace("/index.html?remote_reset=true");
      }
    };
  } catch (e) { /* ignore BC errors */ }
}


/**
 * @description Checks the application version from version.json and compares it with the version stored in localStorage.
 *   If the versions are different, it clears browser cache, cookies, and session storage (preserving localStorage and IndexedDB),
 *   then reloads the page to ensure the user has the latest files.
 * @function checkAppVersionAndClearData
 * @async
 * @returns {Promise<void>}
 */
async function checkAppVersionAndClearData() {
  // [Optimization] Skip version checking inside Android context
  if (window.Android) {
    console.log('[VersionCheck] Android environment detected. Skipping PWA version management.');
    return;
  }
  const VERSION_STORAGE_KEY = 'app_version';
  try {
    // 1) Fetch latest version.json with cache busting
    console.log(`[VersionCheck] Fetching version.json...`);
    const response = await fetch(`version.json?t=${Date.now()}`);
    if (!response.ok) {
      console.error(`[VersionCheck] Failed to fetch version.json. Status: ${response.status}`);
      return;
    }

    const data = await response.json();
    const latestVersion = data.version;
    const storedVersion = localStorage.getItem(VERSION_STORAGE_KEY);

    console.log(`[VersionCheck] Current Stored Version: ${storedVersion}`);
    console.log(`[VersionCheck] Latest Available Version (from file): ${latestVersion}`);

    // [Debug] Explicit check
    if (storedVersion === latestVersion) {
      console.log(`[VersionCheck] Versions match. No update needed.`);
    } else {
      console.warn(`[VersionCheck] VERSION MISMATCH! Triggering clean-up.`);
    }

    // 2) If versions differ, perform aggressive cleanup (excluding localStorage and IndexedDB)
    if (storedVersion && latestVersion !== storedVersion) {
      console.log(`[VersionCheck] New version detected: ${latestVersion} (Old: ${storedVersion}). Performing deep cleanup...`);

      // A) Clear Session Storage
      sessionStorage.clear();

      // B) Clear Cookies
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
      }

      // C) Unregister ALL Service Workers (Crucial for immediate PWA update)
      if ('serviceWorker' in navigator) {
        console.log('[VersionCheck] Checking for Service Workers...');
        const registrations = await navigator.serviceWorker.getRegistrations();
        if (registrations.length === 0) console.log('[VersionCheck] No Service Workers found.');
        for (const registration of registrations) {
          await registration.unregister();
          console.log(`[VersionCheck] Service Worker unregistered: ${registration.scope}`);
        }
      }

      // D) Clear FCM Tokens (PWA Only - Not Android WebView)
      // This forces fresh FCM setup on next load for PWA users
      const isAndroidWebView = window.Android && typeof window.Android === 'object';

      if (!isAndroidWebView) {
        // Only clear Web FCM token in PWA environment
        console.log('[VersionCheck] PWA environment detected - clearing Web FCM token to force re-initialization...');
        localStorage.removeItem('fcm_token');           // Web FCM token only
        localStorage.removeItem('notifications_enabled'); // Notification state
        console.log('[VersionCheck] Web FCM tokens cleared. Fresh FCM setup will be triggered on reload.');
      } else {
        // Android WebView - do NOT touch FCM tokens
        console.log('[VersionCheck] Android WebView detected - preserving Android FCM tokens.');
        // android_fcm_key will remain untouched
      }
      // Note: We do NOT clear IndexedDB to preserve notification history

      // E) Clear ALL Cache Storage (The most important part for file updates)
      if ('caches' in window) {
        console.log('[VersionCheck] Accessing Cache Storage...');
        const cacheNames = await caches.keys();
        if (cacheNames.length === 0) console.log('[VersionCheck] No caches found to delete.');
        await Promise.all(cacheNames.map(name => {
          console.log(`[VersionCheck] Deleting cache: ${name}`);
          return caches.delete(name);
        }));
      }

      // Update stored version
      localStorage.setItem(VERSION_STORAGE_KEY, latestVersion);
      console.log(`[VersionCheck] Updated local app_version to: ${latestVersion}`);

      // E) Force Reload from Server
      console.log("[VersionCheck] Cleanup complete. Forcing reload from server...");
      window.location.reload(true);
    } else if (!storedVersion) {
      // First time visit or storage cleared - just set the version
      localStorage.setItem(VERSION_STORAGE_KEY, latestVersion);
    }

    // Save the time of check
    localStorage.setItem('last_version_check_time', Date.now());
  } catch (error) {
    console.error(`[VersionCheck] Error checking for updates: ${error.message || error}`, error);
  }
}

/**
 * @description Displays notifications modal using `mainLoader`.
 * @function showNotificationsModal
 * @returns {void}
 * @deprecated - This function is commented out in the code and appears unused.
 */
function showNotificationsModal() {
  if (typeof window.handleNotificationsButtonClick === 'function') {
    window.handleNotificationsButtonClick();
  } else {
    window.location.href = "/notification/page/notifications.html";
  }
}


// Global variable to reuse AudioContext
/**
 * @type {AudioContext|null}
 * @description Global variable to store and reuse the AudioContext instance for notification sounds.
 */
let suzeAudioContext = null;

/**
 * @description Play notification sound using Web Audio API
 * @returns {void}
 * @throws {Error} - If the Web Audio API encounters an error during sound playback.
 */
function playNotificationSound() {
  const sampleRate = 44100;
  const beepDurationMs = 140;
  const silenceMs = 70;
  const pulsesCount = 3;
  const frequency = 900;
  const volume = 0.75;

  const audioContext = new (window.AudioContext || window.webkitAudioContext)({
    sampleRate: sampleRate
  });

  const beepSamples = Math.floor(beepDurationMs * sampleRate / 1000);
  const silenceSamples = Math.floor(silenceMs * sampleRate / 1000);
  const totalSamples = pulsesCount * (beepSamples + silenceSamples);

  const buffer = audioContext.createBuffer(1, totalSamples, sampleRate);
  const data = buffer.getChannelData(0);

  let index = 0;

  for (let pulse = 0; pulse < pulsesCount; pulse++) {

    // Beep
    for (let i = 0; i < beepSamples; i++) {
      data[index++] =
        Math.sin(2 * Math.PI * frequency * i / sampleRate) * volume;
    }

    // Silence
    for (let i = 0; i < silenceSamples; i++) {
      data[index++] = 0;
    }
  }

  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.connect(audioContext.destination);
  source.start();

  source.onended = () => {
    audioContext.close();
  };
}



const pageSnapshots = {};
/**
 * @type {object}
 * @description A cache for storing HTML content of pages fetched via `insertUniqueSnapshot`.
 * Keys are page URLs and values are their HTML content.
 */



/**
 * @description Fetches HTML page content and caches it, then inserts it into a specified container.
 *   Ensures the same page is not loaded repeatedly from network if already cached.
 *   Also re-executes scripts found in the loaded page.
 * @function insertUniqueSnapshot
 * @async
 * @param {string} pageUrl - URL of the page to fetch.
 * @param {string} containerId - ID of the container to insert content into.
 * @returns {Promise<void>}
 * @throws {Error} - If the page fails to load or the container element is not found.
 */
async function insertUniqueSnapshot(pageUrl, containerId) {
  try {
    // Save snapshot if not exists
    if (!pageSnapshots[pageUrl]) {
      const response = await fetch(pageUrl, { cache: "no-store" });
      if (!response.ok) throw new Error("فشل تحميل: " + pageUrl);
      pageSnapshots[pageUrl] = await response.text();
    }

    // Remove previous copies from DOM
    document
      .querySelectorAll(`[data-page-url="${pageUrl}"]`)
      .forEach((el) => el.remove());

    // Insert snapshot
    const container = document.getElementById(containerId);
    if (!container) throw new Error("لا يوجد عنصر: " + containerId);

    container.replaceChildren();
    container.innerHTML = pageSnapshots[pageUrl];
    container.setAttribute("data-page-url", pageUrl);

    // Run all scripts
    const scripts = [...container.querySelectorAll("script")];

    for (const oldScript of scripts) {
      const newScript = document.createElement("script");

      // Copy attributes
      for (const attr of oldScript.attributes) {
        newScript.setAttribute(attr.name, attr.value);
      }

      // If inline script
      if (!oldScript.src) {
        let code = oldScript.textContent.trim();

        // Auto-wrap in IIFE to prevent variable re-definition
        code = `(function(){\n${code}\n})();`;

        newScript.textContent = code;
      } else {
        // External script -> add tags to prevent duplication
        const uniqueSrc = oldScript.src + "?v=" + Date.now();
        newScript.src = uniqueSrc;

        if (oldScript.type) newScript.type = oldScript.type;
      }

      oldScript.replaceWith(newScript);

      // Wait for external script to load
      if (newScript.src) {
        await new Promise((resolve) => {
          newScript.onload = resolve;
          newScript.onerror = resolve; // Continue on error
        });
      }
    }

  } catch (err) {
    console.error("خطأ:", err);
  }
}

/**
 * Function that loads an HTML fragment from an external file and merges it into another page,
 * fully re-executing scripts within it,
 * and waits for a period after everything completes.
 *
 * @param {string} pageUrl - URL of the external file to load
 * @param {string} containerId - ID of the element to contain the content
 * @param {number} waitMs - Wait period after loading and executing everything
 * @returns {Promise<void>}
 * @async
 * @throws {Error} - If fetching HTML fails, the container element is not found, or script execution encounters an error.
 */
async function loader(pageUrl, containerId, waitMs = 300) {
  try {
    // ================================
    // 1) Fetch file via fetch
    // ================================
    let response, html;
    try {
      response = await fetch(pageUrl, { cache: "no-store" });
      if (!response.ok) throw new Error("فشل تحميل الملف: " + pageUrl);
      html = await response.text();
    } catch (fetchError) {
      console.error("خطأ أثناء جلب الملف:", fetchError);
      return;
    }

    // ================================
    // 2) Insert content into target element
    // ================================
    let container;
    try {
      container = document.getElementById(containerId);
      if (!container)
        throw new Error("لم يتم العثور على العنصر: " + containerId);

      // Clear content to ensure no old scripts remain
      container.replaceChildren();

      container.innerHTML = html;
    } catch (domError) {
      console.error("خطأ في إدراج المحتوى داخل DOM:", domError);
      return;
    }

    // ================================
    // 3) Extract and re-run all scripts
    // ================================
    try {
      const scripts = [...container.querySelectorAll("script")];

      for (const oldScript of scripts) {
        const newScript = document.createElement("script");

        // Transfer type (important for ES Modules)
        if (oldScript.type) newScript.type = oldScript.type;

        // If external script
        if (oldScript.src) {
          newScript.src = oldScript.src;
          newScript.async = oldScript.async || false; // Maintain async
        }

        // If inline script
        if (oldScript.innerHTML.trim() !== "") {
          newScript.textContent = oldScript.innerHTML;
        }

        // Transfer script attributes (dataset, attributes)
        for (const attr of oldScript.attributes) {
          if (attr.name !== "src" && attr.name !== "type")
            newScript.setAttribute(attr.name, attr.value);
        }

        oldScript.replaceWith(newScript);

        // Wait for external script to load
        if (newScript.src) {
          await new Promise((resolve) => {
            newScript.onload = resolve;
            newScript.onerror = resolve; // Continue on error
          });
        }
      }
    } catch (scriptError) {
      console.error("خطأ أثناء تشغيل السكربتات:", scriptError);
      return;
    }

    // ================================
    // 4) Wait after everything completes
    // ================================
    try {
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    } catch (delayError) {
      console.warn("خطأ أثناء الانتظار:", delayError);
    }

  } catch (globalError) {
    console.error("خطأ غير متوقع في الدالة loader:", globalError);
  }
}



/////////////////////////////////

/**
 * @description Shows a SweetAlert2 modal prompting the user to log in.
 *   If confirmed, it navigates to the login page using mainLoader.
 *   Checks guest session status.
 * @function showLoginAlert
 * @returns {boolean} - Returns false if the user is a guest (and shows alert), true otherwise.
 */
function showLoginAlert() {
  if (!window.userSession) {
    // Alert only if NO session at all. Guests (user_key="guest_user") are allowed to proceed.
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title: window.langu("alert_title_info"),
        text: window.langu("alert_login_required"),
        showCancelButton: true,
        confirmButtonText: window.langu("login_text"),
        cancelButtonText: window.langu("alert_cancel_btn"),
        buttonsStyling: false,
        customClass: {
          popup: 'swal-modern-mini-popup',
          title: 'swal-modern-mini-title',
          htmlContainer: 'swal-modern-mini-text',
          confirmButton: 'swal-modern-mini-confirm',
          cancelButton: 'swal-modern-mini-cancel'
        },
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.href = "/pages/login/login.html";
        }
      });
    } else {
      // Fallback for cases where SweetAlert2 is not loaded
      console.warn("[showLoginAlert] SweetAlert2 not loaded, using fallback alert.");
      if (confirm(window.langu("alert_login_required"))) {
        window.location.href = "/pages/login/login.html";
      }
    }
    return false;
  }
  return true;
}

/**
        * @function generateSerial
        * @description Generates a unique 6-character alphanumeric serial.
        * @returns {string} Serial.
        */
function generateSerial() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let serial = "";
  for (let i = 0; i < 6; i++) {
    serial += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return serial;
}

/**
 * [!IMPORTANT] BRIDGE-DEPENDENT: Any change to the slogans object structure MUST 
 * be coordinated with Android's LocalizationManager.updateSplashSlogans().
 * @description Synchronizes splash slogans (taglines) to Native Android environment.
 *   This ensures that the next time the app starts, the splash screen will show the latest slogans from the web app.
 * @function syncSplashSlogansToAndroid
 */
function syncSplashSlogansToAndroid() {
  if (window.Localization && typeof window.Localization.updateSplashSlogans === 'function' && window.appTranslations) {
    const slogans = { ar: {}, en: {} };
    const keys = ['splash_slogan', 'tagline_1', 'tagline_2', 'tagline_3', 'tagline_4', 'tagline_5', 'tagline_6'];

    keys.forEach(key => {
      if (window.appTranslations[key]) {
        slogans.ar[key] = window.appTranslations[key].ar || '';
        slogans.en[key] = window.appTranslations[key].en || '';
      }
    });

    const slogansJson = JSON.stringify(slogans);
    console.log("📱 [Bridge] Syncing splash slogans to Native Android.");
    window.Localization.updateSplashSlogans(slogansJson);
  }
}

/**
 * @function compressImage
 * @description Compresses an image file using Canvas.
 * @param {File|Blob} file - The image file to compress.
 * @param {number} maxWidth - Maximum width (default 800).
 * @param {number} maxHeight - Maximum height (default 800).
 * @param {number} quality - JPEG/WebP quality (0 to 1).
 * @returns {Promise<Blob>} - A Promise resolving to the compressed image Blob.
 */
async function compressImage(file, maxWidth = 800, maxHeight = 800, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = event => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Try WebP first, fallback to JPEG
        const mime = "image/webp";
        canvas.toBlob(blob => {
          if (blob) resolve(blob);
          else {
            canvas.toBlob(bj => resolve(bj), "image/jpeg", quality);
          }
        }, mime, quality);
      };
      img.onerror = error => reject(error);
    };
    reader.onerror = error => reject(error);
  });
}

/**
 * @function formatBytes
 * @description Formats bytes into a human-readable string.
 * @param {number} bytes - Bytes to format.
 * @returns {string} - Formatted string.
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024, sizes = ['B', 'KB', 'MB'], i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

window.compressImage = compressImage;
window.formatBytes = formatBytes;
