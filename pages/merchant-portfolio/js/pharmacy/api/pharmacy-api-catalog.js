/**
 * @file pharmacy-api-catalog.js
 * @description Catalog and context management for pharmacy API.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 */

window.PharmacyAPI = window.PharmacyAPI || {};

window.PharmacyAPI.getCatalogSource = async function () {
    try {
        if (window.pharmacyApiCache.catalogSource) {
            return window.pharmacyClone(window.pharmacyApiCache.catalogSource);
        }

        const response = await fetch('/shared/pharmList.json');
        if (!response.ok) throw new Error("Failed to load catalog source");

        window.pharmacyApiCache.catalogSource = await response.json();
        return window.pharmacyClone(window.pharmacyApiCache.catalogSource);
    } catch (error) {
        console.error("PharmacyAPI Error (getCatalogSource):", error);
        return [];
    }
};

window.PharmacyAPI.getProductsBySubCategory = async function (userKey, subCatId) {
    try {
        const endpoint = `/api/pharmacy/sub-category-products?user_key=${encodeURIComponent(userKey)}&sub_id=${encodeURIComponent(subCatId)}`;
        const result = await apiFetch(endpoint);
        if (result && result.error) throw new Error(result.error);
        return window.pharmacyNormalizeListPayload(result);
    } catch (error) {
        console.error("PharmacyAPI Error (getProductsBySubCategory):", error);
        return [];
    }
};

window.PharmacyAPI.getReferenceData = async function () {
    try {
        if (window.pharmacyApiCache.referenceData) {
            return window.pharmacyClone(window.pharmacyApiCache.referenceData);
        }

        const response = await fetch('/shared/pharmList/reference_data.json');
        if (!response.ok) throw new Error("Failed to load pharmacy reference data");

        window.pharmacyApiCache.referenceData = await response.json();
        return window.pharmacyClone(window.pharmacyApiCache.referenceData);
    } catch (error) {
        console.error("PharmacyAPI Error (getReferenceData):", error);
        return {};
    }
};

window.PharmacyAPI.getMergedCategories = function (catalogSource = [], customCategories = []) {
    return window.pharmacyMergeCatalogWithCustomCategories(catalogSource, customCategories);
};

window.PharmacyAPI.getCatalogContext = async function (userKey, options = {}) {
    const contextStart = performance.now();
    const cacheKey = String(userKey || 'guest_user');
    const forceReload = options.force === true;

    if (!forceReload && window.pharmacyApiCache.catalogContexts.has(cacheKey)) {
        console.log(`[Diagnostic] Pharmacy catalog context: CACHE HIT for ${cacheKey}`);
        return window.pharmacyClone(window.pharmacyApiCache.catalogContexts.get(cacheKey));
    }

    console.log(`[Diagnostic] Pharmacy catalog context: CACHE MISS for ${cacheKey}. Fetching parallel components...`);

    const t1 = performance.now();
    const [catalogSource, customCategories, preferences] = await Promise.all([
        this.getCatalogSource().then(r => { console.log(`[Diagnostic] - CatalogSource loaded in ${(performance.now() - t1).toFixed(0)}ms`); return r; }),
        (userKey ? this.getCustomCategories(userKey) : Promise.resolve([])).then(r => { console.log(`[Diagnostic] - CustomCategories loaded in ${(performance.now() - t1).toFixed(0)}ms`); return r; }),
        (userKey ? this.getPreferences(userKey) : Promise.resolve({ hidden_main_categories: [], hidden_sub_categories: [], hidden_catalog_products: [] })).then(r => { console.log(`[Diagnostic] - Preferences loaded in ${(performance.now() - t1).toFixed(0)}ms`); return r; })
    ]);

    const mergeStart = performance.now();
    const mergedCategories = this.getMergedCategories(catalogSource, customCategories);
    const preferenceSets = this.getPreferenceSets(preferences);
    console.log(`[Diagnostic] - Merge and logic processing took ${(performance.now() - mergeStart).toFixed(0)}ms`);

    const context = {
        userKey: cacheKey,
        catalogSource,
        customCategories,
        preferences: window.pharmacyNormalizePreferencePayload(preferences),
        mergedCategories,
        hiddenMainIds: Array.from(preferenceSets.hiddenMain),
        hiddenSubIds: Array.from(preferenceSets.hiddenSub),
        hiddenProductIds: Array.from(preferenceSets.hiddenProducts)
    };

    window.pharmacyApiCache.catalogContexts.set(cacheKey, window.pharmacyClone(context));
    console.log(`[Diagnostic] Pharmacy catalog context: TOTAL generation time: ${(performance.now() - contextStart).toFixed(0)}ms`);
    return window.pharmacyClone(context);
};

window.PharmacyAPI.invalidateCatalogContext = function (userKey) {
    if (!userKey) return;
    window.pharmacyApiCache.catalogContexts.delete(String(userKey));
};

window.PharmacyAPI.getSubCategoryStaticProducts = async function (subCatId) {
    try {
        const catalog = await this.getCatalogSource();
        const mainCat = catalog.find(main => Array.isArray(main.sub) && main.sub.some(sub => String(sub.id) === String(subCatId)));
        if (!mainCat?.dataFile) return [];

        const response = await fetch('/' + String(mainCat.dataFile).replace(/^\/+/, ''));
        if (!response.ok) return [];

        const data = await response.json();
        const subData = Array.isArray(data?.sub)
            ? data.sub.find(sub => String(sub.id) === String(subCatId))
            : null;

        return Array.isArray(subData?.active_ingredients) ? subData.active_ingredients : [];
    } catch (error) {
        console.error("PharmacyAPI Error (getSubCategoryStaticProducts):", error);
        return [];
    }
};

window.PharmacyAPI.clearCache = function () {
    window.pharmacyApiCache.catalogSource = null;
    window.pharmacyApiCache.referenceData = null;
    window.pharmacyApiCache.catalogContexts.clear();
};
