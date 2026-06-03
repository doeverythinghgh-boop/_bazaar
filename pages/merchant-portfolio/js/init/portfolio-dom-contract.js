/**
 * @file pages/merchant-portfolio/js/init/portfolio-dom-contract.js
 * @description Validates critical DOM requirements for merchant portfolio page.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


(function initPortfolioDomContract(globalScope) {
    "use strict";

    if (!globalScope) return;
    if (globalScope.PortfolioDomContract) return;

    const REQUIRED_IDS = [
        "header-injection-point",
        "loader-container",
        "portfolio-main-container",
        "portfolio-error",
        "portfolio-error-msg",
        "portfolio-products-grid",
        "reviews-modal"
    ];

    function validate() {
        const missing = REQUIRED_IDS.filter((id) => !document.getElementById(id));
        if (missing.length > 0) {
            console.warn("[PortfolioDomContract] Missing required DOM ids.", { missing });
            return { valid: false, missing };
        }
        return { valid: true, missing: [] };
    }

    globalScope.PortfolioDomContract = {
        validate
    };
})(window);
