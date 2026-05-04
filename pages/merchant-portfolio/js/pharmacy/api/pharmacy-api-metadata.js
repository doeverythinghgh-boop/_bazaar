/**
 * @file pharmacy-api-metadata.js
 * @description Product metadata data access for pharmacy.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 */

window.PharmacyAPI = window.PharmacyAPI || {};

window.PharmacyAPI.getProductMetadata = async function (productId) {
    try {
        return await apiFetch(`/api/pharmacy/product-metadata?product_id=${encodeURIComponent(productId)}`);
    } catch (error) {
        console.error("PharmacyAPI Error (getProductMetadata):", error);
        throw error;
    }
};

window.PharmacyAPI.saveProductMetadata = async function (metadata) {
    try {
        return await apiFetch(`/api/pharmacy/product-metadata`, {
            method: 'POST',
            body: metadata
        });
    } catch (error) {
        console.error("PharmacyAPI Error (saveProductMetadata):", error);
        throw error;
    }
};

window.PharmacyAPI.updateProductMetadata = async function (metadata) {
    try {
        return await apiFetch(`/api/pharmacy/product-metadata`, {
            method: 'PUT',
            body: metadata
        });
    } catch (error) {
        console.error("PharmacyAPI Error (updateProductMetadata):", error);
        throw error;
    }
};

window.PharmacyAPI.deleteProductMetadata = async function (productId, userKey) {
    try {
        return await apiFetch(`/api/pharmacy/product-metadata?product_id=${encodeURIComponent(productId)}&merchant_key=${encodeURIComponent(userKey)}`, {
            method: 'DELETE'
        });
    } catch (error) {
        console.error("PharmacyAPI Error (deleteProductMetadata):", error);
        throw error;
    }
};
