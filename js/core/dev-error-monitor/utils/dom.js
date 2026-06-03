/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */
/** @file js/core/dev-error-monitor/utils/dom.js */
(function() {
    const internal = window.__DevMonitorInternal;
    internal.getElementLabel = function(element) {
        if (!element) return '';
        const label = element.getAttribute && (element.getAttribute('aria-label') || element.getAttribute('title'));
        if (label) return label.slice(0, 80);
        const tag = element.tagName ? element.tagName.toUpperCase() : '';
        if (tag === 'INPUT' || tag === 'TEXTAREA') return element.name || element.id || element.type || '';
        return (element.innerText || element.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80);
    };
    internal.describeElement = function(element) {
        if (!element || !element.tagName) return null;
        const classes = typeof element.className === 'string' ? element.className : '';
        return {
            tag: element.tagName,
            id: element.id || '',
            classes,
            name: element.getAttribute && element.getAttribute('name') || '',
            role: element.getAttribute && element.getAttribute('role') || '',
            text: internal.getElementLabel(element)
        };
    };
})();