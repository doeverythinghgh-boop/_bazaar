/**
 * RULE: All comments and documentation must be in English only.
 * WARNING: Hover effects are strictly prohibited on this page to ensure touch-device compatibility.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

/**
 * @file pages/merchant-portfolio/js/portfolio-fetch-featured.js
 * @description Handles featured products persistence and fetching.
 */

window.portfolioUpdateFeaturedIDs = async function (userKey, featuredIds) {
    try {
        const PortfolioAPI = window.PortfolioAPI || {};
        console.log(`[Portfolio] Updating nested featured data for ${userKey}...`);

        const user = await window.portfolioFetchUser(userKey);
        if (!user) return false;

        const currentData = user.featured_items_data;
        let imgJson = {};

        try {
            imgJson = (typeof currentData === 'string') ? JSON.parse(currentData) : (currentData || {});
            if (typeof imgJson !== 'object' || Array.isArray(imgJson)) imgJson = {};
        } catch (error) {
            if (window.PortfolioErrorUtils?.log) {
                window.PortfolioErrorUtils.log("PortfolioFetchFeatured", "Failed to parse featured_items_data; using fallback object.", error);
            } else {
                console.error("[PortfolioFetchFeatured] Failed to parse featured_items_data; using fallback object.", error);
            }
            imgJson = {};
        }

        imgJson.featured_ids = Array.isArray(featuredIds) ? featuredIds : [];

        const result = await updateUser({
            user_key: userKey,
            featured_items_data: JSON.stringify(imgJson)
        });

        if (result && !result.error) {
            if (PortfolioAPI.saveCache) {
                const cache = PortfolioAPI.loadCache(userKey) || {};
                PortfolioAPI.saveCache(userKey, {
                    ...cache,
                    user: {
                        ...(cache.user || user),
                        ...user,
                        featured_items_data: JSON.stringify(imgJson)
                    }
                });
            }
            console.log('[Portfolio] Featured IDs updated successfully.');
            return true;
        }

        return false;
    } catch (error) {
        console.error('[Portfolio] Update Featured IDs Error:', error);
        return false;
    }
};

window.portfolioFetchAllFeaturedProducts = async function () {
    if (!window.portfolioFeaturedState || window.portfolioFeaturedState.featuredIds.size === 0) return [];

    const idArray = Array.from(window.portfolioFeaturedState.featuredIds);
    const PortfolioAPI = window.PortfolioAPI || {};
    let data = [];
    let fetchSucceeded = false;

    if (typeof apiFetch === 'function') {
        const params = new URLSearchParams();
        params.append('product_keys', idArray.join(','));
        const result = await apiFetch(`/api/products?${params.toString()}`);
        if (result && result.error) {
            console.error('[Portfolio] Featured products fetch failed:', result.error);
            return [];
        }
        data = Array.isArray(result) ? result : [];
        fetchSucceeded = true;
    } else if (PortfolioAPI.fetchFeaturedProducts) {
        data = await PortfolioAPI.fetchFeaturedProducts(idArray);
        fetchSucceeded = Array.isArray(data);
    }

    if (!Array.isArray(data)) return [];

    const resolvedIds = new Set();
    data.forEach((product) => {
        if (product?.id != null) resolvedIds.add(String(product.id));
        if (product?.product_key != null) resolvedIds.add(String(product.product_key));
    });

    const existingIds = idArray.filter((id) => resolvedIds.has(String(id)));
    if (fetchSucceeded && existingIds.length !== idArray.length) {
        window.portfolioFeaturedState.featuredIds = new Set(existingIds);
        const userKey = new URLSearchParams(window.location.search).get('user_key');
        const currentUser = typeof SessionManager !== 'undefined' ? SessionManager.getUser() : null;
        const capabilities = PortfolioAPI.resolveUserCapabilities
            ? PortfolioAPI.resolveUserCapabilities(currentUser)
            : null;
        const canPersistCleanup = !!(currentUser && (currentUser.user_key === userKey || capabilities?.isAdmin));
        if (canPersistCleanup && typeof window.portfolioUpdateFeaturedIDs === 'function') {
            window.portfolioUpdateFeaturedIDs(userKey, existingIds).catch((error) => {
                console.error('[Portfolio] Failed to persist featured cleanup:', error);
            });
        }
    }

    return data;
};

