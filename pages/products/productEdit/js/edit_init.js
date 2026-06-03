/**
 * @file pages/productEdit/js/edit_init.js
 * @description Initializes the product edit form, populates data, and triggers image loading.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


/**
 * @function initializeEditProductForm
 * @description Initializes the product edit form by populating it with data from `ProductStateManager`.
 */
async function initializeEditProductForm() {
    if (window.EDIT_isInitializingProductForm) {
        console.log('[ProductEdit] Initialization already in progress.');
        return;
    }

    window.EDIT_isInitializingProductForm = true;

    try {
    console.log('[ProductEdit] initializing ...');

    const params = new URLSearchParams(window.location.search);
    const urlKey = params.get('product_key') || params.get('key') || params.get('id') || params.get('car_key') || params.get('real_estate_key');
    const providerKey = params.get('provider_key') || params.get('m') || params.get('merchant_key');
    const sourceType = (params.get('source') || '').trim().toLowerCase();
    const rawListingType = params.get('listing') || params.get('listing_type') || sourceType
        || (params.get('car_key') ? 'car' : (params.get('real_estate_key') ? 'real_estate' : ''));
    const listingType = ['car', 'cars', 'real_estate', 'real-estate', 'realestate'].includes(String(rawListingType || '').toLowerCase())
        ? rawListingType
        : '';
    const isPharmacyRoute = params.get('pharmacy') === '1' || sourceType === 'pharmacy' || !!params.get('pharmacy_product_id');
    const dataListingType = isPharmacyRoute ? 'pharmacy' : listingType;

    if (!urlKey || !providerKey) {
        console.error('[ProductEdit] Missing provider_key or product_key in URL. Redirecting to home.');
        window.location.replace('/');
        return;
    }

    const dom = EDIT_getDomElements();
    let currentProduct = (typeof ProductStateManager !== 'undefined') ? ProductStateManager.getCurrentProduct() : null;
    if (currentProduct?.product_key && String(currentProduct.product_key) !== String(urlKey)) {
        currentProduct = null;
    }

    if (typeof getProductByKey === 'function') {
        try {
            const freshProduct = await getProductByKey(urlKey, { listingType: dataListingType });
            if (freshProduct && !freshProduct.error) {
                const mappedProduct = window.ProductModel
                    ? window.ProductModel.normalize(freshProduct)
                    : freshProduct;
                if (mappedProduct) {
                    const currentOptions = ProductStateManager?.getViewOptions?.(urlKey) || {};
                    ProductStateManager?.setProductForView?.(mappedProduct, currentOptions);
                    currentProduct = ProductStateManager?.getCurrentProduct?.() || mappedProduct;
                    console.log('[ProductEdit] Current product refreshed from API.');
                }
            }
        } catch (error) {
            console.warn('[ProductEdit] Failed to refresh current product from API:', error);
        }
    }

    if ((!currentProduct || !currentProduct.product_key) && listingType && typeof window.ProductSpecialtyListingBridge?.buildLegacyProduct === 'function') {
        try {
            const legacyProduct = await window.ProductSpecialtyListingBridge.buildLegacyProduct(listingType, urlKey, providerKey);
            if (legacyProduct) {
                const mappedProduct = window.ProductModel
                    ? window.ProductModel.normalize(legacyProduct)
                    : legacyProduct;
                if (mappedProduct) {
                    const currentOptions = ProductStateManager?.getViewOptions?.(urlKey) || {};
                    ProductStateManager?.setProductForView?.(mappedProduct, currentOptions);
                    currentProduct = ProductStateManager?.getCurrentProduct?.() || mappedProduct;
                    console.log('[ProductEdit] Current specialty listing loaded from legacy API.');
                }
            }
        } catch (error) {
            console.warn('[ProductEdit] Failed to load specialty listing from legacy API:', error);
        }
    }

    if ((!currentProduct || !currentProduct.product_key) && isPharmacyRoute && typeof window.ProductPharmacyBridge?.buildLegacyProduct === 'function') {
        try {
            const legacyProduct = await window.ProductPharmacyBridge.buildLegacyProduct(urlKey, providerKey);
            if (legacyProduct) {
                const mappedProduct = window.ProductModel
                    ? window.ProductModel.normalize(legacyProduct)
                    : legacyProduct;
                if (mappedProduct) {
                    mappedProduct.pharmacy_metadata = true;
                    mappedProduct.pharmacyMetadata = true;
                    const currentOptions = ProductStateManager?.getViewOptions?.(urlKey) || {};
                    ProductStateManager?.setProductForView?.(mappedProduct, currentOptions);
                    currentProduct = ProductStateManager?.getCurrentProduct?.() || mappedProduct;
                    console.log('[ProductEdit] Current pharmacy product loaded from metadata API.');
                }
            }
        } catch (error) {
            console.warn('[ProductEdit] Failed to load pharmacy product from metadata API:', error);
        }
    }

    if (!currentProduct) {
        console.error('[ProductEdit] Done product status!');
        return;
    }

    if (typeof window.ProductPharmacyBridge?.enrichProduct === 'function') {
        try {
            currentProduct = await window.ProductPharmacyBridge.enrichProduct(currentProduct) || currentProduct;
        } catch (error) {
            console.warn('[ProductEdit] Pharmacy enrichment failed:', error);
        }
    }

    if (typeof window.ProductSpecialtyListingBridge?.enrichProduct === 'function') {
        try {
            currentProduct = await window.ProductSpecialtyListingBridge.enrichProduct(currentProduct) || currentProduct;
        } catch (error) {
            console.warn('[ProductEdit] Specialty listing enrichment failed:', error);
        }
    }

    if (typeof ProductStateManager !== 'undefined') {
        const currentOptions = ProductStateManager.getViewOptions?.(currentProduct.product_key) || {};
        ProductStateManager.setProductForView?.(currentProduct, currentOptions);
        currentProduct = ProductStateManager.getCurrentProduct?.() || currentProduct;
    }

    if (dom.form && dom.form.dataset.initializedFor === String(currentProduct.product_key)) {
        return;
    }

    if (typeof EDIT_images !== 'undefined' && EDIT_images.length > 0) {
        EDIT_images.forEach((img) => {
            if (img._objectUrl) {
                URL.revokeObjectURL(img._objectUrl);
            }
        });
    }

    EDIT_images = [];
    EDIT_originalImageNames = [];

    if (dom.form) {
        dom.form.dataset.mode = 'edit';
        dom.form.dataset.productKey = currentProduct.product_key;
        dom.form.dataset.initializedFor = String(currentProduct.product_key);
    }

    console.log(`[ProductEdit] product: ${currentProduct.product_key}`);

    const formValues = window.ProductModel
        ? window.ProductModel.toEditFormValues(currentProduct)
        : {
            productName: currentProduct.productName,
            description: currentProduct.product_description || currentProduct.description,
            sellerMessage: currentProduct.user_message || currentProduct.sellerMessage,
            notes: currentProduct.user_note || '',
            quantity: currentProduct.product_quantity !== undefined ? currentProduct.product_quantity : currentProduct.availableQuantity,
            price: currentProduct.product_price !== undefined ? currentProduct.product_price : currentProduct.pricePerItem,
            originalPrice: currentProduct.original_price,
            realPrice: currentProduct.realPrice,
            heavyLoad: currentProduct.heavyLoad == 1
        };

    const fields = {
        'product-name': formValues.productName,
        'product-description': formValues.description,
        'merchant-message': formValues.sellerMessage,
        'product-notes': formValues.notes,
        'product-quantity': formValues.quantity,
        'product-price': formValues.price,
        'original-price': formValues.originalPrice,
        'real-price': formValues.realPrice
    };

    for (const [id, value] of Object.entries(fields)) {
        const el = document.getElementById(id);
        if (el) {
            el.value = (value !== undefined && value !== null) ? value : '';
            el.dispatchEvent(new Event('input'));
        }
    }

    if (dom.heavyLoadCheckbox) {
        dom.heavyLoadCheckbox.checked = !!formValues.heavyLoad;
    }

    await EDIT_loadExistingImages();

    if (typeof EDIT_renderCategories === 'function') {
        await EDIT_renderCategories();
    }

    if (typeof window.ProductPharmacyBridge?.prefillForm === 'function') {
        await window.ProductPharmacyBridge.prefillForm(currentProduct);
    }
    if (typeof window.ProductSpecialtyListingBridge?.prefillForm === 'function') {
        await window.ProductSpecialtyListingBridge.prefillForm(currentProduct);
    }

    // Snapshot initial state for change tracking
    if (typeof EDIT_collectDraftData === 'function') {
        window.EDIT_initialState = await EDIT_collectDraftData();
        console.log('[ProductEdit] Initial state snapshot taken.');

        // Initial button state (Keep enabled so user can click to see "no changes" message)
        const submitBtn = document.getElementById('edit_btn_submit');
        if (submitBtn) {
            submitBtn.disabled = false;
            console.log('[ProductEdit] Submit button enabled for click detection.');
        }
    }

    // Restore draft if exists (Restoration happens before listeners to prevent overwriting)
    if (typeof EDIT_restoreDraft === 'function') {
        await EDIT_restoreDraft();
    }

    // Attach listeners only AFTER restoration
    EDIT_attachEventListeners();
    EDIT_initSubmitLogic();

    console.log('[ProductEdit] Done initializing successfully.');
    } finally {
        window.EDIT_isInitializingProductForm = false;
    }
}

window.initializeEditProductForm = initializeEditProductForm;

(function () {
    const runInit = () => {
        const params = new URLSearchParams(window.location.search);
        const hasProductRoute = !!(
            (params.get('product_key') || params.get('key') || params.get('id') || params.get('car_key') || params.get('real_estate_key'))
            && (params.get('provider_key') || params.get('m') || params.get('merchant_key'))
        );
        if (typeof ProductStateManager !== 'undefined' && (ProductStateManager.getCurrentProduct() || hasProductRoute)) {
            initializeEditProductForm();
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runInit);
    } else {
        runInit();
    }

    window.addEventListener('pageshow', async (event) => {
        if (!event.persisted) return;
        if (document.body?.id !== 'product-edit-page') return;

        if (typeof EDIT_renderCategories === 'function') {
            await EDIT_renderCategories();
        } else if (typeof EDIT_applyCategoryDrivenUi === 'function') {
            await EDIT_applyCategoryDrivenUi();
        }
    });
})();
