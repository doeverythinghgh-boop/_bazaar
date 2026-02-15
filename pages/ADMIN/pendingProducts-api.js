/**
 * @file pages/ADMIN/pendingProducts-api.js
 * @description API communication module for products management in Admin Panel.
 */

/**
 * @function fetchProductsFromAPI
 * @description Fetches products from the API based on status, limit, and offset.
 * @param {number} status - Product status (0 for pending, 1 for published).
 * @param {number} limit - Number of items to fetch.
 * @param {number} offset - Number of items to skip.
 * @returns {Promise<Array>} List of products.
 */
async function fetchProductsFromAPI(status, limit, offset) {
    try {
        const response = await fetch(`${baseURL}/api/products?status=${status}&limit=${limit}&offset=${offset}`);
        if (!response.ok) throw new Error("API request failed");
        return await response.json();
    } catch (error) {
        console.error(`[Admin-API] Error fetching products (status: ${status}):`, error);
        throw error;
    }
}

/**
 * @function updateProductStatusAPI
 * @description Sends a PUT request to update the product approval status.
 * @param {string} key - Product key.
 * @param {number} newStatus - New status (0 or 1).
 * @returns {Promise<Response>} API response.
 */
async function updateProductStatusAPI(key, newStatus) {
    return await fetch(`${baseURL}/api/products`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_key: key, is_approved: newStatus })
    });
}

/**
 * @function deleteProductFromAPI
 * @description Sends a DELETE request to remove a product from the database.
 * @param {string} key - Product key.
 * @returns {Promise<Response>} API response.
 */
async function deleteProductFromAPI(key) {
    return await fetch(`${baseURL}/api/products?product_key=${key}`, { method: 'DELETE' });
}

/**
 * @function fetchProductDetailsAPI
 * @description Fetches single product details for notifications.
 * @param {string} key - Product key.
 * @returns {Promise<Object>} Product details.
 */
async function fetchProductDetailsAPI(key) {
    const response = await fetch(`${baseURL}/api/products?product_key=${key}`);
    return await response.json();
}
