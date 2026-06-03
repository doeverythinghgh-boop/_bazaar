/**
 * @file pages/merchant-portfolio/js/init/portfolio-error-utils.js
 * @description Error normalization and logging helpers for merchant portfolio page.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


(function initPortfolioErrorUtils(globalScope) {
    "use strict";

    if (!globalScope) return;
    if (globalScope.PortfolioErrorUtils) return;

    function normalize(error, fallbackMessage = "Unexpected portfolio error") {
        if (!error) return { message: fallbackMessage, code: "UNKNOWN", raw: error };
        if (typeof error === "string") return { message: error, code: "STRING_ERROR", raw: error };
        return {
            message: error.message || fallbackMessage,
            code: error.code || error.name || "UNCLASSIFIED",
            raw: error
        };
    }

    function log(scope, message, error, extra = null) {
        const normalized = normalize(error, message);
        const payload = {
            message: normalized.message,
            code: normalized.code,
            ...(extra || {})
        };
        console.error(`[${scope}] ${message}`, payload);
        if (normalized.raw && normalized.raw !== normalized.message) {
            console.error(`[${scope}] raw error`, normalized.raw);
        }
        return normalized;
    }

    globalScope.PortfolioErrorUtils = {
        normalize,
        log
    };
})(window);
