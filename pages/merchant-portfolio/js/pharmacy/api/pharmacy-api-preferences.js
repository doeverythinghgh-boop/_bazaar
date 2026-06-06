/**
 * @file pharmacy-api-preferences.js
 * @description Pharmacy preferences data access.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

window.PharmacyAPI = window.PharmacyAPI || {};

window.PharmacyAPI.getPreferences = async function (userKey) {
    try {
        const endpoint = `/api/pharmacy/preferences?user_key=${encodeURIComponent(userKey)}`;
        const result = await apiFetch(endpoint);

        if (result && result.error) throw new Error(result.error);
        return window.pharmacyNormalizePreferencePayload(result);
    } catch (error) {
        console.error("PharmacyAPI Error (getPreferences):", error);
        return { hidden_main_categories: [], hidden_sub_categories: [], hidden_catalog_products: [] };
    }
};

window.PharmacyAPI.savePreferences = async function (userKey, preferencesData) {
    try {
        const result = await apiFetch(`/api/pharmacy/preferences`, {
            method: 'POST',
            body: { user_key: userKey, data: preferencesData }
        });
        // Invalidate catalog context cache so the next getCatalogContext call
        // fetches fresh preferences from Firestore instead of serving stale data.
        if (userKey) this.invalidateCatalogContext(userKey);
        return result;
    } catch (error) {
        console.error("PharmacyAPI Error (savePreferences):", error);
        throw error;
    }
};

window.PharmacyAPI.getPreferenceSets = function (preferences = {}) {
    const normalized = window.pharmacyNormalizePreferencePayload(preferences);
    return {
        hiddenMain: new Set(normalized.hidden_main_categories.map(id => String(id))),
        hiddenSub: new Set(normalized.hidden_sub_categories.map(id => String(id))),
        hiddenProducts: new Set(normalized.hidden_catalog_products.map(id => String(id)))
    };
};
