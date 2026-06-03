/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */
/** @file js/core/dev-error-monitor/interceptors/api.js */
(function() {
    let unhooks = [];
    window.DevMonitorInterceptors = {
        setup() {
            const internal = window.__DevMonitorInternal;
            if (unhooks.length) return;
            unhooks.push(internal.hookRuntime());
            unhooks.push(internal.hookFetch());
            unhooks.push(internal.hookXHR());
            unhooks.push(internal.hookConsole());
            unhooks.push(internal.hookEvents());
        },
        teardown() {
            unhooks.forEach(fn => fn && fn());
            unhooks = [];
        }
    };
})();