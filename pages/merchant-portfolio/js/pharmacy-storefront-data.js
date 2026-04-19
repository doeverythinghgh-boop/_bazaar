/**
 * @file pages/merchant-portfolio/js/pharmacy-storefront-data.js
 * @description Shared pharmacy storefront data and cache layer.
 */

(function () {
    const pharmacyState = {
        contextByUser: new Map(),
        jsonCache: new Map(),
        hiddenSub: new Set(),
        hiddenProducts: new Set()
    };

    async function fetchJsonCached(path) {
        const cleanPath = String(path || '').replace(/^\/+/, '');
        if (!cleanPath) return null;

        if (!pharmacyState.jsonCache.has(cleanPath)) {
            pharmacyState.jsonCache.set(cleanPath, fetch(`/${cleanPath}`).then(response => (
                response.ok ? response.json() : null
            )));
        }

        return pharmacyState.jsonCache.get(cleanPath);
    }

    async function loadPharmacyList() {
        if (window.PharmacyAPI?.getCatalogSource) {
            return window.PharmacyAPI.getCatalogSource();
        }
        return [];
    }

    async function loadPharmacyContext(userKey, options = {}) {
        const cacheKey = String(userKey || 'guest_user');
        const forceReload = options.force === true;

        if (!forceReload && pharmacyState.contextByUser.has(cacheKey)) {
            const cached = pharmacyState.contextByUser.get(cacheKey);
            pharmacyState.hiddenSub = new Set(cached.hiddenSubIds || []);
            pharmacyState.hiddenProducts = new Set(cached.hiddenProductIds || []);
            return JSON.parse(JSON.stringify(cached));
        }

        const context = window.PharmacyAPI?.getCatalogContext
            ? await window.PharmacyAPI.getCatalogContext(userKey, { force: forceReload })
            : {
                catalogSource: [],
                customCategories: [],
                preferences: { hidden_main_categories: [], hidden_sub_categories: [], hidden_catalog_products: [] },
                mergedCategories: [],
                hiddenMainIds: [],
                hiddenSubIds: [],
                hiddenProductIds: []
            };

        pharmacyState.contextByUser.set(cacheKey, JSON.parse(JSON.stringify(context)));
        pharmacyState.hiddenSub = new Set(context.hiddenSubIds || []);
        pharmacyState.hiddenProducts = new Set(context.hiddenProductIds || []);

        return JSON.parse(JSON.stringify(context));
    }

    function invalidatePharmacyContext(userKey) {
        const cacheKey = String(userKey || 'guest_user');
        pharmacyState.contextByUser.delete(cacheKey);
        if (window.PharmacyAPI?.invalidateCatalogContext) {
            window.PharmacyAPI.invalidateCatalogContext(cacheKey);
        }
    }

    window.pharmacyStorefrontData = {
        state: pharmacyState,
        fetchJsonCached,
        invalidatePharmacyContext,
        loadPharmacyContext,
        loadPharmacyList
    };
})();
