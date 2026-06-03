/**
 * @file js/PRODUCT_SERVICE/product-category-logger.js
 * @description Unified developer logger for category-driven product UI flows.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


(function initProductCategoryLogger() {
    const PREFIX = 'ProductCategory';

    function isEnabled() {
        if (typeof window === 'undefined') return true;
        return window.__CATEGORY_UI_DEBUG__ !== false;
    }

    function emit(level, scope, step, payload) {
        if (!isEnabled()) return;
        const method = console[level] || console.log;
        const label = `[${PREFIX}][${scope}] ${step}`;
        if (typeof payload === 'undefined') {
            method.call(console, label);
            return;
        }
        method.call(console, label, payload);
    }

    function group(scope, step, payload) {
        if (!isEnabled()) return;
        const label = `[${PREFIX}][${scope}] ${step}`;
        if (typeof console.group === 'function') {
            if (typeof payload === 'undefined') console.group(label);
            else console.group(label, payload);
            return;
        }
        emit('log', scope, step, payload);
    }

    function groupEnd() {
        if (!isEnabled()) return;
        if (typeof console.groupEnd === 'function') {
            console.groupEnd();
        }
    }

    window.ProductCategoryLogger = {
        emit,
        group,
        groupEnd,
        info(scope, step, payload) {
            emit('log', scope, step, payload);
        },
        warn(scope, step, payload) {
            emit('warn', scope, step, payload);
        },
        error(scope, step, payload) {
            emit('error', scope, step, payload);
        },
        isEnabled
    };
})();
