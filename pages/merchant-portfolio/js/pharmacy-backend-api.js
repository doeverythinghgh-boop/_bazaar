/**
 * @file pages/merchant-portfolio/js/pharmacy-backend-api.js
 * @description Shared pharmacy data access layer used by both the control panel and merchant storefront.
 * @docs See pharmacy-db-schema.md for database setup.
 */

const pharmacyApiCache = {
    catalogSource: null,
    referenceData: null,
    catalogContexts: new Map()
};

function pharmacyClone(value) {
    if (value == null) return value;
    return JSON.parse(JSON.stringify(value));
}

function pharmacyNormalizeListPayload(result) {
    if (Array.isArray(result)) return result;
    if (Array.isArray(result?.data)) return result.data;
    if (Array.isArray(result?.categories)) return result.categories;
    if (Array.isArray(result?.products)) return result.products;
    return [];
}

function pharmacyNormalizePreferencePayload(result) {
    const source = result?.data || result || {};
    return {
        hidden_main_categories: Array.isArray(source.hidden_main_categories) ? source.hidden_main_categories : [],
        hidden_sub_categories: Array.isArray(source.hidden_sub_categories) ? source.hidden_sub_categories : [],
        hidden_catalog_products: Array.isArray(source.hidden_catalog_products) ? source.hidden_catalog_products : []
    };
}

function pharmacyMergeCatalogWithCustomCategories(standardCategories = [], customCategories = []) {
    const standardCopy = Array.isArray(standardCategories) ? pharmacyClone(standardCategories) : [];
    const customList = Array.isArray(customCategories) ? customCategories : [];

    standardCopy.forEach(std => {
        const customSubsForStandard = customList.filter(category =>
            category &&
            category.level === 'SUB' &&
            String(category.parent_id) === String(std.id)
        );

        if (!customSubsForStandard.length) return;
        if (!Array.isArray(std.sub)) std.sub = [];

        customSubsForStandard.forEach(customSub => {
            if (std.sub.some(sub => String(sub.id) === String(customSub.id))) return;

            std.sub.push({
                id: String(customSub.id),
                title: customSub.title_ar,
                name_en: customSub.title_en,
                isCustom: true
            });
        });
    });

    const customMainCategories = customList
        .filter(category => category && category.level === 'MAIN')
        .map(category => ({
            id: String(category.id),
            title: category.title_ar,
            name_en: category.title_en,
            icon: category.icon || 'fas fa-folder-open',
            isCustom: true,
            sub: customList
                .filter(sub => sub && sub.level === 'SUB' && String(sub.parent_id) === String(category.id))
                .map(sub => ({
                    id: String(sub.id),
                    title: sub.title_ar,
                    name_en: sub.title_en,
                    isCustom: true
                }))
        }));

    return [...standardCopy, ...customMainCategories];
}

