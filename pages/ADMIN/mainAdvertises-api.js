/**
 * @file pages/ADMIN/mainAdvertises-api.js
 * @description API communication module for advertisements management.
 */

// Central state for the advertisements manager
var mainAdver_state = {
    images: [],
    originalImageNames: [],
    featuredList: [],
    idCounter: 1,
    R2_PUBLIC_URL: 'https://pub-e828389e2f1e484c89d8fb652c540c12.r2.dev'
};

/**
 * @function addUpdate
 * @description Adds a new record to the `updates` table in the database.
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
 * @description Fetches the advertisements manifest from R2.
 * @param {string} url - R2 public URL.
 * @returns {Promise<Array>} Manifest data.
 */
async function fetchManifest(url) {
    try {
        const res = await fetch(`${url}/advertisements.json?t=${Date.now()}`);
        if (res.ok) return await res.json();
        return [];
    } catch (e) {
        console.error("[AdminAdver-API] Failed to fetch manifest:", e);
        return [];
    }
}

/**
 * @function fetchFeaturedProducts
 * @description Fetches the featured products list from R2.
 * @param {string} url - R2 public URL.
 * @returns {Promise<Array>} Featured products list.
 */
async function fetchFeaturedProducts(url) {
    const res = await fetch(`${url}/selected_search_products.json?t=${Date.now()}`);
    if (res.ok) return await res.json();
    return [];
}

/**
 * @function saveManifestAPI
 * @description Uploads the advertisements manifest to R2.
 * @param {Array} manifest - Manifest data.
 * @returns {Promise<void>}
 */
async function saveManifestAPI(manifest) {
    const mBlob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
    await uploadFile2cf(mBlob, 'advertisements.json');
}

/**
 * @function saveFeaturedAPI
 * @description Uploads the featured products list to R2.
 * @param {Array} list - Featured products list.
 * @returns {Promise<void>}
 */
async function saveFeaturedAPI(list) {
    const blob = new Blob([JSON.stringify(list)], { type: 'application/json' });
    await uploadFile2cf(blob, 'selected_search_products.json');
}
