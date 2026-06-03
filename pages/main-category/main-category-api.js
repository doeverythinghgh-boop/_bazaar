/**
 * @file main-category-api.js
 * @description Data fetching and storage interaction for the main category page.
 * This file is loaded FIRST and declares the shared page state object.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


/**
 * @description Shared page state - declared here (first script) so all
 * subsequent modules (ui, events, init) can safely read/write it.
 * @type {{mainId: string|null, subId: string|null}}
 */
var mainCategoryState = {
    mainId: null,
    subId: null
};

/**
 * @constant
 * @type {string}
 * @description Storage key for the selected main category.
 */
var MAIN_CATEGORY_STORAGE_KEY = 'selectedMainCategory';

/**
 * @description Read the selected main category from storage.
 * @function mainCategory_getSelection
 * @returns {{id: string}|null}
 */
function mainCategory_getSelection() {
    try {
        var params = new URLSearchParams(window.location.search);
        var urlId = params.get('id') || params.get('mainId') || params.get('main_id');
        if (urlId) {
            var urlSelection = {
                id: String(urlId),
                timestamp: Date.now()
            };
            LocalDBStorage.setItem(MAIN_CATEGORY_STORAGE_KEY, JSON.stringify(urlSelection));
            return {
                id: urlSelection.id,
                virtualCategory: null
            };
        }

        var raw = LocalDBStorage.getItem(MAIN_CATEGORY_STORAGE_KEY);
        if (!raw) return null;
        var parsed = JSON.parse(raw);
        if (!parsed || !parsed.id) return null;
        return {
            id: String(parsed.id),
            virtualCategory: parsed.virtualCategory && typeof parsed.virtualCategory === 'object'
                ? parsed.virtualCategory
                : null
        };
    } catch (error) {
        console.error('[MainCategory] Failed to read selection:', error);
        return null;
    }
}

/**
 * @description Fetch categories list and return main category by ID.
 * @async
 * @function mainCategory_getMainCategoryById
 * @param {string|number} mainId - Main category ID.
 * @returns {Promise<Object|null>}
 */
async function mainCategory_getMainCategoryById(mainId) {
    try {
        var data = window.appCategoriesList || await fetchAppCategories();
        if (!data || !Array.isArray(data.categories)) return null;

        var categories = data.categories;
        for (var i = 0; i < categories.length; i++) {
            if (String(categories[i].id) === String(mainId)) {
                return categories[i];
            }
        }

        return null;
    } catch (error) {
        console.error('[MainCategory] Failed to fetch category by id:', error);
        return null;
    }
}

function mainCategory_getVirtualCategory(selection) {
    if (!selection || !selection.virtualCategory || typeof selection.virtualCategory !== 'object') {
        return null;
    }

    var virtualCategory = selection.virtualCategory;
    if (String(virtualCategory.id) !== String(selection.id)) {
        return null;
    }

    return virtualCategory;
}

async function mainCategory_getVirtualCategoryById(categoryId) {
    if (String(categoryId) !== 'beauty-store-home') {
        return null;
    }

    try {
        var data = window.appCategoriesList || await fetchAppCategories();
        var categories = data && Array.isArray(data.categories) ? data.categories : [];
        var featuredBrandIds = ['44', '45', '23'];
        var featuredBrands = featuredBrandIds
            .map(function (id) {
                return categories.find(function (item) {
                    return String(item.id) === id;
                });
            })
            .filter(Boolean);

        if (featuredBrands.length !== featuredBrandIds.length) {
            return null;
        }

        var beautyStoreAr = mainCategory_translateOrFallback('cat_beauty_store_title', '');
        var beautyStoreEn = mainCategory_translateOrFallback('cat_beauty_store_title_en', '');

        return {
            id: 'beauty-store-home',
            title: {
                ar: beautyStoreAr,
                en: beautyStoreEn
            },
            icon: 'fas fa-store',
            image: 'Beauty Store.webp',
            subcategories: featuredBrands.map(function (brand) {
                return {
                    id: 'beauty-store-brand-' + brand.id,
                    title: brand.title,
                    icon: brand.icon || 'fas fa-store',
                    image: brand.image,
                    imageBasePath: 'mainCategories',
                    targetMainCategoryId: String(brand.id)
                };
            }),
            isVirtualHomeCategory: true
        };
    } catch (error) {
        console.error('[MainCategory] Failed to build virtual category:', error);
        return null;
    }
}

