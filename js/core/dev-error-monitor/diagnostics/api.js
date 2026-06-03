/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */
/** @file js/core/dev-error-monitor/diagnostics/api.js */
(function() {
    let unhooks = [];
    window.DevMonitorDiagnostics = {
        setup() {
            if (unhooks.length) return;
            const internal = window.__DevMonitorInternal;
            unhooks.push(internal.setupPerf());
            unhooks.push(internal.setupMemory());
            unhooks.push(internal.setupMutations());
            unhooks.push(internal.setupOthers());
        },
        teardown() {
            unhooks.forEach(fn => fn && fn());
            unhooks = [];
        }
    };
})();