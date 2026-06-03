/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */
/** @file js/core/dev-error-monitor/ui/banner-core.js */
(function() {
    const internal = window.__DevMonitorInternal;
    internal.injectStyles = function() {
        if (document.getElementById('dev-error-monitor-styles')) return;
        const styleTag = document.createElement('style');
        styleTag.id = 'dev-error-monitor-styles';
        styleTag.textContent = window.DevMonitorStyles;
        document.head.appendChild(styleTag);
    };
    internal.createBanner = function() {
        const banner = document.createElement('div');
        banner.id = 'dev-error-monitor-banner';
        banner.innerHTML = `
            <button id="dev-monitor-launcher" class="dev-monitor-launcher" type="button" data-action="toggle" aria-label="فتح مراقب التطوير">
                <span id="dev-monitor-counter" class="dev-monitor-counter">0</span>
            </button>
            <div id="dev-monitor-overlay" class="dev-monitor-overlay" role="dialog" aria-modal="true" aria-label="مراقب التطوير">
                <div id="dev-monitor-shell" class="dev-monitor-shell">
                    <div id="dev-monitor-header" class="dev-monitor-header">
                        <div id="dev-monitor-heading" class="dev-monitor-heading">
                            <div id="dev-monitor-title" class="dev-monitor-title">مراقب التطوير</div>
                            <div id="dev-monitor-status" class="dev-monitor-status"></div>
                        </div>
                        <button id="dev-monitor-close" class="dev-monitor-close" type="button" data-action="hide">إغلاق</button>
                    </div>
                    <div id="dev-monitor-summary" class="dev-monitor-summary"></div>
                    <div id="dev-monitor-tabs" class="dev-monitor-tabs" role="tablist"></div>
                    <div id="dev-monitor-details" class="dev-monitor-details">
                        <div id="dev-monitor-toolbar" class="dev-monitor-toolbar"></div>
                        <div id="dev-monitor-filters" class="dev-monitor-filters"></div>
                        <div id="dev-monitor-source-groups" class="dev-monitor-source-groups"></div>
                        <div id="dev-monitor-entry-list" class="error-list"></div>
                    </div>
                </div>
            </div>`;
        banner.addEventListener('click', internal.handleClick);
        document.body.appendChild(banner);
    };
})();
