/**
 * @file analyzer-ui-filter.js
 * @description Filtering and summary/stat calculations for the Image Analyzer UI.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


window.filterAnalyzerResults = function () {
    const state = window.AnalyzerState;
    const dom = window.AnalyzerDOM;
    const query = String(dom.search?.value || "").toLowerCase().trim();

    const filtered = state.results.filter((item) => {
        const dbInfo = item.metadata || {};
        const searchable = [
            item?.name,
            item?.type,
            item?.status,
            dbInfo?.table,
            dbInfo?.id
        ]
            .map((value) => String(value || "").toLowerCase())
            .join(" ");

        if (query && !searchable.includes(query)) return false;

        if (state.currentFilter === "dead") return item.status === "DEAD";
        if (state.currentFilter === "broken") return item.status === "BROKEN";
        if (state.currentFilter === "issues") return item.status === "DEAD" || item.status === "BROKEN";
        if (state.currentFilter === "products") return item.type === "Product";
        if (state.currentFilter === "users") return ["Avatar", "Cover", "Deleted User Avatar", "Deleted Shop Cover"].includes(item.type);
        if (state.currentFilter === "ads") return item.type === "Advertisement";
        if (state.currentFilter === "orders") return typeof window.isAnalyzerOrderType === "function" && window.isAnalyzerOrderType(item.type);
        if (state.currentFilter === "featured") return item.type === "FeaturedCache";
        return true;
    });

    state.lastVisibleCount = filtered.length;
    return filtered;
};

window.updateAnalyzerSummary = function () {
    const state = window.AnalyzerState;
    const dom = window.AnalyzerDOM;
    const query = String(dom.search?.value || "").trim();

    if (dom.summaryVisible) dom.summaryVisible.textContent = String(state.lastVisibleCount || 0);
    if (dom.summarySearch) dom.summarySearch.textContent = query || "كل العناصر";
    if (dom.summaryLastScan) {
        dom.summaryLastScan.textContent = state.lastScanAt
            ? state.lastScanAt.toLocaleString()
            : "لم ينفذ بعد";
    }
    if (dom.summaryDuration) {
        dom.summaryDuration.textContent = state.scanDurationMs
            ? `${(state.scanDurationMs / 1000).toFixed(2)} ث`
            : "-";
    }
};

window.updateAnalyzerStats = function () {
    const results = window.AnalyzerState.results;
    const activeCount = results.filter((item) => item.status === "ACTIVE").length;
    const deadCount = results.filter((item) => item.status === "DEAD").length;
    const brokenCount = results.filter((item) => item.status === "BROKEN").length;
    const issueCount = deadCount + brokenCount;
    const isOrderType = typeof window.isAnalyzerOrderType === "function" ? window.isAnalyzerOrderType : (() => false);

    document.getElementById("stat-active").textContent = activeCount;
    document.getElementById("stat-dead").textContent = deadCount;
    document.getElementById("stat-broken").textContent = brokenCount;
    document.getElementById("count-all").textContent = results.length;
    document.getElementById("count-dead").textContent = deadCount;
    document.getElementById("count-broken").textContent = brokenCount;
    const issuesEl = document.getElementById("count-issues");
    if (issuesEl) issuesEl.textContent = issueCount;
    document.getElementById("count-products").textContent = results.filter((item) => item.type === "Product").length;
    document.getElementById("count-users").textContent = results.filter((item) => ["Avatar", "Cover", "Deleted User Avatar", "Deleted Shop Cover"].includes(item.type)).length;
    document.getElementById("count-ads").textContent = results.filter((item) => item.type === "Advertisement").length;
    document.getElementById("count-orders").textContent = results.filter((item) => isOrderType(item.type)).length;
    document.getElementById("count-featured").textContent = results.filter((item) => item.type === "FeaturedCache").length;
};
