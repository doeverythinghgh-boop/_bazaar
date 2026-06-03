/**
 * @file js/core/dev-error-monitor/ui/styles.js
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

window.DevMonitorStyles = `
    #dev-error-monitor-banner {
        position: fixed;
        inset: auto 14px 14px auto;
        z-index: 2147483647;
        font-family: "Segoe UI", Tahoma, Arial, sans-serif;
        color: #f8fafc;
        direction: rtl;
        text-align: right;
    }

    .dev-monitor-launcher {
        width: 52px;
        height: 52px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 1px solid rgba(255,255,255,0.28);
        border-radius: 999px;
        background: #0f766e;
        color: #fff;
        box-shadow: 0 14px 32px rgba(15, 23, 42, 0.34);
        cursor: pointer;
    }

    #dev-error-monitor-banner.has-error .dev-monitor-launcher {
        background: #b91c1c;
    }

    #dev-error-monitor-banner.paused .dev-monitor-launcher {
        background: #92400e;
    }

    .dev-monitor-counter {
        min-width: 30px;
        height: 30px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 999px;
        background: #fff;
        color: #0f766e;
        font-size: 12px;
        font-weight: 800;
        line-height: 1;
    }

    #dev-error-monitor-banner.has-error .dev-monitor-counter {
        color: #b91c1c;
    }

    .dev-monitor-overlay {
        position: fixed;
        inset: 0;
        display: none;
        background: rgba(8, 13, 24, 0.74);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        overscroll-behavior: contain;
        -webkit-overflow-scrolling: touch;
    }

    #dev-error-monitor-banner.expanded .dev-monitor-overlay {
        display: block;
    }

    #dev-error-monitor-banner.expanded .dev-monitor-launcher {
        display: none;
    }

    .dev-monitor-shell {
        width: 100vw;
        height: 100vh;
        height: 100dvh;
        display: grid;
        grid-template-rows: auto auto auto 1fr;
        background: #0b1120;
        overflow: hidden;
    }

    .dev-monitor-header {
        min-height: 64px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        padding: max(14px, env(safe-area-inset-top)) 18px 12px;
        background: #111827;
        border-bottom: 1px solid #263244;
    }

    .dev-monitor-heading {
        min-width: 0;
    }

    .dev-monitor-title {
        color: #ffffff;
        font-size: 18px;
        font-weight: 800;
        line-height: 1.25;
    }

    .dev-monitor-status {
        margin-top: 4px;
        color: #b6c2d3;
        font-size: 12px;
        font-weight: 600;
        line-height: 1.4;
        overflow-wrap: anywhere;
    }

    .dev-monitor-close,
    .dev-monitor-btn,
    .dev-monitor-tab,
    .filter-btn,
    .source-filter-btn,
    .error-copy-btn,
    .error-toggle-btn,
    .error-open-source-btn {
        min-height: 34px;
        border: 1px solid #334155;
        border-radius: 6px;
        background: #1e293b;
        color: #f8fafc;
        padding: 7px 11px;
        cursor: pointer;
        font: inherit;
        font-size: 12px;
        font-weight: 700;
        line-height: 1.2;
    }

    .dev-monitor-close {
        background: #991b1b;
        border-color: #b91c1c;
        flex: 0 0 auto;
    }

    .dev-monitor-btn.danger {
        background: #7f1d1d;
        border-color: #991b1b;
    }

    .dev-monitor-close:hover,
    .dev-monitor-btn:hover,
    .dev-monitor-tab:hover,
    .filter-btn:hover,
    .source-filter-btn:hover,
    .error-copy-btn:hover,
    .error-toggle-btn:hover,
    .error-open-source-btn:hover {
        filter: brightness(1.12);
    }

    .dev-monitor-tabs {
        display: flex;
        gap: 8px;
        padding: 10px 18px;
        background: #0f172a;
        border-bottom: 1px solid #263244;
        overflow-x: auto;
        scrollbar-width: thin;
    }

    .dev-monitor-tab {
        min-width: max-content;
        background: #172033;
        color: #cbd5e1;
    }

    .dev-monitor-tab.active,
    .filter-btn.active,
    .source-filter-btn.active {
        background: #2563eb;
        border-color: #3b82f6;
        color: #fff;
    }

    .dev-monitor-details {
        min-height: 0;
        display: grid;
        grid-template-rows: auto auto auto auto 1fr;
        overflow: hidden;
        background: #0b1120;
    }

    .dev-monitor-toolbar,
    .dev-monitor-filters,
    .dev-monitor-source-groups {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        padding: 10px 18px;
        border-bottom: 1px solid #202b3d;
        background: #101827;
    }

    .dev-monitor-toolbar:empty,
    .dev-monitor-filters:empty,
    .dev-monitor-source-groups:empty {
        display: none;
    }

    .dev-monitor-summary {
        display: flex;
        align-items: center;
        flex-wrap: nowrap;
        gap: 12px;
        padding: 7px 18px;
        background: #0d1626;
        border-bottom: 1px solid #202b3d;
        overflow-x: auto;
        scrollbar-width: none;
        white-space: nowrap;
        font-size: 12px;
        color: #94a3b8;
        min-height: 34px;
    }

    .dev-monitor-summary:empty {
        display: none;
    }

    .dev-monitor-summary::-webkit-scrollbar {
        display: none;
    }

    .dev-monitor-stat {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        flex-shrink: 0;
        white-space: nowrap;
    }

    .dev-monitor-stat span {
        color: #64748b;
        font-size: 11px;
        font-weight: 600;
    }

    .dev-monitor-stat strong {
        color: #e2e8f0;
        font-size: 12px;
        font-weight: 800;
    }

    .dev-monitor-stat-sep {
        color: #334155;
        font-size: 12px;
        user-select: none;
    }

    .dev-monitor-report-preview {
        grid-column: 1 / -1;
        margin: 0;
        max-height: 42vh;
        overflow: auto;
        direction: ltr;
        text-align: left;
        white-space: pre-wrap;
        word-break: break-word;
        padding: 12px;
        border: 1px solid #263244;
        border-radius: 8px;
        background: #050816;
        color: #dbeafe;
        font-family: Consolas, "SFMono-Regular", monospace;
        font-size: 11px;
        line-height: 1.5;
    }

    .error-list {
        min-height: 0;
        overflow: auto;
        padding: 14px 18px 24px;
    }

    .dev-monitor-empty {
        padding: 16px;
        color: #b6c2d3;
        font-size: 13px;
        font-weight: 700;
    }

    .error-entry {
        margin-bottom: 12px;
        border: 1px solid #263244;
        border-right: 4px solid #ef4444;
        border-radius: 8px;
        padding: 12px;
        background: #111827;
    }

    .error-entry.severity-warning {
        border-right-color: #f59e0b;
    }

    .error-entry.severity-info,
    .error-entry.log-entry {
        border-right-color: #22c55e;
    }

    .error-entry-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 10px;
        margin-bottom: 8px;
    }

    .error-entry-title,
    .error-entry-actions {
        min-width: 0;
        display: flex;
        align-items: center;
        gap: 7px;
        flex-wrap: wrap;
    }

    .error-entry-type {
        direction: ltr;
        color: #fbbf24;
        font-size: 11px;
        font-weight: 900;
        text-transform: uppercase;
    }

    .error-entry-time {
        direction: ltr;
        color: #94a3b8;
        font-family: Consolas, "SFMono-Regular", monospace;
        font-size: 11px;
        font-weight: 600;
    }

    .error-entry-msg,
    .error-entry-src {
        direction: ltr;
        text-align: left;
        overflow-wrap: anywhere;
        white-space: pre-wrap;
        font-family: Consolas, "SFMono-Regular", monospace;
    }

    .error-entry-msg {
        color: #f8fafc;
        font-size: 12px;
        line-height: 1.55;
    }

    .error-entry-src {
        margin-top: 8px;
        color: #93a4ba;
        font-size: 11px;
    }

    .error-entry-detail {
        display: none;
        margin-top: 10px;
        border-top: 1px solid #263244;
        padding-top: 10px;
    }

    .error-entry.show-full .error-entry-detail {
        display: block;
    }

    .error-meta-block {
        margin: 0 0 8px;
        color: #dbeafe;
        font-size: 12px;
        font-weight: 700;
    }

    .error-meta-block summary {
        cursor: pointer;
        margin-bottom: 6px;
    }

    .error-meta-block pre,
    .error-stack {
        margin: 0;
        max-height: 220px;
        overflow: auto;
        direction: ltr;
        text-align: left;
        white-space: pre-wrap;
        word-break: break-word;
        padding: 10px;
        border: 1px solid #202b3d;
        border-radius: 6px;
        background: #050816;
        color: #cbd5e1;
        font-family: Consolas, "SFMono-Regular", monospace;
        font-size: 11px;
        line-height: 1.5;
    }

    .error-stack {
        color: #fecaca;
    }

    @keyframes dev-shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }

    @media (max-width: 720px) {
        #dev-error-monitor-banner {
            inset: auto 10px 10px auto;
        }

        .dev-monitor-overlay {
            overflow-y: auto;
        }

        .dev-monitor-shell {
            min-height: 100vh;
            min-height: 100dvh;
            height: auto;
            display: block;
            overflow: visible;
        }

        .dev-monitor-details {
            display: block;
            overflow: visible;
        }

        .error-list {
            overflow: visible;
        }

        .dev-monitor-header {
            align-items: flex-start;
            padding-inline: 12px;
        }

        .dev-monitor-title {
            font-size: 16px;
        }

        .dev-monitor-tabs,
        .dev-monitor-toolbar,
        .dev-monitor-filters,
        .dev-monitor-source-groups,
        .dev-monitor-summary,
        .error-list {
            padding-inline: 12px;
        }

        .dev-monitor-summary {
            padding-inline: 12px;
        }

        .error-entry-header {
            flex-direction: column;
        }
    }

    @media (max-width: 420px) {
        .dev-monitor-summary {
            padding-inline: 10px;
        }

        .dev-monitor-close,
        .dev-monitor-btn,
        .dev-monitor-tab,
        .filter-btn,
        .source-filter-btn,
        .error-copy-btn,
        .error-toggle-btn,
        .error-open-source-btn {
            font-size: 11px;
            padding-inline: 9px;
        }
    }
`;
