/**
 * @file pharmacy-api-merchant.js
 * @description Merchant products data access for pharmacy.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 */

window.PharmacyAPI = window.PharmacyAPI || {};

window.PharmacyAPI.fetchMerchantProducts = async function (userKey) {
    try {
        const result = await apiFetch(`/api/pharmacy/product-metadata?merchant_key=${encodeURIComponent(userKey)}`);
        if (result && result.error) throw new Error(result.error);
        return window.pharmacyNormalizeListPayload(result);
    } catch (error) {
        console.error("PharmacyAPI Error (fetchMerchantProducts):", error);
        return [];
    }
};

window.PharmacyAPI.saveMerchantProduct = async function (productData) {
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
};
