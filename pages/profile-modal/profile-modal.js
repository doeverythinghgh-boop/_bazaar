/**
 * @file pages/profile-modal/profile-modal.js
 * @description Main entry point and coordinator for the user profile modal.
 * This file bootstraps the profile module components.
 */

/**
 * @function initializeProfileModule
 * @description Safely bootstraps the profile module after ensuring dependencies are loaded.
 */
async function initializeProfileModule() {
    try {
        console.log("[Profile] Starting module initialization...");

        // 0. Ensure translations are loaded (Especially if page is opened standalone)
        if (typeof loadIndexTranslations === 'function' && (!window.appTranslations || Object.keys(window.appTranslations).length === 0)) {
            console.log("[Profile] Translations not found, loading now...");
            await loadIndexTranslations();
        }

        // 0. Initialize Session
        if (typeof SessionManager !== "undefined") {
            SessionManager.init();
        }

        // 🛑 PREVENT GUEST ACCESS
        if (SessionManager.isGuest()) {
            console.warn("[Profile] Guest access denied. Redirecting...");
            if (typeof AuthUI !== 'undefined') {
                AuthUI.showError("توثيق", "يجب تسجيل الدخول للوصول إلى الملف الشخصي");
            }
            setTimeout(() => {
                window.location.replace("/pages/login/login.html");
            }, 1500);
            return;
        }

        // 1. Initialize Header (Standard project pattern)
        if (typeof AppHeader !== "undefined" && typeof AppHeader.init === "function") {
            // Use standard AppHeader initialization
            AppHeader.init("header-injection-point");
        } else {
            console.warn("[Profile] AppHeader not found, retrying...");
            setTimeout(initializeProfileModule, 100);
            return;
        }

        // 2. Initial Data Load
        if (typeof profileInitializeData === 'function') {
            profileInitializeData();
        } else {
            console.error("[Profile] profileInitializeData is not defined!");
        }

        // 3. Setup Interactive Listeners
        if (typeof profileSetupListeners === 'function') {
            profileSetupListeners();
        } else {
            console.error("[Profile] profileSetupListeners is not defined!");
        }

        // 4. Final Translation (Crucial for dynamically loaded elements)
        if (typeof applyAppTranslations === 'function') {
            applyAppTranslations();
        }

        console.log("[Profile] Module initialized successfully.");
    } catch (error) {
        console.error("[Profile] Error during module bootstrapping:", error);
    }
}

// Start initialization with a small delay to handle dynamic content loading
// Export for manual initialization
window.initializeProfileModule = initializeProfileModule;
