/**
 * @file analyzer-core.js
 * @description Core state and utilities for the Image Analyzer.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


window.AnalyzerState = {
    r2Files: [],
    dbRefs: new Map(), // name -> type
    results: [],
    currentFilter: 'all',
    lastScanAt: null,
    scanDurationMs: 0,
    lastVisibleCount: 0,
    focusName: '',
    logs: []
};

window.AnalyzerDOM = {
    btnScan: document.getElementById('btn-run-scan'),
    btnDelete: document.getElementById('btn-mass-delete'),
    table: document.getElementById('table-vessel'),
    log: document.getElementById('mini-log'),
    search: document.getElementById('img-search'),
    exportJson: document.getElementById('btn-export-json'),
    exportCsv: document.getElementById('btn-export-csv'),
    copyLog: document.getElementById('btn-copy-log'),
    summaryVisible: document.getElementById('summary-visible-count'),
    summarySearch: document.getElementById('summary-search-query'),
    summaryLastScan: document.getElementById('summary-last-scan'),
    summaryDuration: document.getElementById('summary-scan-duration')
};

/**
 * Adds a message to the mini-log.
 * @param {string} msg
 */
window.addAnalyzerLog = function (msg, level = 'info') {
    if (!window.AnalyzerDOM.log) return;
    const time = new Date().toLocaleTimeString();
    const safeMsg = window.escapeAnalyzerHtml ? window.escapeAnalyzerHtml(msg) : String(msg || '');
    window.AnalyzerState.logs.push({ time, msg: String(msg || ''), level });
    if (window.AnalyzerState.logs.length > 250) {
        window.AnalyzerState.logs = window.AnalyzerState.logs.slice(-250);
    }
    window.AnalyzerDOM.log.innerHTML += `<div class="analyzer-log-entry level-${level}">[${time}] ${safeMsg}</div>`;
    window.AnalyzerDOM.log.scrollTop = window.AnalyzerDOM.log.scrollHeight;
};

window.escapeAnalyzerHtml = function (value) {
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
};

window.analyzerOrderTypes = new Set([
    'OrderPhoto',
    'OrderSnapshot',
    'OrderReceipt',
    'Old Order Photo'
]);

window.isAnalyzerOrderType = function (type) {
    return window.analyzerOrderTypes.has(String(type || ''));
};

window.formatAnalyzerStatus = function (status) {
    if (status === 'DEAD') return 'ميت';
    if (status === 'BROKEN') return 'رابط مكسور';
    return 'نشط';
};
