/**
 * @file pages/register/js/register-dev-logger.js
 * @description Lightweight developer logger to make wizard progress visible step-by-step.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


(function initRegisterDevLogger(globalScope) {
    "use strict";

    if (!globalScope) return;
    if (globalScope.RegisterDevLogger) return;

    const state = {
        sequence: 0
    };

    function shouldLog() {
        return globalScope.REGISTER_DEBUG !== false;
    }

    function nextSequence() {
        state.sequence += 1;
        return state.sequence;
    }

    function formatPrefix(scope, step) {
        return `[Wizard:${scope}] [${String(step).padStart(2, "0")}]`;
    }

    function log(scope, message, payload) {
        if (!shouldLog()) return;
        const step = nextSequence();
        const prefix = formatPrefix(scope || "General", step);
        if (payload === undefined) {
            console.log(`${prefix} ${message}`);
            return;
        }
        console.log(`${prefix} ${message}`, payload);
    }

    function info(scope, message, payload) {
        log(scope, message, payload);
    }

    function warn(scope, message, payload) {
        if (!shouldLog()) return;
        const step = nextSequence();
        const prefix = formatPrefix(scope || "General", step);
        if (payload === undefined) {
            console.warn(`${prefix} ${message}`);
            return;
        }
        console.warn(`${prefix} ${message}`, payload);
    }

    function error(scope, message, payload) {
        const step = nextSequence();
        const prefix = formatPrefix(scope || "General", step);
        if (payload === undefined) {
            console.error(`${prefix} ${message}`);
            return;
        }
        console.error(`${prefix} ${message}`, payload);
    }

    globalScope.RegisterDevLogger = {
        info,
        warn,
        error
    };
})(window);
