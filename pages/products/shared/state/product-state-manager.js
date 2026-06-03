/**
 * @file pages/products/shared/state/product-state-manager.js
 * @description Centralized state management for product operations.
 * Replaces global variables with a clean, encapsulated API.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


/**
 * @description Product State Manager - Centralized state management for product operations.
 * @namespace ProductStateManager
 */
const ProductStateManager = {
    _debug(event, payload, level = 'log') {
        if (window.ProductDebugConsole && typeof window.ProductDebugConsole[level] === 'function') {
            window.ProductDebugConsole[level]('product-state', event, payload);
            return;
        }

        const consoleMethod = console[level] || console.log;
        if (typeof payload === 'undefined') {
            consoleMethod.call(console, `[ProductState] ${event}`);
        } else {
            consoleMethod.call(console, `[ProductState] ${event}`, payload);
        }
    },

    /**
     * @private
     * @description Storage keys for persistence.
     */
    _KEYS: {
        PRODUCT: 'suez_bazaar_current_product',
        OPTIONS: 'suez_bazaar_view_options',
        CATEGORIES: 'suez_bazaar_selected_categories',
        REGISTRY: 'suez_bazaar_product_registry',
        FORM_SCOPE: 'suez_bazaar_form_scope_filter'
    },

    /**
     * @description Private state object.
     * @private
     * @type {object}
     */
    _state: {
        currentProduct: null,
        selectedCategories: null,
        viewOptions: null,
        registry: {},
        formScopeFilter: null
    },

    /**
     * @description Recover state from LocalDBStorage.
     * @private
     */
    _recover() {
        try {
            this._debug('recover-start');

            const productText = LocalDBStorage.getItem(this._KEYS.PRODUCT);
            if (productText) this._state.currentProduct = JSON.parse(productText);

            const optionsText = LocalDBStorage.getItem(this._KEYS.OPTIONS);
            if (optionsText) {
                const parsedOptions = JSON.parse(optionsText);
                this._state.viewOptions = Object.prototype.hasOwnProperty.call(parsedOptions || {}, 'options')
                    ? parsedOptions
                    : {
                        options: parsedOptions || {},
                        product_key: this._state.currentProduct?.product_key || null
                    };
            }

            const categoriesText = LocalDBStorage.getItem(this._KEYS.CATEGORIES);
            if (categoriesText) this._state.selectedCategories = JSON.parse(categoriesText);

            const registryText = LocalDBStorage.getItem(this._KEYS.REGISTRY);
            if (registryText) this._state.registry = JSON.parse(registryText);

            const scopeText = LocalDBStorage.getItem(this._KEYS.FORM_SCOPE);
            if (scopeText) this._state.formScopeFilter = JSON.parse(scopeText);

            this._debug('recover-complete', {
                hasCurrentProduct: !!this._state.currentProduct,
                hasSelectedCategories: !!this._state.selectedCategories,
                hasViewOptions: !!this._state.viewOptions,
                registrySize: Object.keys(this._state.registry || {}).length,
                hasFormScopeFilter: !!this._state.formScopeFilter
            });
        } catch (error) {
            this._debug('recover-error', error, 'error');
        }
    },

    /**
     * @description Save or update a product in the unified registry.
     * @function saveToRegistry
     * @param {object} productData - Mapped product data.
     * @returns {void}
     */
    saveToRegistry(productData) {
        if (!productData || !productData.product_key) {
            this._debug('save-to-registry-skipped', { reason: 'missing-product-key' }, 'warn');
            return;
        }

        const existing = this._state.registry[productData.product_key];
        const hasExistingDesc = !!(existing?.description || existing?.product_description);
        const hasIncomingDesc = !!(productData.description || productData.product_description);

        if (existing && hasExistingDesc && !hasIncomingDesc) {
            this._debug('save-to-registry-preserved-existing', { productKey: productData.product_key });
            return;
        }

        this._state.registry[productData.product_key] = {
            ...productData,
            _last_updated: Date.now()
        };

        try {
            LocalDBStorage.setItem(this._KEYS.REGISTRY, JSON.stringify(this._state.registry));
            this._debug('save-to-registry-complete', {
                productKey: productData.product_key,
                registrySize: Object.keys(this._state.registry || {}).length
            });
        } catch (error) {
            this._debug('save-to-registry-quota-warning', {
                productKey: productData.product_key,
                message: error?.message || String(error)
            }, 'warn');
            this._cleanupRegistry();
        }
    },

    /**
     * @description Retrieve a product from the unified registry.
     * @function getFromRegistry
     * @param {string} key
     * @returns {object|null}
     */
    getFromRegistry(key) {
        const value = this._state.registry[key] || null;
        this._debug('get-from-registry', {
            productKey: key,
            found: !!value
        });
        return value;
    },

    /**
     * @description Set product data for viewing/editing.
     * @function setProductForView
     * @param {object} productData - Product data object.
     * @param {object} [options={}] - View options (showAddToCart, etc).
     * @returns {void}
     */
    setProductForView(productData, options = {}) {
        this._debug('set-product-for-view-start', {
            incomingProductKey: productData?.product_key || null,
            optionKeys: Object.keys(options || {})
        });

        const mapped = (typeof window.mapProductData === 'function')
            ? window.mapProductData(productData)
            : productData;

        const normalizedOptions = {
            options: options || {},
            product_key: mapped?.product_key || null
        };

        this._state.currentProduct = mapped;
        this._state.viewOptions = normalizedOptions;

        LocalDBStorage.setItem(this._KEYS.PRODUCT, JSON.stringify(mapped));
        LocalDBStorage.setItem(this._KEYS.OPTIONS, JSON.stringify(normalizedOptions));

        this.saveToRegistry(mapped);

        this._debug('set-product-for-view-complete', {
            productKey: mapped?.product_key || null,
            optionKeys: Object.keys(normalizedOptions.options || {})
        });
    },

    /**
     * @description Get current product data.
     * @function getCurrentProduct
     * @returns {object|null} Current product data or null.
     */
    getCurrentProduct() {
        this._debug('get-current-product', {
            productKey: this._state.currentProduct?.product_key || null,
            found: !!this._state.currentProduct
        });
        return this._state.currentProduct;
    },

    /**
     * @description Get view options.
     * @returns {object} View options object.
     */
    getViewOptions(productKey = null) {
        const payload = this._state.viewOptions;
        if (!payload) {
            this._debug('get-view-options-empty', { requestedProductKey: productKey });
            return {};
        }

        if (!Object.prototype.hasOwnProperty.call(payload, 'options')) {
            this._debug('get-view-options-legacy-shape', { requestedProductKey: productKey }, 'warn');
            return payload || {};
        }

        if (productKey && payload.product_key && String(payload.product_key) !== String(productKey)) {
            this._debug('get-view-options-mismatch', {
                requestedProductKey: productKey,
                storedProductKey: payload.product_key
            }, 'warn');
            return {};
        }

        this._debug('get-view-options', {
            requestedProductKey: productKey,
            storedProductKey: payload.product_key || null,
            optionKeys: Object.keys(payload.options || {})
        });
        return payload.options || {};
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
        LocalDBStorage.setItem(this._KEYS.CATEGORIES, JSON.stringify(this._state.selectedCategories));
        this._debug('set-selected-categories', { mainId, subId });
    },

    /**
     * @description Get selected categories.
     * @function getSelectedCategories
     * @returns {object|null} Selected categories object or null.
     */
    getSelectedCategories() {
        this._debug('get-selected-categories', this._state.selectedCategories);
        return this._state.selectedCategories;
    },

    /**
     * @description Store a scoped category filter for add/edit flows.
     * @function setFormScopeFilter
     * @param {object|null} filter
     * @returns {void}
     */
    setFormScopeFilter(filter) {
        this._state.formScopeFilter = filter || null;
        if (filter) {
            LocalDBStorage.setItem(this._KEYS.FORM_SCOPE, JSON.stringify(filter));
        } else {
            LocalDBStorage.removeItem(this._KEYS.FORM_SCOPE);
        }
        this._debug('set-form-scope-filter', filter || null);
    },

    /**
     * @description Get the currently stored scoped category filter.
     * @function getFormScopeFilter
     * @returns {object|null}
     */
    getFormScopeFilter() {
        this._debug('get-form-scope-filter', this._state.formScopeFilter || null);
        return this._state.formScopeFilter || null;
    },

    /**
     * @description Internal cleanup for registry to prevent quota errors.
     * @private
     */
    _cleanupRegistry() {
        this._debug('cleanup-registry-start', {
            registrySize: Object.keys(this._state.registry || {}).length
        }, 'warn');

        const entries = Object.entries(this._state.registry);
        if (entries.length < 10) {
            this._state.registry = {};
        } else {
            entries.sort((a, b) => a[1]._last_updated - b[1]._last_updated);
            const half = Math.floor(entries.length / 2);
            for (let index = 0; index < half; index += 1) {
                delete this._state.registry[entries[index][0]];
            }
        }

        LocalDBStorage.setItem(this._KEYS.REGISTRY, JSON.stringify(this._state.registry));
        this._debug('cleanup-registry-complete', {
            registrySize: Object.keys(this._state.registry || {}).length
        });
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
            viewOptions: null,
            registry: {},
            formScopeFilter: null
        };

        LocalDBStorage.removeItem(this._KEYS.PRODUCT);
        LocalDBStorage.removeItem(this._KEYS.OPTIONS);
        LocalDBStorage.removeItem(this._KEYS.CATEGORIES);
        LocalDBStorage.removeItem(this._KEYS.REGISTRY);
        LocalDBStorage.removeItem(this._KEYS.FORM_SCOPE);

        this._debug('clear-all');
    },

    /**
     * @description Resolve category names from IDs.
     * @function resolveCategoryNames
     * @returns {Promise<{main: string, sub: string}>}
     * @async
     */
    async resolveCategoryNames() {
        const selected = this.getSelectedCategories();
        if (!selected || !selected.mainId) {
            this._debug('resolve-category-names-skipped', {
                reason: 'missing-selected-categories'
            }, 'warn');
            return { main: '', sub: '' };
        }

        try {
            this._debug('resolve-category-names-start', selected);
            const data = window.appCategoriesList || await fetchAppCategories();
            if (!data) throw new Error('Failed to load categories');

            const categories = data.categories || [];
            const mainCat = categories.find((category) => String(category.id) === String(selected.mainId));
            let mainTitle = '';
            let subTitle = '';

            if (mainCat) {
                const titleObj = mainCat.title;
                mainTitle = typeof titleObj === 'object'
                    ? (titleObj[window.app_language] || titleObj.ar)
                    : titleObj;

                if (selected.subId && mainCat.subcategories) {
                    const subCat = mainCat.subcategories.find((subcategory) => String(subcategory.id) === String(selected.subId));
                    if (subCat) {
                        const subTitleObj = subCat.title;
                        subTitle = typeof subTitleObj === 'object'
                            ? (subTitleObj[window.app_language] || subTitleObj.ar)
                            : subTitleObj;
                    }
                }
            }

            const result = { main: mainTitle, sub: subTitle };
            this._debug('resolve-category-names-complete', result);
            return result;
        } catch (error) {
            this._debug('resolve-category-names-error', error, 'error');
            return { main: '', sub: '' };
        }
    },

    /**
     * @description Get current state (for debugging).
     * @function getState
     * @returns {object} Current state object.
     */
    getState() {
        const snapshot = { ...this._state };
        this._debug('get-state', {
            hasCurrentProduct: !!snapshot.currentProduct,
            hasSelectedCategories: !!snapshot.selectedCategories,
            hasViewOptions: !!snapshot.viewOptions,
            registrySize: Object.keys(snapshot.registry || {}).length,
            hasFormScopeFilter: !!snapshot.formScopeFilter
        });
        return snapshot;
    }
};

ProductStateManager.getProductFromHistory = function getProductFromHistory(key) {
    return this.getFromRegistry(key);
};

window.ProductStateManager = ProductStateManager;
ProductStateManager._recover();
