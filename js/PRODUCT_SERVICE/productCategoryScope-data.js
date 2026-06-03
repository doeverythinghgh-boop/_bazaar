/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */
/**
 * @file js/PRODUCT_SERVICE/productCategoryScope-data.js
 * @description Logic for resolving category trees and selection states based on user scope.
 */

(function () {
    'use strict';
    window.ProductCategoryScope = window.ProductCategoryScope || {};
    const core = window.ProductCategoryScope;

    async function getCategoriesData() {
        const data = window.appCategoriesList || await fetchAppCategories();
        return Array.isArray(data?.categories) ? data.categories : [];
    }

    async function getAllowedTree(_itemType, scopedFilter = null, bypassFilter = false) {
        const categories = await getCategoriesData();
        const user = core.getCurrentUser();

        const fullAccess = core.isSpecialUser(user);

        const explicitFilter = bypassFilter ? null : (scopedFilter || (typeof ProductStateManager !== 'undefined' ? ProductStateManager.getFormScopeFilter() : null));

        let filterMap;
        if (bypassFilter) {
            filterMap = null;
        } else if (explicitFilter) {
            // Prioritize explicit filter (e.g. product owner's specialties) even for admins
            filterMap = core.normalizeFilterMap(explicitFilter);
        } else if (fullAccess) {
            // Admins get full access if no explicit filter is provided
            filterMap = null;
        } else {
            // Normal users get their own business category filter
            filterMap = core.normalizeFilterMap(user?.business_category);
        }

        return categories.reduce((acc, mainCat) => {
            const mainId = String(mainCat.id);
            if (filterMap && !Object.prototype.hasOwnProperty.call(filterMap, mainId)) {
                return acc;
            }

            const allowedSubIds = filterMap ? filterMap[mainId] || [] : null;
            const subcategories = Array.isArray(mainCat.subcategories) ? mainCat.subcategories : [];

            let filteredSubs = subcategories.filter((subCat) => {
                const subId = String(subCat.id);
                return !(allowedSubIds && allowedSubIds.length > 0 && !allowedSubIds.includes(subId));
            });

            if (filterMap && allowedSubIds && allowedSubIds.length === 0 && filteredSubs.length === 0 && subcategories.length === 0) {
                acc.push({
                    id: mainId,
                    title: typeof mainCat.title === 'object'
                        ? (mainCat.title[window.app_language] || mainCat.title.ar || Object.values(mainCat.title)[0] || '')
                        : mainCat.title,
                    subcategories: []
                });
                return acc;
            }

            if (subcategories.length > 0 && filteredSubs.length === 0) {
                return acc;
            }

            const titleObj = mainCat.title;
            const mainTitle = typeof titleObj === 'object'
                ? (titleObj[window.app_language] || titleObj.ar || Object.values(titleObj)[0] || '')
                : titleObj;

            filteredSubs = filteredSubs.map((subCat) => {
                const subTitleObj = subCat.title;
                return {
                    id: String(subCat.id),
                    title: typeof subTitleObj === 'object'
                        ? (subTitleObj[window.app_language] || subTitleObj.ar || Object.values(subTitleObj)[0] || '')
                        : subTitleObj
                };
            });

            acc.push({
                id: mainId,
                title: mainTitle,
                subcategories: filteredSubs
            });
            return acc;
        }, []);
    }

    function getSelectionFromTree(tree, preferredMainId, preferredSubId) {
        if (!Array.isArray(tree) || tree.length === 0) {
            return { mainId: '', subId: '' };
        }

        const preferredMain = preferredMainId
            ? tree.find((item) => String(item.id) === String(preferredMainId))
            : null;
        const activeMain = preferredMain || tree[0];

        let activeSub = '';
        if (activeMain?.subcategories?.length) {
            const preferredSub = preferredSubId
                ? activeMain.subcategories.find((item) => String(item.id) === String(preferredSubId))
                : null;
            activeSub = preferredSub ? String(preferredSub.id) : String(activeMain.subcategories[0].id);
        }

        return {
            mainId: activeMain ? String(activeMain.id) : '',
            subId: activeSub
        };
    }

    function detectAvailableTypes(filter = null) {
        const user = core.getCurrentUser();
        const normalized = core.normalizeFilterMap(filter || (typeof ProductStateManager !== 'undefined' ? ProductStateManager.getFormScopeFilter() : null) || user?.business_category);
        const mainIds = Object.keys(normalized);
        const result = { hasProduct: false, hasService: false, hasAny: false };

        if (core.isSpecialUser(user)) {
            result.hasProduct = true;
            result.hasAny = true;
            return result;
        }

        result.hasProduct = mainIds.length > 0;
        result.hasAny = mainIds.length > 0;

        return result;
    }

    // Export methods
    window.ProductCategoryScope.getAllowedTree = getAllowedTree;
    window.ProductCategoryScope.getSelectionFromTree = getSelectionFromTree;
    window.ProductCategoryScope.detectAvailableTypes = detectAvailableTypes;
})();
