/**
 * @file pages/register/register.js
 * @description Main entry point and coordinator for the registration page.
 * This file bootstraps the register module components.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

export async function initializeRegisterModule() {
    const devLog = window.RegisterDevLogger;
    try {
        if (devLog) devLog.info("RegisterInit", "Starting module initialization.");
        console.log("[Register] Starting module initialization...");

        // 0. Load Dynamic Steps Templates
        if (window.RegisterLoader && typeof window.RegisterLoader.loadSteps === 'function') {
            if (devLog) devLog.info("RegisterInit", "Loading wizard templates.");
            await window.RegisterLoader.loadSteps();
        }

        // 1. Ensure Translations
        if (typeof window.loadIndexTranslations === 'function' && (!window.appTranslations || Object.keys(window.appTranslations).length === 0)) {
            await window.loadIndexTranslations();
        }

        // 2. Initialize Session
        if (typeof window.SessionManager !== "undefined") {
            window.SessionManager.init();
        }

        // 3. Initialize Header
        if (typeof window.AppHeader !== "undefined" && typeof window.AppHeader.init === "function") {
            window.AppHeader.init('header-injection-point', 'index-login-btn');
        }

        // 4. Initial Data & State
        if (typeof window.registerInitialize === 'function') {
            if (devLog) devLog.info("RegisterInit", "Running registerInitialize orchestrator.");
            window.registerInitialize();
        } else {
            console.error("[Register] registerInitialize is not defined!");
        }

        // 5. Setup Listeners
        if (typeof window.registerSetupListeners === 'function') {
            if (devLog) devLog.info("RegisterInit", "Binding DOM listeners.");
            window.registerSetupListeners();
        } else {
            console.error("[Register] registerSetupListeners is not defined!");
        }

        // 6. UI & UX States
        if (window.RegisterUxEngine && typeof window.RegisterUxEngine.init === 'function') {
            if (devLog) devLog.info("RegisterInit", "Initializing UX engine.");
            window.RegisterUxEngine.init();
        }

        // 7. Apply Translations
        if (typeof window.applyAppTranslations === 'function') {
            window.applyAppTranslations();
            // Ensure dynamic description is updated with correct language
            if (typeof window.registerUpdateRoleDescription === 'function') {
                window.registerUpdateRoleDescription();
            }
        }

        if (devLog) devLog.info("RegisterInit", "Module initialized successfully.");
        console.log("[Register] Module initialized successfully.");

    } catch (error) {
        if (devLog) devLog.error("RegisterInit", "Module bootstrapping failed.", error);
        console.error("[Register] Error during module bootstrapping:", error);
    }
}

// Hybrid bridge
window.initializeRegisterModule = initializeRegisterModule;

export default initializeRegisterModule;

console.log("[ESM Load] register.js: Hybrid bridge established.");
