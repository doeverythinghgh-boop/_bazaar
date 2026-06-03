/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */
/** @file js/core/dev-error-monitor/interceptors/console.js */
(function() {
    window.__DevMonitorInternal.hookConsole = function() {
        let originalConsoleLog = console.log, originalConsoleInfo = console.info, originalConsoleError = console.error, originalConsoleWarn = console.warn, originalConsoleAssert = console.assert, originalNativeLog = window.onNativeLog;
        const install = () => {
            if (!console.log.__isDevMonitorHook) {
                originalConsoleLog = console.log;
                const hookedLog = function(...args) {
                    if (originalConsoleLog) originalConsoleLog.apply(console, args);
                    window.DevMonitorState.addLog({ source: 'web', level: 'log', args });
                };
                hookedLog.__isDevMonitorHook = true; console.log = hookedLog;
            }
            if (!console.info.__isDevMonitorHook) {
                originalConsoleInfo = console.info;
                const hookedInfo = function(...args) {
                    if (originalConsoleInfo) originalConsoleInfo.apply(console, args);
                    window.DevMonitorState.addLog({ source: 'web', level: 'info', args });
                };
                hookedInfo.__isDevMonitorHook = true; console.info = hookedInfo;
            }
            if (!console.error.__isDevMonitorHook) {
                originalConsoleError = console.error;
                const hookedError = function(...args) {
                    if (originalConsoleError) originalConsoleError.apply(console, args);
                    window.DevMonitorState.addLog({ source: 'web', level: 'error', args });
                    window.DevMonitorState.addError({ type: 'CONSOLE', severity: 'error', msg: args.map(a => window.DevMonitorState.safeStringify(a)).join(' '), source: 'console.error', meta: { args: args.map(a => window.DevMonitorState.safeStringify(a)) } });
                };
                hookedError.__isDevMonitorHook = true; console.error = hookedError;
            }
            if (!console.warn.__isDevMonitorHook) {
                originalConsoleWarn = console.warn;
                const hookedWarn = function(...args) {
                    if (originalConsoleWarn) originalConsoleWarn.apply(console, args);
                    window.DevMonitorState.addLog({ source: 'web', level: 'warn', args });
                    window.DevMonitorState.addError({ type: 'CONSOLE_WARN', severity: 'warning', msg: args.map(a => window.DevMonitorState.safeStringify(a)).join(' '), source: 'console.warn', meta: { args: args.map(a => window.DevMonitorState.safeStringify(a)) } });
                };
                hookedWarn.__isDevMonitorHook = true; console.warn = hookedWarn;
            }
            if (!console.assert.__isDevMonitorHook) {
                originalConsoleAssert = console.assert;
                const hookedAssert = function(condition, ...args) {
                    if (originalConsoleAssert) originalConsoleAssert.apply(console, arguments);
                    if (condition) return;
                    window.DevMonitorState.addError({ type: 'CONSOLE_ASSERT', severity: 'error', msg: args.length ? args.map(a => window.DevMonitorState.safeStringify(a)).join(' ') : 'console.assert failed', source: 'console.assert', meta: { args: args.map(a => window.DevMonitorState.safeStringify(a)) } });
                };
                hookedAssert.__isDevMonitorHook = true; console.assert = hookedAssert;
            }
        };
        install();
        window.onNativeLog = function(type, message) {
            const level = type || 'log';
            const taggedMessage = '[Android] ' + message;
            if (level === 'error' && originalConsoleError) originalConsoleError.call(console, taggedMessage);
            else if (level === 'warn' && originalConsoleWarn) originalConsoleWarn.call(console, taggedMessage);
            else if (level === 'info' && originalConsoleInfo) originalConsoleInfo.call(console, taggedMessage);
            else if (originalConsoleLog) originalConsoleLog.call(console, taggedMessage);
            window.DevMonitorState.addLog({ source: 'android', level, args: [message] });
            if (typeof originalNativeLog === 'function') {
                try { originalNativeLog(type, message); } catch { }
            }
        };
        const interval = window.setInterval(install, 2000);
        return () => { window.clearInterval(interval); if (originalConsoleLog) console.log = originalConsoleLog; if (originalConsoleInfo) console.info = originalConsoleInfo; if (originalConsoleError) console.error = originalConsoleError; if (originalConsoleWarn) console.warn = originalConsoleWarn; if (originalConsoleAssert) console.assert = originalConsoleAssert; window.onNativeLog = originalNativeLog; };
    };
})();

