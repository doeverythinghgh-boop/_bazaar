/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */
/** @file js/core/dev-error-monitor/diagnostics/performance.js */
(function() {
    function isIgnoredPerformanceEntry(entry) {
        const name = String(entry && entry.name || '');
        return name.includes('firestore.googleapis.com/google.firestore.v1.Firestore/Listen/channel');
    }

    window.__DevMonitorInternal.setupPerf = function() {
        if (typeof PerformanceObserver !== 'function') return () => {};
        const config = window.DevMonitorState.getConfig();
        const perfObs = new PerformanceObserver((list) => {
            list.getEntries().forEach(entry => {
                if (isIgnoredPerformanceEntry(entry)) return;
                const threshold = entry.entryType === 'measure' ? config.measureDurationThresholdMs : config.resourceDurationThresholdMs;
                if (entry.duration > threshold) window.DevMonitorState.addError({ type: 'PERFORMANCE', severity: 'warning', msg: `${entry.name} took ${entry.duration.toFixed(0)}ms`, source: entry.entryType, url: entry.name, meta: { entryType: entry.entryType, duration: Math.round(entry.duration), startTime: Math.round(entry.startTime) } });
            });
        });
        try { perfObs.observe({ entryTypes: ['measure', 'resource'] }); } catch { }

        const longObs = new PerformanceObserver((list) => {
            list.getEntries().forEach(entry => {
                if (entry.duration < config.longTaskThresholdMs) return;
                window.DevMonitorState.addError({ type: 'UI_FREEZE', severity: 'warning', msg: `Main thread blocked for ${entry.duration.toFixed(0)}ms`, source: 'longtask', meta: { duration: Math.round(entry.duration), startTime: Math.round(entry.startTime) } });
            });
        });
        try { longObs.observe({ entryTypes: ['longtask'] }); } catch { }
        return () => { perfObs.disconnect(); longObs.disconnect(); };
    };
})();
