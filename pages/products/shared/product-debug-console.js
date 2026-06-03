/**
 * @file pages/products/shared/product-debug-console.js
 * @description Shared verbose console instrumentation for product pages.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


(function initProductDebugConsole() {
    if (window.ProductDebugConsole) return;

    const startTime = Date.now();
    const seenInputs = new WeakMap();

    function getPageName() {
        const bodyId = document.body?.id;
        if (bodyId) return bodyId;

        const path = String(window.location.pathname || '').split('/').filter(Boolean);
        return path[path.length - 1] || 'product-page';
    }

    function isoTime() {
        return new Date().toISOString();
    }

    function elapsed() {
        return `${Date.now() - startTime}ms`;
    }

    function shortText(value, max = 180) {
        if (value == null) return value;
        const text = typeof value === 'string' ? value : JSON.stringify(value);
        return text.length > max ? `${text.slice(0, max)}...` : text;
    }

    function buildPrefix(scope, event) {
        return `[ProductsDebug][${getPageName()}][${scope}][${event}][${elapsed()}][${isoTime()}]`;
    }

    function write(method, scope, event, payload) {
        const prefix = buildPrefix(scope, event);
        if (typeof payload === 'undefined') {
            console[method](prefix);
            return;
        }

        console[method](prefix, payload);
    }

    function safeNodeLabel(node) {
        if (!node) return 'unknown';
        const parts = [node.tagName?.toLowerCase()].filter(Boolean);
        if (node.id) parts.push(`#${node.id}`);
        if (node.name) parts.push(`[name="${node.name}"]`);
        if (node.className && typeof node.className === 'string') {
            const firstClass = node.className.trim().split(/\s+/)[0];
            if (firstClass) parts.push(`.${firstClass}`);
        }
        return parts.join('');
    }

    function extractNodeSnapshot(node) {
        if (!node) return null;

        const value = typeof node.value !== 'undefined' ? shortText(String(node.value), 80) : undefined;
        const text = typeof node.textContent === 'string' ? shortText(node.textContent.trim(), 80) : undefined;

        return {
            target: safeNodeLabel(node),
            value,
            text,
            type: node.type || null
        };
    }

    function shouldLogInput(node, nextValue) {
        const previous = seenInputs.get(node);
        if (previous === nextValue) return false;
        seenInputs.set(node, nextValue);
        return true;
    }

    function installGlobalHooks() {
        if (window.__productDebugConsoleHooksInstalled) return;
        window.__productDebugConsoleHooksInstalled = true;

        write('log', 'bootstrap', 'hooks-install-start');

        window.addEventListener('error', (event) => {
            write('error', 'window', 'error', {
                message: event.message,
                source: event.filename,
                line: event.lineno,
                column: event.colno
            });
        });

        window.addEventListener('unhandledrejection', (event) => {
            write('error', 'window', 'unhandledrejection', shortText(event.reason));
        });

        document.addEventListener('click', (event) => {
            write('log', 'dom', 'click', extractNodeSnapshot(event.target));
        }, true);

        document.addEventListener('submit', (event) => {
            write('log', 'dom', 'submit', extractNodeSnapshot(event.target));
        }, true);

        document.addEventListener('change', (event) => {
            write('log', 'dom', 'change', extractNodeSnapshot(event.target));
        }, true);

        document.addEventListener('input', (event) => {
            const snapshot = extractNodeSnapshot(event.target);
            const nextValue = snapshot?.value ?? snapshot?.text ?? '';
            if (!shouldLogInput(event.target, nextValue)) return;
            write('log', 'dom', 'input', snapshot);
        }, true);

        if (typeof window.fetch === 'function' && !window.__productDebugFetchWrapped) {
            const originalFetch = window.fetch.bind(window);
            window.__productDebugFetchWrapped = true;
            window.fetch = async function wrappedFetch(input, init) {
                const requestUrl = typeof input === 'string' ? input : input?.url;
                const requestMethod = init?.method || input?.method || 'GET';
                write('log', 'network', 'fetch-start', {
                    method: requestMethod,
                    url: requestUrl
                });

                try {
                    const response = await originalFetch(input, init);
                    write('log', 'network', 'fetch-end', {
                        method: requestMethod,
                        url: requestUrl,
                        status: response.status,
                        ok: response.ok
                    });
                    return response;
                } catch (error) {
                    write('error', 'network', 'fetch-error', {
                        method: requestMethod,
                        url: requestUrl,
                        message: error?.message || String(error)
                    });
                    throw error;
                }
            };
        }

        if (typeof window.XMLHttpRequest === 'function' && !window.__productDebugXhrWrapped) {
            const originalOpen = XMLHttpRequest.prototype.open;
            const originalSend = XMLHttpRequest.prototype.send;
            window.__productDebugXhrWrapped = true;

            XMLHttpRequest.prototype.open = function productDebugOpen(method, url) {
                this.__productDebugRequest = { method, url };
                write('log', 'network', 'xhr-open', { method, url });
                return originalOpen.apply(this, arguments);
            };

            XMLHttpRequest.prototype.send = function productDebugSend(body) {
                const meta = this.__productDebugRequest || {};
                write('log', 'network', 'xhr-send', {
                    method: meta.method || 'GET',
                    url: meta.url || '',
                    bodyPreview: shortText(body)
                });

                this.addEventListener('loadend', () => {
                    write('log', 'network', 'xhr-loadend', {
                        method: meta.method || 'GET',
                        url: meta.url || '',
                        status: this.status
                    });
                });

                return originalSend.apply(this, arguments);
            };
        }

        write('log', 'bootstrap', 'hooks-install-complete');
    }

    window.ProductDebugConsole = {
        debug(scope, event, payload) {
            write('debug', scope, event, payload);
        },
        info(scope, event, payload) {
            write('info', scope, event, payload);
        },
        log(scope, event, payload) {
            write('log', scope, event, payload);
        },
        warn(scope, event, payload) {
            write('warn', scope, event, payload);
        },
        error(scope, event, payload) {
            write('error', scope, event, payload);
        },
        snapshot(scope, event, payload) {
            write('log', scope, event, payload);
        },
        installGlobalHooks
    };

    installGlobalHooks();
    write('log', 'bootstrap', 'ready', { path: window.location.pathname });
})();
