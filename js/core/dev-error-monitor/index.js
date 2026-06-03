/**
 * @file js/core/dev-error-monitor/index.js
 * @description Orchestrator for the modular development error monitoring system.
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

    const canStart = window.DevMonitorAccess && typeof window.DevMonitorAccess.shouldStart === 'function'
        ? window.DevMonitorAccess.shouldStart()
        : false;
    if (!canStart) return;
    if (window.DevMonitor && window.DevMonitor.isActive) return;

    let bootAttempts = 0;
    const maxBootAttempts = 50;

    function bootstrap() {
        bootAttempts++;

        if (!window.DevMonitorState || !window.DevMonitorUI) {
            if (bootAttempts <= maxBootAttempts) {
                window.setTimeout(bootstrap, 100);
            } else {
                console.warn('[DevMonitor] Bootstrap timed out. Required modules were not loaded.');
            }
            return;
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', start, { once: true });
        } else {
            start();
        }
    }

    function start() {
        if (window.DevMonitorState && typeof window.DevMonitorState.drainEarlyErrors === 'function') {
            window.DevMonitorState.drainEarlyErrors();
        }

        window.DevMonitorUI.init();

        if (window.DevMonitorBreadcrumbs) window.DevMonitorBreadcrumbs.setup();
        if (window.DevMonitorInterceptors) window.DevMonitorInterceptors.setup();
        if (window.DevMonitorDiagnostics) window.DevMonitorDiagnostics.setup();

        window.DevMonitor = createPublicApi();
        if (!window.DevMonitorAccess || !window.DevMonitorAccess.isLocal) {
            window.addEventListener('user-session-changed', enforceAccess);
        }
        console.log('[DevMonitor] Advanced debugging radar active.');
    }

    function enforceAccess() {
        if (window.DevMonitorAccess && window.DevMonitorAccess.shouldStart()) return;
        if (window.DevMonitor && typeof window.DevMonitor.dispose === 'function') window.DevMonitor.dispose();
    }

    function createPublicApi() {
        return {
            isActive: true,
            getState: window.DevMonitorState.get,
            getConfig: window.DevMonitorState.getConfig,
            /**
             * Report a custom issue to the development monitor.
             * @param {DevMonitorErrorInput} error JSON-safe error payload. Common fields:
             * type, severity, msg/message, source, url, method, status, stack, and meta.
             */
            report(error) {
                window.DevMonitorState.addError({
                    type: error && error.type || 'MANUAL',
                    msg: error && (error.msg || error.message) || 'Manual report',
                    source: error && error.source || 'DevMonitor.report',
                    stack: error && error.stack,
                    severity: error && error.severity,
                    meta: error
                });
            },
            clear: window.DevMonitorState.clear,
            pause: window.DevMonitorState.pause,
            resume: window.DevMonitorState.resume,
            show: window.DevMonitorState.show,
            hide: window.DevMonitorState.hide,
            expand: () => window.DevMonitorState.setExpanded(true),
            collapse: () => window.DevMonitorState.setExpanded(false),
            export: window.DevMonitorState.buildFullReport,
            exportMinimal: window.DevMonitorState.buildMinimalReport,
            exportFull: window.DevMonitorState.buildFullReport,
            dispose() {
                if (window.DevMonitorDiagnostics) window.DevMonitorDiagnostics.teardown();
                if (window.DevMonitorInterceptors) window.DevMonitorInterceptors.teardown();
                if (window.DevMonitorBreadcrumbs) window.DevMonitorBreadcrumbs.teardown();
                if (window.DevMonitorUI) window.DevMonitorUI.teardown();
                this.isActive = false;
                window.removeEventListener('user-session-changed', enforceAccess);
            }
        };
    }

    bootstrap();
})();
