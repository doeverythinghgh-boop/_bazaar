/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */
/**
 * @file pages/merchant-control-panel/js/control-panel-render.js
 * @description Rendering helpers for merchant control panel categories and products.
 */

(function () {
    'use strict';

    const state = () => window.MerchantControlPanelState;
    const log = (...args) => console.log('[MerchantControlPanel]', ...args);

    function getImageUrl(product) {
        const firstImage = String(product?.ImageName || '').split(',').map((item) => item.trim()).filter(Boolean)[0] || '';
        if (!firstImage) return '/images/icons/icon-192x192.png';
        return typeof window.getPublicR2FileUrl === 'function' ? window.getPublicR2FileUrl(firstImage) : firstImage;
    }

    function setStatus(message, type = 'muted', icon = 'fas fa-layer-group') {
        log('Updating status:', { message, type });
        const status = document.getElementById('mcp-products-status');
        if (!status) {
            error('Status element (#mcp-products-status) missing from DOM.');
            return;
        }
        status.className = `mcp-status-card ${type ? `is-${type}` : ''}`.trim();
        status.innerHTML = `<i class="${icon}"></i><span>${message}</span>`;
        status.style.display = 'flex';
    }

    function hideStatus() {
        const status = document.getElementById('mcp-products-status');
        if (status) status.style.display = 'none';
    }

    function syncLoadMore() {
        const actions = document.getElementById('mcp-products-actions');
        const loadMore = document.getElementById('mcp-load-more-btn');
        const visible = state().hasMore && state().mode === 'category';
        if (actions) actions.hidden = !visible;
        if (loadMore) loadMore.disabled = !!state().isLoading;
    }

    async function renderCategorySelector() {
        log('Rendering scoped category selector.');
        const container = document.getElementById('mcp-category-display');
        if (!container) return;

        const tree = await window.ProductCategoryScope.getAllowedTree('product', state().merchant?.business_category);
        state().categoryTree = Array.isArray(tree) ? tree : [];

        if (!state().categoryTree.length) {
            container.innerHTML = '<div class="category-scope-empty">لا توجد فئات متاحة ضمن تخصص هذا الحساب.</div>';
            return;
        }

        container.innerHTML = `
            <div id="mcp_category_display_panel" class="category-scope-panel">
                <label id="mcp-main-category-label" for="mcp-main-category-select">القسم الرئيسي</label>
                <label id="mcp-sub-category-label" for="mcp-sub-category-select">القسم الفرعي</label>
                <select id="mcp-main-category-select" class="mcp-category-select">
                    <option value="">اختر القسم الرئيسي</option>
                </select>
                <select id="mcp-sub-category-select" class="mcp-category-select" disabled>
                    <option value="">اختر القسم الفرعي</option>
                </select>
            </div>
        `;

        const mainSelect = document.getElementById('mcp-main-category-select');
        const subSelect = document.getElementById('mcp-sub-category-select');
        mainSelect.insertAdjacentHTML('beforeend', state().categoryTree.map((main) => (
            `<option value="${String(main.id)}">${main.title}</option>`
        )).join(''));

        mainSelect.addEventListener('change', () => {
            const main = state().categoryTree.find((item) => String(item.id) === String(mainSelect.value));
            state().selectedMainId = mainSelect.value || '';
            state().selectedSubId = '';
            subSelect.innerHTML = '<option value="">اختر القسم الفرعي</option>';

            const subs = Array.isArray(main?.subcategories) ? main.subcategories : [];
            if (subs.length) {
                subSelect.disabled = false;
                subSelect.insertAdjacentHTML('beforeend', subs.map((sub) => (
                    `<option value="${String(sub.id)}">${sub.title}</option>`
                )).join(''));
                setStatus('اختر فئة فرعية لعرض الخدمات', 'muted', 'fas fa-list');
            } else if (state().selectedMainId) {
                subSelect.disabled = true;
                window.MerchantControlPanelActions.loadCategoryProducts({ reset: true });
            }
        });

        subSelect.addEventListener('change', () => {
            state().selectedSubId = subSelect.value || '';
            if (state().selectedMainId && state().selectedSubId) {
                window.MerchantControlPanelActions.loadCategoryProducts({ reset: true });
            }
        });

        log('Scoped category selector rendered successfully.');
    }

    function createProductCard(product) {
        const productId = String(product?.product_key || product?.id || '');
        const isCar = state().listingType === 'cars' || product?.item_type === 'car' || product?.is_car_listing;
        const isRealEstate = state().listingType === 'real_estate' || product?.item_type === 'real_estate' || product?.is_real_estate_listing;
        const isFeatured = (isCar || isRealEstate)
            ? String(product?.is_featured) === '1'
            : (state().featuredIds.has(String(product?.product_key || '')) || state().featuredIds.has(String(product?.id || '')));
        const price = Number.parseFloat(product?.product_price || 0);
        const isPending = String(product?.is_approved) === '0';
        const card = document.createElement('article');
        card.className = 'mcp-product-card';
        card.id = `mcp-product-${productId}`;
        card.dataset.productKey = productId;
        card.innerHTML = `
            ${isPending ? '<span class="mcp-product-pending">قيد المراجعة</span>' : ''}
            <button class="mcp-product-feature ${isFeatured ? 'is-active' : ''}" type="button" aria-label="تمييز المنتج">
                <i class="fas fa-crown"></i>
            </button>
            <img class="mcp-product-image" src="${getImageUrl(product)}" alt="${product?.productName || ''}" loading="lazy" onerror="this.onerror=null;this.src='/images/icons/icon-192x192.png';">
            <div class="mcp-product-info">
                <h3 class="mcp-product-title">${product?.productName || (isCar ? 'سيارة بدون اسم' : (isRealEstate ? 'عقار بدون اسم' : 'منتج بدون اسم'))}</h3>
                <div class="mcp-product-meta">
                    <span class="mcp-product-price">${Number.isFinite(price) ? price : 0} ج.م</span>
                    <span>#${productId}</span>
                </div>
            </div>
            <div class="mcp-product-actions">
                <button class="mcp-product-action" type="button" data-action="edit">
                    <i class="fas fa-edit"></i><span>تعديل</span>
                </button>
                <button class="mcp-product-action mcp-product-action-danger" type="button" data-action="delete">
                    <i class="fas fa-trash"></i><span>حذف</span>
                </button>
            </div>
        `;

        card.querySelector('.mcp-product-feature')?.addEventListener('click', (event) => {
            event.stopPropagation();
            window.MerchantControlPanelActions.toggleFeatured(product, card.querySelector('.mcp-product-feature'));
        });
        card.querySelector('[data-action="edit"]')?.addEventListener('click', (event) => {
            event.stopPropagation();
            window.MerchantControlPanelActions.editProduct(product);
        });
        card.querySelector('[data-action="delete"]')?.addEventListener('click', (event) => {
            event.stopPropagation();
            window.MerchantControlPanelActions.deleteProduct(product);
        });
        card.addEventListener('click', () => {
            if (isCar) {
                window.location.href = window.ProductRoutes?.buildProductViewUrl
                    ? window.ProductRoutes.buildProductViewUrl(product, { productKey: product.car_key || productId, providerKey: product.user_key || state().merchant?.user_key || '', listingType: 'car' })
                    : `/pages/products/productView/productView.html?product_key=${encodeURIComponent(product.car_key || productId)}&provider_key=${encodeURIComponent(product.user_key || state().merchant?.user_key || '')}&listing=car`;
            } else if (isRealEstate) {
                window.location.href = window.ProductRoutes?.buildProductViewUrl
                    ? window.ProductRoutes.buildProductViewUrl(product, { productKey: product.real_estate_key || productId, providerKey: product.user_key || state().merchant?.user_key || '', listingType: 'real_estate' })
                    : `/pages/products/productView/productView.html?product_key=${encodeURIComponent(product.real_estate_key || productId)}&provider_key=${encodeURIComponent(product.user_key || state().merchant?.user_key || '')}&listing=real_estate`;
            } else if (typeof window.loadProductView === 'function') {
                window.loadProductView(product, { showAddToCart: true });
            }
        });

        return card;
    }

    function renderProducts(products, { append = false } = {}) {
        const grid = document.getElementById('mcp-products-grid');
        if (!grid) return;
        if (!append) grid.innerHTML = '';

        const list = Array.isArray(products) ? products : [];
        if (!list.length && !append) {
            setStatus(state().mode === 'featured' ? 'لا توجد خدمات مميزة حالياً' : 'لا توجد خدمات في هذه الفئة', 'muted', 'fas fa-box-open');
            syncLoadMore();
            return;
        }

        hideStatus();
        const fragment = document.createDocumentFragment();
        list.forEach((product) => fragment.appendChild(createProductCard(product)));
        grid.appendChild(fragment);
        syncLoadMore();
    }

    function setLoading(isLoading) {
        state().isLoading = !!isLoading;
        const loadMore = document.getElementById('mcp-load-more-btn');
        if (loadMore) loadMore.disabled = !!isLoading;
        if (isLoading) setStatus('جاري تحميل الخدمات...', '', 'fas fa-spinner fa-spin');
    }

    window.MerchantControlPanelRender = {
        renderCategorySelector,
        renderProducts,
        setStatus,
        hideStatus,
        syncLoadMore,
        setLoading
    };
})();
