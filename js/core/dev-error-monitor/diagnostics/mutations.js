/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */
/** @file js/core/dev-error-monitor/diagnostics/mutations.js */
(function() {
    window.__DevMonitorInternal.setupMutations = function() {
        let mutObs = null;
        const observe = () => {
            if (!document.body || mutObs) return;
            const config = window.DevMonitorState.getConfig();
            mutObs = new MutationObserver((mutations) => {
                if (mutations.length > config.mutationBatchThreshold) window.DevMonitorState.addError({ type: 'DOM_FLOOD', severity: 'warning', msg: `Detected ${mutations.length} DOM mutations in a single batch.`, source: 'MutationObserver', meta: { mutations: mutations.length } });
            });
            mutObs.observe(document.body, { childList: true, subtree: true });
        };
        if (document.body) observe(); else document.addEventListener('DOMContentLoaded', observe, { once: true });
        return () => { if (mutObs) mutObs.disconnect(); };
    };
})();