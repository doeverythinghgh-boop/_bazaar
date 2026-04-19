/**
 * @file pages/merchant-portfolio/js/services/portfolio-api.js
 * @description Adapter layer for merchant portfolio dependencies and data access.
 */

(function () {
    function getUserKeyFromLocation() {
        return new URLSearchParams(window.location.search).get('user_key') || '';
    }

    function loadCache(userKey) {
        const resolvedUserKey = userKey || getUserKeyFromLocation();
        return window.portfolioCache && resolvedUserKey ? window.portfolioCache.load(resolvedUserKey) : null;
    }

    function saveCache(userKey, payload) {
        const resolvedUserKey = userKey || getUserKeyFromLocation();
        if (!window.portfolioCache || !resolvedUserKey) return null;
        window.portfolioCache.save(resolvedUserKey, payload);
        return loadCache(resolvedUserKey);
    }

    function clearCache(userKey) {
        const resolvedUserKey = userKey || getUserKeyFromLocation();
        if (window.portfolioCache && resolvedUserKey) {
            window.portfolioCache.clear(resolvedUserKey);
        }
    }

    async function fetchUser(userKey) {
        return window.PortfolioSafeFetch.request(
            async function () {
                const resolvedUserKey = userKey || getUserKeyFromLocation();
                return await apiFetch(`/api/users?user_key=${resolvedUserKey}`);
            },
            {
                retries: 1,
                fallback: null,
                onError: function (error) {
                    console.error('[PortfolioAPI] fetchUser failed:', error);
                }
            }
        );
    }

    async function fetchProducts(options = {}) {
        const params = new URLSearchParams();
        if (options.userKey) params.append('user_key', options.userKey);
        if (Number.isFinite(options.limit)) params.append('limit', String(options.limit));
        if (Number.isFinite(options.offset)) params.append('offset', String(options.offset));
        if (Array.isArray(options.productKeys) && options.productKeys.length > 0) params.append('product_keys', options.productKeys.join(','));

        return window.PortfolioSafeFetch.request(
            async function () {
                return await apiFetch(`/api/products?${params.toString()}`);
            },
            {
                retries: 1,
                fallback: [],
                onError: function (error) {
                    console.error('[PortfolioAPI] fetchProducts failed:', error);
                }
            }
        );
    }

    async function fetchAllProductsForUser(userKey) {
        const resolvedUserKey = userKey || getUserKeyFromLocation();
        if (!resolvedUserKey) return [];

        const batchSize = 100;
        let offset = 0;
        let keepFetching = true;
        const merged = [];

        while (keepFetching) {
            const rows = await fetchProducts({
                userKey: resolvedUserKey,
                limit: batchSize,
                offset: offset
            });
            const chunk = Array.isArray(rows) ? rows : [];
            merged.push(...chunk);
            keepFetching = chunk.length === batchSize;
            offset += chunk.length;
            if (chunk.length === 0) break;
        }

        return merged;
    }

    async function fetchRaters(userKeys) {
        if (!Array.isArray(userKeys) || userKeys.length === 0) return {};
        return window.PortfolioSafeFetch.request(
            async function () {
                const rows = await apiFetch(`/api/users?user_keys=${userKeys.join(',')}`);
                const ratersMap = {};
                if (Array.isArray(rows)) {
                    rows.forEach(function (row) {
                        ratersMap[row.user_key] = {
                            username: row.username,
                            user_image: row.user_image
                        };
                    });
                }
                return ratersMap;
            },
            {
                retries: 1,
                fallback: {},
                onError: function (error) {
                    console.error('[PortfolioAPI] fetchRaters failed:', error);
                }
            }
        );
    }

    async function submitMerchantRating(targetUserKey, ratingData) {
        return window.PortfolioSafeFetch.request(
            async function () {
                return await apiFetch('/api/merchant-portfolio.js?action=rate_user', {
                    method: 'POST',
                    body: {
                        target_user_key: targetUserKey,
                        rating_data: ratingData
                    }
                });
            },
            { retries: 0, fallback: null }
        );
    }

    async function updateMerchantRating(targetUserKey, actorUserKey, ratingRef, ratingData) {
        return window.PortfolioSafeFetch.request(
            async function () {
                return await apiFetch('/api/merchant-portfolio.js?action=edit_rating', {
                    method: 'POST',
                    body: {
                        target_user_key: targetUserKey,
                        actor_user_key: actorUserKey,
                        rating_id: ratingRef?.rating_id || null,
                        rating_date: ratingRef?.date || null,
                        rating_data: ratingData
                    }
                });
            },
            { retries: 0, fallback: null }
        );
    }

    async function deleteMerchantRating(targetUserKey, actorUserKey, ratingRef) {
        return window.PortfolioSafeFetch.request(
            async function () {
                return await apiFetch('/api/merchant-portfolio.js?action=delete_rating', {
                    method: 'POST',
                    body: {
                        target_user_key: targetUserKey,
                        actor_user_key: actorUserKey,
                        rating_id: ratingRef?.rating_id || null,
                        rating_date: ratingRef?.date || null
                    }
                });
            },
            { retries: 0, fallback: null }
        );
    }

    async function fetchFeaturedProducts(productKeys) {
        return fetchProducts({ productKeys: productKeys });
    }

    function resolveSpecialtyViewModel(user) {
        return typeof window.resolvePortfolioSpecialtyViewModel === 'function'
            ? (user?.portfolio_view_model || window.resolvePortfolioSpecialtyViewModel(user))
            : null;
    }

    function resolveUserCapabilities(user) {
        return typeof window.resolveUserCapabilities === 'function'
            ? window.resolveUserCapabilities(user)
            : null;
    }

    function getPublicImageUrl(fileName) {
        return typeof window.getPublicR2FileUrl === 'function'
            ? window.getPublicR2FileUrl(fileName)
            : fileName;
    }

    window.PortfolioAPI = {
        getUserKeyFromLocation,
        loadCache,
        saveCache,
        clearCache,
        fetchUser,
        fetchProducts,
        fetchAllProductsForUser,
        fetchRaters,
        submitMerchantRating,
        updateMerchantRating,
        deleteMerchantRating,
        fetchFeaturedProducts,
        resolveSpecialtyViewModel,
        resolveUserCapabilities,
        getPublicImageUrl
    };
})();
