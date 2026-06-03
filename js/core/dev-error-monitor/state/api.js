/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */
/** @file js/core/dev-error-monitor/state/api.js */
(function() {
    const internal = window.__DevMonitorInternal;
    window.DevMonitorState = {
        get: () => internal.state,
        getConfig: () => internal.config,
        getFilteredErrors: internal.getFilteredErrors,
        getFilteredEntries: internal.getFilteredEntries,
        getSeverityCounts: internal.getSeverityCounts,
        getSourceGroups: internal.getSourceGroups,
        addError: internal.addError,
        drainEarlyErrors: internal.drainEarlyErrors,
        addLog: internal.addLog,
        addBreadcrumb: internal.addBreadcrumb,
        subscribe: internal.subscribe,
        setFilter: (f) => { internal.state.filter = internal.state.filter === 'ANDROID_LOG' && f === 'ANDROID_LOG' ? 'ALL' : f; internal.notify(); internal.persist(); },
        setSourceFilter: (sf) => { internal.state.sourceFilter = sf; internal.notify(); internal.persist(); },
        setActiveTab: (tab) => {
            internal.state.activeTab = tab || 'summary';
            if (internal.state.activeTab === 'logs' && internal.state.filter !== 'ANDROID_LOG') internal.state.filter = 'ALL';
            if (internal.state.activeTab !== 'logs' && internal.state.filter === 'ANDROID_LOG') internal.state.filter = 'ALL';
            internal.notify(); internal.persist();
        },
        toggleExpand: () => { internal.state.isExpanded = !internal.state.isExpanded; internal.notify(); internal.persist(); },
        setExpanded: (e) => { internal.state.isExpanded = Boolean(e); internal.notify(); internal.persist(); },
        hide: () => { internal.state.isVisible = false; internal.notify(); internal.persist(); },
        show: () => { internal.state.isVisible = true; internal.notify(); internal.persist(); },
        clear: internal.clear,
        pause: internal.pause,
        resume: internal.resume,
        buildReport: internal.buildReport,
        buildMinimalReport: internal.buildMinimalReport,
        buildFullReport: internal.buildFullReport,
        safeStringify: internal.safeStringify,
        safeToString: internal.safeToString,
        describeElement: internal.describeElement,
        config: internal.config
    };
})();
