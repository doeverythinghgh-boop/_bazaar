/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */
/** @file js/core/dev-error-monitor/interceptors/events.js */
(function() {
    window.__DevMonitorInternal.hookEvents = function() {
        const handleResourceError = (event) => {
            const target = event.target;
            if (!target || target === window || !(target.src || target.href)) return;
            const url = target.src || target.href;
            window.DevMonitorState.addError({ type: 'RESOURCE', msg: `Failed to load: ${url}`, source: target.tagName || 'RESOURCE', url, meta: window.DevMonitorState.describeElement(target) });
        };
        const handleUnhandledRejection = (event) => {
            const reason = event.reason;
            const message = reason && reason.message ? reason.message : window.DevMonitorState.safeStringify(reason);
            const name = reason && reason.name ? reason.name : '';
            const isDynamicImport = /dynamically imported module|dynamic import|loading chunk|chunkloaderror|import\(\)/i.test(`${name} ${message}`);
            const match = String(message).match(/(https?:\/\/[^\s'")]+|\/[^\s'")]+\.js[^\s'")]*)/i);
            window.DevMonitorState.addError({ type: isDynamicImport ? 'DYNAMIC_IMPORT' : 'PROMISE', msg: message, source: isDynamicImport ? (match ? match[1] : 'dynamic import') : 'Unhandled Promise Rejection', stack: reason && reason.stack, meta: { reason: window.DevMonitorState.safeStringify(reason) } });
        };
        window.addEventListener('error', handleResourceError, true);
        window.addEventListener('unhandledrejection', handleUnhandledRejection);

        let originalAddEventListener = null, originalRemoveEventListener = null;
        const wrappedListeners = new WeakMap();
        if (!EventTarget.prototype.addEventListener.__isDevMonitorHook) {
            originalAddEventListener = EventTarget.prototype.addEventListener;
            originalRemoveEventListener = EventTarget.prototype.removeEventListener;
            EventTarget.prototype.addEventListener = function (type, listener, options) {
                if (!listener || type === 'error' || type === 'unhandledrejection' || (typeof listener !== 'function' && typeof listener.handleEvent !== 'function')) return originalAddEventListener.call(this, type, listener, options);
                let wrappedByType = wrappedListeners.get(listener);
                if (!wrappedByType) { wrappedByType = new Map(); wrappedListeners.set(listener, wrappedByType); }
                let wrapped = wrappedByType.get(type);
                if (!wrapped) {
                    if (typeof listener === 'function') {
                        wrapped = function (...args) { try { return listener.apply(this, args); } catch (e) { window.DevMonitorState.addError({ type: 'EVENT_HANDLER', msg: e && e.message ? e.message : String(e), source: `EventListener: ${type}`, stack: e && e.stack, meta: { eventType: type } }); throw e; } };
                    } else {
                        wrapped = { handleEvent(event) { try { return listener.handleEvent.call(listener, event); } catch (e) { window.DevMonitorState.addError({ type: 'EVENT_HANDLER', msg: e && e.message ? e.message : String(e), source: `EventListener: ${type}`, stack: e && e.stack, meta: { eventType: type } }); throw e; } } };
                    }
                    wrappedByType.set(type, wrapped);
                }
                return originalAddEventListener.call(this, type, wrapped, options);
            };
            EventTarget.prototype.removeEventListener = function (type, listener, options) {
                const wrappedByType = listener && wrappedListeners.get(listener);
                const wrapped = wrappedByType && wrappedByType.get(type);
                return originalRemoveEventListener.call(this, type, wrapped || listener, options);
            };
            EventTarget.prototype.addEventListener.__isDevMonitorHook = true;
        }

        return () => {
            window.removeEventListener('error', handleResourceError, true);
            window.removeEventListener('unhandledrejection', handleUnhandledRejection);
            if (originalAddEventListener) EventTarget.prototype.addEventListener = originalAddEventListener;
            if (originalRemoveEventListener) EventTarget.prototype.removeEventListener = originalRemoveEventListener;
        };
    };
})();