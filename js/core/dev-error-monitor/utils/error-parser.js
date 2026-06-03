/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */
/** @file js/core/dev-error-monitor/utils/error-parser.js */
(function() {
    const internal = window.__DevMonitorInternal;
    internal.severityForType = function(type) {
        if (type.includes('PERFORMANCE') || type.includes('WARNING') || type.includes('SPAM') || type.includes('CSS')) return 'warning';
        if (type.includes('INFO')) return 'info';
        if (type === 'CONSOLE_WARN') return 'warning';
        if (type === 'CONSOLE_ASSERT' || type === 'CONSOLE') return 'error';
        return 'error';
    };
    internal.getSourceKey = function(source, url) {
        const value = internal.safeToString(url || source || 'Unknown Source');
        try {
            const parsed = new URL(value, window.location.href);
            return parsed.pathname || parsed.href;
        } catch (e) {
            return value.replace(/:\d+:\d+$/g, '').split('?')[0] || 'Unknown Source';
        }
    };
    internal.normalizeError = function(errorObj) {
        const source = internal.safeToString(errorObj && errorObj.source ? errorObj.source : 'Unknown Source');
        const msg = internal.safeToString(errorObj && errorObj.msg ? errorObj.msg : errorObj && errorObj.message ? errorObj.message : 'Unknown error');
        const type = internal.safeToString(errorObj && errorObj.type ? errorObj.type : 'UNKNOWN').toUpperCase();
        return {
            type,
            severity: errorObj && errorObj.severity ? errorObj.severity : internal.severityForType(type),
            msg,
            source,
            stack: errorObj && errorObj.stack ? internal.safeToString(errorObj.stack) : '',
            url: errorObj && errorObj.url ? internal.safeToString(errorObj.url) : window.location.href,
            method: errorObj && errorObj.method ? internal.safeToString(errorObj.method) : '',
            status: errorObj && errorObj.status != null ? Number(errorObj.status) : null,
            sourceKey: internal.getSourceKey(source, errorObj && errorObj.url),
            meta: errorObj && errorObj.meta ? internal.sanitizeData(errorObj.meta) : null
        };
    };
    internal.generateHash = function(error) {
        const normalized = [
            error.type,
            error.msg.replace(/\d+/g, '#').slice(0, 300),
            error.source.replace(/:\d+:\d+$/g, ':#:#')
        ].join('|');
        let hash = 5381;
        for (let i = 0; i < normalized.length; i++) {
            hash = ((hash << 5) + hash) + normalized.charCodeAt(i);
            hash >>>= 0;
        }
        return hash.toString(36);
    };
    internal.shouldIgnore = function(error) {
        const haystack = `${error.url || ''} ${error.source || ''} ${error.msg || ''} ${internal.safeStringify(error.meta || '')}`;
        return internal.config.ignoredUrlPatterns.some(pattern => pattern.test(haystack));
    };
})();