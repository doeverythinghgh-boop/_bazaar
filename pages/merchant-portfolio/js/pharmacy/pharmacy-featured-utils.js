/**
 * @file pages/merchant-portfolio/js/pharmacy/pharmacy-featured-utils.js
 * @description Shared helpers for pharmacy featured products.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

(function () {
    function getLanguageValue(arValue, enValue) {
        if (window.pharmacyUIBase?.getLanguageValue) {
            return window.pharmacyUIBase.getLanguageValue(arValue, enValue);
        }
        return window.app_language === 'en' ? (enValue || arValue || '') : (arValue || enValue || '');
    }

    function parseMaybeJson(value, fallback) {
        if (Array.isArray(value)) return value;
        if (value && typeof value === 'object') return value;
        if (typeof value !== 'string' || !value.trim()) return fallback;
        try {
            return JSON.parse(value);
        } catch (error) {
            console.warn('[PharmacyFeatured] Failed to parse JSON field:', error);
            return fallback;
        }
    }

    function normalizeImageName(value) {
        if (!value) return '';
        if (Array.isArray(value)) return String(value[0] || '').trim();
        return String(value).split(',')[0].trim();
    }

    function resolveImageUrl(item) {
        const rawImage = normalizeImageName(item?.image_url || item?.image_names || item?.ImageName);
        if (!rawImage) return '/assets/images/placeholder.png';
        if (rawImage.includes('/') || rawImage.startsWith('data:')) {
            return rawImage.startsWith('/') || rawImage.startsWith('data:') ? rawImage : `/${rawImage.replace(/^\/+/, '')}`;
        }
        return typeof window.getPublicR2FileUrl === 'function'
            ? window.getPublicR2FileUrl(rawImage)
            : `/${rawImage}`;
    }

    function normalizeSavedItem(entry) {
        if (!entry) return null;
        if (typeof entry === 'string' || typeof entry === 'number') {
            return {
                id: String(entry),
                type: String(entry).startsWith('PHARM_PROD_') ? 'merchant' : 'catalog',
                source: 'pharmacy'
            };
        }
        const id = String(entry.id || entry.product_id || entry.productId || '').trim();
        if (!id) return null;
        return {
            id,
            type: String(entry.type || (id.startsWith('PHARM_PROD_') ? 'merchant' : 'catalog')),
            subId: entry.subId != null ? String(entry.subId) : (entry.sub_id != null ? String(entry.sub_id) : undefined),
            source: 'pharmacy'
        };
    }

    function getItemId(item) {
        const rawId = item?.product_id || item?.id || item?.catalog_id || item?.original_catalog_id || '';
        const id = Array.isArray(rawId) ? rawId[0] : rawId;
        return String(id || '').trim();
    }

    function isMerchantItem(item) {
        const id = getItemId(item);
        return !!(
            item?.isMerchant ||
            item?.product_id ||
            id.startsWith('PHARM_PROD_')
        );
    }

    function getFeaturedIdentity(item, options = {}) {
        const id = getItemId(item);
        if (!id) return null;
        const type = options.type || (isMerchantItem(item) ? 'merchant' : 'catalog');
        const subId = item?.subId || item?.SubCategory || item?.custom_sub_cat_id || item?.sub_category_id || options.subId || window.pharmacyActiveSubCategoryId || null;
        return {
            id: String(id),
            type: String(type),
            subId: subId != null ? String(subId) : undefined,
            source: 'pharmacy'
        };
    }

    function getFeaturedKey(entry) {
        const normalized = normalizeSavedItem(entry);
        if (!normalized) return '';
        return `${normalized.type}:${normalized.id}`;
    }

    function getFeaturedItems() {
        const state = window.portfolioFeaturedState || {};
        if (!Array.isArray(state.pharmacyFeaturedItems)) {
            state.pharmacyFeaturedItems = [];
        }
        return state.pharmacyFeaturedItems;
    }

    function setFeaturedItems(items) {
        const state = window.portfolioFeaturedState || {};
        state.pharmacyFeaturedItems = (Array.isArray(items) ? items : [])
            .map(normalizeSavedItem)
            .filter(Boolean);
        state.pharmacyFeaturedKeys = new Set(state.pharmacyFeaturedItems.map(getFeaturedKey));
        window.portfolioFeaturedState = state;
        return state.pharmacyFeaturedItems;
    }

    function isFeatured(item) {
        const identity = getFeaturedIdentity(item);
        if (!identity) return false;
        const state = window.portfolioFeaturedState || {};
        const keys = state.pharmacyFeaturedKeys instanceof Set
            ? state.pharmacyFeaturedKeys
            : new Set(getFeaturedItems().map(getFeaturedKey));
        return keys.has(getFeaturedKey(identity));
    }

    function upsertFeaturedItem(item) {
        const identity = getFeaturedIdentity(item);
        if (!identity) return getFeaturedItems();
        const next = getFeaturedItems().filter((entry) => getFeaturedKey(entry) !== getFeaturedKey(identity));
        next.push(identity);
        return setFeaturedItems(next);
    }

    function removeFeaturedItem(item) {
        const identity = getFeaturedIdentity(item);
        if (!identity) return getFeaturedItems();
        return setFeaturedItems(getFeaturedItems().filter((entry) => getFeaturedKey(entry) !== getFeaturedKey(identity)));
    }

    function adaptForBanner(item, merchant) {
        const id = getItemId(item);
        const title = item?.productName || getLanguageValue(item?.name_ar || item?.title || item?.title_ar, item?.name_en || item?.title_en);
        const price = item?.product_price != null ? item.product_price : item?.price;
        const discount = Number(item?.discount || 0);
        const originalPrice = item?.original_price || (discount > 0 && price ? (Number(price) + discount) : null);
        return {
            ...item,
            id,
            product_key: id,
            productName: title || '',
            product_price: price != null ? price : '',
            original_price: originalPrice,
            ImageName: normalizeImageName(item?.ImageName || item?.image_names || item?.image_url),
            renderedImgUrl: item?.renderedImgUrl || resolveImageUrl(item),
            isPharmacyFeaturedProduct: true,
            merchant_user_key: merchant?.user_key || item?.merchant_user_key || new URLSearchParams(window.location.search).get('user_key')
        };
    }

    window.pharmacyFeaturedUtils = {
        adaptForBanner,
        getFeaturedIdentity,
        getFeaturedItems,
        getFeaturedKey,
        isFeatured,
        normalizeSavedItem,
        parseMaybeJson,
        removeFeaturedItem,
        resolveImageUrl,
        setFeaturedItems,
        upsertFeaturedItem
    };
})();
