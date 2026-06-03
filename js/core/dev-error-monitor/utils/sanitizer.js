/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */
/** @file js/core/dev-error-monitor/utils/sanitizer.js */
(function() {
    const internal = window.__DevMonitorInternal;
    internal.safeToString = function(value) {
        try {
            if (value == null) return '';
            return typeof value === 'string' ? value : String(value);
        } catch (e) { return '[Unprintable value]'; }
    };
    internal.sanitizeData = function sanitizeData(value, seen) {
        if (value == null) return value;
        if (!seen) seen = new WeakSet();
        if (value instanceof Error) return { name: value.name, message: value.message, stack: value.stack || '' };
        if (value instanceof Event) return { type: value.type, target: internal.describeElement ? internal.describeElement(value.target) : null };
        if (value instanceof Element) return internal.describeElement ? internal.describeElement(value) : null;
        if (typeof value !== 'object') return value;
        if (seen.has(value)) return '[Circular]';
        seen.add(value);
        if (Array.isArray(value)) return value.slice(0, 25).map(item => sanitizeData(item, seen));
        const output = {};
        Object.keys(value).slice(0, 40).forEach(key => {
            try { output[key] = sanitizeData(value[key], seen); }
            catch (e) { output[key] = '[Unreadable]'; }
        });
        return output;
    };
    internal.safeStringify = function(value) {
        if (typeof value === 'string') return value;
        if (value instanceof Error) return `${value.name}: ${value.message}\n${value.stack || ''}`.trim();
        try { return JSON.stringify(internal.sanitizeData(value)); }
        catch (e) { return internal.safeToString(value); }
    };
})();