/**
 * @file js/core/dev-error-monitor/loader.js
 * @description Local-only loader and configuration for the development error monitor.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

(function () {
    'use strict';

    const BRIDGE_ORIGIN = 'http://127.0.0.1:3000';
    const host = window.location.hostname;
    const isLocal = host === 'localhost' || host === '127.0.0.1';
    const isAndroid = !!window.Android || host === 'appassets.androidplatform.net' || /Android/i.test(navigator.userAgent || '');
    const isLocalDevelopment = isLocal && !isAndroid;

    if (window.__DevMonitorLoaderActive) return;

    function getCurrentUser() {
        try {
            if (window.UserService && typeof window.UserService.get === 'function') return window.UserService.get();
        } catch { }
        return window.userSession || null;
    }

    function isCurrentUserSuperAdmin() {
        const user = getCurrentUser();
        if (!user) return false;
        try {
            if (typeof window.resolveUserCapabilities === 'function') return !!window.resolveUserCapabilities(user).isSuperAdmin;
            if (typeof window.isSuperAdminUserByIds === 'function') return !!window.isSuperAdminUserByIds(user);
            const authConfig = typeof window.getBazaarAuthConfig === 'function' ? window.getBazaarAuthConfig() : {};
            const superAdminKey = window.SUPER_ADMIN_KEY || authConfig.superAdminKey || '';
            return !!superAdminKey && String(user.user_key || '') === String(superAdminKey);
        } catch (e) {
            return false;
        }
    }

    function isCurrentUserAdmin() {
        const user = getCurrentUser();
        if (!user) return false;
        try {
            if (typeof window.resolveUserCapabilities === 'function') {
                const capabilities = window.resolveUserCapabilities(user);
                return !!(capabilities && capabilities.isAdmin);
            }
            if (typeof window.isAdminUserByIds === 'function') return !!window.isAdminUserByIds(user);
            return isCurrentUserSuperAdmin();
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

    function shouldStart() {
        // Condition 1: enableDevErrorMonitor: true is a strict pre-requisite.
        if (window.AppBehavior && window.AppBehavior.enableDevErrorMonitor !== true) {
            return false;
        }

        // Condition 2: If the logged-in user is a Super Admin, or has explicit session access (via '_hgh1' password suffix):
        if (isCurrentUserSuperAdmin() || hasSessionAccess()) {
            return true;
        }

        // Condition 3: Otherwise, fallback to standard local development rules:
        if (!isLocalDevelopment) {
            return false;
        }

        return isCurrentUserAdmin();
    }

    window.DevMonitorAccess = {
        isLocal: isLocalDevelopment,
        isAndroid,
        getCurrentUser,
        isCurrentUserAdmin,
        isCurrentUserSuperAdmin,
        hasSessionAccess,
        shouldStart
    };

    function fetchConfigAndStart() {
        if (window.__DevMonitorLoaderActive) return;

        // Bypass local bridge server communication completely in production/Android environments
        if (!isLocalDevelopment) {
            console.log('[DevMonitor] Production or Android environment detected. Booting locally without local bridge server contact.');
            startLoader({ enabled: true, verbose: false });
            return;
        }

        console.log('[DevMonitor] Local development environment detected. Fetching bridge server configuration.');
        // Asynchronously query the local bridge server config
        fetch(`${BRIDGE_ORIGIN}/dev-config`)
            .then(res => res.json())
            .then(config => {
                if (config && config.enabled === false) {
                    console.log('[DevMonitor] Disabled by local server configuration (logs/dev-monitor-config.json).');
                    return;
                }
                console.log('[DevMonitor] Configuration successfully fetched. Starting loader.');
                startLoader(config);
            })
            .catch(() => {
                // If local server is offline, fallback to standard local behavior
                console.log('[DevMonitor] Local bridge server offline. Starting without server persistence.');
                startLoader({ enabled: true, verbose: false });
            });
    }

    if (!shouldStart()) {
        let checks = 0;
        const maxChecks = 240;
        const retry = window.setInterval(() => {
            checks++;
            if (window.AppBehavior && window.AppBehavior.enableDevErrorMonitor !== true) {
                window.clearInterval(retry);
                return;
            }
            if (shouldStart()) {
                window.clearInterval(retry);
                fetchConfigAndStart();
            } else if (checks >= maxChecks) {
                window.clearInterval(retry);
            }
        }, 1000);
        window.addEventListener('user-session-changed', () => {
            if (shouldStart()) {
                window.clearInterval(retry);
                fetchConfigAndStart();
            }
        });
        return;
    }

    fetchConfigAndStart();

    function startLoader(serverConfig) {
        if (window.__DevMonitorLoaderActive) return;
        window.__DevMonitorLoaderActive = true;

        window.DevMonitorConfig = {
            maxErrors: 50,
            maxLogs: 200,
            maxEventsBeforeDisable: 200,
            maxBreadcrumbs: 30,
            persist: true,
            autoShow: true,
            autoExpandFirstError: false,
            sourceOpenUrlTemplate: null,
            devLogEndpoint: isLocalDevelopment ? `${BRIDGE_ORIGIN}/dev-logs` : null,
            resourceDurationThresholdMs: 2000,
            measureDurationThresholdMs: 2000,
            longTaskThresholdMs: 50,
            mutationBatchThreshold: 200,
            memoryWarningMb: 300,
            logSpamThresholdPerSecond: 100,
            ignoredUrlPatterns: [
                '/favicon\\.ico(?:$|\\?)',
                '\\.map(?:$|\\?)',
                'gstatic\\.com/generate_204',
                '^chrome-extension://',
                '^moz-extension://',
                '^edge-extension://'
            ],
            verbose: !!(serverConfig && serverConfig.verbose)
        };

        const basePath = '/js/core/dev-error-monitor';

    // Loaded in specific order to satisfy dependencies
        const files = [
        '/config/defaults.js',
        '/config/manager.js',
        '/utils/sanitizer.js',
        '/utils/dom.js',
        '/utils/env.js',
        '/utils/error-parser.js',
        '/state/core.js',
        '/state/filters.js',
        '/state/reports.js',
        '/state/actions.js',
        '/state/persistence.js',
        '/state/api.js',
        '/interceptors/runtime.js',
        '/interceptors/network.js',
        '/interceptors/console.js',
        '/interceptors/events.js',
        '/interceptors/api.js',
        '/diagnostics/performance.js',
        '/diagnostics/memory.js',
        '/diagnostics/mutations.js',
        '/diagnostics/others.js',
        '/diagnostics/api.js',
        '/breadcrumbs/dom.js',
        '/breadcrumbs/history.js',
        '/breadcrumbs/api.js',
        '/ui/styles.js',
        '/ui/banner-core.js',
        '/ui/banner-render.js',
        '/ui/banner-events.js',
        '/ui/api.js',
        '/index.js'
        ];

        files.forEach(file => {
            const script = document.createElement('script');
            script.src = basePath + file;
            script.async = false;
            script.onerror = function () {
                console.error('[DevMonitor] Failed to load module:', script.src);
            };
            document.head.appendChild(script);
        });
    }
})();

