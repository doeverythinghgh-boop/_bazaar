/**
 * @file pages/merchant-portfolio/js/init/portfolio-bootstrap.js
 * @description Unified bootstrap flow for merchant portfolio page.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


(function initPortfolioBootstrap(globalScope) {
    "use strict";

    if (!globalScope) return;
    if (globalScope.PortfolioBootstrap) return;

    function safeTask(label, task) {
        return Promise.resolve()
            .then(task)
            .catch((error) => {
                if (globalScope.PortfolioErrorUtils?.log) {
                    globalScope.PortfolioErrorUtils.log("PortfolioBootstrap", `${label} failed`, error);
                } else {
                    console.error(`[PortfolioBootstrap] ${label} failed`, error);
                }
                throw error;
            });
    }

    async function start() {
        if (globalScope.PortfolioFeatureFlags?.PORTFOLIO_DOM_CONTRACT_CHECKS !== false) {
            await safeTask("DOM contract validation", () => {
                if (globalScope.PortfolioDomContract?.validate) {
                    globalScope.PortfolioDomContract.validate();
                }
            });
        }

        await safeTask("Theme init", () => {
            if (typeof globalScope.initAppTheme === "function") globalScope.initAppTheme();
        });

        await safeTask("Translations load", async () => {
            if (typeof globalScope.loadIndexTranslations === "function") {
                await globalScope.loadIndexTranslations();
            }
        });

        await safeTask("Session init", () => {
            if (typeof globalScope.SessionManager !== "undefined" && globalScope.SessionManager?.init) {
                globalScope.SessionManager.init();
            }
        });

        // Inject the global app header and mark the login/profile button as active.
        // The merchant portfolio is the destination of the login button, so highlighting
        // 'index-login-btn' keeps the navigation state consistent for logged-in users.
        await safeTask("Header init", async () => {
            if (typeof globalScope.AppHeader !== "undefined" && globalScope.AppHeader?.init) {
                await globalScope.AppHeader.init("header-injection-point", "index-login-btn");
            }
        });

        await safeTask("Portfolio init", async () => {
            if (typeof globalScope.initPortfolio === "function") {
                await globalScope.initPortfolio();
            } else {
                throw new Error("initPortfolio is not available.");
            }
        });
    }

    globalScope.PortfolioBootstrap = { start };
})(window);
