/**
 * @file pharmacy-api-custom-categories.js
 * @description Custom categories data access for pharmacy.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 */

window.PharmacyAPI = window.PharmacyAPI || {};

window.PharmacyAPI.getCustomCategories = async function (userKey) {
    try {
        const result = await apiFetch(`/api/pharmacy/custom-categories?user_key=${encodeURIComponent(userKey)}`);
        if (result && result.error) throw new Error(result.error);
        return window.pharmacyNormalizeListPayload(result);
    } catch (error) {
        console.error("PharmacyAPI Error (getCustomCategories):", error);
        return [];
    }
};

window.PharmacyAPI.addCustomCategory = async function (categoryData) {
    try {
        const result = await apiFetch(`/api/pharmacy/custom-categories`, {
            method: 'POST',
            body: categoryData
        });
        if (categoryData?.user_key) this.invalidateCatalogContext(categoryData.user_key);
        return result;
    } catch (error) {
        console.error("PharmacyAPI Error (addCustomCategory):", error);
        throw error;
    }
};

window.PharmacyAPI.deleteCustomCategory = async function (userKey, categoryId) {
    try {
        const result = await apiFetch(`/api/pharmacy/custom-categories?id=${encodeURIComponent(categoryId)}`, {
            method: 'DELETE'
        });
        if (userKey) this.invalidateCatalogContext(userKey);
        return result;
    } catch (error) {
        console.error("PharmacyAPI Error (deleteCustomCategory):", error);
        throw error;
    }
};

window.PharmacyAPI.updateCustomCategory = async function (categoryData) {
    try {
        const result = await apiFetch(`/api/pharmacy/custom-categories`, {
            method: 'PUT',
            body: categoryData
        });
        if (categoryData?.user_key) this.invalidateCatalogContext(categoryData.user_key);
        return result;
    } catch (error) {
        console.error("PharmacyAPI Error (updateCustomCategory):", error);
        throw error;
    }
};
