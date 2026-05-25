/**
 * @file pages/products/shared/api/product-data-service.js
 * @description API connection layer for products and product ratings.
 * Depends on the global `apiFetch` and related shared utilities.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


function productApiDebug(event, payload, level = 'log') {
    if (window.ProductDebugConsole && typeof window.ProductDebugConsole[level] === 'function') {
        window.ProductDebugConsole[level]('product-api', event, payload);
        return;
    }

    const consoleMethod = console[level] || console.log;
    if (typeof payload === 'undefined') {
        consoleMethod.call(console, `[ProductAPI] ${event}`);
    } else {
        consoleMethod.call(console, `[ProductAPI] ${event}`, payload);
    }
}

function summarizeProductPayload(productData) {
    return {
        productKey: productData?.product_key || null,
        userKey: productData?.user_key || null,
        mainCategory: productData?.MainCategory || null,
        subCategory: productData?.SubCategory || null,
        imageCount: String(productData?.ImageName || '')
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean).length
    };
}

function summarizeCollectionResponse(data) {
    if (Array.isArray(data)) return { kind: 'array', count: data.length };
    if (Array.isArray(data?.products)) return { kind: 'products', count: data.products.length };
    return { kind: typeof data, count: 0 };
}

function productApiCacheProducts(products, source) {
    if (!window.LocalDB || !products) return;
    const list = Array.isArray(products) ? products : [products];
    if (!list.length) return;
    window.LocalDB.saveProducts(list, source).catch((error) => {
        productApiDebug('local-products-cache-failed', {
            source,
            message: error?.message || String(error)
        }, 'warn');
    });
}

/**
 * @description Adds a new product to the database via API call.
 * @function addProduct
 * @param {object} productData
 * @returns {Promise<Object>}
 */
async function addProduct(productData) {
    productApiDebug('add-product-start', summarizeProductPayload(productData));
    const response = await apiFetch('/api/products', {
        method: 'POST',
        body: productData
    });
    productApiDebug('add-product-complete', {
        ...summarizeProductPayload(productData),
        hasError: !!response?.error
    }, response?.error ? 'warn' : 'log');
    if (!response?.error) productApiCacheProducts(response?.product || response?.data || productData, 'product-add');
    return response;
}

/**
 * @description Updates an existing product in the database via API.
 * @function updateProduct
 * @param {object} productData
 * @returns {Promise<Object>}
 */
async function updateProduct(productData) {
    productApiDebug('update-product-start', summarizeProductPayload(productData));
    const response = await apiFetch('/api/products', {
        method: 'PUT',
        body: productData
    });
    productApiDebug('update-product-complete', {
        ...summarizeProductPayload(productData),
        hasError: !!response?.error
    }, response?.error ? 'warn' : 'log');
    if (!response?.error) productApiCacheProducts(response?.product || response?.data || productData, 'product-update');
    return response;
}

/**
 * @description Deletes an existing product from the database via API.
 * @function deleteProduct_
 * @param {string} productKey
 * @returns {Promise<Object>}
 */
async function deleteProduct_(productKey) {
    productApiDebug('delete-product-start', { productKey });
    const response = await apiFetch(`/api/products?product_key=${productKey}`, {
        method: 'DELETE'
    });
    productApiDebug('delete-product-complete', {
        productKey,
        hasError: !!response?.error
    }, response?.error ? 'warn' : 'log');
    return response;
}

/**
 * @description Fetches the list of products based on the selected Main and Sub category from the API.
 * @function getProductsByCategory
 * @param {string} mainCatId
 * @param {string} subCatId
 * @returns {Promise<Array<Object>|null>}
 */
async function getProductsByCategory(mainCatId, subCatId) {
    try {
        productApiDebug('get-products-by-category-start', { mainCatId, subCatId });

        if (typeof baseURL === 'undefined' || !baseURL) {
            productApiDebug('get-products-by-category-missing-base-url', null, 'error');
            throw new Error('baseURL is not defined');
        }

        const targets = (mainCatId && typeof window.getCompatibleCategorySelections === 'function')
            ? window.getCompatibleCategorySelections(mainCatId, subCatId || '')
            : [{ mainId: mainCatId || '', subId: subCatId || '' }];

        productApiDebug('get-products-by-category-targets', targets);

        const responses = await Promise.all(targets.map(async (target) => {
            const params = new URLSearchParams();
            if (target.mainId) params.append('MainCategory', target.mainId);
            if (target.subId) params.append('SubCategory', target.subId);

            const data = await apiFetch(`/api/products?${params.toString()}`);
            if (data.error) throw new Error(data.error);

            productApiDebug('get-products-by-category-target-response', {
                target,
                summary: summarizeCollectionResponse(data)
            });

            return Array.isArray(data) ? data : (Array.isArray(data?.products) ? data.products : []);
        }));

        const merged = [];
        const seen = new Set();
        responses.flat().forEach((product) => {
            const productKey = String(product?.product_key || product?.id || '');
            if (!productKey || seen.has(productKey)) return;
            seen.add(productKey);
            merged.push(product);
        });

        productApiDebug('get-products-by-category-complete', {
            mainCatId,
            subCatId,
            resultCount: merged.length
        });
        productApiCacheProducts(merged, 'category-fetch');
        return merged;
    } catch (error) {
        productApiDebug('get-products-by-category-error', {
            mainCatId,
            subCatId,
            message: error?.message || String(error)
        }, 'error');
        return null;
    }
}

/**
 * @description Fetches all products added by a specific user (merchant) from the API.
 * @function getProductsByUser
 * @param {string} userKey
 * @param {object} [filters={}]
 * @returns {Promise<Array<Object>|null>}
 */
