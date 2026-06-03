/**
 * @file pages/merchant-portfolio/js/portfolio-search-state.js
 * @description Merchant search state and shared helpers.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
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

window.portfolioGetSearchScrollY = function () {
    const values = [
        window.scrollY,
        window.pageYOffset,
        document.documentElement?.scrollTop,
        document.body?.scrollTop,
        document.getElementById('port-body')?.scrollTop,
        document.getElementById('portfolio-main-container')?.scrollTop
    ].map((value) => Number(value) || 0);

    return Math.max(...values);
};

// --- NEW Persistence Helpers for Pharmacy Search ---
window.portfolioSaveSearchStateToLocal = function(userKey) {
    if (!userKey || !window.portfolioPersistence) return;
    const searchState = window.portfolioEnsureSellerSearchState();
    const visibleCount = Math.max(0, Number(searchState.visibleCount) || 0);
    const totalMatched = Math.max(0, Number(searchState.totalMatched) || 0);

    const stateToSave = {
        query: searchState.query,
        appliedQuery: searchState.appliedQuery,
        mainCategory: searchState.mainCategory,
        appliedMainCategory: searchState.appliedMainCategory,
        subCategory: searchState.subCategory,
        appliedSubCategory: searchState.appliedSubCategory,
        sort: searchState.sort,
        appliedSort: searchState.appliedSort,
        isActive: !!searchState.isActive,
        visibleCount: Math.min(visibleCount, totalMatched || visibleCount),
        totalMatched: totalMatched,
        scrollY: typeof window.portfolioGetSearchScrollY === 'function'
            ? Math.round(window.portfolioGetSearchScrollY())
            : Math.round(window.scrollY || document.documentElement?.scrollTop || 0),
        timestamp: Date.now()
    };

    // We don't save the full 'results' array to avoid LocalDBStorage quota issues (results are already in 'search' cache type)
    window.portfolioPersistence.save(userKey, 'pharmacy_search_meta', 'current', 0, stateToSave);
};

window.portfolioLoadSearchStateFromLocal = function(userKey) {
    if (!userKey || !window.portfolioPersistence) return null;
    return window.portfolioPersistence.get(userKey, 'pharmacy_search_meta', 'current', 0);
};

window.portfolioClearSearchStateFromLocal = function(userKey) {
    if (!userKey) return;
    const searchState = window.portfolioEnsureSellerSearchState();

    // Non-destructive clear: Keep the query and filters, but mark as inactive
    searchState.isActive = false;
    searchState.results = [];
    searchState.totalMatched = 0;
    searchState.visibleCount = 0;

    window.portfolioSaveSearchStateToLocal(userKey);
    console.log(`[Diagnostic] Search marked as inactive in LocalDBStorage (Texts preserved).`);
};

window.portfolioSavePreSearchStateToLocal = function(userKey, state) {
    if (!userKey || !state) return;
    const key = `pp_pre_search_${userKey}`;
    try {
        LocalDBStorage.setItem(key, JSON.stringify(state));
    } catch (e) {
        console.warn('[Search] Failed to save pre-search state:', e);
    }
};

window.portfolioLoadPreSearchStateFromLocal = function(userKey) {
    if (!userKey) return null;
    const key = `pp_pre_search_${userKey}`;
    try {
        const saved = LocalDBStorage.getItem(key);
        return saved ? JSON.parse(saved) : null;
    } catch (e) {
        return null;
    }
};

window.portfolioClearPreSearchStateFromLocal = function(userKey) {
    if (!userKey) return;
    LocalDBStorage.removeItem(`pp_pre_search_${userKey}`);
};
