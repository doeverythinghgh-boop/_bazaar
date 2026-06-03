/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */
/**
 * @file pages/merchant-control-panel/js/control-panel-actions.js
 * @description Product management actions for the merchant control panel.
 */

(function () {
    'use strict';

    const state = () => window.MerchantControlPanelState;
    const api = () => window.MerchantControlPanelAPI;
    const render = () => window.MerchantControlPanelRender;
    const log = (...args) => console.log('[MerchantControlPanel]', ...args);
    const error = (...args) => console.error('[MerchantControlPanel]', ...args);

    function normalizeProductId(product) {
        return String(product?.product_key || product?.id || '');
    }

    function getSwalText(key, fallback) {
        return (typeof window.langu === 'function' ? window.langu(key) : null) || fallback;
    }

    async function loadCategoryProducts({ reset = false, prefetchedPromise = null } = {}) {
        if (state().listingType === 'cars') {
            await loadCarListings({ reset, prefetchedPromise });
            return;
        }
        if (state().listingType === 'real_estate') {
            await loadRealEstateListings({ reset, prefetchedPromise });
            return;
        }
        if (!state().selectedMainId) return;
        log(reset ? 'Fetching first category batch.' : 'Fetching next category batch.');
        state().mode = 'category';
        state().featuredOnly = false;
        document.getElementById('mcp-featured-filter-btn')?.classList.remove('is-active');
        const checkbox = document.getElementById('mcp-featured-filter-checkbox');
        if (checkbox) checkbox.checked = false;

        if (reset) {
            const cached = state().loadCache(state().selectedMainId, state().selectedSubId, state().mode, state().merchant.user_key);
            if (cached && (cached.products.length > 0 || !state().selectedSubId)) {
                log('Restoring products from cache.');
                state().products = cached.products;
                state().offset = cached.offset;
                state().hasMore = cached.hasMore;
                render().renderProducts(cached.products, { append: false });
                render().syncLoadMore();
                return;
            }
            state().offset = 0;
            state().products = [];
            state().hasMore = false;
            const grid = document.getElementById('mcp-products-grid');
            if (grid) grid.innerHTML = '';
        }

        render().setLoading(true);
        try {
            let batch = null;
            if (prefetchedPromise && reset) {
                batch = await prefetchedPromise;
            }
            if (!batch) {
                batch = await api().fetchProductsBatch({
                    userKey: state().merchant.user_key,
                    mainId: state().selectedMainId,
                    subId: state().selectedSubId,
                    offset: state().offset,
                    limit: state().limit
                });
            }
            state().products = reset ? batch.slice() : state().products.concat(batch);
            state().offset += batch.length;
            state().hasMore = batch.length === state().limit;
            render().renderProducts(batch, { append: !reset });
            state().saveCache();
        } catch (loadError) {
            error('Failed to load products batch.', loadError);
            render().setStatus('تعذر تحميل الخدمات حالياً', 'error', 'fas fa-triangle-exclamation');
        } finally {
            render().setLoading(false);
            render().syncLoadMore();
        }
    }

    async function loadCarListings({ reset = false, prefetchedPromise = null } = {}) {
        log(reset ? 'Fetching first car listings batch.' : 'Fetching next car listings batch.');
        state().mode = 'category';
        state().featuredOnly = false;
        document.getElementById('mcp-featured-filter-btn')?.classList.remove('is-active');
        const checkbox = document.getElementById('mcp-featured-filter-checkbox');
        if (checkbox) checkbox.checked = false;

        if (reset) {
            const cached = state().loadCache(state().selectedMainId, state().selectedSubId, state().mode, state().merchant.user_key);
            if (cached && (cached.products.length > 0 || !state().selectedSubId)) {
                log('Restoring products from cache.');
                state().products = cached.products;
                state().offset = cached.offset;
                state().hasMore = cached.hasMore;
                render().renderProducts(cached.products, { append: false });
                render().syncLoadMore();
                return;
            }
            state().offset = 0;
            state().products = [];
            state().hasMore = false;
            const grid = document.getElementById('mcp-products-grid');
            if (grid) grid.innerHTML = '';
        }

        render().setLoading(true);
        try {
            let batch = null;
            if (prefetchedPromise && reset) {
                batch = await prefetchedPromise;
            }
            if (!batch) {
                batch = await api().fetchCarsBatch({
                    userKey: state().merchant.user_key,
                    offset: state().offset,
                    limit: state().limit
                });
            }

            // Self-healing: If cars return nothing (though cars don't strictly use subId in fetchCarsBatch yet,
            // we keep it consistent with RE for future-proofing or if the API changes).
            if (reset && batch.length === 0 && state().selectedSubId) {
                log(`No cars found for sub-category ${state().selectedSubId}. Attempting fallback fetch.`);
                const fallbackBatch = await api().fetchCarsBatch({
                    userKey: state().merchant.user_key,
                    offset: 0,
                    limit: state().limit
                });
                if (fallbackBatch.length > 0) {
                    batch = fallbackBatch;
                    state().selectedSubId = '';
                }
            }

            state().products = reset ? batch.slice() : state().products.concat(batch);
            state().offset += batch.length;
            state().hasMore = batch.length === state().limit;
            render().renderProducts(batch, { append: !reset });
            state().saveCache();
        } catch (loadError) {
            error('Failed to load car listings batch.', loadError);
            render().setStatus('تعذر تحميل إعلانات السيارات حالياً', 'error', 'fas fa-triangle-exclamation');
        } finally {
            render().setLoading(false);
            render().syncLoadMore();
        }
    }

    async function loadRealEstateListings({ reset = false, prefetchedPromise = null } = {}) {
        log(reset ? 'Fetching first real estate listings batch.' : 'Fetching next real estate listings batch.');
        state().mode = 'category';
        state().featuredOnly = false;
        document.getElementById('mcp-featured-filter-btn')?.classList.remove('is-active');
        const checkbox = document.getElementById('mcp-featured-filter-checkbox');
        if (checkbox) checkbox.checked = false;

        if (reset) {
            const cached = state().loadCache(state().selectedMainId, state().selectedSubId, state().mode, state().merchant.user_key);
            if (cached && (cached.products.length > 0 || !state().selectedSubId)) {
                log('Restoring products from cache.');
                state().products = cached.products;
                state().offset = cached.offset;
                state().hasMore = cached.hasMore;
                render().renderProducts(cached.products, { append: false });
                render().syncLoadMore();
                return;
            }
            state().offset = 0;
            state().products = [];
            state().hasMore = false;
            const grid = document.getElementById('mcp-products-grid');
            if (grid) grid.innerHTML = '';
        }

        render().setLoading(true);
        try {
            let batch = null;
            if (prefetchedPromise && reset) {
                batch = await prefetchedPromise;
            }
            if (!batch) {
                batch = await api().fetchRealEstateBatch({
                    userKey: state().merchant.user_key,
                    subCategoryId: state().selectedSubId,
                    offset: state().offset,
                    limit: state().limit
                });
            }

            // Self-healing: If sub-category returned nothing but we are in reset mode,
            // try fetching ALL listings for this merchant to catch orphaned items.
            if (reset && (!batch || batch.length === 0) && state().selectedSubId) {
                log(`No listings found for sub-category ${state().selectedSubId}. Attempting fallback fetch for all merchant listings.`);
                const fallbackBatch = await api().fetchRealEstateBatch({
                    userKey: state().merchant.user_key,
                    subCategoryId: '', // Fetch all
                    offset: 0,
                    limit: state().limit
                });
                if (Array.isArray(fallbackBatch) && fallbackBatch.length > 0) {
                    log(`Found ${fallbackBatch.length} orphaned listings. Updating view to 'All'.`);
                    batch = fallbackBatch;
                    state().selectedSubId = ''; // Unlock to show all
                }
            }

            state().products = reset ? batch.slice() : state().products.concat(batch);
            state().offset += batch.length;
            state().hasMore = batch.length === state().limit;
            render().renderProducts(batch, { append: !reset });
            state().saveCache();
        } catch (loadError) {
            error('Failed to load real estate listings batch.', loadError);
            render().setStatus('تعذر تحميل إعلانات العقارات حالياً', 'error', 'fas fa-triangle-exclamation');
        } finally {
            render().setLoading(false);
            render().syncLoadMore();
        }
    }

    async function loadFeaturedProducts() {
        if (state().listingType === 'cars') {
            await loadFeaturedCars();
            return;
        }
        if (state().listingType === 'real_estate') {
            await loadFeaturedRealEstate();
            return;
        }
        log('Featured filter requested. Ignoring selected categories.');
        state().mode = 'featured';
        state().featuredOnly = true;
        state().hasMore = false;
        state().offset = 0;
        const button = document.getElementById('mcp-featured-filter-btn');
        if (button) {
            button.classList.add('is-active');
            log('Filter button visual state: ACTIVE');
        }
        const checkbox = document.getElementById('mcp-featured-filter-checkbox');
        if (checkbox) checkbox.checked = true;
        const grid = document.getElementById('mcp-products-grid');
        if (grid) grid.innerHTML = '';

        render().setLoading(true);
        try {
            const products = await api().fetchFeaturedProducts(Array.from(state().featuredIds));
            const ownedProducts = products.filter((product) => {
                if (String(product.user_key || '') !== String(state().merchant.user_key || '')) return false;
                if (state().lockedCategoryFromUrl && state().selectedMainId && String(product.MainCategory || '') !== String(state().selectedMainId)) return false;
                if (state().lockedCategoryFromUrl && state().selectedSubId && String(product.SubCategory || '') !== String(state().selectedSubId)) return false;
                return true;
            });
            state().products = ownedProducts;
            render().renderProducts(ownedProducts, { append: false });
            state().saveCache();
        } catch (featuredError) {
            error('Failed to load featured products.', featuredError);
            render().setStatus('تعذر تحميل الخدمات المميزة', 'error', 'fas fa-triangle-exclamation');
        } finally {
            render().setLoading(false);
            render().syncLoadMore();
        }
    }

    async function loadFeaturedCars() {
        log('Featured car filter requested.');
        state().mode = 'featured';
        state().featuredOnly = true;
        state().hasMore = false;
        state().offset = 0;
        document.getElementById('mcp-featured-filter-btn')?.classList.add('is-active');
        const checkbox = document.getElementById('mcp-featured-filter-checkbox');
        if (checkbox) checkbox.checked = true;
        const grid = document.getElementById('mcp-products-grid');
        if (grid) grid.innerHTML = '';

        render().setLoading(true);
        try {
            const cars = await api().fetchCarsBatch({
                userKey: state().merchant.user_key,
                offset: 0,
                limit: 100,
                featured: true
            });
            state().products = cars;
            render().renderProducts(cars, { append: false });
            state().saveCache();
        } catch (featuredError) {
            error('Failed to load featured car listings.', featuredError);
            render().setStatus('تعذر تحميل السيارات المميزة', 'error', 'fas fa-triangle-exclamation');
        } finally {
            render().setLoading(false);
            render().syncLoadMore();
        }
    }

    async function loadFeaturedRealEstate() {
        log('Featured real estate filter requested.');
        state().mode = 'featured';
        state().featuredOnly = true;
        state().hasMore = false;
        state().offset = 0;
        document.getElementById('mcp-featured-filter-btn')?.classList.add('is-active');
        const checkbox = document.getElementById('mcp-featured-filter-checkbox');
        if (checkbox) checkbox.checked = true;
        const grid = document.getElementById('mcp-products-grid');
        if (grid) grid.innerHTML = '';

        render().setLoading(true);
        try {
            const listings = await api().fetchRealEstateBatch({
                userKey: state().merchant.user_key,
                offset: 0,
                limit: 100,
                featured: true,
                subCategoryId: state().selectedSubId || null
            });
            state().products = listings;
            render().renderProducts(listings, { append: false });
            state().saveCache();
        } catch (featuredError) {
            error('Failed to load featured real estate listings.', featuredError);
            render().setStatus('تعذر تحميل العقارات المميزة', 'error', 'fas fa-triangle-exclamation');
        } finally {
            render().setLoading(false);
            render().syncLoadMore();
        }
    }

    async function toggleFeaturedFilter(isEnabled) {
        log('Featured checkbox changed event triggered.', { isEnabled });
        if (isEnabled) {
            await loadFeaturedProducts();
            return;
        }

        state().featuredOnly = false;
        state().mode = 'category';
        document.getElementById('mcp-featured-filter-btn')?.classList.remove('is-active');
        const grid = document.getElementById('mcp-products-grid');
        if (grid) grid.innerHTML = '';

        if (state().listingType === 'cars') {
            await loadCarListings({ reset: true });
            return;
        }

        if (state().listingType === 'real_estate') {
            await loadRealEstateListings({ reset: true });
            return;
        }

        const subSelect = document.getElementById('mcp-sub-category-select');
        const categorySelectionReady = state().lockedCategoryFromUrl || (!!state().selectedMainId && (!subSelect || subSelect.disabled || !!state().selectedSubId));

        log('Featured filter OFF. Re-syncing with category view.', {
            locked: state().lockedCategoryFromUrl,
            selectionReady: categorySelectionReady
        });

        if (categorySelectionReady) {
            await loadCategoryProducts({ reset: true });
        } else {
            state().products = [];
            state().offset = 0;
            state().hasMore = false;
            render().setStatus('اختر فئة لعرض الخدمات من القائمة', 'muted', 'fas fa-layer-group');
            render().syncLoadMore();
        }
    }

    function addProduct() {
        log('Routing to add product page.');
        if (state().listingType === 'cars') {
            window.location.href = window.ProductRoutes?.buildProductAddUrl
                ? window.ProductRoutes.buildProductAddUrl({ providerKey: state().merchant.user_key, listingType: 'car' })
                : `/pages/products/productAdd/productAdd.html?provider_key=${encodeURIComponent(state().merchant.user_key)}&listing=car&MainCategory=7&SubCategory=1`;
            return;
        }
        if (state().listingType === 'real_estate') {
            window.location.href = window.ProductRoutes?.buildProductAddUrl
                ? window.ProductRoutes.buildProductAddUrl({ providerKey: state().merchant.user_key, listingType: 'real_estate', SubCategory: state().selectedSubId || '' })
                : `/pages/products/productAdd/productAdd.html?provider_key=${encodeURIComponent(state().merchant.user_key)}&listing=real_estate&MainCategory=16${state().selectedSubId ? `&SubCategory=${encodeURIComponent(String(state().selectedSubId))}` : ''}`;
            return;
        }
        const lockedFilter = state().selectedMainId
            ? { [String(state().selectedMainId)]: state().selectedSubId ? [String(state().selectedSubId)] : [] }
            : null;
        const filter = lockedFilter || (window.ProductCategoryScope?.normalizeFilterMap
            ? window.ProductCategoryScope.normalizeFilterMap(state().merchant?.business_category)
            : state().merchant?.business_category);
        if (typeof ProductStateManager !== 'undefined') {
            ProductStateManager.setSelectedCategories(state().selectedMainId || null, state().selectedSubId || null);
            ProductStateManager.setFormScopeFilter(filter);
        }
        window.location.href = window.ProductRoutes?.buildProductAddUrl
            ? window.ProductRoutes.buildProductAddUrl({ providerKey: state().merchant.user_key, MainCategory: state().selectedMainId || '', SubCategory: state().selectedSubId || '' })
            : `/pages/products/productAdd/productAdd.html?provider_key=${encodeURIComponent(state().merchant.user_key)}`;
    }

    function editProduct(product) {
        log('Editing product.', { productKey: normalizeProductId(product) });
        if (state().listingType === 'cars' || product?.item_type === 'car' || product?.is_car_listing) {
            const carKey = product.car_key || product.product_key || product.id;
            window.location.href = window.ProductRoutes?.buildProductEditUrl
                ? window.ProductRoutes.buildProductEditUrl(product, { productKey: carKey, providerKey: state().merchant.user_key, listingType: 'car' })
                : `/pages/products/productEdit/productEdit.html?product_key=${encodeURIComponent(carKey)}&provider_key=${encodeURIComponent(state().merchant.user_key)}&listing=car`;
            return;
        }
        if (state().listingType === 'real_estate' || product?.item_type === 'real_estate' || product?.is_real_estate_listing) {
            const reKey = product.real_estate_key || product.product_key || product.id;
            window.location.href = window.ProductRoutes?.buildProductEditUrl
                ? window.ProductRoutes.buildProductEditUrl(product, { productKey: reKey, providerKey: state().merchant.user_key, listingType: 'real_estate' })
                : `/pages/products/productEdit/productEdit.html?product_key=${encodeURIComponent(reKey)}&provider_key=${encodeURIComponent(state().merchant.user_key)}&listing=real_estate`;
            return;
        }
        if (typeof ProductStateManager !== 'undefined') {
            ProductStateManager.setSelectedCategories(product.MainCategory || null, product.SubCategory || null);
            ProductStateManager.setFormScopeFilter(
                window.ProductCategoryScope?.normalizeFilterMap
                    ? window.ProductCategoryScope.normalizeFilterMap(state().merchant?.business_category)
                    : state().merchant?.business_category
            );
        }
        if (typeof loadProductForm === 'function') {
            loadProductForm({ editMode: true, productData: product });
        }
    }

    async function deleteProduct(product) {
        const productId = normalizeProductId(product);
        log('Delete confirmation requested.', { productKey: productId });
        if (typeof Swal === 'undefined') return;

        const result = await Swal.fire({
            title: getSwalText('gen_swal_title_confirm', 'هل أنت متأكد؟'),
            text: getSwalText('port_delete_confirm_text', 'سيتم حذف {name} نهائياً').replace('{name}', product.productName || ''),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: getSwalText('gen_swal_btn_yes_delete', 'نعم، احذف'),
            cancelButtonText: getSwalText('gen_swal_btn_cancel', 'إلغاء'),
            buttonsStyling: false,
            customClass: {
                popup: 'swal-modern-mini-popup',
                confirmButton: 'swal-modern-mini-confirm',
                cancelButton: 'swal-modern-mini-cancel'
            },
            showLoaderOnConfirm: true,
            preConfirm: async () => {
                try {
                    if (state().listingType === 'cars' || product?.item_type === 'car' || product?.is_car_listing) {
                        if (product.ImageName && typeof window.deleteFile2cf === 'function') {
                            const images = product.ImageName.split(',').map((item) => item.trim()).filter(Boolean);
                            await Promise.all(images.map((image) => window.deleteFile2cf(image)));
                        }
                        await api().deleteCar(product.car_key || product.product_key || productId);
                        return true;
                    }

                    if (state().listingType === 'real_estate' || product?.item_type === 'real_estate' || product?.is_real_estate_listing) {
                        if (product.ImageName && typeof window.deleteFile2cf === 'function') {
                            const images = product.ImageName.split(',').map((item) => item.trim()).filter(Boolean);
                            await Promise.all(images.map((image) => window.deleteFile2cf(image)));
                        }
                        await api().deleteRealEstate(product.real_estate_key || product.product_key || productId);
                        return true;
                    }

                    if (product.ImageName && typeof window.deleteFile2cf === 'function') {
                        const images = product.ImageName.split(',').map((item) => item.trim()).filter(Boolean);
                        await Promise.all(images.map((image) => window.deleteFile2cf(image)));
                    }
                    if (typeof deleteProduct_ !== 'function') throw new Error('deleteProduct_ function not found');
                    const dbResult = await deleteProduct_(product.product_key);
                    if (dbResult?.error) throw new Error(dbResult.error);
                    return true;
                } catch (deleteError) {
                    error('Product deletion failed.', deleteError);
                    Swal.showValidationMessage(getSwalText('port_delete_error', 'خطأ أثناء الحذف: {msg}').replace('{msg}', deleteError.message));
                    return false;
                }
            }
        });

        if (!result.isConfirmed) return;

        state().products = state().products.filter((item) => normalizeProductId(item) !== productId);
        if (state().listingType === 'cars') {
            render().renderProducts(state().products, { append: false });
            Swal.fire({
                title: getSwalText('port_delete_success_title', 'تم الحذف!'),
                text: 'تم حذف إعلان السيارة بنجاح.',
                icon: 'success',
                timer: 1800,
                showConfirmButton: false,
                customClass: { popup: 'swal-modern-mini-popup' }
            });
            log('Car listing deleted successfully.', { carKey: productId });
            return;
        }
        if (state().listingType === 'real_estate') {
            render().renderProducts(state().products, { append: false });
            Swal.fire({
                title: getSwalText('port_delete_success_title', 'تم الحذف!'),
                text: 'تم حذف إعلان العقار بنجاح.',
                icon: 'success',
                timer: 1800,
                showConfirmButton: false,
                customClass: { popup: 'swal-modern-mini-popup' }
            });
            log('Real estate listing deleted successfully.', { realEstateKey: productId });
            return;
        }
        state().featuredIds.delete(productId);
        if (product?.id != null) state().featuredIds.delete(String(product.id));
        if (typeof window.sharedProductCleanup === 'function') {
            window.sharedProductCleanup(product.product_key || productId, state().merchant.user_key);
        }
        render().renderProducts(state().products, { append: false });
        api().updateFeaturedIds(state().merchant.user_key, Array.from(state().featuredIds)).catch((cleanupError) => {
            error('Failed to cleanup featured IDs after deletion.', cleanupError);
        });
        Swal.fire({
            title: getSwalText('port_delete_success_title', 'تم الحذف!'),
            text: getSwalText('port_delete_success_text', 'تم حذف المنتج بنجاح.'),
            icon: 'success',
            timer: 1800,
            showConfirmButton: false,
            customClass: { popup: 'swal-modern-mini-popup' }
        });
        log('Product deleted successfully.', { productKey: productId });
    }

    async function toggleFeatured(product, button) {
        const productId = normalizeProductId(product);
        const productDbId = product?.id != null ? String(product.id) : '';
        const shouldAdd = !(state().featuredIds.has(productId) || (productDbId && state().featuredIds.has(productDbId)));
        log('Featured toggle confirmation requested.', { productKey: productId, shouldAdd });
        if (typeof Swal === 'undefined') return;

        const result = await Swal.fire({
            title: getSwalText('gen_swal_title_confirm', 'هل أنت متأكد؟'),
            text: shouldAdd
                ? getSwalText('port_featured_add_confirm', 'هل تريد إضافة هذا المنتج إلى المميزة؟')
                : getSwalText('port_featured_remove_confirm', 'هل تريد إزالة هذا المنتج من المميزة؟'),
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: getSwalText('alert_confirm_btn', 'تأكيد'),
            cancelButtonText: getSwalText('alert_cancel_btn', 'إلغاء'),
            customClass: {
                popup: 'swal-modern-mini-popup',
                title: 'swal-modern-mini-title',
                htmlContainer: 'swal-modern-mini-text',
                confirmButton: 'swal-modern-mini-confirm',
                cancelButton: 'swal-modern-mini-cancel'
            }
        });

        if (!result.isConfirmed) return;

        if (state().listingType === 'cars' || product?.item_type === 'car' || product?.is_car_listing) {
            try {
                await api().setCarFeatured(product.car_key || product.product_key || productId, shouldAdd);
                product.is_featured = shouldAdd ? 1 : 0;
                button?.classList.toggle('is-active', shouldAdd);
                log('Car featured state updated successfully.', { carKey: productId, isFeatured: shouldAdd });
            } catch (featuredError) {
                error('Failed to update car featured state.', featuredError);
                Swal.fire(getSwalText('port_rate_error_title', 'خطأ'), featuredError.message, 'error');
            }
            return;
        }

        if (state().listingType === 'real_estate' || product?.item_type === 'real_estate' || product?.is_real_estate_listing) {
            try {
                await api().setRealEstateFeatured(product.real_estate_key || product.product_key || productId, shouldAdd);
                product.is_featured = shouldAdd ? 1 : 0;
                button?.classList.toggle('is-active', shouldAdd);
                log('Real estate featured state updated successfully.', { realEstateKey: productId, isFeatured: shouldAdd });
            } catch (featuredError) {
                error('Failed to update real estate featured state.', featuredError);
                Swal.fire(getSwalText('port_rate_error_title', 'خطأ'), featuredError.message, 'error');
            }
            return;
        }

        if (shouldAdd) {
            state().featuredIds.add(productId);
        } else {
            state().featuredIds.delete(productId);
            if (productDbId) state().featuredIds.delete(productDbId);
        }

        try {
            await api().updateFeaturedIds(state().merchant.user_key, Array.from(state().featuredIds));
            button?.classList.toggle('is-active', shouldAdd);
            log('Featured state updated successfully.', { productKey: productId, isFeatured: shouldAdd });
        } catch (featuredError) {
            if (shouldAdd) {
                state().featuredIds.delete(productId);
            } else {
                state().featuredIds.add(productId);
                if (productDbId) state().featuredIds.add(productDbId);
            }
            error('Failed to update featured state.', featuredError);
            Swal.fire(getSwalText('port_rate_error_title', 'خطأ'), featuredError.message, 'error');
        }
    }

    window.MerchantControlPanelActions = {
        loadCategoryProducts,
        loadFeaturedProducts,
        toggleFeaturedFilter,
        addProduct,
        editProduct,
        deleteProduct,
        toggleFeatured
    };
})();
