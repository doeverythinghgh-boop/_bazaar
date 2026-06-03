/** Developer note: Hover effects are prohibited in this project. This UI is designed for tablet devices, so do not add hover-based behavior. */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

/**
 * @file js/category-tree-modal-core.js
 * @description Shared state and data bootstrap for the business category tree modal.
 */

window.CategoryTreeModalState = window.CategoryTreeModalState || {
    categories: [],
    selectedData: {}
};

window.CategoryTreeModalCore = (function () {
    'use strict';

    function getState() {
        return window.CategoryTreeModalState;
    }

    async function prepareState(initialSelection = {}) {
        const state = getState();
        const normalizedInitialSelection = typeof window.normalizeBusinessCategoryMap === 'function'
            ? window.normalizeBusinessCategoryMap(initialSelection || {})
            : (initialSelection || {});
        state.selectedData = JSON.parse(JSON.stringify(normalizedInitialSelection));

        if (!state.categories || state.categories.length === 0) {
            const data = window.appCategoriesList || (typeof fetchAppCategories === 'function' ? await fetchAppCategories() : null);
            state.categories = (data && data.categories) ? data.categories : [];
        }

        return state;
    }

    function ensureCategoriesCache() {
        const state = getState();
        if (state.categories && state.categories.length > 0) return;
        const data = window.appCategoriesList;
        state.categories = (data && data.categories) ? data.categories : [];
    }

    return {
        getState,
        prepareState,
        ensureCategoriesCache
    };
})();
