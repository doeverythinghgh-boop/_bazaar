/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */
/** @file js/core/dev-error-monitor/config/manager.js */
(function() {
    const internal = window.__DevMonitorInternal;
    function mergeConfig(defaults, overrides) {
        return {
            ...defaults,
            ...overrides,
            ignoredUrlPatterns: (overrides.ignoredUrlPatterns || defaults.ignoredUrlPatterns || []).map(toPattern)
        };
    }
    function toPattern(value) {
        if (value instanceof RegExp) return value;
        if (typeof value === 'string') {
            try { return new RegExp(value, 'i'); }
            catch (e) { return new RegExp(escapeRegExp(value), 'i'); }
        }
        return /$a/;
    }
    function escapeRegExp(value) {
        return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    internal.config = mergeConfig(internal.DEFAULT_CONFIG, window.DevMonitorConfig || {});
})();