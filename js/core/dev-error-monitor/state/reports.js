/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */
/** @file js/core/dev-error-monitor/state/reports.js */
(function() {
    const internal = window.__DevMonitorInternal;
    internal.minimalError = function(error) {
        return { type: error.type, severity: error.severity, msg: error.msg, source: error.source, sourceKey: error.sourceKey, url: error.url, status: error.status, count: error.count, lastSeenAt: error.lastSeenAt };
    };
    internal.buildMinimalReport = function(error) {
        const payload = error ? internal.minimalError(error) : {
            generatedAt: new Date().toISOString(),
            environment: internal.getEnvironmentSnapshot(),
            counts: { totalEvents: internal.state.totalEvents, totalLogs: internal.state.totalLogs, groupedIssues: internal.state.counter, severities: internal.getSeverityCounts() },
            sourceGroups: internal.getSourceGroups().slice(0, 10),
            logs: internal.state.logs.slice(-50),
            errors: internal.state.errors.map(internal.minimalError)
        };
        return JSON.stringify(payload, null, 2);
    };
    internal.buildFullReport = function(error) {
        const payload = error || {
            generatedAt: new Date().toISOString(),
            environment: internal.getEnvironmentSnapshot(),
            state: { counter: internal.state.counter, totalEvents: internal.state.totalEvents, totalLogs: internal.state.totalLogs, filter: internal.state.filter, sourceFilter: internal.state.sourceFilter, isPaused: internal.state.isPaused, isDisabled: internal.state.isDisabled },
            severityCounts: internal.getSeverityCounts(),
            sourceGroups: internal.getSourceGroups(),
            breadcrumbs: internal.state.breadcrumbs,
            logs: internal.state.logs,
            errors: internal.state.errors
        };
        return JSON.stringify(payload, null, 2);
    };
    internal.buildReport = internal.buildFullReport;
})();
