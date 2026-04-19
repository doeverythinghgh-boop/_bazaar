/**
 * @file pages/merchant-portfolio/js/portfolio-search-data.js
 * @description Seller search category/data parsing and filtering.
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

        if (sellerSubIds.length > 0 && productSubIds.length > 0) {
            finalSubIds = sellerSubIds.filter((subId) => productSubIds.includes(String(subId)));
        } else if (sellerSubIds.length > 0) {
            finalSubIds = sellerSubIds;
        } else {
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

window.portfolioGetBaseProductsForSearch = function () {
    const state = window.PortfolioStore?.getState ? window.PortfolioStore.getState() : window.portfolioState;
    const products = Array.isArray(state?.allProducts) ? state.allProducts.slice() : [];

    if (state?.showFeaturedOnly && window.portfolioFeaturedState?.featuredIds instanceof Set) {
        return products.filter((product) => {
            const productId = String(product.product_key || product.id || '');
            return window.portfolioFeaturedState.featuredIds.has(productId);
        });
    }

    return products;
};

window.portfolioSortSellerProducts = function (products, sortValue) {
    const sortedProducts = Array.isArray(products) ? products.slice() : [];
    if (sortValue === 'price-asc') {
        sortedProducts.sort((a, b) => (parseFloat(a?.product_price) || 0) - (parseFloat(b?.product_price) || 0));
    } else if (sortValue === 'price-desc') {
        sortedProducts.sort((a, b) => (parseFloat(b?.product_price) || 0) - (parseFloat(a?.product_price) || 0));
    }
    return sortedProducts;
};

window.portfolioFilterSellerProducts = function (products, criteria) {
    const query = window.portfolioNormalizeSearchText(criteria?.query);
    let filteredProducts = Array.isArray(products) ? products.slice() : [];

    if (query) {
        filteredProducts = filteredProducts.filter((product) => {
            const name = window.portfolioNormalizeSearchText(product?.productName);
            const description = window.portfolioNormalizeSearchText(product?.product_description);
            return name.includes(query) || description.includes(query);
        });
    }

    if (criteria?.mainCategory) {
        filteredProducts = filteredProducts.filter((product) => {
            const normalizedSelection = typeof window.normalizeCategorySelection === 'function'
                ? window.normalizeCategorySelection(product?.MainCategory || '', product?.SubCategory || '')
                : { mainId: String(product?.MainCategory || ''), subId: String(product?.SubCategory || '') };
            return String(normalizedSelection.mainId || '') === String(criteria.mainCategory);
        });
    }

    if (criteria?.subCategory) {
        filteredProducts = filteredProducts.filter((product) => {
            const normalizedSelection = typeof window.normalizeCategorySelection === 'function'
                ? window.normalizeCategorySelection(product?.MainCategory || '', product?.SubCategory || '')
                : { mainId: String(product?.MainCategory || ''), subId: String(product?.SubCategory || '') };
            return String(normalizedSelection.subId || '') === String(criteria.subCategory);
        });
    }

    return window.portfolioSortSellerProducts(filteredProducts, criteria?.sort || 'default');
};

window.portfolioFetchSellerSearchSource = async function (userKey) {
    if (window.portfolioPageController?.fetchAllProductsForUser) {
        return await window.portfolioPageController.fetchAllProductsForUser(userKey);
    }

    const params = new URLSearchParams();
    params.append('user_key', userKey);
    params.append('limit', '100');
    return await apiFetch(`/api/products?${params.toString()}`);
};
