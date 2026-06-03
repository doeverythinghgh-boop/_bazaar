/**
 * @file analyzer-ui-actions.js
 * @description Export, delete, and page event wiring for the Image Analyzer UI.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


window.refreshSingleAnalyzerItem = async function (encodedName) {
    const name = decodeURIComponent(String(encodedName || ""));
    if (!name) return;
    window.addAnalyzerLog(`إعادة فحص العنصر: ${name}`, "info");
    await window.fetchAllAnalyzerResources({ focusName: name });
};

window.deleteSingleAnalyzerFile = async function (encodedName) {
    const name = decodeURIComponent(String(encodedName || ""));
    if (!name) return;

    const confirmed = await Swal.fire({
        title: "هل أنت متأكد؟",
        text: "سوف يتم حذف هذا الملف نهائيًا من السيرفر.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        confirmButtonText: "نعم، احذف",
        cancelButtonText: "إلغاء"
    });

    if (!confirmed.isConfirmed) return;

    try {
        await deleteFile2cf(name);
        Swal.fire("تم", "تم الحذف بنجاح.", "success");
        window.fetchAllAnalyzerResources();
    } catch (error) {
        Swal.fire("فشل الحذف", error.message, "error");
    }
};

window.exportAnalyzerResultsAsJson = function () {
    const state = window.AnalyzerState;
    const payload = {
        exported_at: new Date().toISOString(),
        filter: state.currentFilter,
        query: String(window.AnalyzerDOM.search?.value || ""),
        total_results: state.results.length,
        visible_results: state.lastVisibleCount,
        last_scan_at: state.lastScanAt ? state.lastScanAt.toISOString() : null,
        results: window.filterAnalyzerResults()
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `image-analyzer-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
};

window.exportAnalyzerResultsAsCsv = function () {
    const rows = window.filterAnalyzerResults();
    const header = ["name", "type", "status", "table", "id"];
    const csvRows = [
        header.join(","),
        ...rows.map((item) => [
            item.name,
            item.type,
            item.status,
            item.metadata?.table || "",
            item.metadata?.id || ""
        ].map((value) => `"${String(value || "").replace(/"/g, '""')}"`).join(","))
    ];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `image-analyzer-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
};

window.copyAnalyzerLog = async function () {
    const logs = (window.AnalyzerState.logs || []).map((entry) => `[${entry.time}] [${entry.level}] ${entry.msg}`).join("\n");
    if (!logs) return;

    try {
        await navigator.clipboard.writeText(logs);
        Swal.fire("تم", "تم نسخ السجل.", "success");
    } catch (error) {
        Swal.fire("تعذر النسخ", "المتصفح لم يسمح بنسخ السجل.", "error");
    }
};

document.addEventListener("DOMContentLoaded", () => {
    const dom = window.AnalyzerDOM;
    const state = window.AnalyzerState;

    if (dom.btnScan) dom.btnScan.addEventListener("click", () => window.fetchAllAnalyzerResources());
    if (dom.search) dom.search.addEventListener("input", () => window.renderAnalyzerTable());
    if (dom.exportJson) dom.exportJson.addEventListener("click", window.exportAnalyzerResultsAsJson);
    if (dom.exportCsv) dom.exportCsv.addEventListener("click", window.exportAnalyzerResultsAsCsv);
    if (dom.copyLog) dom.copyLog.addEventListener("click", window.copyAnalyzerLog);

    document.querySelectorAll(".tab-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".tab-btn").forEach((item) => item.classList.remove("active"));
            btn.classList.add("active");
            state.currentFilter = btn.dataset.filter;
            window.renderAnalyzerTable();
        });
    });

    if (dom.btnDelete) {
        dom.btnDelete.addEventListener("click", async () => {
            const deadFiles = state.results.filter((item) => item.status === "DEAD").map((item) => item.name);
            const confirmed = await Swal.fire({
                title: `حذف ${deadFiles.length} ملف؟`,
                text: "لا يمكن التراجع عن هذه العملية.",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#d33",
                confirmButtonText: "احذف الكل فورًا",
                cancelButtonText: "إلغاء"
            });

            if (!confirmed.isConfirmed) return;

            window.addAnalyzerLog(`بدء التنظيف الشامل لعدد ${deadFiles.length} ملف...`, "warning");
            let count = 0;

            for (const name of deadFiles) {
                try {
                    await deleteFile2cf(name);
                    count += 1;
                    window.addAnalyzerLog(`تم حذف (${count}/${deadFiles.length}) : ${name}`, "success");
                } catch (error) {
                    window.addAnalyzerLog(`فشل حذف ${name}: ${error.message}`, "error");
                }
            }

            Swal.fire("اكتملت العملية", `تم تنظيف ${count} ملف بنجاح.`, "success");
            window.fetchAllAnalyzerResources();
        });
    }

    if (LocalDBStorage.getItem("app_theme") === "dark") {
        document.body.classList.add("dark-theme");
    }
});
