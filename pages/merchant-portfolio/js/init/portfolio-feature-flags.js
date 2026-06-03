/**
 * @file pages/merchant-portfolio/js/init/portfolio-feature-flags.js
 * @description Runtime feature flags for merchant portfolio page.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


(function initPortfolioFeatureFlags(globalScope) {
    "use strict";

    if (!globalScope) return;
    if (globalScope.PortfolioFeatureFlags) return;

    const defaults = {
        PORTFOLIO_BOOTSTRAP_V2: true,
        PORTFOLIO_DOM_CONTRACT_CHECKS: true
    };

    const source = globalScope.__PORTFOLIO_FEATURE_FLAGS__ || {};
    globalScope.PortfolioFeatureFlags = Object.freeze({
        ...defaults,
        ...source
    });
})(window);
