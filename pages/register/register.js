/**
 * @file pages/register/register.js
 * @description Main entry point and coordinator for the registration page.
 * This file bootstraps the register module components.
 */

/**
 * @function initializeRegisterModule
 * @description Safely bootstraps the register module after ensuring dependencies are loaded.
 */
async function initializeRegisterModule() {
    try {
        console.log("[Register] Starting module initialization...");

        // 0. Load Dynamic Steps Templates
        if (window.RegisterLoader && typeof window.RegisterLoader.loadSteps === 'function') {
            await window.RegisterLoader.loadSteps();
        }

        // 1. Ensure Translations
        if (typeof loadIndexTranslations === 'function' && (!window.appTranslations || Object.keys(window.appTranslations).length === 0)) {
            await loadIndexTranslations();
        }

        // 2. Initialize Session
        if (typeof SessionManager !== "undefined") {
            SessionManager.init();
        }

        // 3. Initialize Header
        if (typeof AppHeader !== "undefined" && typeof AppHeader.init === "function") {
            AppHeader.init('header-injection-point', 'index-login-btn');
        }

        // 4. Initial Data & State
        if (typeof registerInitialize === 'function') {
            registerInitialize();
        } else {
            console.error("[Register] registerInitialize is not defined!");
        }

        // 5. Setup Listeners & Behaviors
        if (typeof registerSetupListeners === 'function') {
            registerSetupListeners();
        } else {
            console.error("[Register] registerSetupListeners is not defined!");
        }

        if (typeof registerSetupStepBehaviors === 'function') {
            registerSetupStepBehaviors();
        }

        // 6. UI & UX States
        if (window.RegisterUxEngine && typeof window.RegisterUxEngine.init === 'function') {
            window.RegisterUxEngine.init();
        }
        if (typeof checkImpersonationMode === 'function') checkImpersonationMode();
        if (typeof runHeaderScrollTutorial === 'function') window.runHeaderScrollTutorial();

        // 7. Apply Translations
        if (typeof applyAppTranslations === 'function') {
            applyAppTranslations();
            // Ensure dynamic description is updated with correct language
            if (typeof registerUpdateRoleDescription === 'function') {
                registerUpdateRoleDescription();
            }
        }

        console.log("[Register] Module initialized successfully.");

    } catch (error) {
        console.error("[Register] Error during module bootstrapping:", error);
    }
}

// Export global
window.initializeRegisterModule = initializeRegisterModule;

// Auto-run if DOM is already ready (for standalone testing), or let HTML script handle it.
// The HTML file has a script block that calls init logic, we will update it to call this function.
