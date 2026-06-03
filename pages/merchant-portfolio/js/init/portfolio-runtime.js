/**
 * @file pages/merchant-portfolio/js/init/portfolio-runtime.js
 * @description Final runtime initialization for the merchant portfolio.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 1. Try modern V2 bootstrap if available
        if (window.PortfolioFeatureFlags?.PORTFOLIO_BOOTSTRAP_V2 !== false &&
            window.PortfolioBootstrap?.start) {
            await window.PortfolioBootstrap.start();
            return;
        }

        // 2. Fallback to legacy sequential initialization

        // Theme initialization
        if (typeof initAppTheme === 'function') {
            initAppTheme();
        }

        // Translations loading
        if (typeof window.loadIndexTranslations === 'function') {
            await window.loadIndexTranslations();
        }

        // Session management
        if (typeof SessionManager !== 'undefined' && SessionManager.init) {
            SessionManager.init();
        }

        // Global Header injection.
        // Pass 'index-login-btn' as the active button so the header correctly highlights
        // the login/profile button when the user is viewing their own merchant portfolio.
        if (typeof AppHeader !== 'undefined' && AppHeader.init) {
            await AppHeader.init('header-injection-point', 'index-login-btn');
        }

        // Portfolio specific initialization
        if (typeof initPortfolio === 'function') {
            await initPortfolio();
        }

    } catch (error) {
        if (window.PortfolioErrorUtils?.log) {
            window.PortfolioErrorUtils.log("MerchantPortfolioPage", "Runtime initialization failed.", error);
        } else {
            console.error("[MerchantPortfolioPage] Runtime initialization failed.", error);
        }

        // Ensure the loader is hidden even on failure to prevent a stuck screen
        const loader = document.getElementById('portfolio-main-loader');
        if (loader) {
            loader.style.display = 'none';
        }
    }
});
