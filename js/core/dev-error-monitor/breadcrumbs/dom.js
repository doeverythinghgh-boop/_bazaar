/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */
/** @file js/core/dev-error-monitor/breadcrumbs/dom.js */
(function() {
    window.__DevMonitorInternal.hookBreadcrumbDOM = function() {
        const handleClick = e => window.DevMonitorState.addBreadcrumb({ type: 'click', target: window.DevMonitorState.describeElement(e.target), x: e.clientX, y: e.clientY });
        const handleSubmit = e => window.DevMonitorState.addBreadcrumb({ type: 'submit', target: window.DevMonitorState.describeElement(e.target) });
        const handleFocus = e => {
            const tag = e.target && e.target.tagName ? e.target.tagName.toUpperCase() : '';
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') window.DevMonitorState.addBreadcrumb({ type: 'input_focus', target: window.DevMonitorState.describeElement(e.target) });
        };
        document.addEventListener('click', handleClick, true);
        document.addEventListener('submit', handleSubmit, true);
        document.addEventListener('focusin', handleFocus, true);
        return () => {
            document.removeEventListener('click', handleClick, true);
            document.removeEventListener('submit', handleSubmit, true);
            document.removeEventListener('focusin', handleFocus, true);
        };
    };
})();