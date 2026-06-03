/**
 * @file pages/ADMIN/pendingProducts-ui.js
 * @description UI rendering module for products management in Admin Panel.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


function createPendingCardHTML(p) {
    const firstImage = p.ImageName ? p.ImageName.split(",")[0] : null;
    const r2PublicUrl = (typeof window.getBazaarInfrastructureConfig === "function"
        ? window.getBazaarInfrastructureConfig().r2PublicUrl
        : null) || "";
    const imgUrl = firstImage ? `${r2PublicUrl}/${firstImage}` : "images/placeholder.png";

    return `
        <div class="pending-product-card" id="card-${p.product_key}">
            <img src="${imgUrl}" class="pending-product-image" alt="${p.productName}">
            <div class="pending-product-details">
                <div class="pending-product-title">${p.productName}</div>
                <div class="pending-product-info"><strong>${adminPendingText("admin_pending_provider_label", "مقدم الخدمة:")}</strong> ${p.seller_name || adminPendingText("unknown_status", "غير معروف")} (${p.seller_phone || "-"})</div>
                <div class="pending-product-info"><strong>${adminPendingText("admin_pending_price_label", "السعر:")}</strong> ${p.product_price} ${adminPendingText("admin_pending_currency", "جنيه")}</div>
                <div class="pending-product-info">${p.product_description ? p.product_description.substring(0, 80) : ""}...</div>
            </div>
            <div class="pending-product-actions">
                <button id="approve-btn-${p.product_key}" class="btn-approve" onclick="window.adminUpdateStatus('${p.product_key}', '${p.productName}', 1)">
                    <i class="fas fa-check"></i> ${adminPendingText("admin_pending_approve", "موافقة")}
                </button>
                 <button id="reject-btn-${p.product_key}" class="btn-reject" 
                    onclick="window.adminDeleteProduct('${p.product_key}', '${p.productName}', '${p.ImageName || ""}', '${p.user_key || ""}', ${p.isService || p.serviceType === 2})">
                    <i class="fas fa-times"></i> ${adminPendingText("admin_pending_reject", "رفض")}
                </button>
                 <button id="view-btn-${p.product_key}" class="btn-view" onclick="window.adminPreviewProduct('${p.product_key}', 0)">
                    <i class="fas fa-eye"></i> ${adminPendingText("admin_pending_preview", "معاينة")}
                </button>
            </div>
        </div>
    `;
}

function createPublishedRowHTML(p) {
    return `
        <tr id="row-${p.product_key}">
            <td>
                <strong>${p.productName}</strong><br>
                <span style="color:#777; font-size:0.85em">${p.product_price} EGP</span>
            </td>
            <td>
                ${p.seller_name || "Unknown"}<br>
                <span style="color:#777; font-size:0.85em">${p.seller_phone || "-"}</span>
            </td>
            <td>
                <button class="btn-view" style="width:100%; margin-bottom: 5px;" onclick="window.adminPreviewProduct('${p.product_key}', 1)" title="${adminPendingText("admin_pending_preview", "معاينة")}">
                    <i class="fas fa-eye"></i> ${adminPendingText("admin_pending_preview", "معاينة")}
                </button>
                <button class="btn-unpublish" style="width:100%; margin-bottom: 5px;" onclick="window.adminUpdateStatus('${p.product_key}', '${p.productName}', 0)" title="${adminPendingText("admin_pending_unpublish", "إلغاء النشر")}">
                    <i class="fas fa-ban"></i> ${adminPendingText("admin_pending_unpublish", "إلغاء النشر")}
                </button>
                <button class="btn-reject" style="width:100%" onclick="window.adminDeleteProduct('${p.product_key}', '${p.productName}', '${p.ImageName || ""}')" title="${adminPendingText("gen_delete", "حذف")}">
                    <i class="fas fa-trash"></i> ${adminPendingText("gen_delete", "حذف")}
                </button>
            </td>
        </tr>
    `;
}

function getPublishedTableHeaderHTML() {
    return `
        <table class="pending-products-table">
            <thead>
                <tr>
                    <th>${adminPendingText("admin_pending_product_name", "اسم المنتج")}</th>
                    <th>${adminPendingText("admin_pending_provider", "مقدم الخدمة")}</th>
                    <th>${adminPendingText("admin_pending_actions", "الإجراءات")}</th>
                </tr>
            </thead>
            <tbody id="published-table-body">
    `;
}
