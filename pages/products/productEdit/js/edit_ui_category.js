/**
 * @file pages/productEdit/js/edit_ui_category.js
 * @description Category selector rendering and category-driven page refresh for Product Edit.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


const EDIT_CATEGORY_SELECTION_PREFIX = 'suez_bazaar_edit_category_';

function EDIT_getProductKeyFromRouteOrState(currentProduct = null) {
    const params = new URLSearchParams(window.location.search);
    return currentProduct?.product_key || params.get('product_key') || params.get('key') || params.get('id') || params.get('car_key') || params.get('real_estate_key') || null;
}

function EDIT_loadPersistedCategorySelection(productKey) {
    if (!productKey) return null;
    try {
        const raw = LocalDBStorage.getItem(`${EDIT_CATEGORY_SELECTION_PREFIX}${productKey}`);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed?.mainId || !parsed?.subId) return null;
        return parsed;
    } catch (error) {
        console.warn('[Edit][CategoryUI] Failed to load persisted category selection:', error);
        return null;
    }
}

function EDIT_persistCategorySelection(productKey, mainId, subId) {
    if (!productKey || !mainId || !subId) return;
    try {
        LocalDBStorage.setItem(`${EDIT_CATEGORY_SELECTION_PREFIX}${productKey}`, JSON.stringify({
            mainId,
            subId,
            savedAt: Date.now()
        }));
    } catch (error) {
        console.warn('[Edit][CategoryUI] Failed to persist category selection:', error);
    }
}

window.EDIT_persistCategorySelection = EDIT_persistCategorySelection;

function EDIT_getCurrentCategorySelection(currentProduct = null) {
    const mainSelect = document.getElementById('edit_category_display_main_select');
    const subSelect = document.getElementById('edit_category_display_sub_select');
    const selected = ProductStateManager?.getSelectedCategories?.() || {};
    const specialtyConfig = window.ProductSpecialtyListingBridge?.getConfig?.(currentProduct) || null;
    const pharmacyFallback = window.ProductPharmacyBridge?.isPharmacyProduct?.(currentProduct)
        ? { mainId: '20', subId: '204' }
        : null;

    return {
        mainId: mainSelect?.value || selected.mainId || currentProduct?.MainCategory || specialtyConfig?.mainCategory || pharmacyFallback?.mainId || null,
        subId: subSelect?.value || selected.subId || currentProduct?.SubCategory || specialtyConfig?.defaultSubCategory || pharmacyFallback?.subId || null
    };
}

window.EDIT_getCurrentCategorySelection = EDIT_getCurrentCategorySelection;

async function EDIT_applyCategoryDrivenUi() {
    if (typeof window.ProductCategoryPageCore === 'undefined') {
        return null;
    }

    const currentProduct = ProductStateManager?.getCurrentProduct?.() || null;
    const selected = EDIT_getCurrentCategorySelection(currentProduct);
    const mainId = selected.mainId;
    const subId = selected.subId;
    const productKey = EDIT_getProductKeyFromRouteOrState(currentProduct);
    if (typeof ProductStateManager !== 'undefined' && mainId && subId) {
        ProductStateManager.setSelectedCategories(mainId, subId);
        EDIT_persistCategorySelection(productKey, mainId, subId);
    }
    const payload = {
        mainId,
        subId,
        productKey
    };
    if (window.ProductCategoryLogger) window.ProductCategoryLogger.info('EditPage', 'apply-category-driven-ui', payload);
    else console.log('[Edit][CategoryUI] apply-category-driven-ui', payload);
    return window.ProductCategoryPageCore.applyEditPage(mainId, subId);
}

async function EDIT_renderCategories() {
    try {
        if (typeof window.ProductCategoryScope === 'undefined') return;
        const currentProduct = ProductStateManager?.getCurrentProduct?.() || null;
        const productKey = EDIT_getProductKeyFromRouteOrState(currentProduct);
        const specialtyConfig = window.ProductSpecialtyListingBridge?.getConfig?.(currentProduct) || null;
        const pharmacyFallback = window.ProductPharmacyBridge?.isPharmacyProduct?.(currentProduct)
            ? { mainId: '20', subId: '204' }
            : null;
        const persistedCategories = EDIT_loadPersistedCategorySelection(productKey) || {};
        const selectedCategories = ProductStateManager?.getSelectedCategories?.() || {};
        const preferredMainId = persistedCategories.mainId || selectedCategories.mainId || currentProduct?.MainCategory || specialtyConfig?.mainCategory || pharmacyFallback?.mainId || null;
        const preferredSubId = persistedCategories.subId || selectedCategories.subId || currentProduct?.SubCategory || specialtyConfig?.defaultSubCategory || pharmacyFallback?.subId || null;

        const includePreferredCategory = (rawFilter) => {
            const normalized = window.ProductCategoryScope.normalizeFilterMap(rawFilter);
            const mainId = preferredMainId ? String(preferredMainId) : '';
            const subId = preferredSubId ? String(preferredSubId) : '';
            if (!mainId || mainId === 'undefined' || mainId === 'null' || mainId === 'NaN') return normalized;

            if (!normalized[mainId]) {
                normalized[mainId] = subId && subId !== 'undefined' && subId !== 'null' && subId !== 'NaN' ? [subId] : [];
            } else if (subId && subId !== 'undefined' && subId !== 'null' && subId !== 'NaN' && !normalized[mainId].includes(subId)) {
                normalized[mainId].push(subId);
            }
            return normalized;
        };

        if (currentProduct && currentProduct.user_key) {
            try {
                let ownerData = await window.apiFetch(`/api/users?user_key=${currentProduct.user_key}`);
                if (Array.isArray(ownerData)) {
                    ownerData = ownerData[0];
                }
                if (ownerData && !ownerData.error && ownerData.business_category) {
                    if (typeof ProductStateManager !== 'undefined') {
                        ProductStateManager.setFormScopeFilter(includePreferredCategory(ownerData.business_category));
                        if (window.ProductCategoryLogger) window.ProductCategoryLogger.info('EditPage', 'applied-owner-specialty-filter');
                    }
                }
            } catch (fetchErr) {
                console.warn('[Edit][CategoryUI] Failed to fetch product owner specialties:', fetchErr);
            }
        } else if (typeof ProductStateManager !== 'undefined') {
            ProductStateManager.setFormScopeFilter(includePreferredCategory(ProductStateManager.getFormScopeFilter?.() || null));
        }

        const payload = {
            productKey,
            mainId: preferredMainId,
            subId: preferredSubId
        };
        if (window.ProductCategoryLogger) window.ProductCategoryLogger.info('EditPage', 'render-categories-start', payload);
        else console.log('[Edit][CategoryUI] render-categories-start', payload);
        const selectorResult = await window.ProductCategoryScope.renderSelector({
            containerId: 'edit_category_display',
            inputClass: 'edit-product-modal__input',
            mainLabel: 'القسم الرئيسي',
            subLabel: 'القسم الفرعي',
            preferredMainId,
            preferredSubId,
            emptyMessage: 'لا توجد أقسام متاحة ضمن نطاق هذا الحساب.'
        });

        if (typeof ProductStateManager !== 'undefined' && preferredMainId && preferredSubId) {
            ProductStateManager.setSelectedCategories(preferredMainId, preferredSubId);
            EDIT_persistCategorySelection(productKey, preferredMainId, preferredSubId);
        }

        await EDIT_applyCategoryDrivenUi();
        if (window.ProductCategoryLogger) window.ProductCategoryLogger.info('EditPage', 'initial-category-ui-applied');
        else console.log('[Edit][CategoryUI] initial-category-ui-applied');

        const refresh = async () => {
            if (window.ProductCategoryLogger) window.ProductCategoryLogger.info('EditPage', 'selector-change-detected');
            else console.log('[Edit][CategoryUI] selector-change-detected');

            // 1. Capture current data before switching key
            let currentData = null;
            if (typeof window.ProductDraftManager !== 'undefined' && typeof EDIT_collectDraftData === 'function') {
                currentData = await EDIT_collectDraftData();
            }

            // 2. Perform the category UI switch
            await EDIT_applyCategoryDrivenUi();

            // 3. Migrate draft to new key
            if (currentData && currentData.mainId && currentData.subId) {
                const selected = (typeof ProductStateManager !== 'undefined') ? ProductStateManager.getSelectedCategories() : {};
                if (selected.mainId && selected.subId) {
                    EDIT_persistCategorySelection(productKey, selected.mainId, selected.subId);
                    const newKey = window.ProductDraftManager.generateKey(currentData.providerKey, currentData.productKey, selected.mainId, selected.subId);
                    const oldKey = window.ProductDraftManager.generateKey(currentData.providerKey, currentData.productKey, currentData.mainId, currentData.subId);

                    // Update data with new IDs and save
                    currentData.mainId = selected.mainId;
                    currentData.subId = selected.subId;
                    window.ProductDraftManager.saveDraft(newKey, currentData);

                    // Only clear old draft if the key actually changed
                    if (newKey !== oldKey) {
                        window.ProductDraftManager.clearDraft(oldKey);
                        console.log('[Edit][CategoryUI] Draft migrated to new category key.');
                    }
                }
            }

            // 4. Restore (this ensures any fields that might have been different are synced)
            if (typeof EDIT_restoreDraft === 'function') {
                await EDIT_restoreDraft();
            }

            if (window.ProductCategoryLogger) window.ProductCategoryLogger.info('EditPage', 'selector-change-applied');
            else console.log('[Edit][CategoryUI] selector-change-applied');
        };

        selectorResult?.mainSelect?.addEventListener('change', refresh);
        selectorResult?.subSelect?.addEventListener('change', refresh);
    } catch (error) {
        console.error('[Edit] Error rendering categories:', error);
    }
}


// Removed immediate call: initialization is now handled explicitly by edit_init.js
// to ensure proper product state recovery before rendering.
// EDIT_renderCategories();
