/**
 * @file pages/merchant-portfolio/js/pharmacy-control-panel/pharmacy-ui-renderer.js
 * @description Catalog tree renderer for the pharmacy control panel.
 */

function pharmacyCountHiddenProductsForRender(subCategoryId, hiddenProductSet) {
    return Array.from(hiddenProductSet).filter(productId => {
        const mappedSubId = window.pharmacyProductSubCategoryIndex?.[String(productId)];
        return String(mappedSubId || '') === String(subCategoryId) || String(productId).startsWith(String(subCategoryId));
    }).length;
}

function pharmacyRenderCatalog(data, preferenceState) {
    const container = document.getElementById('catalog-container');
    if (!container) return;

    container.innerHTML = '';

    data.forEach(main => {
        const mainTitle = (window.app_language === 'en' ? main.name_en : main.title) || main.title;
        const card = document.createElement('div');
        card.className = 'catalog-card';
        card.id = `catalog-card-${main.id}`;

        const hiddenSubsCount = (main.sub || []).filter(sub => preferenceState.hidden_sub_categories.has(Number(sub.id))).length;
        const hiddenBadgeHtml = hiddenSubsCount > 0
            ? `<span class="sub-hidden-badge" id="hidden-badge-${main.id}" style="background:#e53e3e; color:white; padding:2px 6px; border-radius:10px; font-size:0.6rem; margin-right:5px;"><i class="fas fa-eye-slash"></i> ${hiddenSubsCount}</span>`
            : '';

        const isMainChecked = !preferenceState.hidden_main_categories.has(Number(main.id)) ? 'checked' : '';

        let subHtml = `<div class="sub-cat-list" id="sub-cat-list-${main.id}" style="display: none;">`;

        if (Array.isArray(main.sub) && main.sub.length > 0) {
            main.sub.forEach(sub => {
                const subTitle = (window.app_language === 'en' ? sub.name_en : sub.title) || sub.title;
                const isSubChecked = !preferenceState.hidden_sub_categories.has(Number(sub.id)) ? 'checked' : '';
                const hiddenProductsCount = pharmacyCountHiddenProductsForRender(sub.id, preferenceState.hidden_catalog_products);
                const counterHtml = hiddenProductsCount > 0
                    ? `<span class="btn-product-counter" id="product-counter-${sub.id}">-${hiddenProductsCount}</span>`
                    : '';

                subHtml += `
                    <div class="sub-cat-item" id="sub-cat-item-${sub.id}">
                        <div style="display:flex; align-items:center; gap:10px;">
                            <span id="sub-cat-title-${sub.id}">${subTitle}</span>
                            <button class="btn-manage-products" id="btn-manage-${sub.id}"
                                    style="border:none; background:rgba(0,86,179,0.05); color:var(--primary); padding:4px 10px; border-radius:8px; cursor:pointer; display:flex; align-items:center; gap:6px; position:relative;"
                                    title="${window.pharmacyL('manage_products')}"
                                    onclick="pharmacyOpenProductManagement('${sub.id}', '${subTitle.replace(/'/g, "\\\\'")}')">
                                <i class="fas fa-boxes"></i>
                                ${counterHtml}
                            </button>
                        </div>
                        <label class="toggle-switch" id="sub-cat-toggle-label-${sub.id}">
                            <input type="checkbox" id="sub-cat-input-${sub.id}" data-type="sub" data-id="${sub.id}" ${isSubChecked}>
                            <span class="slider" id="sub-cat-slider-${sub.id}"></span>
                        </label>
                    </div>
                `;
            });
        } else {
            subHtml += `<small class="text-muted" id="sub-cat-empty-${main.id}" style="padding:10px; display:block;">${window.pharmacyL('no_sub_categories')}</small>`;
        }

        subHtml += '</div>';

        card.innerHTML = `
            <div class="catalog-card-header" id="catalog-card-header-${main.id}" style="cursor:pointer;">
                <span id="main-cat-title-wrapper-${main.id}">
                    <i class="fas fa-chevron-down toggle-arrow" id="chevron-${main.id}" style="margin-left:8px; transition:0.3s; font-size:0.8rem; opacity:0.5; transform: rotate(-90deg);"></i>
                    <i class="${main.icon || 'fas fa-pills'}" id="main-cat-icon-${main.id}"></i>
                    <span id="main-cat-title-${main.id}">${mainTitle}</span>
                    ${hiddenBadgeHtml}
                </span>
                <label class="toggle-switch" id="main-cat-toggle-label-${main.id}">
                    <input type="checkbox" id="main-cat-input-${main.id}" data-type="main" data-id="${main.id}" ${isMainChecked}>
                    <span class="slider" id="main-cat-slider-${main.id}"></span>
                </label>
            </div>
            ${subHtml}
        `;

        container.appendChild(card);

        const header = card.querySelector('.catalog-card-header');
        const list = card.querySelector('.sub-cat-list');
        const arrow = card.querySelector('.toggle-arrow');

        header.addEventListener('click', event => {
            if (event.target.closest('.toggle-switch')) return;
            const isCollapsed = list.style.display === 'none';
            list.style.display = isCollapsed ? 'block' : 'none';
            arrow.style.transform = isCollapsed ? 'rotate(0deg)' : 'rotate(-90deg)';
        });
    });
}

window.pharmacyRenderCatalog = pharmacyRenderCatalog;
