/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */
/** @file js/core/dev-error-monitor/breadcrumbs/api.js */
(function() {
    let unhooks = [];
    window.DevMonitorBreadcrumbs = {
        setup() {
            if (unhooks.length) return;
            const internal = window.__DevMonitorInternal;
            unhooks.push(internal.hookBreadcrumbDOM());
            unhooks.push(internal.hookBreadcrumbHistory());
            window.DevMonitorState.addBreadcrumb({ type: 'page_load', url: window.location.href, readyState: document.readyState });
        },
        teardown() {
            unhooks.forEach(fn => fn && fn());
            unhooks = [];
        }
    };
})();