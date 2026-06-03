/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */
/** @file js/core/dev-error-monitor/interceptors/runtime.js */
(function() {
    window.__DevMonitorInternal.hookRuntime = function() {
        const originalOnError = window.onerror;
        window.onerror = function (message, source, lineno, colno, error) {
            window.DevMonitorState.addError({
                type: 'JS_RUNTIME', msg: window.DevMonitorState.safeToString(message || error && error.message || 'Runtime error'),
                source: `${source || window.location.href}:${lineno || 0}:${colno || 0}`, stack: error && error.stack,
                url: source || window.location.href, meta: { lineno, colno }
            });
            if (typeof originalOnError === 'function') return originalOnError.apply(this, arguments);
            return false;
        };
        return () => { window.onerror = originalOnError; };
    };
})();