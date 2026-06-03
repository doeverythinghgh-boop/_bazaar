/**
 * @file portfolio-search-data-filter.js
 * @description Product filtering and sorting for search.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

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
    const query = window.portfolioNormalizeSearchText ? window.portfolioNormalizeSearchText(criteria?.query) : criteria?.query;
    let filteredProducts = Array.isArray(products) ? products.slice() : [];

    if (query) {
        filteredProducts = filteredProducts.filter((product) => {
            const name = window.portfolioNormalizeSearchText ? window.portfolioNormalizeSearchText(product?.productName) : product?.productName;
            const description = window.portfolioNormalizeSearchText ? window.portfolioNormalizeSearchText(product?.product_description) : product?.product_description;
            return (name && name.includes(query)) || (description && description.includes(query));
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