const PharmacyAPI = {
    getPreferences: async function (userKey) {
        try {
            const endpoint = `/api/pharmacy/preferences?user_key=${encodeURIComponent(userKey)}`;
            const result = await apiFetch(endpoint);

            if (result && result.error) throw new Error(result.error);
            return pharmacyNormalizePreferencePayload(result);
        } catch (error) {
            console.error("PharmacyAPI Error (getPreferences):", error);
            return { hidden_main_categories: [], hidden_sub_categories: [], hidden_catalog_products: [] };
        }
    },

    savePreferences: async function (userKey, preferencesData) {
        try {
            return await apiFetch(`/api/pharmacy/preferences`, {
                method: 'POST',
                body: { user_key: userKey, data: preferencesData }
            });
        } catch (error) {
            console.error("PharmacyAPI Error (savePreferences):", error);
            throw error;
        }
    },

    getCustomCategories: async function (userKey) {
        try {
            const result = await apiFetch(`/api/pharmacy/custom-categories?user_key=${encodeURIComponent(userKey)}`);
            if (result && result.error) throw new Error(result.error);
            return pharmacyNormalizeListPayload(result);
        } catch (error) {
            console.error("PharmacyAPI Error (getCustomCategories):", error);
            return [];
        }
    },

    addCustomCategory: async function (categoryData) {
        try {
            const result = await apiFetch(`/api/pharmacy/custom-categories`, {
                method: 'POST',
                body: categoryData
            });
            if (categoryData?.user_key) this.invalidateCatalogContext(categoryData.user_key);
            return result;
        } catch (error) {
            console.error("PharmacyAPI Error (addCustomCategory):", error);
            throw error;
        }
    },

    deleteCustomCategory: async function (userKey, categoryId) {
        try {
            const result = await apiFetch(`/api/pharmacy/custom-categories?id=${encodeURIComponent(categoryId)}`, {
                method: 'DELETE'
            });
            if (userKey) this.invalidateCatalogContext(userKey);
            return result;
        } catch (error) {
            console.error("PharmacyAPI Error (deleteCustomCategory):", error);
            throw error;
        }
    },

    updateCustomCategory: async function (categoryData) {
        try {
            const result = await apiFetch(`/api/pharmacy/custom-categories`, {
                method: 'PUT',
                body: categoryData
            });
            if (categoryData?.user_key) this.invalidateCatalogContext(categoryData.user_key);
            return result;
        } catch (error) {
            console.error("PharmacyAPI Error (updateCustomCategory):", error);
            throw error;
        }
    },

    getProductMetadata: async function (productId) {
        try {
            return await apiFetch(`/api/pharmacy/product-metadata?product_id=${encodeURIComponent(productId)}`);
        } catch (error) {
            console.error("PharmacyAPI Error (getProductMetadata):", error);
            throw error;
        }
    },

    saveProductMetadata: async function (metadata) {
        try {
            return await apiFetch(`/api/pharmacy/product-metadata`, {
                method: 'POST',
                body: metadata
            });
        } catch (error) {
            console.error("PharmacyAPI Error (saveProductMetadata):", error);
            throw error;
        }
    },

    updateProductMetadata: async function (metadata) {
        try {
            return await apiFetch(`/api/pharmacy/product-metadata`, {
                method: 'PUT',
                body: metadata
            });
        } catch (error) {
            console.error("PharmacyAPI Error (updateProductMetadata):", error);
            throw error;
        }
    },

    deleteProductMetadata: async function (productId, userKey) {
        try {
            return await apiFetch(`/api/pharmacy/product-metadata?product_id=${encodeURIComponent(productId)}&merchant_key=${encodeURIComponent(userKey)}`, {
                method: 'DELETE'
            });
        } catch (error) {
            console.error("PharmacyAPI Error (deleteProductMetadata):", error);
            throw error;
        }
    },

    getCatalogSource: async function () {
        try {
            if (pharmacyApiCache.catalogSource) {
                return pharmacyClone(pharmacyApiCache.catalogSource);
            }

            const response = await fetch('/shared/pharmList.json');
            if (!response.ok) throw new Error("Failed to load catalog source");

            pharmacyApiCache.catalogSource = await response.json();
            return pharmacyClone(pharmacyApiCache.catalogSource);
        } catch (error) {
            console.error("PharmacyAPI Error (getCatalogSource):", error);
            return [];
        }
    },

    getProductsBySubCategory: async function (userKey, subCatId) {
        try {
            const endpoint = `/api/pharmacy/sub-category-products?user_key=${encodeURIComponent(userKey)}&sub_id=${encodeURIComponent(subCatId)}`;
            const result = await apiFetch(endpoint);
            if (result && result.error) throw new Error(result.error);
            return pharmacyNormalizeListPayload(result);
        } catch (error) {
            console.error("PharmacyAPI Error (getProductsBySubCategory):", error);
            return [];
        }
    },

    getReferenceData: async function () {
        try {
            if (pharmacyApiCache.referenceData) {
                return pharmacyClone(pharmacyApiCache.referenceData);
            }

            const response = await fetch('/shared/pharmList/reference_data.json');
            if (!response.ok) throw new Error("Failed to load pharmacy reference data");

            pharmacyApiCache.referenceData = await response.json();
            return pharmacyClone(pharmacyApiCache.referenceData);
        } catch (error) {
            console.error("PharmacyAPI Error (getReferenceData):", error);
            return {};
        }
    },

    getMergedCategories: function (catalogSource = [], customCategories = []) {
        return pharmacyMergeCatalogWithCustomCategories(catalogSource, customCategories);
    },

    getPreferenceSets: function (preferences = {}) {
        const normalized = pharmacyNormalizePreferencePayload(preferences);
        return {
            hiddenMain: new Set(normalized.hidden_main_categories.map(id => String(id))),
            hiddenSub: new Set(normalized.hidden_sub_categories.map(id => String(id))),
            hiddenProducts: new Set(normalized.hidden_catalog_products.map(id => String(id)))
        };
    },

    getCatalogContext: async function (userKey, options = {}) {
        const cacheKey = String(userKey || 'guest_user');
        const forceReload = options.force === true;

        if (!forceReload && pharmacyApiCache.catalogContexts.has(cacheKey)) {
            return pharmacyClone(pharmacyApiCache.catalogContexts.get(cacheKey));
        }

        const [catalogSource, customCategories, preferences] = await Promise.all([
            this.getCatalogSource(),
            userKey ? this.getCustomCategories(userKey) : Promise.resolve([]),
            userKey ? this.getPreferences(userKey) : Promise.resolve({ hidden_main_categories: [], hidden_sub_categories: [], hidden_catalog_products: [] })
        ]);

        const mergedCategories = this.getMergedCategories(catalogSource, customCategories);
        const preferenceSets = this.getPreferenceSets(preferences);

        const context = {
            userKey: cacheKey,
            catalogSource,
            customCategories,
            preferences: pharmacyNormalizePreferencePayload(preferences),
            mergedCategories,
            hiddenMainIds: Array.from(preferenceSets.hiddenMain),
            hiddenSubIds: Array.from(preferenceSets.hiddenSub),
            hiddenProductIds: Array.from(preferenceSets.hiddenProducts)
        };

        pharmacyApiCache.catalogContexts.set(cacheKey, pharmacyClone(context));
        return pharmacyClone(context);
    },

    invalidateCatalogContext: function (userKey) {
        if (!userKey) return;
        pharmacyApiCache.catalogContexts.delete(String(userKey));
    },

    fetchMerchantProducts: async function (userKey) {
        try {
            const result = await apiFetch(`/api/pharmacy/product-metadata?merchant_key=${encodeURIComponent(userKey)}`);
            if (result && result.error) throw new Error(result.error);
            return pharmacyNormalizeListPayload(result);
        } catch (error) {
            console.error("PharmacyAPI Error (fetchMerchantProducts):", error);
            return [];
        }
    },

    saveMerchantProduct: async function (productData) {
        const isUpdate = !!productData?.product_id;
        const method = isUpdate ? 'PUT' : 'POST';
        const result = await apiFetch(`/api/pharmacy/product-metadata`, {
            method,
            body: productData
        });

        if (result && result.error) {
            throw new Error(result.error);
        }

        if (productData?.merchant_key) {
            this.invalidateCatalogContext(productData.merchant_key);
        }

        return result || null;
    },

    getSubCategoryStaticProducts: async function (subCatId) {
        try {
            const catalog = await this.getCatalogSource();
            const mainCat = catalog.find(main => Array.isArray(main.sub) && main.sub.some(sub => String(sub.id) === String(subCatId)));
            if (!mainCat?.dataFile) return [];

            const response = await fetch('/' + String(mainCat.dataFile).replace(/^\/+/, ''));
            if (!response.ok) return [];

            const data = await response.json();
            const subData = Array.isArray(data?.sub)
                ? data.sub.find(sub => String(sub.id) === String(subCatId))
                : null;

            return Array.isArray(subData?.active_ingredients) ? subData.active_ingredients : [];
        } catch (error) {
            console.error("PharmacyAPI Error (getSubCategoryStaticProducts):", error);
            return [];
        }
    },

    clearCache: function () {
        pharmacyApiCache.catalogSource = null;
        pharmacyApiCache.referenceData = null;
        pharmacyApiCache.catalogContexts.clear();
    }
};

window.PharmacyAPI = PharmacyAPI;
