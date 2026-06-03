/**
 * @file pages/register/js/register-bootstrap.js
 * @description Unified bootstrap flow for Register/Profile wizard pages.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


(function initRegisterBootstrap(globalScope) {
    "use strict";

    if (!globalScope) return;
    if (globalScope.RegisterBootstrap) return;

    function logger() {
        return globalScope.RegisterDevLogger || null;
    }

    function log(scope, message, payload) {
        if (logger()) {
            logger().info(scope, message, payload);
            return;
        }
        if (payload === undefined) {
            console.log(`[Wizard:${scope}] ${message}`);
            return;
        }
        console.log(`[Wizard:${scope}] ${message}`, payload);
    }

    function warn(scope, message, payload) {
        if (logger()) {
            logger().warn(scope, message, payload);
            return;
        }
        if (payload === undefined) {
            console.warn(`[Wizard:${scope}] ${message}`);
            return;
        }
        console.warn(`[Wizard:${scope}] ${message}`, payload);
    }

    function flags() {
        return globalScope.RegisterFeatureFlags || {};
    }

    function scheduleNonCritical(scope, label, task) {
        if (flags().DEFER_NON_CRITICAL_INIT === false) {
            Promise.resolve().then(task).catch((error) => warn(scope, `${label} failed.`, error));
            return;
        }

        const runner = () => Promise.resolve().then(task).catch((error) => warn(scope, `${label} failed.`, error));
        if (typeof globalScope.requestIdleCallback === "function") {
            globalScope.requestIdleCallback(runner, { timeout: 1200 });
        } else {
            globalScope.setTimeout(runner, 0);
        }
    }

    async function safeCall(scope, label, fn) {
        if (typeof fn !== "function") {
            warn(scope, `${label} skipped (not available).`);
            return null;
        }
        log(scope, `${label} started.`);
        const result = await fn();
        log(scope, `${label} completed.`);
        return result;
    }

    async function start(options = {}) {
        const scope = options.scope || "Bootstrap";
        const mode = options.mode || (globalScope.WIZARD_MODES?.REGISTER || "REGISTER");
        try {
            log(scope, `Boot sequence started. Mode=${mode}`);

            await safeCall(scope, "Theme init", () => {
                if (typeof globalScope.initAppTheme === "function") {
                    globalScope.initAppTheme();
                }
            });

            if (flags().DOM_CONTRACT_CHECKS !== false && globalScope.RegisterDomContract?.validate) {
                await safeCall(scope, "DOM contract validation", () => {
                    const contractMode = mode === (globalScope.WIZARD_MODES?.PROFILE || "PROFILE") ? "profile" : "register";
                    globalScope.RegisterDomContract.validate(contractMode);
                });
            }

            await safeCall(scope, "Translations load", async () => {
                const hasTranslations = !!(globalScope.appTranslations && Object.keys(globalScope.appTranslations).length);
                if (!hasTranslations && typeof globalScope.loadIndexTranslations === "function") {
                    await globalScope.loadIndexTranslations();
                }
                if (typeof globalScope.applyAppTranslations === "function") {
                    globalScope.applyAppTranslations();
                }
            });

            await safeCall(scope, "Wizard mode sync", () => {
                if (typeof globalScope.registerSetWizardMode === "function") {
                    globalScope.registerSetWizardMode(mode);
                }
            });

            await safeCall(scope, "UX engine init", () => {
                if (globalScope.RegisterUxEngine?.init) {
                    globalScope.RegisterUxEngine.init();
                }
            });

            await safeCall(scope, "Shared module init", async () => {
                if (typeof globalScope.initializeRegisterModule === "function") {
                    await globalScope.initializeRegisterModule();
                } else {
                    throw new Error("initializeRegisterModule is missing.");
                }
            });

            if (typeof options.postInitialize === "function") {
                await safeCall(scope, "Mode-specific post init", options.postInitialize);
            }

            await safeCall(scope, "Draft manager init", () => {
                if (globalScope.RegisterDraftManager?.init) {
                    globalScope.RegisterDraftManager.init({
                        mode: globalScope.regWizard?.mode || mode
                    });
                }
            });

            scheduleNonCritical(scope, "Non-critical startup tasks", () => {
                if (typeof globalScope.checkImpersonationMode === "function") globalScope.checkImpersonationMode();
                if (typeof globalScope.runHeaderScrollTutorial === "function") globalScope.runHeaderScrollTutorial();
            });

            log(scope, "Boot sequence finished successfully.");
        } catch (error) {
            warn(scope, "Boot sequence failed.", error);
            throw error;
        }
    }

    globalScope.RegisterBootstrap = {
        start
    };
})(window);
