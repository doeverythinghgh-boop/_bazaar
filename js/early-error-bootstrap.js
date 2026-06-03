/**
 * @file js/early-error-bootstrap.js
 * @description Captures page boot errors before the development monitor is loaded.
 */
(function () {
    'use strict';

    if (window.__DevMonitorEarlyBootstrapActive) return;
    window.__DevMonitorEarlyBootstrapActive = true;

    // --- Dynamic Console Suppression for Production & Android ---
    (function () {
        const host = window.location.hostname;
        const isLocal = host === 'localhost' || host === '127.0.0.1';
        const isAndroid = !!window.Android || host === 'appassets.androidplatform.net' || /Android/i.test(navigator.userAgent || '');
        const isLocalDevelopment = isLocal && !isAndroid;
        const isProductionOrAndroid = !isLocalDevelopment;

        if (isProductionOrAndroid) {
            function isCurrentUserSuperAdmin() {
                try {
                    const rawUser = LocalDBStorage.getItem('loggedInUser');
                    if (!rawUser) return false;
                    const parsed = JSON.parse(rawUser);
                    const user = parsed ? (parsed.user || parsed) : null;
                    if (!user) return false;

                    const explicitRole = typeof user.system_role === 'string' ? user.system_role.trim().toLowerCase() : '';
                    if (explicitRole === 'super_admin') return true;

                    let superAdminKey = '682dri6b';
                    if (window.BazaarRuntimeConfig && window.BazaarRuntimeConfig.auth && window.BazaarRuntimeConfig.auth.superAdminKey) {
                        superAdminKey = window.BazaarRuntimeConfig.auth.superAdminKey;
                    } else if (window.SUPER_ADMIN_KEY) {
                        superAdminKey = window.SUPER_ADMIN_KEY;
                    }
                    return !!superAdminKey && String(user.user_key || '') === String(superAdminKey);
                } catch (e) {
                    return false;
                }
            }

            function hasSessionAccess() {
                try {
                    return !!window.LocalDBSession && LocalDBSession.getItem('dev-monitor-session-access') === '1';
                } catch (e) {
                    return false;
                }
            }

            function shouldSuppressConsole() {
                return !isCurrentUserSuperAdmin() && !hasSessionAccess();
            }

            const consoleMethods = ['log', 'warn', 'error', 'info', 'debug', 'trace', 'dir', 'table', 'group', 'groupCollapsed', 'groupEnd'];
            consoleMethods.forEach(method => {
                const original = console[method];
                if (typeof original === 'function') {
                    console[method] = function (...args) {
                        if (!shouldSuppressConsole()) {
                            original.apply(console, args);
                        }
                    };
                }
            });
        }
    })();

    const MAX_QUEUE_SIZE = 100;
    const queue = Array.isArray(window.__DevMonitorEarlyQueue) ? window.__DevMonitorEarlyQueue : [];
    const seen = window.__DevMonitorEarlySeen || Object.create(null);

    window.__DevMonitorEarlyQueue = queue;
    window.__DevMonitorEarlySeen = seen;

    function safeToString(value) {
        if (value == null) return '';
        try {
            if (typeof value === 'string') return value;
            if (value instanceof Error) return value.message || String(value);
            return String(value);
        } catch (e) {
            return '[Unserializable value]';
        }
    }

    function getTargetUrl(target) {
        if (!target) return '';
        return target.src || target.href || target.currentSrc || '';
    }

    function buildKey(entry) {
        return [
            entry.type || '',
            entry.msg || '',
            entry.source || '',
            entry.url || '',
            entry.lineno || 0,
            entry.colno || 0,
            entry.tagName || ''
        ].join('|');
    }

    function enqueue(entry) {
        if (window.DevMonitorState && window.DevMonitor && window.DevMonitor.isActive) return;

        const normalized = {
            type: entry.type || 'EARLY_ERROR',
            severity: entry.severity || 'error',
            msg: safeToString(entry.msg || entry.message || 'Early boot error'),
            source: safeToString(entry.source || entry.url || window.location.href),
            url: safeToString(entry.url || entry.source || window.location.href),
            stack: safeToString(entry.stack || ''),
            lineno: Number(entry.lineno || 0),
            colno: Number(entry.colno || 0),
            tagName: safeToString(entry.tagName || ''),
            timestamp: Date.now(),
            page: window.location.pathname,
            href: window.location.href,
            meta: entry.meta || null
        };

        const key = buildKey(normalized);
        if (seen[key]) return;
        seen[key] = true;

        normalized.earlyKey = key;
        queue.push(normalized);
        while (queue.length > MAX_QUEUE_SIZE) queue.shift();
    }

    const previousOnError = window.onerror;
    window.onerror = function (message, source, lineno, colno, error) {
        enqueue({
            type: 'EARLY_RUNTIME',
            msg: message || (error && error.message) || 'Runtime error during page boot',
            source: source || window.location.href,
            url: source || window.location.href,
            stack: error && error.stack,
            lineno,
            colno,
            meta: { phase: 'window.onerror' }
        });

        if (typeof previousOnError === 'function') {
            return previousOnError.apply(this, arguments);
        }
        return false;
    };

    window.addEventListener('error', function (event) {
        const target = event && event.target;
        const url = getTargetUrl(target);

        if (target && target !== window && url) {
            enqueue({
                type: 'EARLY_RESOURCE',
                msg: 'Failed to load resource: ' + url,
                source: url,
                url,
                tagName: target.tagName || '',
                meta: {
                    phase: 'resource-error',
                    tagName: target.tagName || '',
                    id: target.id || '',
                    className: target.className || ''
                }
            });
            return;
        }

        if (event && event.message) {
            enqueue({
                type: 'EARLY_RUNTIME',
                msg: event.message,
                source: event.filename || window.location.href,
                url: event.filename || window.location.href,
                stack: event.error && event.error.stack,
                lineno: event.lineno,
                colno: event.colno,
                meta: { phase: 'error-event' }
            });
        }
    }, true);

    window.addEventListener('unhandledrejection', function (event) {
        const reason = event && event.reason;
        enqueue({
            type: 'EARLY_PROMISE',
            msg: reason && reason.message ? reason.message : safeToString(reason || 'Unhandled promise rejection during page boot'),
            source: 'Unhandled Promise Rejection',
            url: window.location.href,
            stack: reason && reason.stack,
            meta: {
                phase: 'unhandledrejection',
                reason: safeToString(reason)
            }
        });
    });
})();
