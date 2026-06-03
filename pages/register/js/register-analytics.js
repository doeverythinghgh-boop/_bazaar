/**
 * @file pages/register/js/register-analytics.js
 * @description Internal analytics and event tracking for the registration wizard.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


window.RegisterAnalytics = (function () {
    'use strict';

    const STORAGE_KEY = 'register_analytics_log';

    // Unique Session ID for linking events
    const sessionId = (function() {
        let sid = LocalDBSession.getItem('reg_session_id');
        if (!sid) {
            sid = `sid-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
            LocalDBSession.setItem('reg_session_id', sid);
        }
        return sid;
    })();

    function logEvent(name, data = {}) {
        const logEntry = {
            sessionId: sessionId,
            event: name,
            timestamp: new Date().toISOString(),
            data: data
        };

        console.log(`[Analytics][${sessionId}] ${name}`, data);

        try {
            const logs = JSON.parse(LocalDBStorage.getItem(STORAGE_KEY) || '[]');
            logs.push(logEntry);
            LocalDBStorage.setItem(STORAGE_KEY, JSON.stringify(logs.slice(-100))); // Keep last 100
        } catch (e) {
            console.warn('[Analytics] Save failed', e);
        }
    }

    function trackStepStart(stepId) {
        logEvent('step_start', { stepId });
    }

    function trackStepComplete(stepId) {
        logEvent('step_complete', { stepId });
    }

    function trackStepError(stepId, field, errorCode) {
        logEvent('step_error', { stepId, field, errorCode });
    }

    function trackDropOff(stepId) {
        logEvent('drop_off', { stepId });
    }

    function runCleanup() {
        try {
            const logs = JSON.parse(LocalDBStorage.getItem(STORAGE_KEY) || '[]');
            const now = new Date().getTime();
            const EXPIRY = 24 * 60 * 60 * 1000; // 24 Hours

            const cleaned = logs
                .filter(log => (now - new Date(log.timestamp).getTime()) < EXPIRY)
                .slice(-100);

            LocalDBStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
            console.log(`[Analytics] Cleanup complete. Remaining: ${cleaned.length}`);
        } catch (e) {
            console.warn('[Analytics] Cleanup failed', e);
        }
    }

    // Initial Cleanup
    runCleanup();

    return {
        sessionId,
        trackStepStart,
        trackStepComplete,
        trackStepError,
        trackDropOff,
        logEvent,
        runCleanup
    };
})();
