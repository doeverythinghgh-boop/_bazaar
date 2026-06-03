/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */
/** @file js/core/dev-error-monitor/interceptors/network.js */
(function() {
    const internal = window.__DevMonitorInternal;
    async function isIgnorableFcmResponse(res, requestInfo) {
        const url = String((res && res.url) || requestInfo.url || '');
        if (!url.includes('fcm.googleapis.com/v1/projects/') || !url.includes('/messages:send')) return false;
        if (res.status !== 404) return false;

        try {
            const payload = await res.clone().json();
            const error = payload && payload.error;
            return error?.message === 'NotRegistered'
                || error?.status === 'NOT_FOUND'
                || error?.details?.some((detail) => detail?.errorCode === 'UNREGISTERED');
        } catch {
            return false;
        }
    }

    internal.hookFetch = function() {
        if (typeof window.fetch !== 'function' || window.fetch.__isDevMonitorHook) return () => {};
        const originalFetch = window.fetch;
        const hookedFetch = async function (...args) {
            const input = args[0], init = args[1] || {};
            let url = '', method = init.method || 'GET';
            if (typeof input === 'string') url = input; else if (input && input.url) { url = input.url; method = init.method || input.method || method; } else url = String(input);
            const requestInfo = { url, method: String(method).toUpperCase() };
            try {
                const res = await originalFetch.apply(this, args);
                if (!res.ok && !(await isIgnorableFcmResponse(res, requestInfo))) {
                    window.DevMonitorState.addError({ type: 'NETWORK', msg: `HTTP ${res.status} -> ${res.url || requestInfo.url}`, source: 'fetch', url: res.url || requestInfo.url, status: res.status, method: requestInfo.method, meta: requestInfo });
                }
                return res;
            } catch (err) {
                window.DevMonitorState.addError({ type: 'NETWORK', msg: `Fetch failed: ${err && err.message ? err.message : String(err)}`, source: 'fetch', url: requestInfo.url, method: requestInfo.method, stack: err && err.stack, meta: requestInfo });
                throw err;
            }
        };
        hookedFetch.__isDevMonitorHook = true;
        window.fetch = hookedFetch;
        return () => { window.fetch = originalFetch; };
    };
    internal.hookXHR = function() {
        if (!window.XMLHttpRequest || XMLHttpRequest.prototype.open.__isDevMonitorHook) return () => {};
        const originalXHROpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function (method, url) {
            this.__devMonitorRequest = { method: String(method).toUpperCase(), url: String(url) };
            this.addEventListener('load', function() { if (this.status >= 400) window.DevMonitorState.addError({ type: 'NETWORK', msg: `HTTP ${this.status} -> ${this.responseURL || this.__devMonitorRequest.url || 'XHR'}`, source: 'XHR', url: this.responseURL || this.__devMonitorRequest.url, status: this.status, method: this.__devMonitorRequest.method, meta: this.__devMonitorRequest }); });
            this.addEventListener('error', function() { window.DevMonitorState.addError({ type: 'NETWORK', msg: 'XHR request failed', source: 'XHR', url: this.responseURL || this.__devMonitorRequest.url, method: this.__devMonitorRequest.method, meta: this.__devMonitorRequest }); });
            this.addEventListener('abort', function() { window.DevMonitorState.addError({ type: 'NETWORK', severity: 'warning', msg: 'XHR request aborted', source: 'XHR', url: this.responseURL || this.__devMonitorRequest.url, method: this.__devMonitorRequest.method, meta: this.__devMonitorRequest }); });
            return originalXHROpen.apply(this, arguments);
        };
        XMLHttpRequest.prototype.open.__isDevMonitorHook = true;
        return () => { XMLHttpRequest.prototype.open = originalXHROpen; };
    };
})();
