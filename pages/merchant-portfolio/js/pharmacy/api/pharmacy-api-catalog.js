/**
 * @file pharmacy-api-catalog.js
 * @description Catalog and context management for pharmacy API.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
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

// --- Pharmacy Catalog Context: MerchantRegistry-backed cross-page cache ---
// The catalog context (custom categories + preferences) belongs to the merchant,
// so we store it in MerchantRegistry under a dedicated prefix. This survives
// page navigation within the same browser session, eliminating redundant
// Firestore reads on every page load.
const _PHARM_CTX_PREFIX = "pharm_ctx_";

function _pharmCtxFromRegistry(userKey) {
    if (!userKey || userKey === 'guest_user' || !window.MerchantRegistry) return null;
    try {
        const session = globalThis.LocalDBSession;
        if (!session) return null;
        const raw = session.getItem(_PHARM_CTX_PREFIX + userKey);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        // Validate the stored entry has required keys
        if (!parsed || !Array.isArray(parsed.mergedCategories)) return null;
        return parsed;
    } catch (_) {
        return null;
    }
}

function _pharmCtxToRegistry(userKey, context) {
    if (!userKey || userKey === 'guest_user' || !window.MerchantRegistry) return;
    try {
        const session = globalThis.LocalDBSession;
        if (!session) return;
        session.setItem(_PHARM_CTX_PREFIX + userKey, JSON.stringify(context));
    } catch (_) { /* quota errors are non-fatal */ }
}

function _pharmCtxDeleteFromRegistry(userKey) {
    if (!userKey || !window.MerchantRegistry) return;
    try {
        const session = globalThis.LocalDBSession;
        if (session) session.removeItem(_PHARM_CTX_PREFIX + userKey);
    } catch (_) { }
}

window.PharmacyAPI.getCatalogContext = async function (userKey, options = {}) {
    const contextStart = performance.now();
    const cacheKey = String(userKey || 'guest_user');
    const forceReload = options.force === true;

    // --- Layer 1: In-memory Map cache (fastest, same page lifecycle) ---
    if (!forceReload && window.pharmacyApiCache.catalogContexts.has(cacheKey)) {
        console.log(`[Diagnostic] Pharmacy catalog context: IN-MEMORY CACHE HIT for ${cacheKey}`);
        return window.pharmacyClone(window.pharmacyApiCache.catalogContexts.get(cacheKey));
    }

    // --- Layer 2: MerchantRegistry / sessionStorage cache (survives page navigation) ---
    if (!forceReload) {
        const registryCached = _pharmCtxFromRegistry(cacheKey);
        if (registryCached) {
            console.log(`[Diagnostic] Pharmacy catalog context: REGISTRY CACHE HIT for ${cacheKey} (no Firestore calls needed).`);
            // Repopulate in-memory cache for the remainder of this page lifecycle
            window.pharmacyApiCache.catalogContexts.set(cacheKey, registryCached);
            return window.pharmacyClone(registryCached);
        }
    }

    console.log(`[Diagnostic] Pharmacy catalog context: CACHE MISS for ${cacheKey}. Fetching parallel components from Firestore...`);

    const t1 = performance.now();
    const results = await Promise.allSettled([
        this.getCatalogSource().then(r => { console.log(`[Diagnostic] - CatalogSource loaded in ${(performance.now() - t1).toFixed(0)}ms`); return r; }),
        (userKey ? this.getCustomCategories(userKey) : Promise.resolve([])).then(r => { console.log(`[Diagnostic] - CustomCategories loaded in ${(performance.now() - t1).toFixed(0)}ms`); return r; }),
        (userKey ? this.getPreferences(userKey) : Promise.resolve({ hidden_main_categories: [], hidden_sub_categories: [], hidden_catalog_products: [] })).then(r => { console.log(`[Diagnostic] - Preferences loaded in ${(performance.now() - t1).toFixed(0)}ms`); return r; })
    ]);

    const catalogSource = results[0].status === 'fulfilled' ? results[0].value : [];
    if (results[0].status === 'rejected') {
        console.error("[Diagnostic] Pharmacy catalog context: CatalogSource failed to load:", results[0].reason);
    }

    const customCategories = results[1].status === 'fulfilled' ? results[1].value : [];
    if (results[1].status === 'rejected') {
        console.error("[Diagnostic] Pharmacy catalog context: CustomCategories failed to load:", results[1].reason);
    }

    const preferences = results[2].status === 'fulfilled' ? results[2].value : { hidden_main_categories: [], hidden_sub_categories: [], hidden_catalog_products: [] };
    if (results[2].status === 'rejected') {
        console.error("[Diagnostic] Pharmacy catalog context: Preferences failed to load:", results[2].reason);
    }

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

    // Persist to both layers
    window.pharmacyApiCache.catalogContexts.set(cacheKey, window.pharmacyClone(context));
    _pharmCtxToRegistry(cacheKey, context);

    console.log(`[Diagnostic] Pharmacy catalog context: TOTAL generation time: ${(performance.now() - contextStart).toFixed(0)}ms`);
    return window.pharmacyClone(context);
};

window.PharmacyAPI.invalidateCatalogContext = function (userKey) {
    if (!userKey) return;
    const cacheKey = String(userKey);
    // Invalidate both layers simultaneously
    window.pharmacyApiCache.catalogContexts.delete(cacheKey);
    _pharmCtxDeleteFromRegistry(cacheKey);
    console.log(`[Diagnostic] Pharmacy catalog context: INVALIDATED for ${cacheKey} (both layers cleared).`);
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
    // Layer 1: clear in-memory Map
    window.pharmacyApiCache.catalogSource = null;
    window.pharmacyApiCache.referenceData = null;
    window.pharmacyApiCache.catalogContexts.clear();
    // Layer 2: clear all pharm_ctx_ entries from sessionStorage
    try {
        const session = globalThis.LocalDBSession;
        if (session) {
            const keysToRemove = [];
            for (let i = 0; i < session.length; i++) {
                const k = session.key(i);
                if (k && k.startsWith(_PHARM_CTX_PREFIX)) keysToRemove.push(k);
            }
            keysToRemove.forEach(k => session.removeItem(k));
            if (keysToRemove.length) {
                console.log(`[Diagnostic] Pharmacy clearCache: removed ${keysToRemove.length} registry entries from session.`);
            }
        }
    } catch (_) { }
};
