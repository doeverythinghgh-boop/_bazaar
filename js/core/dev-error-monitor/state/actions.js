/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */
/** @file js/core/dev-error-monitor/state/actions.js */
(function() {
    const internal = window.__DevMonitorInternal;
    internal.addBreadcrumb = function(data) {
        if (internal.state.isDisabled) return;
        internal.state.breadcrumbs.push({
            ...internal.sanitizeData(data), timestamp: Date.now(), page: window.location.pathname
        });
        while (internal.state.breadcrumbs.length > internal.config.maxBreadcrumbs) {
            internal.state.breadcrumbs.shift();
        }
        internal.persist();
    };
    internal.sendToDevServer = function(error) {
        if (!internal.config.devLogEndpoint || typeof fetch !== 'function') return;
        fetch(internal.config.devLogEndpoint, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(error)
        }).catch(() => {});
    };
    internal.addError = function(errorObj) {
        if (internal.state.isDisabled || internal.state.isPaused) return;
        if (internal.state.totalEvents >= internal.config.maxEventsBeforeDisable) {
            internal.state.isDisabled = true;
            console.warn('[DevMonitor] Kill-switch triggered: Too many errors. Monitoring disabled.');
            internal.notify(); internal.persist();
            return;
        }
        const error = internal.normalizeError(errorObj || {});
        if (internal.shouldIgnore(error)) return;

        internal.state.totalEvents++;
        internal.state.lastUpdatedAt = Date.now();
        const hash = internal.generateHash(error);
        const existing = internal.state.errors.find(e => e.hash === hash);

        if (existing) {
            existing.count++; existing.lastSeenAt = Date.now(); existing.totalEvents = internal.state.totalEvents;
            if (error.stack && !existing.stack) existing.stack = error.stack;
            if (error.meta) existing.meta = error.meta;
        } else {
            error.hash = hash; error.timestamp = Date.now(); error.lastSeenAt = error.timestamp;
            error.count = 1; error.totalEvents = internal.state.totalEvents;
            error.breadcrumbs = internal.state.breadcrumbs.slice();
            error.environment = internal.getEnvironmentSnapshot();
            internal.state.errors.push(error);
            internal.state.counter++;
            while (internal.state.errors.length > internal.config.maxErrors) internal.state.errors.shift();
            internal.sendToDevServer(error);
        }
        if (internal.config.autoShow) internal.state.isVisible = true;
        if (internal.config.autoExpandFirstError && internal.state.counter === 1) internal.state.isExpanded = true;
        internal.notify(); internal.persist();
    };
    internal.drainEarlyErrors = function() {
        const queue = Array.isArray(window.__DevMonitorEarlyQueue) ? window.__DevMonitorEarlyQueue : [];
        if (!queue.length) return;

        const drainedKeys = window.__DevMonitorEarlyDrainedKeys || Object.create(null);
        window.__DevMonitorEarlyDrainedKeys = drainedKeys;

        queue.forEach(entry => {
            if (!entry || entry.__devMonitorDrained) return;
            if (entry.earlyKey && drainedKeys[entry.earlyKey]) return;

            const normalized = internal.normalizeError({
                type: entry.type || 'EARLY_ERROR',
                severity: entry.severity || 'error',
                msg: entry.msg || entry.message || 'Early boot error',
                source: entry.source || entry.url || window.location.href,
                url: entry.url || entry.source || window.location.href,
                stack: entry.stack || '',
                meta: {
                    earlyBoot: true,
                    page: entry.page || window.location.pathname,
                    href: entry.href || window.location.href,
                    lineno: entry.lineno || 0,
                    colno: entry.colno || 0,
                    tagName: entry.tagName || '',
                    originalMeta: entry.meta || null
                }
            });
            const hash = internal.generateHash(normalized);
            const alreadyRecorded = internal.state.errors.some(error => error.hash === hash);

            entry.__devMonitorDrained = true;
            if (entry.earlyKey) drainedKeys[entry.earlyKey] = true;
            if (alreadyRecorded) return;

            internal.addError(normalized);
        });
    };
    internal.addLog = function(logObj) {
        if (internal.state.isDisabled || internal.state.isPaused) return;
        const source = logObj && logObj.source === 'android' ? 'android' : 'web';
        const args = Array.isArray(logObj && logObj.args) ? logObj.args : [logObj && logObj.message];
        const message = args.map(item => internal.safeStringify(item)).join(' ');
        const logEntry = {
            type: source === 'android' ? 'ANDROID_LOG' : 'WEB_LOG',
            severity: logObj && logObj.level === 'error' ? 'error' : logObj && logObj.level === 'warn' ? 'warning' : 'info',
            level: logObj && logObj.level ? internal.safeToString(logObj.level) : 'log',
            msg: message,
            source: source === 'android' ? 'Android' : 'Console',
            sourceKey: source === 'android' ? 'Android' : 'Console',
            timestamp: Date.now()
        };
        internal.state.logs.push(logEntry);
        while (internal.state.logs.length > internal.config.maxLogs) internal.state.logs.shift();
        internal.state.totalLogs++;
        internal.state.lastUpdatedAt = Date.now();
        if (internal.config.autoShow) internal.state.isVisible = true;
        internal.notify(); internal.persist();

        // Forward to dev server if verbose is active
        if (internal.config.verbose) {
            internal.sendToDevServer({
                type: 'LOG',
                severity: logEntry.severity,
                level: logEntry.level,
                msg: logEntry.msg,
                source: logEntry.source,
                timestamp: logEntry.timestamp,
                environment: internal.getEnvironmentSnapshot()
            });
        }
    };
    internal.clear = function() {
        internal.state.errors = []; internal.state.logs = []; internal.state.counter = 0; internal.state.totalEvents = 0; internal.state.totalLogs = 0;
        internal.state.lastUpdatedAt = null; internal.state.isExpanded = false; internal.state.isVisible = true;
        internal.state.isDisabled = false; internal.state.sourceFilter = 'ALL'; internal.state.filter = 'ALL'; internal.state.activeTab = 'summary';
        internal.notify(); internal.persist();
    };
    internal.pause = function() { internal.state.isPaused = true; internal.notify(); internal.persist(); };
    internal.resume = function() { internal.state.isPaused = false; internal.notify(); internal.persist(); };
    internal.subscribe = function(fn) {
        if (typeof fn !== 'function') return function noop() {};
        internal.state.listeners.push(fn);
        fn(internal.state);
        return function() { internal.state.listeners = internal.state.listeners.filter(l => l !== fn); };
    };
})();
