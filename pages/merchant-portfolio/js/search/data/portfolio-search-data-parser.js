/**
 * @file portfolio-search-data-parser.js
 * @description Parsing logic for business categories and titles.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

window.portfolioParseBusinessCategory = function (rawCategory) {
    try {
        if (typeof window.normalizeBusinessCategoryMap === 'function') {
            return window.normalizeBusinessCategoryMap(rawCategory);
        }

        const parsed = typeof rawCategory === 'string' ? JSON.parse(rawCategory) : rawCategory;
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

        return Object.keys(parsed).reduce((result, mainId) => {
            const subIds = Array.isArray(parsed[mainId]) ? parsed[mainId].map(String) : [];
            result[String(mainId)] = subIds;
            return result;
        }, {});
    } catch (error) {
        console.warn('[Portfolio] Failed to parse business category map:', error);
        return {};
    }
};

window.portfolioResolveCategoryTitle = function (mainId, subId = null) {
    const categories = Array.isArray(window.appCategoriesList?.categories) ? window.appCategoriesList.categories : [];
    const lang = window.app_language || 'ar';
    const main = categories.find((item) => String(item.id) === String(mainId));
    if (!main) return '';

    if (!subId) {
        return typeof main.title === 'object' ? (main.title[lang] || main.title.ar || '') : (main.title || '');
    }

    const sub = Array.isArray(main.subcategories)
        ? main.subcategories.find((item) => String(item.id) === String(subId))
        : null;
    if (!sub) return '';

    return typeof sub.title === 'object' ? (sub.title[lang] || sub.title.ar || '') : (sub.title || '');
};

window.portfolioBuildSellerCategoryOptions = function (user) {
    const sellerMap = window.portfolioParseBusinessCategory(user?.business_category);
    const productMap = {};
    const state = window.PortfolioStore?.getState ? window.PortfolioStore.getState() : window.portfolioState;

    (Array.isArray(state?.allProducts) ? state.allProducts : []).forEach((product) => {
        const normalizedSelection = typeof window.normalizeCategorySelection === 'function'
            ? window.normalizeCategorySelection(product?.MainCategory || '', product?.SubCategory || '')
            : { mainId: String(product?.MainCategory || ''), subId: String(product?.SubCategory || '') };
        const mainId = String(normalizedSelection.mainId || '');
        const subId = String(normalizedSelection.subId || '');
        if (!mainId) return;
        if (!productMap[mainId]) productMap[mainId] = new Set();
        if (subId) productMap[mainId].add(subId);
    });

    const sourceMainIds = Object.keys(sellerMap).length > 0 ? Object.keys(sellerMap) : Object.keys(productMap);

    return sourceMainIds.map((mainId) => {
        const sellerSubIds = sellerMap[mainId] || [];
        const productSubIds = Array.from(productMap[mainId] || []);
        let finalSubIds = [];

        if (sellerSubIds.length > 0) {
            // ALWAYS use the merchant's configured subcategories if available.
            // Do not intersect with productSubIds because products are paginated and we may not have all of them loaded.
            finalSubIds = sellerSubIds;
        } else {
            // Fallback to extracting from products only if profile config is empty
            finalSubIds = productSubIds;
        }

        return {
            id: String(mainId),
            title: window.portfolioResolveCategoryTitle(mainId) || `Main ${mainId}`,
            subcategories: finalSubIds.map((subId) => ({
                id: String(subId),
                title: window.portfolioResolveCategoryTitle(mainId, subId) || `Sub ${subId}`
            }))
        };
    }).filter((item) => item.id);
};

window.portfolioGetSellerCategoryById = function (user, mainId) {
    return window.portfolioBuildSellerCategoryOptions(user).find((item) => item.id === String(mainId)) || null;
};

window.portfolioIsPharmacyUser = function (user) {
    const specialtyViewModel = window.PortfolioAPI?.resolveSpecialtyViewModel ? window.PortfolioAPI.resolveSpecialtyViewModel(user) : null;
    let isPharmacy = specialtyViewModel?.profile?.entries?.some((entry) => String(entry.subId) === '204');
    if (!isPharmacy && user?.business_category) {
        const bc = user.business_category;
        if (typeof bc === 'string') isPharmacy = bc.includes('"204"');
        else if (Array.isArray(bc)) isPharmacy = bc.includes('204') || bc.includes(204);
    }
    return !!isPharmacy;
};
