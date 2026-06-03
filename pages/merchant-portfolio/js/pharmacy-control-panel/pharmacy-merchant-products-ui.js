/**
 * @file pages/merchant-portfolio/js/pharmacy-control-panel/pharmacy-merchant-products-ui.js
 * @description Merchant pharmacy products list UI.
 *
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 */

window.pharmacyMerchantProductsUI = (function () {
    const state = {
        products: [],
        userKey: null
    };

    function getFallbackImage() {
        return '/assets/images/placeholder.png';
    }

    function getImageUrl(imageName) {
        if (!imageName) return getFallbackImage();
        if (imageName.includes('/')) {
            return '/' + imageName.replace(/^\/+/, '');
        }
        return (typeof window.getPublicR2FileUrl === 'function')
            ? window.getPublicR2FileUrl(imageName)
            : ('/' + imageName);
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function resolveCategoryNames(product) {
        const mainId = String(product?.custom_main_cat_id || '');
        const subId = String(product?.custom_sub_cat_id || '');

        let mainName = '';
        let subName = '';

        const catalog = Array.isArray(window.globalCatalogData) ? window.globalCatalogData : [];

        // Find main category
        const mainCat = catalog.find(m => String(m.id) === mainId);
        if (mainCat) {
            mainName = (window.app_language === 'en' ? mainCat.name_en : mainCat.title) || mainCat.title;

            // Find sub category under this main
            if (Array.isArray(mainCat.sub)) {
                const subCat = mainCat.sub.find(s => String(s.id) === subId);
                if (subCat) {
                    subName = (window.app_language === 'en' ? subCat.name_en : subCat.title) || subCat.title;
                }
            }
        }

        // If not found inside main.sub (e.g. orphan custom sub), search everywhere in subcategories
        if (!subName && subId) {
            for (const main of catalog) {
                if (Array.isArray(main.sub)) {
                    const subCat = main.sub.find(s => String(s.id) === subId);
                    if (subCat) {
                        subName = (window.app_language === 'en' ? subCat.name_en : subCat.title) || subCat.title;
                        if (!mainName) {
                            mainName = (window.app_language === 'en' ? main.name_en : main.title) || main.title;
                        }
                        break;
                    }
                }
            }
        }

        return { mainName, subName };
    }

    function getMerchantFeaturedItem(product) {
        return {
            product_id: String(product?.product_id || ''),
            custom_sub_cat_id: String(product?.custom_sub_cat_id || ''),
            isMerchant: true,
            source: 'pharmacy'
        };
    }

    function isMerchantFeatured(product) {
        return !!(
            window.pharmacyFeaturedUtils?.isFeatured &&
            window.pharmacyFeaturedUtils.isFeatured(getMerchantFeaturedItem(product))
        );
    }

    function findCatalogProduct(featuredItem) {
        const targetId = String(featuredItem?.id || '');
        const targetSubId = String(featuredItem?.subId || '');
        const catalog = Array.isArray(window.globalCatalogData) ? window.globalCatalogData : [];
        for (const mainCategory of catalog) {
            const subCategories = Array.isArray(mainCategory?.sub) ? mainCategory.sub : [];
            for (const subCategory of subCategories) {
                if (targetSubId && String(subCategory?.id || '') !== targetSubId) continue;
                const products = Array.isArray(subCategory?.products) ? subCategory.products : [];
                const product = products.find((entry) => String(entry?.id || entry?.product_id || '') === targetId);
                if (product) return product;
            }
        }
        return null;
    }

    function renderFeaturedProducts() {
        const container = document.getElementById('pharmacy-featured-products-container');
        const emptyState = document.getElementById('pharmacy-featured-products-empty');
        const countEl = document.getElementById('pharmacy-featured-products-count');
        if (!container) return;

        const featuredItems = window.pharmacyFeaturedUtils?.getFeaturedItems
            ? window.pharmacyFeaturedUtils.getFeaturedItems()
            : [];

        container.innerHTML = '';
        if (countEl) countEl.textContent = String(featuredItems.length);

        if (!featuredItems.length) {
            if (emptyState) emptyState.classList.remove('hidden');
            return;
        }

        if (emptyState) emptyState.classList.add('hidden');

        const fragment = document.createDocumentFragment();
        featuredItems.forEach((item) => {
            const isMerchant = String(item.type || '') === 'merchant';
            const product = isMerchant
                ? state.products.find((entry) => String(entry.product_id || '') === String(item.id || ''))
                : findCatalogProduct(item);
            const card = document.createElement('div');
            card.className = 'merchant-product-card pharmacy-featured-card';

            const name = product
                ? (product.name_ar || product.name_en || product.title || product.title_ar || product.title_en || item.id)
                : (isMerchant ? item.id : `Catalog #${item.id}`);
            const meta = product
                ? `${typeof window.pharmacyL === 'function' ? window.pharmacyL('price_label') : 'السعر'}: ${product.price || 0}`
                : (isMerchant ? 'Merchant product' : 'Catalog product');
            const image = product
                ? (window.pharmacyFeaturedUtils?.resolveImageUrl
                    ? window.pharmacyFeaturedUtils.resolveImageUrl(product)
                    : getImageUrl(product.image_names))
                : getFallbackImage();

            card.innerHTML = `
                <button class="btn-featured-remove" data-featured-type="${escapeHtml(item.type || 'catalog')}" data-featured-id="${escapeHtml(item.id || '')}" data-featured-sub-id="${escapeHtml(item.subId || '')}">
                    <i class="fas fa-crown portfolio-feature-crown active"></i>
                </button>
                <div class="product-card-body">
                    <div class="product-card-thumb">
                        <img src="${escapeHtml(image)}" onerror="this.src='${getFallbackImage()}';">
                    </div>
                    <div class="product-card-main-info">
                        <h4 class="product-card-name">${escapeHtml(name)}</h4>
                        <p class="product-card-meta">${escapeHtml(meta)}</p>
                    </div>
                </div>
            `;
            fragment.appendChild(card);
        });

        container.appendChild(fragment);
    }

    function renderProducts(products) {
        const container = document.getElementById('merchant-products-container');
        const emptyState = document.getElementById('products-empty-state');

        if (!container) return;
        container.innerHTML = '';

        if (!products?.length) {
            if (emptyState) emptyState.classList.remove('hidden');
            return;
        }

        if (emptyState) emptyState.classList.add('hidden');

        const fragment = document.createDocumentFragment();

        products.forEach(product => {
            const card = document.createElement('div');
            card.className = 'merchant-product-card';

            const statusClass = product.status == 1 ? 'status-active' : 'status-hidden';
            const isFeatured = isMerchantFeatured(product);
            const statusLabel = product.status == 1
                ? (typeof window.pharmacyL === 'function' ? window.pharmacyL('status_available') : 'متوفر')
                : (typeof window.pharmacyL === 'function' ? window.pharmacyL('status_hidden') : 'مخفي');

            const { mainName, subName } = resolveCategoryNames(product);
            const categoryBadgeHtml = (mainName || subName)
                ? `
                <div class="product-card-categories-badge" style="display: inline-flex; align-items: center; gap: 4px; background: rgba(0, 86, 179, 0.05); color: var(--primary, #0056b3); padding: 2px 8px; border-radius: 12px; font-size: 0.72rem; margin-top: 6px; font-weight: 500; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    <i class="fas fa-folder" style="font-size: 0.68rem; opacity: 0.7;"></i>
                    <span>${escapeHtml(mainName || '---')}</span>
                    <span style="opacity: 0.5;">/</span>
                    <span>${escapeHtml(subName || '---')}</span>
                </div>
                `
                : '';

            card.innerHTML = `
                <div class="product-status-badge ${statusClass}">${statusLabel}</div>
                <button class="btn-product-featured btn-pharmacy-merchant-featured" data-product-id="${escapeHtml(product.product_id)}" data-sub-id="${escapeHtml(product.custom_sub_cat_id || '')}">
                    <i class="fas fa-crown portfolio-feature-crown ${isFeatured ? 'active' : ''}"></i>
                </button>
                <div class="product-card-body">
                    <div class="product-card-thumb">
                        <img src="${getImageUrl(product.image_names)}" onerror="this.src='${getFallbackImage()}';">
                    </div>
                    <div class="product-card-main-info">
                        <h4 class="product-card-name">${product.name_ar || ''}</h4>
                        <p class="product-card-meta">${typeof window.pharmacyL === 'function' ? window.pharmacyL('price_label') : 'السعر'}: <b>${product.price} ${typeof window.pharmacyL === 'function' ? window.pharmacyL('currency_egp') : 'ج.م'}</b></p>
                        <p class="product-card-meta">${typeof window.pharmacyL === 'function' ? window.pharmacyL('stock_label') : 'المخزون'}: <b>${product.stock_quantity || 0}</b></p>
                        ${categoryBadgeHtml}
                    </div>
                </div>
                <div class="product-card-actions">
                    <button class="btn-card-action btn-edit-product" data-product-id="${product.product_id}">
                        <i class="fas fa-edit"></i> ${typeof window.pharmacyL === 'function' ? window.pharmacyL('edit_btn') : 'تعديل'}
                    </button>
                    <button class="btn-card-action btn-delete-product" data-product-id="${product.product_id}">
                        <i class="fas fa-trash-alt"></i> ${typeof window.pharmacyL === 'function' ? window.pharmacyL('delete_btn') : 'حذف'}
                    </button>
                </div>
            `;

            fragment.appendChild(card);
        });

        container.appendChild(fragment);
    }

    async function loadProducts(userKey) {
        if (!userKey) return;

        state.userKey = userKey;

        const loader = document.getElementById('merchant-products-loader');
        const container = document.getElementById('merchant-products-container');
        const emptyState = document.getElementById('products-empty-state');

        if (loader) loader.classList.remove('hidden');
        if (container) container.innerHTML = '';
        if (emptyState) emptyState.classList.add('hidden');

        try {
            if (typeof window.pharmacyControlInitFeatured === 'function') {
                await window.pharmacyControlInitFeatured();
            }
            const context = await window.PharmacyAPI.getCatalogContext(userKey);
            if (context && context.mergedCategories) {
                window.globalCatalogData = context.mergedCategories;
            }
            state.products = await window.PharmacyAPI.fetchMerchantProducts(userKey);
            renderProducts(state.products);
            renderFeaturedProducts();
        } catch (error) {
            console.error("[PharmacyProducts] Load failed:", error);
            if (container) {
                const errorMsg = typeof window.pharmacyL === 'function' ? window.pharmacyL('load_error_products') : 'حدث خطأ أثناء تحميل الخدمات.';
                container.innerHTML = `<p class="error-text">${errorMsg}</p>`;
            }
        } finally {
            if (loader) loader.classList.add('hidden');
        }
    }

    async function deleteProduct(productId) {
        const product = state.products.find(item => item.product_id === productId);
        if (!product) return;

        const result = await Swal.fire({
            title: typeof window.pharmacyL === 'function' ? window.pharmacyL('delete_confirm_title') : 'هل أنت متأكد؟',
            text: typeof window.pharmacyL === 'function' ? window.pharmacyL('delete_confirm_text') : 'سيتم حذف المنتج وصورته نهائياً من النظام!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: typeof window.pharmacyL === 'function' ? window.pharmacyL('delete_confirm_btn') : 'نعم، احذف الكل!',
            cancelButtonText: typeof window.pharmacyL === 'function' ? window.pharmacyL('cancel_btn') : 'إلغاء',
            customClass: {
                popup: 'swal-modern-mini-popup',
                title: 'swal-modern-mini-title',
                htmlContainer: 'swal-modern-mini-text',
                confirmButton: 'swal-modern-mini-confirm',
                cancelButton: 'swal-modern-mini-cancel'
            }
        });

        if (!result.isConfirmed) return;

        Swal.fire({
            title: typeof window.pharmacyL === 'function' ? window.pharmacyL('deleting_loader') : 'جاري الحذف...',
            didOpen: () => { Swal.showLoading(); },
            customClass: {
                popup: 'swal-modern-mini-popup',
                title: 'swal-modern-mini-title'
            },
            allowOutsideClick: false
        });

        try {
            if (product.image_names && typeof window.deleteFile2cf === 'function') {
                await window.deleteFile2cf(product.image_names);
            }

            await window.PharmacyAPI.deleteProductMetadata(productId, state.userKey);

            // Real-time Sync: Remove from global catalog map
            if (product.original_catalog_id && window.pharmacyCatalogToMerchantMap) {
                delete window.pharmacyCatalogToMerchantMap[String(product.original_catalog_id)];
                console.log(`[Pharmacy-System] Catalog map updated: Removed link for Catalog ID: ${product.original_catalog_id}`);
            }

            window.PharmacyAPI.invalidateCatalogContext(state.userKey);
            await loadProducts(state.userKey);

            Swal.fire({
                title: typeof window.pharmacyL === 'function' ? window.pharmacyL('delete_success_title') : 'تم الحذف!',
                text: typeof window.pharmacyL === 'function' ? window.pharmacyL('delete_success_text') : 'تم حذف المنتج وصورته بنجاح.',
                icon: 'success',
                customClass: {
                    popup: 'swal-modern-mini-popup',
                    title: 'swal-modern-mini-title',
                    htmlContainer: 'swal-modern-mini-text',
                    confirmButton: 'swal-modern-mini-confirm'
                }
            });
        } catch (error) {
            console.error("[PharmacyProducts] Delete failed:", error);
        }
    }

    function editProduct(productId) {
        const product = state.products.find(item => item.product_id === productId);
        if (!product) return;

        const addTabBtn = document.querySelector('.navbar-menu li[data-tab="add-product-tab"]');
        if (addTabBtn) addTabBtn.click();

        if (typeof window.pharmacyPreFillAddProductForm === 'function') {
            window.pharmacyPreFillAddProductForm(product);
        }
    }

    function bindEvents() {
        const container = document.getElementById('merchant-products-container');
        if (container && container.dataset.bound !== 'true') {
            container.dataset.bound = 'true';
            container.addEventListener('click', event => {
                const editBtn = event.target.closest('.btn-edit-product');
                if (editBtn) {
                    editProduct(editBtn.dataset.productId);
                    return;
                }

                const deleteBtn = event.target.closest('.btn-delete-product');
                if (deleteBtn) {
                    deleteProduct(deleteBtn.dataset.productId);
                    return;
                }

                const featuredBtn = event.target.closest('.btn-pharmacy-merchant-featured');
                if (featuredBtn) {
                    window.pharmacyControlToggleFeaturedMerchantProduct?.(
                        featuredBtn.dataset.productId,
                        featuredBtn.dataset.subId || '',
                        featuredBtn.querySelector('.portfolio-feature-crown')
                    )?.then(() => {
                        renderProducts(state.products);
                        renderFeaturedProducts();
                    });
                }
            });
        }

        const featuredContainer = document.getElementById('pharmacy-featured-products-container');
        if (featuredContainer && featuredContainer.dataset.bound !== 'true') {
            featuredContainer.dataset.bound = 'true';
            featuredContainer.addEventListener('click', event => {
                const removeBtn = event.target.closest('.btn-featured-remove');
                if (!removeBtn) return;

                const done = () => {
                    renderProducts(state.products);
                    renderFeaturedProducts();
                };

                if (removeBtn.dataset.featuredType === 'merchant') {
                    window.pharmacyControlToggleFeaturedMerchantProduct?.(
                        removeBtn.dataset.featuredId,
                        removeBtn.dataset.featuredSubId || '',
                        removeBtn.querySelector('.portfolio-feature-crown')
                    )?.then(done);
                    return;
                }

                window.pharmacyControlToggleFeaturedCatalogProduct?.(
                    removeBtn.dataset.featuredId,
                    removeBtn.dataset.featuredSubId || '',
                    removeBtn.querySelector('.portfolio-feature-crown')
                )?.then(done);
            });
        }
    }

    let featuredChangeDebounceTimer = null;
    window.addEventListener('pharmacy-featured-items-changed', (event) => {
        const source = event?.detail?.source || 'unknown';
        console.log(`[Pharmacy-Products-UI] Featured items changed event received (Source: ${source}). Scheduling re-render...`);

        if (featuredChangeDebounceTimer) clearTimeout(featuredChangeDebounceTimer);

        featuredChangeDebounceTimer = setTimeout(() => {
            console.log('[Pharmacy-Products-UI] Executing debounced re-render for featured items update.');
            renderProducts(state.products);
            renderFeaturedProducts();
            featuredChangeDebounceTimer = null;
        }, 100);
    });

    bindEvents();

    return {
        deleteProduct,
        editProduct,
        loadProducts,
        renderFeaturedProducts
    };
})();
