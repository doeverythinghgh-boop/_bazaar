/**
 * @file pages/register/js/register-error-utils.js
 * @description Shared error normalization and logging helpers.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


(function initRegisterErrorUtils(globalScope) {
    "use strict";

    if (!globalScope) return;
    if (globalScope.RegisterErrorUtils) return;

    function normalizeError(error, fallbackMessage = "Unexpected error") {
        if (!error) {
            return { message: fallbackMessage, code: "UNKNOWN", raw: error };
        }
        if (typeof error === "string") {
            return { message: error, code: "STRING_ERROR", raw: error };
        }

        const message = error.message || fallbackMessage;
        const code = error.code || error.name || "UNCLASSIFIED";
        return { message, code, raw: error };
    }

    function logError(scope, message, error, extra = null) {
        const normalized = normalizeError(error, message);
        const payload = {
            code: normalized.code,
            message: normalized.message,
            ...(extra || {})
        };

        if (globalScope.RegisterDevLogger?.error) {
            globalScope.RegisterDevLogger.error(scope, message, payload);
        } else {
            console.error(`[${scope}] ${message}`, payload);
        }

        if (normalized.raw && normalized.raw !== normalized.message) {
            console.error(`[${scope}] raw error`, normalized.raw);
        }

        return normalized;
    }

    globalScope.RegisterErrorUtils = {
        normalizeError,
        logError
    };
})(window);
