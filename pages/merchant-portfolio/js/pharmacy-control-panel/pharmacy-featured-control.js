/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */
/**
 * @file pages/merchant-portfolio/js/pharmacy-control-panel/pharmacy-featured-control.js
 * @description Featured product bridge for the pharmacy control panel.
 */

(function () {
    'use strict';

    function getUserKey() {
        return window.userKey || new URLSearchParams(window.location.search).get('user_key') || '';
    }

    function ensureState() {
        window.portfolioFeaturedState = window.portfolioFeaturedState || {};
        if (!Array.isArray(window.portfolioFeaturedState.pharmacyFeaturedItems)) {
            window.portfolioFeaturedState.pharmacyFeaturedItems = [];
        }
        if (!(window.portfolioFeaturedState.pharmacyFeaturedKeys instanceof Set)) {
            const utils = window.pharmacyFeaturedUtils || {};
            const keyOf = utils.getFeaturedKey || ((entry) => `${entry?.type || 'catalog'}:${entry?.id || entry}`);
            window.portfolioFeaturedState.pharmacyFeaturedKeys = new Set(window.portfolioFeaturedState.pharmacyFeaturedItems.map(keyOf));
        }
        return window.portfolioFeaturedState;
    }

    async function fetchUser(userKey) {
        if (!userKey || typeof apiFetch !== 'function') return null;
        const result = await apiFetch(`/api/users?user_key=${encodeURIComponent(userKey)}`);
        return result && !result.error ? result : null;
    }

    function readFeaturedItems(user) {
        const utils = window.pharmacyFeaturedUtils || {};
        let data = {};
        try {
            data = typeof user?.featured_items_data === 'string'
                ? JSON.parse(user.featured_items_data || '{}')
                : (user?.featured_items_data || {});
        } catch (error) {
            console.error('[PharmacyFeaturedControl] Failed to parse featured data:', error);
            data = {};
        }
        return (Array.isArray(data.pharmacy_featured_ids) ? data.pharmacy_featured_ids : [])
            .map((entry) => utils.normalizeSavedItem ? utils.normalizeSavedItem(entry) : entry)
            .filter(Boolean);
    }

    async function persistFeaturedItems(userKey, featuredItems) {
        const user = await fetchUser(userKey);
        if (!user) return false;

        let data = {};
        try {
            data = typeof user.featured_items_data === 'string'
                ? JSON.parse(user.featured_items_data || '{}')
                : (user.featured_items_data || {});
        } catch (error) {
            console.error('[PharmacyFeaturedControl] Failed to parse current featured data:', error);
            data = {};
        }

        const utils = window.pharmacyFeaturedUtils || {};
        data.pharmacy_featured_ids = (Array.isArray(featuredItems) ? featuredItems : [])
            .map((entry) => utils.normalizeSavedItem ? utils.normalizeSavedItem(entry) : entry)
            .filter(Boolean);

        const payload = {
            user_key: userKey,
            featured_items_data: JSON.stringify(data)
        };

        const result = typeof updateUser === 'function'
            ? await updateUser(payload)
            : await apiFetch('/api/users', { method: 'PUT', body: payload });

        return !!(result && !result.error);
    }

    window.portfolioFetchUser = window.portfolioFetchUser || fetchUser;
    window.portfolioUpdatePharmacyFeaturedItems = async function (userKey, featuredItems) {
        console.log(`[Pharmacy-Featured-Control] portfolioUpdatePharmacyFeaturedItems called with ${featuredItems.length} items.`);
        const success = await persistFeaturedItems(userKey, featuredItems);
        if (success) {
            console.log('[Pharmacy-Featured-Control] Persistence successful. Syncing local state and notifying UI...');
            if (window.pharmacyFeaturedUtils?.setFeaturedItems) {
                window.pharmacyFeaturedUtils.setFeaturedItems(featuredItems);
            }
            window.dispatchEvent(new CustomEvent('pharmacy-featured-items-changed', { 
                detail: { source: 'manual_toggle', items: featuredItems } 
            }));
        } else {
            console.error('[Pharmacy-Featured-Control] Persistence failed.');
        }
        return success;
    };

    window.pharmacyControlInitFeatured = async function (userKey) {
        ensureState();
        const finalKey = userKey || new URLSearchParams(window.location.search).get('user_key');
        console.log(`[Pharmacy-Featured-Control] Initializing featured products for user: ${finalKey}`);
        const user = await fetchUser(finalKey);
        if (user) {
            const items = readFeaturedItems(user);
            console.log(`[Pharmacy-Featured-Control] Loaded ${items.length} items from user profile.`);
            if (window.pharmacyFeaturedUtils?.setFeaturedItems) {
                window.pharmacyFeaturedUtils.setFeaturedItems(items);
            }
            window.dispatchEvent(new CustomEvent('pharmacy-featured-items-changed', { 
                detail: { source: 'init', items: items } 
            }));
        }
    };

    window.pharmacyControlIsFeatured = function (item) {
        ensureState();
        return !!(window.pharmacyFeaturedUtils?.isFeatured && window.pharmacyFeaturedUtils.isFeatured(item));
    };

    window.pharmacyControlToggleFeaturedItem = async function (item, crownEl) {
        ensureState();
        if (!item) {
            console.warn('[Pharmacy-Swal-Diagnostic] Featured control stopped. Reason: missing item payload.');
            return false;
        }
        if (typeof window.togglePharmacyFeaturedProduct !== 'function') {
            console.warn('[Pharmacy-Swal-Diagnostic] Featured control stopped. Reason: togglePharmacyFeaturedProduct is not loaded.');
            return false;
        }
        
        const shouldAdd = !window.pharmacyControlIsFeatured(item);
        console.log(`[Pharmacy-Featured-Control] Toggling item ${item.id || item.product_id}. Action: ${shouldAdd ? 'Add' : 'Remove'}`);
        
        // togglePharmacyFeaturedProduct internally calls portfolioUpdatePharmacyFeaturedItems
        // which already dispatches the 'pharmacy-featured-items-changed' event.
        return await window.togglePharmacyFeaturedProduct(item, shouldAdd, crownEl);
    };

    window.pharmacyControlToggleFeaturedCatalogProduct = function (productId, subCatId, crownEl) {
        return window.pharmacyControlToggleFeaturedItem({
            id: String(productId || ''),
            subId: String(subCatId || ''),
            type: 'catalog',
            source: 'pharmacy'
        }, crownEl);
    };

    window.pharmacyControlToggleFeaturedMerchantProduct = function (productId, subCatId, crownEl) {
        return window.pharmacyControlToggleFeaturedItem({
            product_id: String(productId || ''),
            custom_sub_cat_id: String(subCatId || ''),
            isMerchant: true,
            source: 'pharmacy'
        }, crownEl);
    };

    document.addEventListener('DOMContentLoaded', () => {
        window.pharmacyControlInitFeatured().catch((error) => {
            console.error('[PharmacyFeaturedControl] Initialization failed:', error);
        });
    });
})();
