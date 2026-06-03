/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */
/** @file js/core/dev-error-monitor/utils/env.js */
(function() {
    window.__DevMonitorInternal.getEnvironmentSnapshot = function() {
        return {
            href: window.location.href,
            userAgent: navigator.userAgent,
            viewport: `${window.innerWidth}x${window.innerHeight}`,
            language: navigator.language || '',
            online: navigator.onLine,
            readyState: document.readyState
        };
    };
})();