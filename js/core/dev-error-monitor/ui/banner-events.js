/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */
/** @file js/core/dev-error-monitor/ui/banner-events.js */
(function() {
    const internal = window.__DevMonitorInternal;
    internal.copyText = function(text, button, successText) {
        const done = () => { const oldText = button.textContent; button.textContent = successText; window.setTimeout(() => { button.textContent = oldText; }, 1000); };
        const fallbackCopy = () => {
            const input = document.createElement('textarea'); input.id = 'dev-monitor-copy-fallback-input'; input.value = text; input.setAttribute('readonly', ''); input.style.position = 'fixed'; input.style.left = '-9999px';
            document.body.appendChild(input); input.select();
            try { document.execCommand('copy'); done(); } catch (e) { console.warn('[DevMonitor] Copy failed.', e); } finally { document.body.removeChild(input); }
        };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done).catch(fallbackCopy); else fallbackCopy();
    };
    internal.handleClick = function(event) {
        const actionEl = event.target.closest('[data-action], [data-filter], .dev-monitor-tab, .filter-btn, .source-filter-btn, .error-copy-btn, .error-toggle-btn');
        if (!actionEl) return;
        event.stopPropagation();
        const action = actionEl.dataset.action;
        if (action === 'toggle') window.DevMonitorState.toggleExpand();
        if (action === 'hide') window.DevMonitorState.setExpanded(false);
        if (action === 'clear') window.DevMonitorState.clear();
        if (action === 'pause') { const isPaused = window.DevMonitorState.get().isPaused; if (isPaused) window.DevMonitorState.resume(); else window.DevMonitorState.pause(); }
        if (action === 'copy-minimal') internal.copyText(window.DevMonitorState.buildMinimalReport(), actionEl, 'تم النسخ');
        if (action === 'copy-full') internal.copyText(window.DevMonitorState.buildFullReport(), actionEl, 'تم النسخ');
        if (action === 'open-source') {
            const source = actionEl.dataset.source || actionEl.dataset.url || '';
            const tpl = window.DevMonitorState.getConfig().sourceOpenUrlTemplate;
            const url = tpl && source ? tpl.replace(/\{source\}/g, encodeURIComponent(source)).replace(/\{rawSource\}/g, source) : '';
            if (url) window.open(url, '_blank', 'noopener'); else internal.copyText(source || 'Unknown Source', actionEl, 'تم نسخ المصدر');
        }
        if (actionEl.classList.contains('dev-monitor-tab')) window.DevMonitorState.setActiveTab(actionEl.dataset.tab);
        if (actionEl.dataset.filter) window.DevMonitorState.setFilter(actionEl.dataset.filter);
        if (actionEl.classList.contains('source-filter-btn')) window.DevMonitorState.setSourceFilter(actionEl.dataset.sourceFilter);
        if (actionEl.classList.contains('error-copy-btn')) internal.copyText(actionEl.dataset.payload || '', actionEl, 'تم النسخ');
        if (actionEl.classList.contains('error-toggle-btn')) { const entry = actionEl.closest('.error-entry'); if (entry) entry.classList.toggle('show-full'); }
    };
})();
