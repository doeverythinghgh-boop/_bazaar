/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */
/**
 * @file pages/merchant-control-panel/js/control-panel-api.js
 * @description API helpers for the merchant control panel.
 */

(function () {
    'use strict';

    const log = (...args) => console.log('[MerchantControlPanel]', ...args);
    const error = (...args) => console.error('[MerchantControlPanel]', ...args);

    function getUserKeyFromUrl() {
        return new URLSearchParams(window.location.search).get('user_key') || '';
    }

    async function fetchMerchant(userKey) {
        log('Loading merchant data.', { userKey });
        const user = await apiFetch(`/api/users?user_key=${encodeURIComponent(userKey)}`);
        log('Merchant data loaded.', { found: !!user });
        return user && !user.error ? user : null;
    }

    async function fetchProductsBatch({ userKey, mainId, subId, offset = 0, limit = 5 }) {
        log('Fetching products batch.', { userKey, mainId, subId, offset, limit });
        const params = new URLSearchParams();
        params.set('user_key', userKey);
        params.set('limit', String(limit));
        params.set('offset', String(offset));
        if (mainId) params.set('MainCategory', String(mainId));
        if (subId) params.set('SubCategory', String(subId));
        const rows = await apiFetch(`/api/products?${params.toString()}`);
        const products = Array.isArray(rows) ? rows : [];
        log('Products batch loaded.', { count: products.length });
        return products;
    }

    async function fetchCarsBatch({ userKey, offset = 0, limit = 5, featured = null }) {
        log('Fetching car listings batch.', { userKey, offset, limit, featured });
        const params = new URLSearchParams();
        params.set('user_key', userKey);
        params.set('limit', String(limit));
        params.set('offset', String(offset));
        if (featured !== null && featured !== undefined) params.set('featured', featured ? '1' : '0');
        const rows = await apiFetch(`/api/cars?${params.toString()}`);
        const cars = Array.isArray(rows) ? rows : [];
        log('Car listings batch loaded.', { count: cars.length });
        return cars;
    }

    async function setCarFeatured(carKey, isFeatured) {
        log('Updating car featured state.', { carKey, isFeatured });
        const result = await apiFetch('/api/cars', {
            method: 'POST',
            body: {
                action: 'set_featured',
                car_key: carKey,
                is_featured: isFeatured ? 1 : 0
            }
        });
        if (result?.error) throw new Error(result.error);
        return result;
    }

    async function deleteCar(carKey) {
        log('Deleting car listing.', { carKey });
        const result = await apiFetch(`/api/cars?car_key=${encodeURIComponent(carKey)}`, { method: 'DELETE' });
        if (result?.error) throw new Error(result.error);
        return result;
    }

    async function fetchRealEstateBatch({ userKey, offset = 0, limit = 5, featured = null, subCategoryId = null }) {
        log('Fetching real estate listings batch.', { userKey, offset, limit, featured, subCategoryId });
        const params = new URLSearchParams();
        params.set('user_key', userKey);
        params.set('limit', String(limit));
        params.set('offset', String(offset));
        if (featured !== null && featured !== undefined) params.set('featured', featured ? '1' : '0');
        if (subCategoryId) params.set('sub_category_id', String(subCategoryId));
        const rows = await apiFetch(`/api/real-estate?${params.toString()}`);
        const listings = Array.isArray(rows) ? rows : [];
        log('Real estate listings batch loaded.', { count: listings.length });
        return listings;
    }

    async function setRealEstateFeatured(realEstateKey, isFeatured) {
        log('Updating real estate featured state.', { realEstateKey, isFeatured });
        const result = await apiFetch('/api/real-estate', {
            method: 'POST',
            body: {
                action: 'set_featured',
                real_estate_key: realEstateKey,
                is_featured: isFeatured ? 1 : 0
            }
        });
        if (result?.error) throw new Error(result.error);
        return result;
    }

    async function deleteRealEstate(realEstateKey) {
        log('Deleting real estate listing.', { realEstateKey });
        const result = await apiFetch(`/api/real-estate?real_estate_key=${encodeURIComponent(realEstateKey)}`, { method: 'DELETE' });
        if (result?.error) throw new Error(result.error);
        return result;
    }

    async function fetchFeaturedProducts(productKeys) {
        const keys = Array.from(new Set((productKeys || []).map(String).filter(Boolean)));
        log('Loading featured products.', { count: keys.length });
        if (!keys.length) return [];
        const params = new URLSearchParams();
        params.set('product_keys', keys.join(','));
        const rows = await apiFetch(`/api/products?${params.toString()}`);
        const products = Array.isArray(rows) ? rows : [];
        log('Featured products loaded.', { count: products.length });
        return products;
    }

    function parseFeaturedIds(user) {
        try {
            const raw = user?.featured_items_data;
            const parsed = typeof raw === 'string' ? JSON.parse(raw || '{}') : (raw || {});
            const ids = Array.isArray(parsed?.featured_ids) ? parsed.featured_ids.map(String) : [];
            return new Set(ids);
        } catch (parseError) {
            error('Failed to parse featured items data.', parseError);
            return new Set();
        }
    }

    async function updateFeaturedIds(userKey, ids) {
        const finalIds = Array.from(new Set((ids || []).map(String).filter(Boolean)));
        log('Persisting featured products.', { userKey, count: finalIds.length });

        const freshUser = await fetchMerchant(userKey);
        const raw = freshUser?.featured_items_data;
        let data = {};
        try {
            data = typeof raw === 'string' ? JSON.parse(raw || '{}') : (raw || {});
            if (!data || typeof data !== 'object' || Array.isArray(data)) data = {};
        } catch (parseError) {
            error('Failed to parse fresh featured items data.', parseError);
            data = {};
        }

        data.featured_ids = finalIds;
        const payload = {
            user_key: userKey,
            featured_items_data: JSON.stringify(data)
        };

        const result = typeof updateUser === 'function'
            ? await updateUser(payload)
            : await apiFetch('/api/users', { method: 'PUT', body: payload });

        if (result?.error) throw new Error(result.error);
        log('Featured products persisted successfully.');
        return true;
    }

    window.MerchantControlPanelAPI = {
        getUserKeyFromUrl,
        fetchMerchant,
        fetchProductsBatch,
        fetchCarsBatch,
        fetchRealEstateBatch,
        fetchFeaturedProducts,
        setCarFeatured,
        deleteCar,
        setRealEstateFeatured,
        deleteRealEstate,
        parseFeaturedIds,
        updateFeaturedIds
    };
})();
