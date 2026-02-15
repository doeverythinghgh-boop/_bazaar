/**
 * @file pages/ADMIN/pendingProducts-ui.js
 * @description UI rendering module for products management in Admin Panel.
 */

/**
 * @function createPendingCardHTML
 * @description Generates HTML for a pending product card.
 * @param {Object} p - Product data.
 * @returns {string} HTML string.
 */
function createPendingCardHTML(p) {
    const firstImage = p.ImageName ? p.ImageName.split(',')[0] : null;
    const imgUrl = firstImage ? `https://pub-e828389e2f1e484c89d8fb652c540c12.r2.dev/${firstImage}` : 'images/placeholder.png';

    return `
        <div class="pending-product-card" id="card-${p.product_key}">
            <img src="${imgUrl}" class="pending-product-image" alt="${p.productName}">
            <div class="pending-product-details">
                <div class="pending-product-title">${p.productName}</div>
                <div class="pending-product-info"><strong>البائع:</strong> ${p.seller_name || 'غير معروف'} (${p.seller_phone || '-'})</div>
                <div class="pending-product-info"><strong>السعر:</strong> ${p.product_price} جنيه</div>
                <div class="pending-product-info">${p.product_description ? p.product_description.substring(0, 80) : ''}...</div>
            </div>
            <div class="pending-product-actions">
                <button class="btn-approve" onclick="window.adminUpdateStatus('${p.product_key}', '${p.productName}', 1)">
                    <i class="fas fa-check"></i> موافقة
                </button>
                 <button class="btn-reject" onclick="window.adminDeleteProduct('${p.product_key}', '${p.productName}', '${p.ImageName || ''}')">
                    <i class="fas fa-times"></i> رفض
                </button>
                 <button class="btn-view" onclick="window.adminPreviewProduct('${p.product_key}', 0)">
                    <i class="fas fa-eye"></i> معاينة
                </button>
            </div>
        </div>
    `;
}

/**
 * @function createPublishedRowHTML
 * @description Generates HTML for a published product table row.
 * @param {Object} p - Product data.
 * @returns {string} HTML string.
 */
function createPublishedRowHTML(p) {
    return `
        <tr id="row-${p.product_key}">
            <td>
                <strong>${p.productName}</strong><br>
                <span style="color:#777; font-size:0.85em">${p.product_price} EGP</span>
            </td>
            <td>
                ${p.seller_name || 'Unknown'}<br>
                <span style="color:#777; font-size:0.85em">${p.seller_phone || '-'}</span>
            </td>
            <td>
                <button class="btn-view" style="width:100%; margin-bottom: 5px;" onclick="window.adminPreviewProduct('${p.product_key}', 1)" title="معاينة">
                    <i class="fas fa-eye"></i> معاينة
                </button>
                <button class="btn-unpublish" style="width:100%; margin-bottom: 5px;" onclick="window.adminUpdateStatus('${p.product_key}', '${p.productName}', 0)" title="إلغاء النشر">
                    <i class="fas fa-ban"></i> إلغاء النشر
                </button>
                <button class="btn-reject" style="width:100%" onclick="window.adminDeleteProduct('${p.product_key}', '${p.productName}', '${p.ImageName || ''}')" title="حذف">
                    <i class="fas fa-trash"></i> حذف
                </button>
            </td>
        </tr>
    `;
}

/**
 * @function getPublishedTableHeaderHTML
 * @description Returns the header HTML for the published products table.
 * @returns {string} HTML string.
 */
function getPublishedTableHeaderHTML() {
    return `
        <table class="pending-products-table">
            <thead>
                <tr>
                    <th>اسم المنتج</th>
                    <th>البائع</th>
                    <th>الإجراءات</th>
                </tr>
            </thead>
            <tbody id="published-table-body">
    `;
}
