/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */
/** @file js/core/dev-error-monitor/config/defaults.js */
window.__DevMonitorInternal = window.__DevMonitorInternal || {};
window.__DevMonitorInternal.DEFAULT_CONFIG = {
    maxErrors: 50,
    maxLogs: 200,
    maxEventsBeforeDisable: 200,
    maxBreadcrumbs: 30,
    persist: true,
    autoShow: true,
    autoExpandFirstError: false,
    sourceOpenUrlTemplate: null,
    devLogEndpoint: null,
    resourceDurationThresholdMs: 2000,
    measureDurationThresholdMs: 2000,
    longTaskThresholdMs: 50,
    mutationBatchThreshold: 200,
    memoryWarningMb: 300,
    logSpamThresholdPerSecond: 100,
    ignoredUrlPatterns: [
        /\/favicon\.ico(?:$|\?)/i,
        /\.map(?:$|\?)/i,
        /gstatic\.com\/generate_204/i,
        /^chrome-extension:\/\//i,
        /^moz-extension:\/\//i,
        /^edge-extension:\/\//i
    ]
};