async function getProductsByUser(userKey, filters = {}) {
    try {
        productApiDebug('get-products-by-user-start', { userKey, filters });

        const targets = (filters.MainCategory && typeof window.getCompatibleCategorySelections === 'function')
            ? window.getCompatibleCategorySelections(filters.MainCategory, filters.SubCategory || '')
            : [{ mainId: filters.MainCategory || '', subId: filters.SubCategory || '' }];

        productApiDebug('get-products-by-user-targets', targets);

        const responses = await Promise.all(targets.map(async (target) => {
            const params = new URLSearchParams();
            params.append('user_key', userKey);

            if (filters.searchName) params.append('searchTerm', filters.searchName);
            if (target.mainId) params.append('MainCategory', target.mainId);
            if (target.subId) params.append('SubCategory', target.subId);

            const data = await apiFetch(`/api/products?${params.toString()}`);
            productApiDebug('get-products-by-user-target-response', {
                target,
                summary: summarizeCollectionResponse(data)
            });
            if (data?.error) return [];
            return Array.isArray(data) ? data : (Array.isArray(data?.products) ? data.products : []);
        }));

        const merged = [];
        const seen = new Set();
        responses.flat().forEach((product) => {
            const productKey = String(product?.product_key || product?.id || '');
            if (!productKey || seen.has(productKey)) return;
            seen.add(productKey);
            merged.push(product);
        });

        productApiDebug('get-products-by-user-complete', {
            userKey,
            resultCount: merged.length
        });
        productApiCacheProducts(merged, 'merchant-fetch');
        return merged;
    } catch (error) {
        productApiDebug('get-products-by-user-error', {
            userKey,
            filters,
            message: error?.message || String(error)
        }, 'error');
        return null;
    }
}

/**
 * @description Fetches data of a single product based on its unique key from the API.
 * @function getProductByKey
 * @param {string} productKey
 * @returns {Promise<Object|null>}
 */
async function getProductByKey(productKey, options = {}) {
    try {
        const listingType = String(options.listingType || options.listing || options.source || '').trim();
        productApiDebug('get-product-by-key-start', { productKey, listingType });
        const params = new URLSearchParams({ product_key: productKey, single: 'true' });
        if (listingType) params.set('listing', listingType);
        const data = await apiFetch(`/api/products?${params.toString()}`, {
            specialHandlers: {
                404: () => {
                    productApiDebug('get-product-by-key-not-found', { productKey }, 'warn');
                    return null;
                }
            }
        });
        productApiDebug('get-product-by-key-complete', {
            productKey,
            found: !!data,
            hasError: !!data?.error
        }, data?.error ? 'warn' : 'log');
        if (data && !data.error) productApiCacheProducts(data, 'detail-fetch');
        return data;
    } catch (error) {
        productApiDebug('get-product-by-key-error', {
            productKey,
            message: error?.message || String(error)
        }, 'error');
        return null;
    }
}

/**
 * @description Submits/updates current user's rating for a product.
 * @param {string} productKey
 * @param {string} actorUserKey
 * @param {Object} ratingData
 * @returns {Promise<Object>}
 */
async function rateProduct(productKey, actorUserKey, ratingData) {
    productApiDebug('rate-product-start', {
        productKey,
        actorUserKey,
        ratingKeys: Object.keys(ratingData || {})
    });
    const response = await apiFetch('/api/products', {
        method: 'POST',
        body: {
            action: 'rate_product',
            product_key: productKey,
            actor_user_key: actorUserKey,
            rating_data: ratingData
        }
    });
    productApiDebug('rate-product-complete', {
        productKey,
        actorUserKey,
        hasError: !!response?.error
    }, response?.error ? 'warn' : 'log');
    return response;
}

/**
 * @description Edits an existing product rating by its owner.
 * @param {string} productKey
 * @param {string} actorUserKey
 * @param {Object} ratingRef
 * @param {Object} ratingData
 * @returns {Promise<Object>}
 */
async function editProductRating(productKey, actorUserKey, ratingRef, ratingData) {
    productApiDebug('edit-rating-start', {
        productKey,
        actorUserKey,
        ratingId: ratingRef?.rating_id || null,
        ratingDate: ratingRef?.date || null
    });
    const response = await apiFetch('/api/products', {
        method: 'POST',
        body: {
            action: 'edit_product_rating',
            product_key: productKey,
            actor_user_key: actorUserKey,
            rating_id: ratingRef?.rating_id || null,
            rating_date: ratingRef?.date || null,
            rating_data: ratingData
        }
    });
    productApiDebug('edit-rating-complete', {
        productKey,
        actorUserKey,
        ratingId: ratingRef?.rating_id || null,
        hasError: !!response?.error
    }, response?.error ? 'warn' : 'log');
    return response;
}

/**
 * @description Deletes an existing product rating by its owner.
 * @param {string} productKey
 * @param {string} actorUserKey
 * @param {Object} ratingRef
 * @returns {Promise<Object>}
 */
async function deleteProductRating(productKey, actorUserKey, ratingRef) {
    productApiDebug('delete-rating-start', {
        productKey,
        actorUserKey,
        ratingId: ratingRef?.rating_id || null,
        ratingDate: ratingRef?.date || null
    });
    const response = await apiFetch('/api/products', {
        method: 'POST',
        body: {
            action: 'delete_product_rating',
            product_key: productKey,
            actor_user_key: actorUserKey,
            rating_id: ratingRef?.rating_id || null,
            rating_date: ratingRef?.date || null
        }
    });
    productApiDebug('delete-rating-complete', {
        productKey,
        actorUserKey,
        ratingId: ratingRef?.rating_id || null,
        hasError: !!response?.error
    }, response?.error ? 'warn' : 'log');
    return response;
}
