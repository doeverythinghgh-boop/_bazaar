/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */
/** @file js/core/dev-error-monitor/diagnostics/memory.js */
(function() {
    window.__DevMonitorInternal.setupMemory = function() {
        const config = window.DevMonitorState.getConfig();
        const interval = window.setInterval(() => {
            if (!performance.memory) return;
            const used = performance.memory.usedJSHeapSize / 1048576;
            if (used > config.memoryWarningMb) window.DevMonitorState.addError({ type: 'MEMORY_WARNING', severity: 'warning', msg: `High JS heap usage: ${used.toFixed(1)} MB`, source: 'memory', meta: { usedMb: Number(used.toFixed(1)), limitMb: Math.round(performance.memory.jsHeapSizeLimit / 1048576) } });
        }, 15000);
        return () => window.clearInterval(interval);
    };
})();