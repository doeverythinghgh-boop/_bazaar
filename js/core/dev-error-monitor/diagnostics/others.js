/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */
/** @file js/core/dev-error-monitor/diagnostics/others.js */
(function() {
    window.__DevMonitorInternal.setupOthers = function() {
        const config = window.DevMonitorState.getConfig();
        let originalLog = null, logCount = 0, spamInterval = null;
        if (console.log && !console.log.__isDevMonitorHook) {
            originalLog = console.log;
            console.log = function (...args) { logCount++; if (originalLog) originalLog.apply(console, args); };
            console.log.__isDevMonitorHook = true;
            console.log.__isDevMonitorLogHook = true;
            spamInterval = window.setInterval(() => {
                if (logCount > config.logSpamThresholdPerSecond) window.DevMonitorState.addError({ type: 'SPAM_DETECTION', severity: 'warning', msg: `Too many console logs (${logCount}) detected in 1 second.`, source: 'console.log', meta: { count: logCount } });
                logCount = 0;
            }, 1000);
        }

        const cssTimer = window.setTimeout(() => {
            Array.from(document.styleSheets).forEach(sheet => {
                try { sheet.cssRules; } catch (e) { window.DevMonitorState.addError({ type: 'CSS_ACCESS_ERROR', severity: 'warning', msg: 'Cannot access CSS rules. The stylesheet may be blocked by CORS.', source: sheet.href || 'inline stylesheet', url: sheet.href || window.location.href }); }
            });
        }, 2000);

        const hbTimer = window.setTimeout(() => {
            if (typeof window.APP_READY !== 'undefined' && !window.APP_READY) window.DevMonitorState.addError({ type: 'SILENT_FAILURE', msg: 'Application detected as not ready after 5 seconds of loading.', source: 'Heartbeat', meta: { APP_READY: window.APP_READY } });
            if (window.location.pathname.includes('merchant-portfolio') && !window.portfolioNavigationRestorationComplete) window.DevMonitorState.addError({ type: 'PORTFOLIO_RESTORE_PENDING', severity: 'warning', msg: 'Portfolio navigation restoration still pending after 5 seconds.', source: 'Heartbeat', meta: { portfolioNavigationRestorationComplete: window.portfolioNavigationRestorationComplete } });
        }, 5000);

        return () => {
            if (spamInterval) window.clearInterval(spamInterval);
            if (cssTimer) window.clearTimeout(cssTimer);
            if (hbTimer) window.clearTimeout(hbTimer);
            if (originalLog) console.log = originalLog;
        };
    };
})();