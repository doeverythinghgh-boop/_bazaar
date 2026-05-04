/**
 * @file pharmacy-api-base.js
 * @description Base utilities and cache for the Pharmacy API.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 */

window.pharmacyApiCache = {
    catalogSource: null,
    referenceData: null,
    catalogContexts: new Map()
};

window.PharmacyAPI = window.PharmacyAPI || {};

window.pharmacyClone = function(value) {
    if (value == null) return value;
    return JSON.parse(JSON.stringify(value));
};

window.pharmacyNormalizeListPayload = function(result) {
    if (Array.isArray(result)) return result;
    if (Array.isArray(result?.data)) return result.data;
    if (Array.isArray(result?.categories)) return result.categories;
    if (Array.isArray(result?.products)) return result.products;
    return [];
};

window.pharmacyNormalizePreferencePayload = function(result) {
    const source = result?.data || result || {};
    return {
        hidden_main_categories: Array.isArray(source.hidden_main_categories) ? source.hidden_main_categories : [],
        hidden_sub_categories: Array.isArray(source.hidden_sub_categories) ? source.hidden_sub_categories : [],
        hidden_catalog_products: Array.isArray(source.hidden_catalog_products) ? source.hidden_catalog_products : []
    };
};

window.pharmacyMergeCatalogWithCustomCategories = function(standardCategories = [], customCategories = []) {
    const standardCopy = Array.isArray(standardCategories) ? window.pharmacyClone(standardCategories) : [];
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
};
