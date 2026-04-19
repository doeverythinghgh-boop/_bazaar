/**
 * @file pages/merchant-portfolio/js/portfolio-search-state.js
 * @description Seller search state and shared helpers.
 */

window.portfolioEnsureSellerSearchState = function () {
    const store = window.PortfolioStore || null;
    const state = store ? store.getState() : (window.portfolioState || (window.portfolioState = {}));
    if (!state.sellerSearch) {
        state.sellerSearch = {};
    }

    const sellerSearch = state.sellerSearch;
    if (typeof sellerSearch.isOpen !== 'boolean') sellerSearch.isOpen = false;
    if (typeof sellerSearch.query !== 'string') sellerSearch.query = '';
    if (typeof sellerSearch.mainCategory !== 'string') sellerSearch.mainCategory = '';
    if (typeof sellerSearch.subCategory !== 'string') sellerSearch.subCategory = '';
    if (typeof sellerSearch.sort !== 'string') sellerSearch.sort = 'default';
    if (typeof sellerSearch.isActive !== 'boolean') sellerSearch.isActive = false;
    if (typeof sellerSearch.appliedQuery !== 'string') sellerSearch.appliedQuery = '';
    if (typeof sellerSearch.appliedMainCategory !== 'string') sellerSearch.appliedMainCategory = '';
    if (typeof sellerSearch.appliedSubCategory !== 'string') sellerSearch.appliedSubCategory = '';
    if (typeof sellerSearch.appliedSort !== 'string') sellerSearch.appliedSort = 'default';
    if (!Number.isFinite(sellerSearch.limit) || sellerSearch.limit <= 0) sellerSearch.limit = 5;
    if (!Number.isFinite(sellerSearch.visibleCount) || sellerSearch.visibleCount < 0) sellerSearch.visibleCount = 0;
    if (!Number.isFinite(sellerSearch.totalMatched) || sellerSearch.totalMatched < 0) sellerSearch.totalMatched = 0;
    if (!Array.isArray(sellerSearch.results)) sellerSearch.results = [];
    if (typeof sellerSearch.isLoading !== 'boolean') sellerSearch.isLoading = false;

    return sellerSearch;
};

window.portfolioNormalizeSearchText = function (value) {
    const raw = value == null ? '' : String(value);
    const normalized = typeof normalizeArabicText === 'function' ? normalizeArabicText(raw) : raw;
    return normalized.trim().toLowerCase();
};

window.portfolioSellerSearchL = function (key, fallbackAr, fallbackEn) {
    const translated = typeof window.langu === 'function' ? window.langu(key) : '';
    if (translated && translated !== key) return translated;

    return (window.app_language || 'ar') === 'ar'
        ? (fallbackAr || fallbackEn || key)
        : (fallbackEn || fallbackAr || key);
};

window.portfolioUnwrapApiPayload = function (payload) {
    if (
        payload &&
        typeof payload === 'object' &&
        Object.prototype.hasOwnProperty.call(payload, 'success') &&
        Object.prototype.hasOwnProperty.call(payload, 'data') &&
        Object.prototype.hasOwnProperty.call(payload, 'error')
    ) {
        if (payload.success === false) {
            throw new Error(payload?.error?.message || 'API request failed');
        }
        return payload.data;
    }

    return payload;
};

window.portfolioTrimSellerSearchText = function (value, maxLength = 6) {
    const text = String(value || '').trim();
    if (!text) return window.portfolioSellerSearchL('search_modal_input_placeholder', 'نص', 'Text');
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
};

window.portfolioGetAppliedSellerSearchState = function () {
    const searchState = window.portfolioEnsureSellerSearchState();
    return {
        query: searchState.appliedQuery || '',
        mainCategory: searchState.appliedMainCategory || '',
        subCategory: searchState.appliedSubCategory || '',
        sort: searchState.appliedSort || 'default'
    };
};

window.portfolioHasSellerSearchCriteria = function (criteria) {
    const source = criteria || window.portfolioEnsureSellerSearchState();
    return !!(
        String(source.query || '').trim() ||
        String(source.mainCategory || '').trim() ||
        String(source.subCategory || '').trim() ||
        (source.sort && source.sort !== 'default')
    );
};

window.portfolioIsSellerSearchActive = function () {
    return !!window.portfolioEnsureSellerSearchState().isActive;
};
