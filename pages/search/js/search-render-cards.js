/**
 * @file search-render-cards.js
 * @description Logic for generating individual result cards (Merchant/Product).
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


/**
 * @function generateMerchantResultHTML
 * @description Generates HTML for a merchant result card.
 */
function generateMerchantResultHTML(user) {
  // We'll use a less obtrusive log here since this runs per-card and could spam the console.
  // Using info level.
  console.info(` [Search Module - Cards] generateMerchantResultHTML() Started for user: ${user.user_key}`);
  const images = (typeof parseProfileImages === 'function')
    ? parseProfileImages(user.user_image)
    : { avatar: user.user_image, cover: null };
  const imageUrl = images.avatar ? getPublicR2FileUrl(images.avatar) : "/images/placeholder.png";
  const name = user.business_name || user.username || "مقدم خدمة غير معروف";
  const bio = user.business_bio || "";
  const specialtyDisplayMeta = typeof window.resolveBusinessSpecialtyDisplayMeta === 'function'
    ? window.resolveBusinessSpecialtyDisplayMeta(user.specialty_profile || user)
    : null;
  const specialtyAccent = typeof window.resolveBusinessSpecialtyAccent === 'function'
    ? window.resolveBusinessSpecialtyAccent(user.specialty_profile || user)
    : null;
  const specialtyProfile = user.specialty_profile || (
    typeof window.buildBusinessSpecialtyProfile === 'function'
      ? window.buildBusinessSpecialtyProfile(user)
      : null
  );
  const specialtyText = Array.isArray(specialtyProfile?.titles)
    ? specialtyProfile.titles.slice(0, 2).map((item) => String(item?.label || '').trim()).filter(Boolean).join(" • ")
    : "";
  const portfolioUrl = `/pages/merchant-portfolio/merchant-portfolio.html?user_key=${user.user_key}`;

  console.info(` [Search Module - Cards] generateMerchantResultHTML() Finished for user: ${user.user_key}`);
  return `
    <div id="merchant-card-${user.user_key}" class="search-result-item merchant-result" data-user-key="${user.user_key}" data-primary-category="${specialtyProfile?.primaryMainCategoryId || ''}" onclick="window.location.href='${portfolioUrl}'" ${specialtyAccent?.color ? `style="--merchant-accent:${specialtyAccent.color}; --merchant-accent-soft:${specialtyAccent.soft}; --merchant-accent-border:${specialtyAccent.border};"` : ''}>
      <div id="merchant-img-wrapper-${user.user_key}" class="search-result-image-wrapper">
        <img id="merchant-img-${user.user_key}" src="${imageUrl}" alt="${name}" class="search-result-image">
      </div>
      <div id="merchant-details-${user.user_key}" class="search-result-details">
        <h4 id="merchant-title-${user.user_key}" class="search-result-title">${name}</h4>
        ${specialtyDisplayMeta?.modeBadgeLabel ? `<p id="merchant-mode-${user.user_key}" class="search-result-bio" style="font-size: 0.72rem; color: var(--primary-color); margin-top: 3px; min-height: 16px;"><i class="${specialtyDisplayMeta.primaryCategoryIcon || 'fas fa-store'}"></i> ${specialtyDisplayMeta.modeBadgeLabel}</p>` : ''}
        <p id="merchant-bio-${user.user_key}" class="search-result-bio" style="font-size: 0.85rem; color: #666; margin-top: 5px; height: 40px; overflow: hidden;">
          ${bio.substring(0, 60)}${bio.length > 60 ? '...' : ''}
        </p>
        ${specialtyText ? `<p id="merchant-specialties-${user.user_key}" class="search-result-bio" style="font-size: 0.74rem; color: var(--primary-color); margin-top: 4px; min-height: 18px;">${specialtyText}</p>` : ''}
        <div id="merchant-btn-container-${user.user_key}" style="margin-top: auto; padding-top: 10px;">
           <span id="merchant-btn-text-${user.user_key}" class="glass-btn sm-btn" style="padding: 5px 15px; font-size: 0.8rem; width: 100%; justify-content: center;">
            عرض المتجر
           </span>
        </div>
      </div>
    </div>
  `;
}

/**
 * @function generateSearchResultHTML
 * @description Generates HTML for a product result card.
 */
