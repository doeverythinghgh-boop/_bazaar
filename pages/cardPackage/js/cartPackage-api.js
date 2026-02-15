/**
 * @file pages/cardPackage/js/cartPackage-api.js
 * @description API service for cart package operations.
 * Handles order creation via API calls.
 */

/**
 * @description Creates a new order in the database via the API.
 * @function createOrder
 * @param {object} orderData - An object containing all the data for the order to be created.
 * @param {string} orderData.order_key - The unique key generated for the order.
 * @param {string} orderData.user_key - The key of the user who placed the order.
 * @param {number} orderData.total_amount - The total amount of the order.
 * @param {Array<object>} orderData.items - An array of products included in the order.
 * @returns {Promise<Object>} - A Promise that resolves with the created order data object, or an error object if it fails.
 * @see apiFetch
 */
async function createOrder(orderData) {
    return await apiFetch('/api/orders', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: orderData,
    });
}
