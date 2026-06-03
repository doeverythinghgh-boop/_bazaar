/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */
/** @file js/core/dev-error-monitor/state/filters.js */
(function() {
    const internal = window.__DevMonitorInternal;
    internal.getFilteredErrors = function() {
        return internal.state.errors.filter(error => {
            if (internal.state.sourceFilter !== 'ALL' && error.sourceKey !== internal.state.sourceFilter) return false;
            if (internal.state.filter === 'ALL') return true;
            if (internal.state.filter === 'NETWORK') return error.type === 'NETWORK' || error.type === 'RESOURCE';
            if (internal.state.filter === 'SEVERITY_ERROR') return error.severity === 'error';
            if (internal.state.filter === 'SEVERITY_WARNING' || internal.state.filter === 'WARNINGS') return error.severity === 'warning';
            if (internal.state.filter === 'SEVERITY_INFO') return error.severity === 'info';
            return error.type === internal.state.filter;
        });
    };
    internal.getFilteredEntries = function() {
        const errors = internal.state.errors.map(error => ({ kind: 'error', ...error }));
        const logs = internal.state.logs.map(log => ({ kind: 'log', count: 1, ...log }));
        return errors.concat(logs).filter(entry => {
            if (internal.state.sourceFilter !== 'ALL' && entry.sourceKey !== internal.state.sourceFilter) return false;
            if (internal.state.filter === 'ALL') return true;
            if (internal.state.filter === 'ANDROID_LOG') return entry.type === 'ANDROID_LOG';
            if (entry.kind === 'log') return false;
            if (internal.state.filter === 'NETWORK') return entry.type === 'NETWORK' || entry.type === 'RESOURCE';
            if (internal.state.filter === 'SEVERITY_ERROR') return entry.severity === 'error';
            if (internal.state.filter === 'SEVERITY_WARNING' || internal.state.filter === 'WARNINGS') return entry.severity === 'warning';
            if (internal.state.filter === 'SEVERITY_INFO') return entry.severity === 'info';
            return entry.type === internal.state.filter;
        }).sort((a, b) => (a.lastSeenAt || a.timestamp || 0) - (b.lastSeenAt || b.timestamp || 0));
    };
    internal.getSeverityCounts = function() {
        return internal.state.errors.concat(internal.state.logs).reduce((counts, entry) => {
            const severity = entry.severity || 'error';
            counts[severity] = (counts[severity] || 0) + 1;
            return counts;
        }, { error: 0, warning: 0, info: 0 });
    };
    internal.getSourceGroups = function() {
        const groups = new Map();
        internal.state.errors.concat(internal.state.logs).forEach(entry => {
            const key = entry.sourceKey || 'Unknown Source';
            const group = groups.get(key) || { key, count: 0, events: 0, latestAt: 0, severities: { error: 0, warning: 0, info: 0 } };
            group.count++; group.events += entry.count || 1;
            group.latestAt = Math.max(group.latestAt, entry.lastSeenAt || entry.timestamp || 0);
            group.severities[entry.severity || 'error']++;
            groups.set(key, group);
        });
        return Array.from(groups.values()).sort((a, b) => b.events - a.events || b.latestAt - a.latestAt);
    };
})();
