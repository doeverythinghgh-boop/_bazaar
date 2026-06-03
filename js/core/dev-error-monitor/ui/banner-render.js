/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */
/** @file js/core/dev-error-monitor/ui/banner-render.js */
(function() {
    const internal = window.__DevMonitorInternal;
    const TABS = [
        ['summary', 'الملخص'],
        ['errors', 'الأخطاء'],
        ['logs', 'السجلات'],
        ['sources', 'المصادر'],
        ['reports', 'التقارير']
    ];
    const FILTERS = [
        ['ALL', 'الكل'], ['SEVERITY_ERROR', 'أخطاء'], ['SEVERITY_WARNING', 'تحذيرات'], ['SEVERITY_INFO', 'معلومات'],
        ['JS_RUNTIME', 'JavaScript'], ['PROMISE', 'Promise'], ['DYNAMIC_IMPORT', 'Imports'], ['NETWORK', 'Network'],
        ['RESOURCE', 'Resource'], ['CONSOLE', 'Console'], ['CONSOLE_WARN', 'Warn'], ['CONSOLE_ASSERT', 'Assert'],
        ['ANDROID_LOG', 'سجلات أندرويد'],
        ['EVENT_HANDLER', 'Events'], ['PERFORMANCE', 'Perf'], ['UI_FREEZE', 'Freeze'], ['DOM_FLOOD', 'DOM'],
        ['MEMORY_WARNING', 'Memory']
    ];

    function setText(root, selector, value) {
        const el = root.querySelector(selector);
        if (el) el.textContent = value;
    }

    function idPart(value) {
        return String(value == null ? 'unknown' : value)
            .toLowerCase()
            .replace(/[^a-z0-9_-]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 60) || 'item';
    }

    function entryId(entry, index) {
        return idPart([entry.kind, entry.type, entry.hash || entry.timestamp || index].join('-'));
    }

    function createButton(className, text, attrs) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = className;
        btn.textContent = text;
        Object.keys(attrs || {}).forEach(key => {
            btn.dataset[key] = attrs[key];
        });
        if (attrs && attrs.id) btn.id = attrs.id;
        return btn;
    }

    function renderTabs(container, activeTab) {
        container.innerHTML = '';
        TABS.forEach(([tab, label]) => {
            const btn = createButton('dev-monitor-tab', label, { id: `dev-monitor-tab-${idPart(tab)}`, tab });
            btn.classList.toggle('active', activeTab === tab);
            container.appendChild(btn);
        });
    }

    function renderToolbar(container, activeTab, state) {
        container.innerHTML = '';
        if (activeTab === 'summary') {
            container.appendChild(createButton('dev-monitor-btn', state.isPaused ? 'استئناف المراقبة' : 'إيقاف مؤقت', { id: 'dev-monitor-action-pause-summary', action: 'pause' }));
            container.appendChild(createButton('dev-monitor-btn danger', 'مسح الكل', { id: 'dev-monitor-action-clear-summary', action: 'clear' }));
        }
        if (activeTab === 'errors') {
            container.appendChild(createButton('dev-monitor-btn', 'نسخ تقرير مختصر', { id: 'dev-monitor-action-copy-minimal-errors', action: 'copy-minimal' }));
            container.appendChild(createButton('dev-monitor-btn', 'نسخ تقرير كامل', { id: 'dev-monitor-action-copy-full-errors', action: 'copy-full' }));
            container.appendChild(createButton('dev-monitor-btn danger', 'مسح الأخطاء والسجلات', { id: 'dev-monitor-action-clear-errors', action: 'clear' }));
        }
        if (activeTab === 'logs') {
            const androidText = state.filter === 'ANDROID_LOG' ? 'عرض كل السجلات' : 'عرض أندرويد فقط';
            container.appendChild(createButton('dev-monitor-btn', androidText, { id: 'dev-monitor-action-filter-android-logs', filter: 'ANDROID_LOG' }));
            container.appendChild(createButton('dev-monitor-btn', 'نسخ تقرير السجلات', { id: 'dev-monitor-action-copy-full-logs', action: 'copy-full' }));
            container.appendChild(createButton('dev-monitor-btn danger', 'مسح السجلات والأخطاء', { id: 'dev-monitor-action-clear-logs', action: 'clear' }));
        }
        if (activeTab === 'reports') {
            container.appendChild(createButton('dev-monitor-btn', 'نسخ المختصر', { id: 'dev-monitor-action-copy-minimal-reports', action: 'copy-minimal' }));
            container.appendChild(createButton('dev-monitor-btn', 'نسخ الكامل', { id: 'dev-monitor-action-copy-full-reports', action: 'copy-full' }));
        }
    }

    function renderFilters(container, state, activeTab) {
        container.innerHTML = '';
        if (activeTab !== 'errors' && activeTab !== 'logs') return;
        const filterSet = activeTab === 'logs'
            ? [['ALL', 'كل السجلات'], ['ANDROID_LOG', 'سجلات أندرويد']]
            : FILTERS.filter(([key]) => key !== 'ANDROID_LOG');
        filterSet.forEach(([f, label]) => {
            const entries = state.errors.concat(state.logs);
            const count = entries.filter(e => {
                if (f === 'ALL') return activeTab === 'logs' ? e.type === 'WEB_LOG' || e.type === 'ANDROID_LOG' : e.type !== 'WEB_LOG' && e.type !== 'ANDROID_LOG';
                if (f === 'ANDROID_LOG') return e.type === 'ANDROID_LOG';
                if (e.type === 'WEB_LOG' || e.type === 'ANDROID_LOG') return false;
                if (f === 'NETWORK') return e.type === 'NETWORK' || e.type === 'RESOURCE';
                if (f === 'SEVERITY_ERROR') return e.severity === 'error';
                if (f === 'SEVERITY_WARNING' || f === 'WARNINGS') return e.severity === 'warning';
                if (f === 'SEVERITY_INFO') return e.severity === 'info';
                return e.type === f;
            }).length;
            const btn = createButton('filter-btn', `${label}${count ? ` (${count})` : ''}`, { id: `dev-monitor-filter-${idPart(activeTab)}-${idPart(f)}`, filter: f });
            btn.classList.toggle('active', state.filter === f || (activeTab === 'logs' && f === 'ALL' && state.filter !== 'ANDROID_LOG'));
            container.appendChild(btn);
        });
    }

    function renderSources(container, state, activeTab) {
        container.innerHTML = '';
        if (activeTab !== 'sources') return;
        const allBtn = createButton('source-filter-btn', 'كل المصادر', { id: 'dev-monitor-source-filter-all', sourceFilter: 'ALL' });
        allBtn.classList.toggle('active', state.sourceFilter === 'ALL');
        container.appendChild(allBtn);
        window.DevMonitorState.getSourceGroups().forEach((group, index) => {
            const clean = String(group.key || 'مصدر غير معروف').split('?')[0];
            const parts = clean.split(/[\\/]/).filter(Boolean);
            const label = (parts.slice(-2).join('/') || clean).slice(0, 70);
            const btn = createButton('source-filter-btn', `${label} (${group.events})`, { id: `dev-monitor-source-filter-${index}-${idPart(group.key)}`, sourceFilter: group.key });
            btn.classList.toggle('active', state.sourceFilter === group.key);
            container.appendChild(btn);
        });
    }

    function renderSummary(container, state, severityCounts, activeTab) {
        container.innerHTML = '';
        if (activeTab === 'reports') {
            const pre = document.createElement('pre');
            pre.id = 'dev-monitor-report-preview';
            pre.className = 'dev-monitor-report-preview';
            pre.textContent = window.DevMonitorState.buildMinimalReport();
            container.appendChild(pre);
            return;
        }
        const items = [
            ['الأحداث', state.totalEvents],
            ['القضايا', state.counter],
            ['السجلات', state.logs.length],
            ['أخطاء', severityCounts.error],
            ['تحذيرات', severityCounts.warning],
            ['معلومات', severityCounts.info],
            ['المصادر', window.DevMonitorState.getSourceGroups().length],
            ['Breadcrumbs', state.breadcrumbs.length]
        ];
        items.forEach(([label, value], index) => {
            const stat = document.createElement('span');
            const statId = `dev-monitor-stat-${index}-${idPart(label)}`;
            stat.id = statId;
            stat.className = 'dev-monitor-stat';
            stat.innerHTML = `<span id="${statId}-label">${label}</span><strong id="${statId}-value">${value}</strong>`;
            container.appendChild(stat);
            if (index < items.length - 1) {
                const sep = document.createElement('span');
                sep.className = 'dev-monitor-stat-sep';
                sep.setAttribute('aria-hidden', 'true');
                sep.textContent = '•';
                container.appendChild(sep);
            }
        });
    }


    function renderEntries(container, entries, activeTab, state) {
        container.innerHTML = '';
        let filtered = entries.slice().reverse();
        if (activeTab === 'errors') filtered = filtered.filter(entry => entry.kind === 'error');
        if (activeTab === 'logs') filtered = filtered.filter(entry => entry.kind === 'log' && (state.filter === 'ANDROID_LOG' ? entry.type === 'ANDROID_LOG' : true));
        if (activeTab !== 'errors' && activeTab !== 'logs') return;
        if (!filtered.length) {
            const empty = document.createElement('div');
            empty.id = `dev-monitor-empty-${idPart(activeTab)}`;
            empty.className = 'dev-monitor-empty';
            empty.textContent = activeTab === 'logs' ? 'لا توجد سجلات مطابقة.' : 'لا توجد أخطاء مطابقة.';
            container.appendChild(empty);
            return;
        }

        const bulkActions = document.createElement('div');
        bulkActions.className = 'dev-monitor-bulk-actions';
        bulkActions.style.marginBottom = '12px';
        bulkActions.style.display = 'flex';
        bulkActions.style.gap = '8px';
        
        const copyAllBtn = createButton('dev-monitor-btn', 'نسخ كل العناصر', { action: 'copy-minimal' });
        const copyFullBtn = createButton('dev-monitor-btn', 'نسخ كامل لكل العناصر', { action: 'copy-full' });
        
        bulkActions.appendChild(copyAllBtn);
        bulkActions.appendChild(copyFullBtn);
        container.appendChild(bulkActions);

        filtered.forEach((error, index) => {
            const isLog = error.kind === 'log';
            const entry = document.createElement('div');
            const baseId = `dev-monitor-entry-${index}-${entryId(error, index)}`;
            entry.id = baseId;
            entry.className = `error-entry ${isLog ? 'log-entry' : ''} severity-${error.severity || 'error'}`;
            const minimalPayload = isLog ? window.DevMonitorState.safeStringify(error) : window.DevMonitorState.buildMinimalReport(error);
            entry.innerHTML = `
                <div id="${baseId}-header" class="error-entry-header">
                    <div id="${baseId}-title" class="error-entry-title">
                        <span id="${baseId}-type" class="error-entry-type">${error.type}${error.count > 1 ? ` x${error.count}` : ''}</span>
                        <span id="${baseId}-time" class="error-entry-time">${new Date(error.lastSeenAt || error.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div id="${baseId}-actions" class="error-entry-actions">
                        ${isLog ? '' : `<button id="${baseId}-details-btn" type="button" class="error-toggle-btn">التفاصيل</button>`}
                        <button id="${baseId}-copy-min-btn" type="button" class="error-copy-btn" data-payload="${minimalPayload.replace(/"/g, '&quot;')}">نسخ</button>
                        ${isLog ? '' : `<button id="${baseId}-copy-full-btn" type="button" class="error-copy-btn" data-payload="${window.DevMonitorState.buildFullReport(error).replace(/"/g, '&quot;')}">نسخ كامل</button><button id="${baseId}-source-btn" type="button" class="error-open-source-btn" data-action="open-source" data-source="${error.source || ''}" data-url="${error.url || ''}">المصدر</button>`}
                    </div>
                </div>
                <div id="${baseId}-message" class="error-entry-msg">${error.msg}</div>
                <div id="${baseId}-source" class="error-entry-src">${error.source || 'مصدر غير معروف'}</div>
                <div id="${baseId}-detail" class="error-entry-detail"></div>`;
            const detail = entry.querySelector('.error-entry-detail');
            if (!isLog) {
                [
                    ['البيئة', error.environment],
                    ['البيانات', error.meta],
                    ['المسار السابق', error.breadcrumbs]
                ].forEach(([title, data], metaIndex) => {
                    const block = document.createElement('details');
                    const metaId = `${baseId}-meta-${metaIndex}-${idPart(title)}`;
                    block.id = metaId;
                    block.className = 'error-meta-block';
                    const summary = document.createElement('summary');
                    summary.id = `${metaId}-summary`;
                    summary.textContent = title;
                    const pre = document.createElement('pre');
                    pre.id = `${metaId}-content`;
                    pre.textContent = data ? JSON.stringify(data, null, 2) : 'لا يوجد';
                    block.appendChild(summary);
                    block.appendChild(pre);
                    detail.appendChild(block);
                });
                if (error.stack) {
                    const stack = document.createElement('pre');
                    stack.id = `${baseId}-stack`;
                    stack.className = 'error-stack';
                    stack.textContent = error.stack;
                    detail.appendChild(stack);
                }
            }
            container.appendChild(entry);
        });
    }

    internal.renderBanner = function(state) {
        const banner = document.getElementById('dev-error-monitor-banner');
        if (!banner) return;
        const severityCounts = window.DevMonitorState.getSeverityCounts();
        const entries = window.DevMonitorState.getFilteredEntries();
        const activeTab = state.activeTab || 'summary';
        const totalCaptured = (state.totalEvents || 0) + (state.logs ? state.logs.length : 0);
        const hasError = severityCounts.error > 0, hasWarning = severityCounts.warning > 0;
        banner.style.display = state.isVisible ? 'block' : 'none';
        banner.classList.toggle('expanded', state.isExpanded);
        banner.classList.toggle('compact', !state.isExpanded);
        banner.classList.toggle('has-error', hasError);
        banner.classList.toggle('has-warning', !hasError && hasWarning);
        banner.classList.toggle('paused', state.isPaused);
        banner.classList.toggle('disabled', state.isDisabled);

        setText(banner, '.dev-monitor-counter', String(totalCaptured || state.counter || 0));
        setText(banner, '.dev-monitor-status', [
            severityCounts.error ? `${severityCounts.error} خطأ` : '',
            severityCounts.warning ? `${severityCounts.warning} تحذير` : '',
            severityCounts.info ? `${severityCounts.info} معلومة` : '',
            state.logs && state.logs.length ? `${state.logs.length} سجل` : '',
            state.isPaused ? 'متوقف مؤقتًا' : '',
            state.isDisabled ? 'معطل' : ''
        ].filter(Boolean).join(' - ') || 'لا توجد أحداث حتى الآن');

        renderTabs(banner.querySelector('.dev-monitor-tabs'), activeTab);
        renderToolbar(banner.querySelector('.dev-monitor-toolbar'), activeTab, state);
        renderSummary(banner.querySelector('.dev-monitor-summary'), state, severityCounts, activeTab);
        renderFilters(banner.querySelector('.dev-monitor-filters'), state, activeTab);
        renderSources(banner.querySelector('.dev-monitor-source-groups'), state, activeTab);
        renderEntries(banner.querySelector('.error-list'), entries, activeTab, state);

        if ((state.totalEvents || state.counter || state.logs.length) > 0 && !state.isExpanded) {
            banner.style.animation = 'dev-shake 0.3s';
            window.setTimeout(() => { banner.style.animation = ''; }, 300);
        }
    };
})();
