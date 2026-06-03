/**
 * @file pages/ADMIN/mainAdvertises-api.js
 * @description API communication module for advertisements management.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


// Central state for the advertisements manager
var mainAdver_state = {
    images: [],
    originalImageNames: [],
    featuredList: [],
    idCounter: 1,
    R2_PUBLIC_URL: (typeof window.getBazaarInfrastructureConfig === 'function'
        ? window.getBazaarInfrastructureConfig().r2PublicUrl
        : null) || ''
};

/**
 * @function addUpdate
 * @description Touches the remote advertisement update timestamp.
 * @param {string} text - The text to record in the update.
 * @returns {Promise<Object>} - A Promise that resolves to the server response object.
 */
async function addUpdate(text) {
    return await apiFetch('/api/updates', {
        method: 'POST',
        body: { txt: text },
    });
}

/**
 * @function fetchManifest
 * @description Fetches the advertisements from the database API.
 * @returns {Promise<Array>} Manifest data.
 */
async function fetchManifest() {
    try {
        const data = await apiFetch(`/api/get-ads?t=${Date.now()}`);
        if (data && !data.error && Array.isArray(data)) return data;
        return [];
    } catch (e) {
        console.error("[AdminAdver-API] Failed to fetch advertisements from DB:", e);
        return [];
    }
}

/**
 * @function fetchFeaturedProducts
 * @description Fetches the featured products list from the database API.
 * @returns {Promise<Array>} Featured products list.
 */
async function fetchFeaturedProducts() {
    try {
        const data = await apiFetch(`/api/get-featured?t=${Date.now()}`);
        if (data && !data.error && Array.isArray(data)) return data;
        return [];
    } catch (e) {
        console.error("[AdminAdver-API] Failed to fetch featured products from DB:", e);
        return [];
    }
}

/**
 * @function saveManifestAPI
 * @description Saves the advertisements to the database API.
 * @param {Array} manifest - Manifest data.
 * @returns {Promise<void>}
 */
async function saveManifestAPI(manifest) {
    const data = await apiFetch('/api/save-ads', {
        method: 'POST',
        body: { ads: manifest }
    });
    if (data && data.error) throw new Error("Failed to save advertisements to database: " + data.error);
}

/**
 * @function saveFeaturedAPI
 * @description Saves the featured products list to the database API.
 * @param {Array} list - Featured products list.
 * @returns {Promise<void>}
 */
async function saveFeaturedAPI(list) {
    const data = await apiFetch('/api/save-featured', {
        method: 'POST',
        body: { products: list }
    });
    if (data && data.error) throw new Error("Failed to save featured products to database: " + data.error);
}
