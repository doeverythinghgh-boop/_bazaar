/**
 * @file portfolio-mgmt-edit.js
 * @description Product editing logic for the merchant portfolio.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

window.portfolioEditProduct = async function (productId) {
    const L = (key, fallback) => (typeof window.langu === 'function' ? window.langu(key) : null) || fallback;
    console.log(`[Portfolio] Editing Product ID: ${productId}`);

    const params = new URLSearchParams(window.location.search);
    const userKey = params.get('user_key');
    const PortfolioAPI = window.PortfolioAPI || {};

    if (typeof window.resolvePortfolioProductById !== 'function') return;

    const resolved = window.resolvePortfolioProductById(productId, userKey);
    const product = resolved.product;

    if (!product) {
        console.error(`[Portfolio] Product ${productId} not found for editing in cache or state.`);
        if (typeof Swal !== 'undefined') {
            Swal.fire(L('port_rate_error_title', 'خطأ'), L('port_product_not_found', 'لم يتم العثور على بيانات المنتج، يرجى تحديث الصفحة'), "error");
        }
        return;
    }

    if (PortfolioAPI.clearCache) PortfolioAPI.clearCache(userKey);

    if (product?.item_type === 'car' || product?.is_car_listing) {
        const carKey = product.car_key || product.product_key || productId;
        window.location.href = window.ProductRoutes?.buildProductEditUrl
            ? window.ProductRoutes.buildProductEditUrl(product, { productKey: carKey, providerKey: userKey || product.user_key || '', listingType: 'car' })
            : `/pages/products/productEdit/productEdit.html?product_key=${encodeURIComponent(carKey)}&provider_key=${encodeURIComponent(userKey || product.user_key || '')}&listing=car`;
        return;
    }

    if (product?.item_type === 'real_estate' || product?.is_real_estate_listing) {
        const realEstateKey = product.real_estate_key || product.product_key || productId;
        window.location.href = window.ProductRoutes?.buildProductEditUrl
            ? window.ProductRoutes.buildProductEditUrl(product, { productKey: realEstateKey, providerKey: userKey || product.user_key || '', listingType: 'real_estate' })
            : `/pages/products/productEdit/productEdit.html?product_key=${encodeURIComponent(realEstateKey)}&provider_key=${encodeURIComponent(userKey || product.user_key || '')}&listing=real_estate`;
        return;
    }

    if (typeof ProductStateManager !== 'undefined') {
        ProductStateManager.setSelectedCategories(product.MainCategory, product.SubCategory);
        ProductStateManager.setFormScopeFilter(null);
    }

    if (typeof loadProductForm === 'function') {
        loadProductForm({ editMode: true, productData: product });
    }
};
