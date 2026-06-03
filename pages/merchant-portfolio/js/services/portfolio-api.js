/**
 * @file pages/merchant-portfolio/js/services/portfolio-api.js
 * @description Adapter layer for merchant portfolio dependencies and data access.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
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
        if (options.mainCategory) params.append('MainCategory', String(options.mainCategory));
        if (options.subCategory) params.append('SubCategory', String(options.subCategory));
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

    async function fetchCars(options = {}) {
        const params = new URLSearchParams();
        if (options.userKey) params.append('user_key', options.userKey);
        if (Number.isFinite(options.limit)) params.append('limit', String(options.limit));
        if (Number.isFinite(options.offset)) params.append('offset', String(options.offset));
        if (options.featured !== undefined && options.featured !== null) params.append('featured', options.featured ? '1' : '0');
        if (Array.isArray(options.carKeys) && options.carKeys.length > 0) params.append('car_keys', options.carKeys.join(','));

        return window.PortfolioSafeFetch.request(
            async function () {
                return await apiFetch(`/api/cars?${params.toString()}`);
            },
            {
                retries: 1,
                fallback: [],
                onError: function (error) {
                    console.error('[PortfolioAPI] fetchCars failed:', error);
                }
            }
        );
    }

    async function fetchRealEstate(options = {}) {
        const params = new URLSearchParams();
        if (options.userKey) params.append('user_key', options.userKey);
        if (Number.isFinite(options.limit)) params.append('limit', String(options.limit));
        if (Number.isFinite(options.offset)) params.append('offset', String(options.offset));
        if (options.featured !== undefined && options.featured !== null) params.append('featured', options.featured ? '1' : '0');
        if (options.subCategory) params.append('sub_category_id', String(options.subCategory));
        if (Array.isArray(options.realEstateKeys) && options.realEstateKeys.length > 0) params.append('real_estate_keys', options.realEstateKeys.join(','));

        return window.PortfolioSafeFetch.request(
            async function () {
                return await apiFetch(`/api/real-estate?${params.toString()}`);
            },
            {
                retries: 1,
                fallback: [],
                onError: function (error) {
                    console.error('[PortfolioAPI] fetchRealEstate failed:', error);
                }
            }
        );
    }

    async function setCarFeatured(carKey, isFeatured) {
        return window.PortfolioSafeFetch.request(
            async function () {
                return await apiFetch('/api/cars', {
                    method: 'POST',
                    body: {
                        action: 'set_featured',
                        car_key: carKey,
                        is_featured: isFeatured ? 1 : 0
                    }
                });
            },
            {
                retries: 0,
                fallback: null,
                onError: function (error) {
                    console.error('[PortfolioAPI] setCarFeatured failed:', error);
                }
            }
        );
    }

    async function setRealEstateFeatured(realEstateKey, isFeatured) {
        return window.PortfolioSafeFetch.request(
            async function () {
                return await apiFetch('/api/real-estate', {
                    method: 'POST',
                    body: {
                        action: 'set_featured',
                        real_estate_key: realEstateKey,
                        is_featured: isFeatured ? 1 : 0
                    }
                });
            },
            {
                retries: 0,
                fallback: null,
                onError: function (error) {
                    console.error('[PortfolioAPI] setRealEstateFeatured failed:', error);
                }
            }
        );
    }

    async function setProductFeatured(productKey, isFeatured) {
        return window.PortfolioSafeFetch.request(
            async function () {
                return await apiFetch('/api/products', {
                    method: 'POST',
                    body: {
                        action: 'set_featured',
                        product_key: productKey,
                        is_featured: isFeatured ? 1 : 0
                    }
                });
            },
            {
                retries: 0,
                fallback: null,
                onError: function (error) {
                    console.error('[PortfolioAPI] setProductFeatured failed:', error);
                }
            }
        );
    }

    function syncRatingsCache(targetUserKey, ratings) {
        if (!targetUserKey || !Array.isArray(ratings)) return null;
        const currentCache = loadCache(targetUserKey);
        if (!currentCache) return null;

        const nextUser = currentCache.user
            ? { ...currentCache.user, ratings }
            : currentCache.user;

        return saveCache(targetUserKey, {
            ...currentCache,
            user: nextUser
        });
    }

    async function submitMerchantRating(targetUserKey, ratingData = {}) {
        return window.PortfolioSafeFetch.request(
            async function () {
                const result = await apiFetch('/api/merchant-portfolio?action=rate_user', {
                    method: 'POST',
                    body: {
                        target_user_key: targetUserKey,
                        actor_user_key: ratingData.rater_id || ratingData.actor_user_key,
                        rating_data: ratingData
                    }
                });

                if (result?.success && Array.isArray(result.ratings)) {
                    syncRatingsCache(targetUserKey, result.ratings);
                }

                return result;
            },
            {
                retries: 0,
                fallback: null,
                onError: function (error) {
                    console.error('[PortfolioAPI] submitMerchantRating failed:', error);
                }
            }
        );
    }

    async function updateMerchantRating(targetUserKey, actorUserKey, ratingRef, ratingData = {}) {
        return window.PortfolioSafeFetch.request(
            async function () {
                const currentUser = typeof SessionManager !== 'undefined' ? SessionManager.getUser() : null;
                const result = await apiFetch('/api/merchant-portfolio?action=edit_rating', {
                    method: 'POST',
                    body: {
                        target_user_key: targetUserKey,
                        actor_user_key: actorUserKey,
                        rating_ref: ratingRef || null,
                        rating_data: {
                            ...ratingData,
                            rater_id: actorUserKey,
                            rater_name: ratingData.rater_name || currentUser?.username || ''
                        }
                    }
                });

                if (result?.success && Array.isArray(result.ratings)) {
                    syncRatingsCache(targetUserKey, result.ratings);
                }

                return result;
            },
            {
                retries: 0,
                fallback: null,
                onError: function (error) {
                    console.error('[PortfolioAPI] updateMerchantRating failed:', error);
                }
            }
        );
    }

    async function deleteMerchantRating(targetUserKey, actorUserKey, ratingRef) {
        return window.PortfolioSafeFetch.request(
            async function () {
                const result = await apiFetch('/api/merchant-portfolio?action=delete_rating', {
                    method: 'POST',
                    body: {
                        target_user_key: targetUserKey,
                        actor_user_key: actorUserKey,
                        rating_ref: ratingRef || null
                    }
                });

                if (result?.success && Array.isArray(result.ratings)) {
                    syncRatingsCache(targetUserKey, result.ratings);
                }

                return result;
            },
            {
                retries: 0,
                fallback: null,
                onError: function (error) {
                    console.error('[PortfolioAPI] deleteMerchantRating failed:', error);
                }
            }
        );
    }

    async function fetchRaters(userKeys = []) {
        const keys = Array.from(new Set((Array.isArray(userKeys) ? userKeys : [])
            .map(function (key) { return String(key || '').trim(); })
            .filter(Boolean)));

        if (!keys.length) return {};

        return window.PortfolioSafeFetch.request(
            async function () {
                const rows = await apiFetch(`/api/users?user_keys=${encodeURIComponent(keys.join(','))}`);
                const map = {};
                (Array.isArray(rows) ? rows : []).forEach(function (user) {
                    const key = user?.user_key;
                    if (key) map[key] = user;
                });
                return map;
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

    function resolveSpecialtyViewModel(user) {
        if (!user) return { isSpecialty: false, specialtyId: null };
        const id = Number(user.account_type);
        const knownSpecialties = [15, 16];
        return {
            isSpecialty: knownSpecialties.includes(id),
            specialtyId: id,
            showContactSection: true,
            canFeatureCatalog: true
        };
    }

    function resolveUserCapabilities(user) {
        if (typeof window.resolveUserCapabilities === 'function') {
            return window.resolveUserCapabilities(user);
        }
        if (!user) return { isAdmin: false };
        return {
            isAdmin: String(user.is_admin) === '1'
        };
    }

    function getPublicImageUrl(imageName) {
        if (typeof window.getPublicR2FileUrl === 'function') {
            return window.getPublicR2FileUrl(imageName);
        }
        return imageName;
    }

    window.PortfolioAPI = {
        getUserKeyFromLocation,
        loadCache,
        saveCache,
        clearCache,
        fetchUser,
        fetchProducts,
        fetchCars,
        fetchRealEstate,
        setCarFeatured,
        setRealEstateFeatured,
        setProductFeatured,
        submitMerchantRating,
        updateMerchantRating,
        deleteMerchantRating,
        fetchRaters,
        resolveSpecialtyViewModel,
        resolveUserCapabilities,
        getPublicImageUrl
    };
})();
