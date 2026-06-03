/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */
/** @file js/core/dev-error-monitor/state/core.js */
(function() {
    const internal = window.__DevMonitorInternal;
    internal.STORAGE_KEY = 'dev-error-monitor:v2';
    internal.state = {
        errors: [], logs: [], breadcrumbs: [], counter: 0, totalEvents: 0, totalLogs: 0,
        isExpanded: false, isVisible: true, filter: 'ALL', sourceFilter: 'ALL', activeTab: 'summary',
        listeners: [], isDisabled: false, isPaused: false,
        startedAt: Date.now(), lastUpdatedAt: null
    };
    internal.notify = function() {
        internal.state.listeners.slice().forEach(fn => {
            try { fn(internal.state); } catch (e) { console.warn('[DevMonitor] Listener failed.', e); }
        });
    };
})();