function generateSearchResultHTML(product) {
  console.info(` [Search Module - Cards] generateSearchResultHTML() Started for product: ${product.product_key}`);
  const firstImageName = product.ImageName ? product.ImageName.split(",")[0] : null;
  const imageUrl = firstImageName ? getPublicR2FileUrl(firstImageName) : "/images/placeholder.png";

  const hidePrice = typeof window.ProductCategoryUi?.shouldHidePriceForProduct === 'function'
    ? window.ProductCategoryUi.shouldHidePriceForProduct(product)
    : false;
  const price = parseFloat(product.product_price);
  const oldPrice = parseFloat(product.original_price);
  const isSelected = isProductSelected(product.product_key);

  // Management Permissions
  const currentUser = typeof SessionManager !== 'undefined' ? SessionManager.getUser() : null;
  const capabilities = typeof window.resolveUserCapabilities === 'function'
    ? window.resolveUserCapabilities(currentUser)
    : null;
  const isAdmin = !!(capabilities?.isAdmin || isAdminForSearch);
  const isOwner = currentUser && (currentUser.user_key === product.user_key);
  const hasMgmtPermission = !!(currentUser && (isOwner || isAdmin));

  let priceHTML = "";
  if (!hidePrice) {
    const displayPrice = parseFloat(price.toFixed(2));
    const displayOldPrice = oldPrice ? parseFloat(oldPrice.toFixed(2)) : null;

    if (oldPrice && oldPrice > price) {
      priceHTML = `
            <div id="product-price-container-${product.product_key}" class="search-result-price-row">
                <span id="product-price-current-${product.product_key}" class="search-result-price">${displayPrice} ${window.langu('currency_egp')}</span>
                <span id="product-price-old-${product.product_key}" class="search-result-price-old">${displayOldPrice}</span>
            </div>
          `;
    } else {
      priceHTML = `<p id="product-price-container-${product.product_key}" class="search-result-price">${displayPrice} ${window.langu('currency_egp')}</p>`;
    }
  }

  // Management Actions Logic
  let mgmtActionsHtml = '';
  if (hasMgmtPermission) {
    const editLabel = typeof window.langu === 'function' ? window.langu('port_product_edit') || 'تعديل' : 'تعديل';
    const deleteLabel = typeof window.langu === 'function' ? window.langu('port_product_delete') || 'حذف' : 'حذف';
    mgmtActionsHtml = `
          <div class="product-management-actions search-mgmt-actions">
              <button class="portfolio-mgmt-btn portfolio-mgmt-btn-edit" 
                  onclick="event.stopPropagation(); window.searchEditProduct('${product.product_key}')">
                  <i class="fas fa-edit"></i> <span>${editLabel}</span>
              </button>
              <button class="portfolio-mgmt-btn portfolio-mgmt-btn-delete" 
                  onclick="event.stopPropagation(); window.searchDeleteProduct('${product.product_key}')">
                  <i class="fas fa-trash"></i> <span>${deleteLabel}</span>
              </button>
          </div>
      `;
  }

  const productMeta = {
    ...product,
    key: product.product_key,
    name: product.productName,
    price: price,
    img: firstImageName || '',
    MainCategory: product.MainCategory,
    SubCategory: product.SubCategory
  };
  const productMetaStr = encodeURIComponent(JSON.stringify(productMeta));

  // Featured Management Checkbox (Search Page)
  let featuredCheckboxHtml = '';
  if (hasMgmtPermission) {
    let isFeatured = false;
    const productIdStr = String(product.product_key || product.id);

    // If owner, check their own featured list
    if (isOwner && currentUser.featured_items_data) {
      try {
        const imgData = typeof currentUser.featured_items_data === 'string' ? JSON.parse(currentUser.featured_items_data) : currentUser.featured_items_data;
        if (imgData && imgData.featured_ids) {
          isFeatured = imgData.featured_ids.map(id => String(id)).includes(productIdStr);
        }
      } catch { }
    }

    const tooltipTitle = typeof window.langu === 'function' ? window.langu('port_feature_checkbox_tooltip') : 'Feature in Portfolio';
    featuredCheckboxHtml = `
            <div class="portfolio-feature-checkbox-container" 
                 style="position: absolute; top: 10px; right: 10px; width: 32px; height: 32px; z-index: 10;"
                 title="${tooltipTitle}"
                 onclick="event.stopPropagation(); toggleFeaturedProduct('${product.product_key}', ${!isFeatured}, this.querySelector('.portfolio-feature-crown'), '${product.user_key}')">
                <i class="fas fa-crown portfolio-feature-crown ${isFeatured ? 'active' : ''}"></i>
            </div>
        `;
  }

  console.info(` [Search Module - Cards] generateSearchResultHTML() Finished for product: ${product.product_key}`);
  return `
  <div id="product-card-${product.product_key}" class="search-result-item" data-product-key="${product.product_key}">
    <div id="product-img-wrapper-${product.product_key}" class="search-result-image-wrapper" style="position: relative;">
      ${featuredCheckboxHtml}
      <img id="product-img-${product.product_key}" src="${imageUrl}" alt="${product.productName}" class="search-result-image">
    </div>
    <div id="product-details-${product.product_key}" class="search-result-details">
      <h4 id="product-title-${product.product_key}" class="search-result-title">${product.productName}</h4>
      ${priceHTML}
      ${isAdminForSearch ? `
        <div id="product-admin-controls-${product.product_key}" class="search-admin-controls" style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee; display: flex; align-items: center; gap: 8px;" onclick="event.stopPropagation();">
            <input type="checkbox" id="chk_${product.product_key}" 
                   onchange="window.toggleSearchProduct('${productMetaStr}', this.parentElement)"
                   ${isSelected ? 'checked' : ''} 
                   style="transform: scale(1.2); cursor: pointer;">
            <label for="chk_${product.product_key}" style="font-size: 0.85rem; color: var(--primary-color); cursor: pointer;">
                ${window.langu('search_admin_checkbox_label')}
            </label>
        </div>
      ` : ''}
    </div>
    ${mgmtActionsHtml}
  </div>
`;
}

