/**
 * @file portfolio-mgmt-utils.js
 * @description Utilities for product management (Cleanup and resolution).
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

window.sharedProductCleanup = function (productId, userKey) {
    const PortfolioAPI = window.PortfolioAPI || {};
    const store = window.PortfolioStore || null;
    console.log(`[SharedCleanup] Synchronizing deletion for product ${productId}...`);
    const pid = String(productId);

    // 1. Clear Merchant Portfolio Cache for this user
    if (PortfolioAPI.loadCache) {
        const cache = PortfolioAPI.loadCache(userKey);
        if (cache && cache.products) {
            const initialCount = cache.products.length;
            const updated = cache.products.filter(p => String(p.id) !== pid && String(p.product_key) !== pid);

            if (updated.length !== initialCount) {
                const newOffset = updated.length;
                PortfolioAPI.saveCache(userKey, {
                    ...cache,
                    products: updated,
                    offset: newOffset
                });

                if (store?.patch) store.patch({ productOffset: newOffset });
                else if (window.portfolioState) window.portfolioState.productOffset = newOffset;
                console.log(` - Portfolio cache updated. New offset: ${newOffset}`);
            }
        }
    }

    // 2. Update Search Results Cache (LocalDBSession)
    try {
        const searchStateRaw = LocalDBSession.getItem('search_page_state');
        if (searchStateRaw) {
            const state = JSON.parse(searchStateRaw);
            if (state.results && state.results.length > 0) {
                const initialCount = state.results.length;
                state.results = state.results.filter(p => String(p.id) !== pid && String(p.product_key) !== pid);
                if (state.results.length !== initialCount) {
                    LocalDBSession.setItem('search_page_state', JSON.stringify(state));
                    console.log(" - Search page cache synchronized.");
                }
            }
        }
    } catch (error) {
        if (window.PortfolioErrorUtils?.log) {
            window.PortfolioErrorUtils.log("PortfolioActionsMgmt", "Failed to synchronize search cache after deletion.", error);
        } else {
            console.error("[SharedCleanup] Search cache update failed", error);
        }
    }

    // 3. Update Product Registry (LocalDBStorage)
    if (window.ProductStateManager) {
        const registry = window.ProductStateManager.getState().registry || {};
        const entries = Object.entries(registry);
        const match = entries.find(([key, val]) => key === pid || (val.id && String(val.id) === pid));
        if (match) {
            delete registry[match[0]];
            LocalDBStorage.setItem('suez_bazaar_product_registry', JSON.stringify(registry));
            console.log(" - Global product registry updated.");
        }
    }

    // 4. Remove deleted products from the featured filter and persisted featured IDs.
    if (window.portfolioFeaturedState?.featuredIds instanceof Set && window.portfolioFeaturedState.featuredIds.has(pid)) {
        window.portfolioFeaturedState.featuredIds.delete(pid);
        console.log(" - Featured IDs synchronized.");

        const currentUser = typeof SessionManager !== 'undefined' ? SessionManager.getUser() : null;
        const capabilities = PortfolioAPI.resolveUserCapabilities
            ? PortfolioAPI.resolveUserCapabilities(currentUser)
            : null;
        const canPersistCleanup = !!(currentUser && (currentUser.user_key === userKey || capabilities?.isAdmin));
        if (canPersistCleanup && typeof window.portfolioUpdateFeaturedIDs === 'function') {
            window.portfolioUpdateFeaturedIDs(userKey, Array.from(window.portfolioFeaturedState.featuredIds)).catch((error) => {
                console.error('[SharedCleanup] Failed to persist featured cleanup:', error);
            });
        }
    }

    // 5. Cleanup any persistent Drafts (LocalDBStorage)
    try {
        const draftPrefix = `draft_${userKey}_${pid}`;
        const keys = [];
        for (let i = 0; i < LocalDBStorage.length; i++) {
            const key = LocalDBStorage.key(i);
            if (key) keys.push(key);
        }
        keys.forEach(key => {
            if (key.startsWith(draftPrefix) || key.includes(`_${pid}_`)) {
                LocalDBStorage.removeItem(key);
                console.log(` - Draft cleared: ${key}`);
            }
        });
    } catch (e) {
        console.warn("[SharedCleanup] Draft cleanup failed", e);
    }
};

window.resolvePortfolioProductById = function (productId, userKey) {
    const PortfolioAPI = window.PortfolioAPI || {};
    const state = window.PortfolioStore?.getState ? window.PortfolioStore.getState() : window.portfolioState;
    const cache = PortfolioAPI.loadCache ? PortfolioAPI.loadCache(userKey) : null;
    const normalizedProductId = String(productId);

    let product = cache?.products?.find(
        p => String(p.id) === normalizedProductId || String(p.product_key) === normalizedProductId
    );
    if (!product && state?.allProducts) {
        product = state.allProducts.find(
            p => String(p.id) === normalizedProductId || String(p.product_key) === normalizedProductId
        );
    }
    return {
        product: product || null,
        state,
        cache
    };
};
