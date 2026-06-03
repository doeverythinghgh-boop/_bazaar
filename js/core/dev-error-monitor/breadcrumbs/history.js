/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */
/** @file js/core/dev-error-monitor/breadcrumbs/history.js */
(function() {
    window.__DevMonitorInternal.hookBreadcrumbHistory = function() {
        const handlePopState = () => window.DevMonitorState.addBreadcrumb({ type: 'navigation', mode: 'popstate', url: window.location.href });
        window.addEventListener('popstate', handlePopState);
        let origPush = null, origReplace = null;
        if (window.history && !history.pushState.__isDevMonitorHook) {
            origPush = history.pushState; origReplace = history.replaceState;
            history.pushState = function() { const r = origPush.apply(this, arguments); window.DevMonitorState.addBreadcrumb({ type: 'navigation', mode: 'pushState', url: window.location.href }); return r; };
            history.replaceState = function() { const r = origReplace.apply(this, arguments); window.DevMonitorState.addBreadcrumb({ type: 'navigation', mode: 'replaceState', url: window.location.href }); return r; };
            history.pushState.__isDevMonitorHook = true; history.replaceState.__isDevMonitorHook = true;
        }
        return () => {
            window.removeEventListener('popstate', handlePopState);
            if (origPush) history.pushState = origPush;
            if (origReplace) history.replaceState = origReplace;
        };
    };
})();