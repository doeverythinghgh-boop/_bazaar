/**
 * @file js/PRODUCT_SERVICE/productStateManager.js
 * @description Centralized state management for product operations.
 * Replaces global variables with a clean, encapsulated API.
 */

/**
 * @description Product State Manager - Centralized state management for product operations.
 * @namespace ProductStateManager
 */
const ProductStateManager = {
    /**
     * @private
     * @description Storage keys for persistence.
     */
    _KEYS: {
        PRODUCT: 'suez_bazaar_current_product',
        OPTIONS: 'suez_bazaar_view_options',
        CATEGORIES: 'suez_bazaar_selected_categories'
    },

    /**
     * @description Private state object.
     * @private
     * @type {object}
     */
    _state: {
        currentProduct: null,
        selectedCategories: null,
        viewOptions: null
    },

    /**
     * @description Recover state from localStorage.
     * @private
     */
    _recover() {
        try {
            const p = localStorage.getItem(this._KEYS.PRODUCT);
            if (p) this._state.currentProduct = JSON.parse(p);

            const o = localStorage.getItem(this._KEYS.OPTIONS);
            if (o) this._state.viewOptions = JSON.parse(o);

            const c = localStorage.getItem(this._KEYS.CATEGORIES);
            if (c) this._state.selectedCategories = JSON.parse(c);
        } catch (e) {
            console.error('[ProductState] Error recovering state:', e);
        }
    },

    /**
     * @description Set product data for viewing/editing.
     * @function setProductForView
     * @param {object} productData - Product data object.
     * @param {object} [options={}] - View options (showAddToCart, etc).
     * @returns {void}
     */
    setProductForView(productData, options = {}) {
        this._state.currentProduct = productData;
        this._state.viewOptions = options;

        localStorage.setItem(this._KEYS.PRODUCT, JSON.stringify(productData));
        localStorage.setItem(this._KEYS.OPTIONS, JSON.stringify(options));

        console.log('[ProductState] تم تعيين بيانات المنتج وحفظها في التخزين:', productData);
    },

    /**
     * @description Get current product data.
     * @function getCurrentProduct
     * @returns {object|null} Current product data or null.
     */
    getCurrentProduct() {
        return this._state.currentProduct;
    },

    /**
     * @description Get view options.
     * @function getViewOptions
     * @returns {object} View options object.
     */
    getViewOptions() {
        return this._state.viewOptions || {};
    },

    /**
     * @description Set selected categories for add/edit operations.
     * @function setSelectedCategories
     * @param {number} mainId - Main category ID.
     * @param {number} subId - Sub category ID.
     * @returns {void}
     */
    setSelectedCategories(mainId, subId) {
        this._state.selectedCategories = { mainId, subId };
        localStorage.setItem(this._KEYS.CATEGORIES, JSON.stringify(this._state.selectedCategories));
        console.log('[ProductState] تم تعيين الفئات المختارة وحفظها:', { mainId, subId });
    },

    /**
     * @description Get selected categories.
     * @function getSelectedCategories
     * @returns {object|null} Selected categories object or null.
     */
    getSelectedCategories() {
        return this._state.selectedCategories;
    },

    /**
     * @description Clear all state.
     * @function clear
     * @returns {void}
     */
    clear() {
        this._state = {
            currentProduct: null,
            selectedCategories: null,
            viewOptions: null
        };
        localStorage.removeItem(this._KEYS.PRODUCT);
        localStorage.removeItem(this._KEYS.OPTIONS);
        localStorage.removeItem(this._KEYS.CATEGORIES);
        console.log('[ProductState] تم مسح جميع البيانات من الذاكرة والتخزين');
    },

    /**
     * @description Resolve category names from IDs.
     * @function resolveCategoryNames
     * @returns {Promise<{main: string, sub: string}>} Object with main and sub category titles.
     * @async
     */
    async resolveCategoryNames() {
        const selected = this.getSelectedCategories();
        if (!selected || !selected.mainId || !selected.subId) return { main: '', sub: '' };

        try {
            // Use global categories list if available, otherwise fetch
            const data = window.appCategoriesList || await fetchAppCategories();
            if (!data) throw new Error('Failed to load categories');
            const categories = data.categories || [];

            const mainCat = categories.find(c => String(c.id) === String(selected.mainId));
            let mainTitle = '';
            let subTitle = '';

            if (mainCat) {
                const titleObj = mainCat.title;
                mainTitle = typeof titleObj === 'object' ?
                    (titleObj[window.app_language] || titleObj['ar']) : titleObj;

                if (mainCat.subcategories) {
                    const subCat = mainCat.subcategories.find(s => String(s.id) === String(selected.subId));
                    if (subCat) {
                        const subTitleObj = subCat.title;
                        subTitle = typeof subTitleObj === 'object' ?
                            (subTitleObj[window.app_language] || subTitleObj['ar']) : subTitleObj;
                    }
                }
            }

            return {
                main: mainTitle,
                sub: subTitle
            };
        } catch (error) {
            console.error('[ProductState] Error resolving category names:', error);
            return { main: '', sub: '' };
        }
    },

    /**
     * @description Get current state (for debugging).
     * @function getState
     * @returns {object} Current state object.
     */
    getState() {
        return { ...this._state };
    }
};

// Make it globally available
window.ProductStateManager = ProductStateManager;

// Auto-recover state on load
ProductStateManager._recover();
