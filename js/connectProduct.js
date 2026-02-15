/**
 * @file js/connectProduct.js
 * @description API connection layer for Products, and product details display logic.
 *
 * This file contains a set of async functions to facilitate handling products,
 * including adding, updating, deleting, and fetching from the database.
 * It also contains logic for displaying and populating the product details modal.
 * Depends on the global `baseURL` variable which must be defined in `js/config.js`.
 */

/**
 * @description Adds a new product to the database via API call.
 * @function addProduct
 * @param {object} productData - Object containing all data of the product to add.
 * @returns {Promise<Object>} - Promise containing the created product object, or an error object on failure.
 * @async
 * @throws {Error} - If `apiFetch` encounters a network error or the API returns an error.
 * @see apiFetch
 */
async function addProduct(productData) {
  return await apiFetch('/api/products', {
    method: 'POST',
    body: productData,
  });
}

/**
 * @description Updates an existing product in the database via API.
 * @function updateProduct
 * @param {object} productData - Object containing updated product data. Must include `product_key` to identify the product.
 * @returns {Promise<Object>} - Promise containing the updated object, or an error object on failure.
 * @async
 * @throws {Error} - If `apiFetch` encounters a network error or the API returns an error.
 * @see apiFetch
 */
async function updateProduct(productData) {
  return await apiFetch('/api/products', {
    method: 'PUT',
    body: productData,
  });
}

/**
 * @description Deletes an existing product from the database via API.
 * @function deleteProduct
 * @param {string} productKey - Unique key of the product to delete.
 * @returns {Promise<Object>} - Promise containing the server response object.
 * @async
 * @throws {Error} - If `apiFetch` encounters a network error or the API returns an error.
 * @see apiFetch
 */
async function deleteProduct_(productKey) {
  return await apiFetch(`/api/products?product_key=${productKey}`, {
    method: 'DELETE',
  });
}

/**
 * @description Fetches the list of products based on the selected Main and Sub category from the API.
 * @function getProductsByCategory
 * @param {string} mainCatId - ID of the main category.
 * @param {string} subCatId - ID of the sub category.
 * @returns {Promise<Array<Object>|null>} - Promise containing an array of product objects, or `null` on failure.
 * @throws {Error} - If `baseURL` is undefined, or API fetch fails.
 * @see apiFetch
 * @see baseURL
 */
async function getProductsByCategory(mainCatId, subCatId) {
  try {
    // Check for baseURL to ensure settings are loaded correctly.
    if (typeof baseURL === "undefined" || !baseURL) {
      console.error(
        "%c[API-Debug] متغير baseURL غير معرف أو فارغ!",
        "color: red; font-weight: bold;"
      );
      throw new Error("المتغير baseURL غير معرف"); // Stop execution if variable is missing.
    }
    // Use URLSearchParams to create the query string safely and correctly.
    // This ensures 'null' or 'undefined' values are not sent as part of the URL.
    const params = new URLSearchParams();
    if (mainCatId) {
      params.append("MainCategory", mainCatId);
    }
    if (subCatId) {
      params.append("SubCategory", subCatId);
    }
    const data = await apiFetch(`/api/products?${params.toString()}`);
    if (data.error) throw new Error(data.error);
    return data;
  } catch (error) {
    // Log any error and return `null`.
    console.error(
      "%c[getProductsByCategory] فشل:",
      "color: red;",
      error
    );
    return null;
  }
}

/**
 * @description Fetches all products added by a specific user (seller) from the API.
 *   Optionally filters by search term and categories on the server side.
 * @function getProductsByUser
 * @param {string} userKey - Unique key of the user (`user_key`) whose products we want to fetch.
 * @param {object} [filters={}] - Optional filters object containing:
 *   - {string} searchName - Search term to filter by product name
 *   - {string} MainCategory - Main category ID to filter by
 *   - {string} SubCategory - Sub category ID to filter by
 * @returns {Promise<Array<Object>|null>} - Promise containing an array of product objects, or `null` on failure.
 * @async
 * @throws {Error} - If `apiFetch` encounters a network error or the API returns an error.
 * @see apiFetch
 */
async function getProductsByUser(userKey, filters = {}) {
  try {
    // Build query parameters
    const params = new URLSearchParams();
    params.append('user_key', userKey);

    // Add optional search filters
    if (filters.searchName) {
      params.append('searchTerm', filters.searchName);
    }
    if (filters.MainCategory) {
      params.append('MainCategory', filters.MainCategory);
    }
    if (filters.SubCategory) {
      params.append('SubCategory', filters.SubCategory);
    }

    const data = await apiFetch(`/api/products?${params.toString()}`);
    return data.error ? null : data;
  } catch (error) {
    console.error("%c[getProductsByUser] فشل:", "color: red;", error);
    return null;
  }
}

/**
 * @description Fetches data of a single product based on its unique key from the API.
 * @function getProductByKey
 * @param {string} productKey - Unique key of the product to fetch.
 * @returns {Promise<Object|null>} - Promise containing the product object, or `null` if not found or error.
 * @async
 * @throws {Error} - If `apiFetch` encounters a network error or the API returns an error.
 * @see apiFetch
 */
async function getProductByKey(productKey) {
  try {
    const data = await apiFetch(`/api/products?product_key=${productKey}&single=true`, {
      specialHandlers: {
        404: () => {
          console.warn("[API] getProductByKey: المنتج غير موجود (404).");
          return null;
        }
      }
    });
    return data;
  } catch (error) {
    console.error("%c[getProductByKey] فشل:", "color: red;", error);
    return null;
  }
}



