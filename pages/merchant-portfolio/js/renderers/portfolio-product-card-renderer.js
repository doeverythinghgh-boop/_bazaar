/**
 * @file pages/merchant-portfolio/js/renderers/portfolio-product-card-renderer.js
 * @description Product card rendering helpers for merchant portfolio.
 */

function portfolioGetRenderPermissions() {
    const PortfolioAPI = window.PortfolioAPI || {};
    const currentUser = typeof SessionManager !== 'undefined' ? SessionManager.getUser() : null;
    const viewedUserKey = new URLSearchParams(window.location.search).get('user_key');
    const capabilities = PortfolioAPI.resolveUserCapabilities
        ? PortfolioAPI.resolveUserCapabilities(currentUser)
        : null;
    const isAdmin = !!capabilities?.isAdmin;
    const isOwner = currentUser && (currentUser.user_key === viewedUserKey);

    return {
        currentUser,
        hasMgmtPermission: !!(currentUser && (isOwner || isAdmin))
    };
}

function portfolioBuildPriceHtml(product, productId) {
    const currentPrice = parseFloat(product.product_price);
    const oldPrice = parseFloat(product.original_price);

    if (oldPrice && oldPrice > currentPrice) {
        return `
            <div class="product-price-row" id="product-price-row-${productId}">
                <span class="product-price-current" id="product-price-current-${productId}">${currentPrice} ج.م</span>
                <span class="product-price-old" id="product-price-old-${productId}">${oldPrice} ج.م</span>
            </div>
        `;
    }

    return `<div class="product-price" id="product-price-${productId}">${currentPrice} ج.م</div>`;
}

function portfolioBuildStatusBadge(product, hasMgmtPermission) {
    if (!(hasMgmtPermission && product.is_approved == 0)) return '';

    const pendingLabel = typeof window.langu === 'function'
        ? window.langu('port_product_status_pending') || 'قيد المراجعة'
        : 'قيد المراجعة';
    return `<div class="product-status-badge">${pendingLabel}</div>`;
}

function portfolioBuildManagementActions(product, hasMgmtPermission) {
    if (!hasMgmtPermission) return '';

    const editLabel = typeof window.langu === 'function' ? window.langu('port_product_edit') || 'تعديل' : 'تعديل';
    const deleteLabel = typeof window.langu === 'function' ? window.langu('port_product_delete') || 'حذف' : 'حذف';

    return `
        <div class="product-management-actions">
            <button class="portfolio-mgmt-btn portfolio-mgmt-btn-edit"
                onclick="event.stopPropagation(); portfolioEditProduct(${product.id || `'${product.product_key}'`})">
                <i class="fas fa-edit"></i> <span>${editLabel}</span>
            </button>
            <button class="portfolio-mgmt-btn portfolio-mgmt-btn-delete"
                onclick="event.stopPropagation(); portfolioDeleteProduct(${product.id || `'${product.product_key}'`})">
                <i class="fas fa-trash"></i> <span>${deleteLabel}</span>
            </button>
        </div>
    `;
}

function portfolioBuildFeaturedToggle(product, specialtyViewModel, hasMgmtPermission) {
    if (!(hasMgmtPermission && specialtyViewModel?.canFeatureCatalog !== false)) return '';

    const productId = product.product_key || product.id;
    const isFeatured = window.portfolioFeaturedState && (
        window.portfolioFeaturedState.featuredIds.has(String(product.id)) ||
        window.portfolioFeaturedState.featuredIds.has(String(product.product_key))
    );
    const tooltipTitle = typeof window.langu === 'function'
        ? window.langu('port_feature_checkbox_tooltip')
        : 'Feature in Scroller';

    return `
        <div class="portfolio-feature-checkbox-container"
             title="${tooltipTitle}"
             onclick="event.stopPropagation(); toggleFeaturedProduct('${productId}', ${!isFeatured}, this.querySelector('.portfolio-feature-crown'))">
            <i class="fas fa-crown portfolio-feature-crown ${isFeatured ? 'active' : ''}"></i>
        </div>
    `;
}

function portfolioCreateProductCard(product, specialtyViewModel, permissions) {
    const productId = product.product_key || product.id;
    const PortfolioAPI = window.PortfolioAPI || {};
    const card = document.createElement('div');
    card.className = 'portfolio-product-card';
    card.id = `product-card-${productId}`;

    const firstImage = product.ImageName ? product.ImageName.split(',')[0] : '';
    const imgUrl = firstImage && PortfolioAPI.getPublicImageUrl
        ? PortfolioAPI.getPublicImageUrl(firstImage)
        : '/assets/images/placeholder.png';

    card.innerHTML = `
        ${portfolioBuildStatusBadge(product, permissions.hasMgmtPermission)}
        ${portfolioBuildFeaturedToggle(product, specialtyViewModel, permissions.hasMgmtPermission)}
        <img src="${imgUrl}" class="product-img" id="product-img-${productId}" loading="lazy" alt="${product.productName}">
        <div class="product-info" id="product-info-${productId}">
            <h3 class="product-title" id="product-title-${productId}">${product.productName}</h3>
            ${portfolioBuildPriceHtml(product, productId)}
        </div>
        ${portfolioBuildManagementActions(product, permissions.hasMgmtPermission)}
    `;

    card.onclick = function () {
        if (typeof window.loadProductView === 'function') {
            window.loadProductView(product, { showAddToCart: true });
        } else if (product.product_key) {
            window.location.href = `/pages/products/productView/productView.html?product_key=${encodeURIComponent(product.product_key)}`;
        }
    };

    return card;
}
