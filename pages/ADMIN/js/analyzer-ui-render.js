/**
 * @file analyzer-ui-render.js
 * @description Table rendering and item-level display actions for the Image Analyzer UI.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


window.renderAnalyzerTable = function () {
    const state = window.AnalyzerState;
    const dom = window.AnalyzerDOM;
    const escapeHtml = window.escapeAnalyzerHtml || ((value) => String(value || ""));
    const filtered = window.filterAnalyzerResults();

    console.log(`[UI] Render Requested. Filter=[${state.currentFilter}] Visible=${filtered.length}`);

    if (filtered.length === 0) {
        dom.table.innerHTML = '<div class="analyzer-empty-state">لا توجد نتائج مطابقة لهذا الفلتر.</div>';
        window.updateAnalyzerSummary();
        return;
    }

    let html = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>العرض</th>
                    <th>اسم الملف</th>
                    <th>النوع</th>
                    <th>الحالة</th>
                    <th>الإجراء</th>
                </tr>
            </thead>
            <tbody>
    `;

    filtered.forEach((item) => {
        const badgeClass = item.status === "DEAD" ? "badge-danger" : (item.status === "BROKEN" ? "badge-warning" : "badge-success");
        const badgeText = typeof window.formatAnalyzerStatus === "function"
            ? window.formatAnalyzerStatus(item.status)
            : item.status;
        const fileUrl = getPublicR2FileUrl(item.name);
        const dbInfo = item.metadata || {};
        const metadataHtml = dbInfo.table || dbInfo.id
            ? `<div class="analyzer-meta">
                    <span>الجدول: ${escapeHtml(dbInfo.table)}</span><br>
                    <span>المعرف: ${escapeHtml(dbInfo.id)}</span>
               </div>`
            : "";
        const nameClass = item.status === "DEAD" && String(item.type || "").includes("Deleted") ? "untracked-highlight" : "";
        const encodedName = encodeURIComponent(item.name || "");
        const encodedUrl = encodeURIComponent(fileUrl || "");
        const encodedItem = encodeURIComponent(JSON.stringify(item));

        html += `
            <tr>
                <td>
                    ${item.status !== "BROKEN"
                        ? `<img src="${escapeHtml(fileUrl)}" class="img-preview-small" loading="lazy" onerror="this.onerror=null; this.src='https://placehold.co/100x100?text=N%2FA';">`
                        : '<i class="fas fa-link-slash" style="color:var(--warning); font-size:1.5rem;"></i>'}
                </td>
                <td dir="ltr" class="${nameClass} analyzer-file-name" title="${escapeHtml(item.name)}">
                    ${escapeHtml(item.name)}
                    ${metadataHtml}
                </td>
                <td class="analyzer-type-cell">${escapeHtml(item.type)}</td>
                <td><span class="badge ${badgeClass}">${badgeText}</span></td>
                <td class="analyzer-actions-cell">
                    <button type="button" onclick="window.showAnalyzerItemDetails('${encodedItem}')" class="analyzer-action-btn analyzer-action-neutral" title="تفاصيل">
                        <i class="fas fa-circle-info"></i>
                    </button>
                    <button type="button" onclick="window.refreshSingleAnalyzerItem('${encodedName}')" class="analyzer-action-btn analyzer-action-secondary" title="إعادة فحص">
                        <i class="fas fa-rotate-right"></i>
                    </button>
                    ${item.status === "DEAD"
                        ? `<button type="button" onclick="window.deleteSingleAnalyzerFile('${encodedName}')" class="analyzer-action-btn analyzer-action-danger" title="حذف نهائي"><i class="fas fa-trash-alt"></i></button>`
                        : ""}
                    ${item.status !== "BROKEN"
                        ? `<button type="button" onclick="window.openAnalyzerFile('${encodedUrl}')" class="analyzer-action-btn analyzer-action-primary" title="فتح الملف"><i class="fas fa-external-link-alt"></i></button>`
                        : ""}
                </td>
            </tr>
        `;
    });

    html += "</tbody></table>";
    dom.table.innerHTML = html;
    window.updateAnalyzerSummary();
};

window.openAnalyzerFile = function (encodedUrl) {
    const url = decodeURIComponent(String(encodedUrl || ""));
    if (!url) return;
    window.open(url, "_blank", "noopener");
};

window.showAnalyzerItemDetails = async function (encodedItem) {
    try {
        const item = JSON.parse(decodeURIComponent(String(encodedItem || "")));
        const metadata = item.metadata || {};
        const fileUrl = item.status === "BROKEN" ? "" : getPublicR2FileUrl(item.name);

        await Swal.fire({
            title: "تفاصيل العنصر",
            html: `
                <div class="analyzer-details-panel">
                    <div><strong>الاسم:</strong> <span dir="ltr">${window.escapeAnalyzerHtml(item.name)}</span></div>
                    <div><strong>النوع:</strong> ${window.escapeAnalyzerHtml(item.type)}</div>
                    <div><strong>الحالة:</strong> ${window.escapeAnalyzerHtml(window.formatAnalyzerStatus(item.status))}</div>
                    <div><strong>الجدول:</strong> ${window.escapeAnalyzerHtml(metadata.table)}</div>
                    <div><strong>المعرف:</strong> ${window.escapeAnalyzerHtml(metadata.id)}</div>
                    ${fileUrl ? `<div><strong>الرابط:</strong> <span dir="ltr">${window.escapeAnalyzerHtml(fileUrl)}</span></div>` : ""}
                </div>
            `,
            confirmButtonText: "إغلاق",
            buttonsStyling: false,
            customClass: {
                popup: "swal-modern-mini-popup",
                title: "swal-modern-mini-title",
                htmlContainer: "swal-modern-mini-text",
                confirmButton: "swal-modern-mini-confirm"
            }
        });
    } catch (error) {
        console.error(error);
    }
};
