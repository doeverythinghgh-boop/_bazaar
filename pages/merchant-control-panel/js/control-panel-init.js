/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */
/**
 * @file pages/merchant-control-panel/js/control-panel-init.js
 * @description Runtime bootstrap for the merchant control panel.
 */

(function () {
    'use strict';

    const state = () => window.MerchantControlPanelState;
    const api = () => window.MerchantControlPanelAPI;
    const render = () => window.MerchantControlPanelRender;
    const actions = () => window.MerchantControlPanelActions;
    const log = (...args) => console.log('[MerchantControlPanel]', ...args);
    const error = (...args) => console.error('[MerchantControlPanel]', ...args);

    function isPharmacyUser(user) {
        const profile = typeof window.buildBusinessSpecialtyProfile === 'function'
            ? window.buildBusinessSpecialtyProfile(user)
            : null;
        return !!(
            profile?.entries?.some((entry) => String(entry.subId) === '204') ||
            (typeof user?.business_category === 'string' && user.business_category.includes('"204"'))
        );
    }

    function isPrimaryCarSalesUser(user) {
        const profile = typeof window.buildBusinessSpecialtyProfile === 'function'
            ? window.buildBusinessSpecialtyProfile(user)
            : null;
        const firstEntry = profile?.entries?.[0] || null;
        return String(firstEntry?.mainId || '') === '7' && String(firstEntry?.subId || '') === '1';
    }

    function isPrimaryRealEstateSalesUser(user) {
        const profile = typeof window.buildBusinessSpecialtyProfile === 'function'
            ? window.buildBusinessSpecialtyProfile(user)
            : null;
        const firstEntry = profile?.entries?.[0] || null;
        return String(firstEntry?.mainId || '') === '16';
    }

    /**
     * Resolves a human-readable label for a main+sub category pair from appCategoriesList.
     * @returns {{ main: string, sub: string } | null}
     */
    function _resolveCategoryLabel(mainId, subId) {
        const data = window.appCategoriesList;
        const categories = Array.isArray(data?.categories) ? data.categories : [];
        if (!categories.length || !mainId) return null;
        const lang = window.app_language || 'ar';
        const resolve = (t) => (typeof t === 'object' ? (t[lang] || t.ar || Object.values(t)[0] || '') : (t || ''));
        const mainCat = categories.find((c) => String(c.id) === String(mainId));
        if (!mainCat) return null;
        const mainLabel = resolve(mainCat.title);
        if (subId) {
            const subCat = (mainCat.subcategories || []).find((s) => String(s.id) === String(subId));
            if (subCat) return { main: mainLabel, sub: resolve(subCat.title) };
        }
        return { main: mainLabel, sub: '' };
    }

    /**
     * Updates #merchant-control-header text elements to reflect the active specialty.
     */
    function _applyHeaderForCategory(mainId, subId) {
        const label = _resolveCategoryLabel(mainId, subId);
        if (!label) return;
        const displayName = label.sub || label.main;
        if (!displayName) return;
        const titleEl = document.getElementById('merchant-control-title');
        if (titleEl) titleEl.textContent = `إدارة ${displayName}`;
        // Use the main category name as the kicker when a sub-category drives the title
        const kickerEl = document.getElementById('merchant-control-kicker');
        if (kickerEl && label.sub && label.main) kickerEl.textContent = label.main;
        log('Header updated for category:', { mainId, subId, displayName });
    }

    function readRequestedCategory() {
        const params = new URLSearchParams(window.location.search);
        return {
            mainId: String(params.get('MainCategory') || '').trim(),
            subId: String(params.get('SubCategory') || '').trim()
        };
    }

    function buildRequestedFilter(mainId, subId) {
        if (!mainId) return null;
        return { [String(mainId)]: subId ? [String(subId)] : [] };
    }

    function hasManagementPermission(merchant, currentUser) {
        const capabilities = typeof window.resolveUserCapabilities === 'function'
            ? window.resolveUserCapabilities(currentUser)
            : null;
        return !!(currentUser && (String(currentUser.user_key) === String(merchant.user_key) || capabilities?.isAdmin));
    }

    async function init() {
        log('Initializing page.');
        if (typeof initAppTheme === 'function') initAppTheme();
        if (typeof SessionManager !== 'undefined' && SessionManager.init) SessionManager.init();

        const userKey = api().getUserKeyFromUrl();
        if (!userKey) {
            render().setStatus('رابط لوحة التحكم غير مكتمل', 'error', 'fas fa-triangle-exclamation');
            return;
        }

        state().currentUser = typeof SessionManager !== 'undefined' ? SessionManager.getUser() : window.userSession;
        const requestedCategory = readRequestedCategory();
        const hasRequestedCategory = !!requestedCategory.mainId;

        let activeCategory = { ...requestedCategory };
        let hasActiveCategory = hasRequestedCategory;
        let restoredFromCache = false;

        const lastVisited = state().getLastVisitedCategory(userKey);
        if (!hasRequestedCategory && lastVisited && lastVisited.mainId) {
            activeCategory = { mainId: lastVisited.mainId, subId: lastVisited.subId };
            hasActiveCategory = true;
            restoredFromCache = true;
            state().mode = lastVisited.mode || 'category';
            state().featuredOnly = lastVisited.featuredOnly || false;
            state().listingType = lastVisited.listingType || 'products';
            log('Restored last visited category from cache', activeCategory);
        }

        state().prefetchedProductsPromise = null;

        const cacheMode = state().mode || 'category';
        const hasCache = !!state().loadCache(activeCategory.mainId, activeCategory.subId, cacheMode, userKey);

        if (hasActiveCategory && String(activeCategory.subId) !== '204' && !hasCache) {
            const fetchOpts = { userKey, offset: 0, limit: state().limit || 5 };
            if (String(activeCategory.mainId) === '7') {
                state().prefetchedProductsPromise = api().fetchCarsBatch(fetchOpts).catch(e => { error('Prefetch cars failed', e); return null; });
            } else if (String(activeCategory.mainId) === '16') {
                fetchOpts.subCategoryId = activeCategory.subId || null;
                state().prefetchedProductsPromise = api().fetchRealEstateBatch(fetchOpts).catch(e => { error('Prefetch real estate failed', e); return null; });
            } else {
                fetchOpts.mainId = activeCategory.mainId;
                fetchOpts.subId = activeCategory.subId;
                state().prefetchedProductsPromise = api().fetchProductsBatch(fetchOpts).catch(e => { error('Prefetch products failed', e); return null; });
            }
        }

        const initTasks = [
            api().fetchMerchant(userKey).then(m => { state().merchant = m; }),
            (async () => {
                if (typeof window.loadIndexTranslations === 'function') await window.loadIndexTranslations();
                if (typeof AppHeader !== 'undefined' && AppHeader.init) await AppHeader.init('header-injection-point', '');
            })()
        ];
        if (typeof fetchAppCategories === 'function') initTasks.push(fetchAppCategories());

        await Promise.all(initTasks);

        if (!state().merchant) {
            render().setStatus('لم يتم العثور على بيانات التاجر', 'error', 'fas fa-triangle-exclamation');
            return;
        }

        if (!hasManagementPermission(state().merchant, state().currentUser)) {
            render().setStatus('لا تملك صلاحية إدارة خدمات هذا المتجر', 'error', 'fas fa-lock');
            return;
        }

        if ((!hasRequestedCategory && isPharmacyUser(state().merchant)) || String(activeCategory.subId) === '204') {
            log('Pharmacy merchant detected. Redirecting to pharmacy control panel.');
            window.location.replace('/pages/merchant-portfolio/pharmacy-control-panel.html?user_key=' + encodeURIComponent(state().merchant.user_key));
            return;
        }

        // Fallback: If no category was explicitly requested or cached, pick the first one from profile
        if (!hasActiveCategory) {
            const profile = state().merchant?.portfolio_view_model?.profile;
            if (profile && profile.entries && profile.entries.length > 0) {
                const first = profile.entries[0];
                activeCategory.mainId = String(first.mainId);
                activeCategory.subId = String(first.subId);
                hasActiveCategory = true;
            }
        }

        const isCarCategoryRequest = hasActiveCategory && String(activeCategory.mainId) === '7';
        if (isCarCategoryRequest || (!hasActiveCategory && isPrimaryCarSalesUser(state().merchant))) {
            log('Primary car sales merchant detected. Enabling car listing mode.');
            state().listingType = 'cars';
            state().selectedMainId = '7';
            state().selectedSubId = activeCategory.subId || '1';
            state().lockedCategoryFromUrl = true;
            document.getElementById('merchant-control-title').textContent = 'إدارة إعلانات السيارات';
            document.getElementById('merchant-control-subtitle').textContent = 'أضف وعدل إعلانات السيارات الخاصة بهذا مقدم الخدمة.';
            const addLabel = document.querySelector('#mcp-add-product-btn span');
            if (addLabel) addLabel.textContent = 'إضافة سيارة';
            bindActions();
            await actions().loadCategoryProducts({ reset: true, prefetchedPromise: state().prefetchedProductsPromise });
            log('Car listing mode initialized successfully.');
            return;
        }

        const isRealEstateCategoryRequest = hasActiveCategory && String(activeCategory.mainId) === '16';
        if (isRealEstateCategoryRequest || (!hasActiveCategory && isPrimaryRealEstateSalesUser(state().merchant))) {
            log('Primary real estate sales merchant detected. Enabling real estate listing mode.');
            state().listingType = 'real_estate';
            state().selectedMainId = '16';
            state().selectedSubId = activeCategory.subId || '';
            state().lockedCategoryFromUrl = true;
            document.getElementById('merchant-control-title').textContent = 'إدارة إعلانات العقارات';
            document.getElementById('merchant-control-subtitle').textContent = 'أضف وعدل إعلانات العقارات الخاصة بهذا مقدم الخدمة.';
            const addLabel = document.querySelector('#mcp-add-product-btn span');
            if (addLabel) addLabel.textContent = 'إضافة عقار';
            bindActions();
            await actions().loadCategoryProducts({ reset: true, prefetchedPromise: state().prefetchedProductsPromise });
            log('Real estate listing mode initialized successfully.');
            return;
        }

        state().featuredIds = api().parseFeaturedIds(state().merchant);

        if (hasActiveCategory) {
            state().selectedMainId = activeCategory.mainId;
            state().selectedSubId = activeCategory.subId;
            state().lockedCategoryFromUrl = true; // Always lock since we don't have a selector anymore
            document.getElementById('merchant-control-subtitle').textContent = 'تتم إدارة خدمات التخصص المحدد من صفحة المتجر.';
            // Update header title/kicker to reflect the actual specialty name from URL params
            _applyHeaderForCategory(activeCategory.mainId, activeCategory.subId);
            // Update add button label for medical services specialty (MainCategory=20, SubCategory=302)
            if (String(activeCategory.mainId) === '20' && String(activeCategory.subId) === '302') {
                const addLabel = document.querySelector('#mcp-add-product-btn span');
                if (addLabel) addLabel.textContent = 'إضافة خدمة';
            }
        }

        if (typeof ProductStateManager !== 'undefined') {
            const requestedFilter = buildRequestedFilter(state().selectedMainId, state().selectedSubId);
            ProductStateManager.setFormScopeFilter(
                requestedFilter || (window.ProductCategoryScope?.normalizeFilterMap
                    ? window.ProductCategoryScope.normalizeFilterMap(state().merchant.business_category)
                    : state().merchant.business_category)
            );
            if (requestedFilter) {
                ProductStateManager.setSelectedCategories(state().selectedMainId, state().selectedSubId || null);
            }
        }

        bindActions();

        await actions().loadCategoryProducts({ reset: true, prefetchedPromise: state().prefetchedProductsPromise });
        log('Page initialized with category load.');

        // Re-sync UI state based on restored cache
        if (restoredFromCache && state().featuredOnly) {
            const btn = document.getElementById('mcp-featured-filter-btn');
            if (btn) btn.classList.add('is-active');
            const checkbox = document.getElementById('mcp-featured-filter-checkbox');
            if (checkbox) checkbox.checked = true;
        }
    }

    function bindActions() {
        document.getElementById('mcp-add-product-btn')?.addEventListener('click', actions().addProduct);
        document.getElementById('mcp-featured-filter-checkbox')?.addEventListener('change', (event) => {
            actions().toggleFeaturedFilter(event.target.checked);
        });
        document.getElementById('mcp-load-more-btn')?.addEventListener('click', () => actions().loadCategoryProducts({ reset: false }));
    }

    document.addEventListener('DOMContentLoaded', () => {
        init().catch((initError) => {
            error('Runtime initialization failed.', initError);
            render().setStatus('حدث خطأ أثناء تشغيل لوحة التحكم', 'error', 'fas fa-triangle-exclamation');
        });
    });
})();