function mainCategory_translateOrFallback(key, fallback) {
    if (typeof window.langu !== 'function') return fallback;

    var translated = window.langu(key);
    if (!translated || translated === key) return fallback;

    return translated;
}

/**
 * @description Fetch subcategory object by IDs.
 * @async
 * @function mainCategory_getSubcategoryById
 * @param {string|number} mainId - Main category ID.
 * @param {string|number} subId - Subcategory ID.
 * @returns {Promise<Object|null>}
 */
async function mainCategory_getSubcategoryById(mainId, subId) {
    try {
        var category = await mainCategory_getMainCategoryById(mainId);
        if (!category || !Array.isArray(category.subcategories)) return null;

        for (var i = 0; i < category.subcategories.length; i++) {
            if (String(category.subcategories[i].id) === String(subId)) {
                return category.subcategories[i];
            }
        }

        return null;
    } catch (error) {
        console.error('[MainCategory] Failed to get subcategory by id:', error);
        return null;
    }
}

/**
 * @description Fetch products for selected category and subcategory.
 * @async
 * @function mainCategory_getProductsByCategory
 * @param {string|number} mainId - Main category ID.
 * @param {string|number} subId - Subcategory ID.
 * @returns {Promise<Array<Object>>}
 */
async function mainCategory_getProductsByCategory(mainId, subId) {
    try {
        if (typeof baseURL === 'undefined' || !baseURL) {
            throw new Error('baseURL is not defined');
        }

        if (typeof apiFetch === 'undefined') {
            throw new Error('apiFetch is not defined');
        }

        var targets = (mainId && typeof window.getCompatibleCategorySelections === 'function')
            ? window.getCompatibleCategorySelections(mainId, subId || '')
            : [{ mainId: mainId || '', subId: subId || '' }];

        var responses = await Promise.all(targets.map(async function (target) {
            var params = new URLSearchParams();
            params.append('MainCategory', target.mainId);
            if (target.subId) params.append('SubCategory', target.subId);

            var data = await apiFetch('/api/products?' + params.toString());
            if (data && data.error) throw new Error(data.error);

            if (Array.isArray(data)) return data;
            if (data && Array.isArray(data.products)) return data.products;
            return [];
        }));

        var merged = [];
        var seen = {};
        responses.flat().forEach(function (product) {
            var key = String(product && (product.product_key || product.id || ''));
            if (!key || seen[key]) return;
            seen[key] = true;
            merged.push(product);
        });

        return merged;
    } catch (error) {
        console.error('[MainCategory] Failed to fetch products:', error);
        return [];
    }
}

/**
 * @description Fetch merchants/providers for selected main category.
 * @async
 * @function mainCategory_getMerchantsByMainCategory
 * @param {string|number} mainId - Main category ID.
 * @returns {Promise<Array<Object>>}
 */
async function mainCategory_getMerchantsByMainCategory(mainId) {
    try {
        if (typeof baseURL === 'undefined' || !baseURL) {
            throw new Error('baseURL is not defined');
        }

        if (typeof apiFetch === 'undefined') {
            throw new Error('apiFetch is not defined');
        }

        var params = new URLSearchParams();
        params.append('mode', 'category_search');
        params.append('main_id', String(mainId));

        var data = await apiFetch('/api/users?' + params.toString());
        if (data && data.error) throw new Error(data.error);

        if (Array.isArray(data)) return data;
        return [];
    } catch (error) {
        console.error('[MainCategory] Failed to fetch merchants:', error);
        return [];
    }
}
