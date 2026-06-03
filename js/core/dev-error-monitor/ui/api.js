/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */
/** @file js/core/dev-error-monitor/ui/api.js */
(function() {
    let unsubscribe = null, renderFrame = null;
    window.DevMonitorUI = {
        init() {
            if (document.getElementById('dev-error-monitor-banner')) return;
            window.__DevMonitorInternal.injectStyles();
            window.__DevMonitorInternal.createBanner();
            unsubscribe = window.DevMonitorState.subscribe(state => {
                if (renderFrame) return;
                const schedule = window.requestAnimationFrame || (cb => window.setTimeout(cb, 16));
                renderFrame = schedule(() => { renderFrame = null; window.__DevMonitorInternal.renderBanner(state); });
            });
        },
        teardown() {
            if (unsubscribe) unsubscribe();
            unsubscribe = null;
            if (renderFrame) (window.cancelAnimationFrame || window.clearTimeout)(renderFrame);
            renderFrame = null;
            const banner = document.getElementById('dev-error-monitor-banner');
            if (banner) banner.remove();
        }
    };
})();
