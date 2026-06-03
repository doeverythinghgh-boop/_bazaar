/**
 * @file js/connectUsers.js
 * @description API connection layer for users.
 *
 * This file contains a set of async functions that facilitate
 * handling user data, including fetching, adding, updating, deleting, and verifying.
 * Depends on the global `baseURL` variable which must be defined in `js/config.js`.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

// Dependency locator for apiFetch (likely in window or soon to be ESM)
const getApiFetch = () => window.apiFetch;

/**
 * @description Fetches a list of all users from the database via API.
 *   Commonly used in admin dashboards.
 * @function fetchUsers
 * @returns {Promise<Array<Object>|null>} - Promise containing an array of user objects, or `null` on error.
 * @async
 * @throws {Error} - If `apiFetch` encounters a network error or the API returns an error.
 * @see apiFetch
 */
export async function fetchUsers() {
  try {
    const apiFetch = getApiFetch();
    const data = await apiFetch('/api/users');
    return data.error ? null : data;
  } catch (error) {
    console.error("[fetchUsers] Failed:", error);
    return null;
  }
}

/**
 * @description Adds a new user to the database via API.
 * @function addUser
 * @param {object} userData - Object containing all data of the user to append.
 * @param {string} userData.username - Username.
 * @param {string} userData.phone - User phone number.
 * @param {string} [userData.password] - Password (optional).
 * @param {string} [userData.address] - Address (optional).
 * @param {string} userData.user_key - Unique serial number for the user.
 * @returns {Promise<Object>} - Promise containing the created object, or error object on failure.
 * @async
 * @throws {Error} - If `apiFetch` encounters a network error or the API returns an error.
 * @see apiFetch
 */
export async function addUser(userData) {
  const apiFetch = getApiFetch();
  return await apiFetch('/api/users', {
    method: 'POST',
    body: userData,
  });
}

/**
 * @description Updates single user data in the database via API.
 * @function updateUser
 * @param {object} userData - Object containing user data to update. Must contain `user_key` to identify the user.
 * @returns {Promise<Object>} - Promise containing the updated object, or error object on failure.
 * @async
 * @throws {Error} - If `apiFetch` encounters a network error or the API returns an error.
 * @see apiFetch
 */
export async function updateUser(userData) {
  const apiFetch = getApiFetch();
  return await apiFetch('/api/users', {
    method: 'PUT',
    body: userData,
  });
}

/**
 * @description Updates data for multiple users at once via API.
 *   Used in admin dashboard to change roles of multiple users (e.g., upgrade to merchants).
 * @function updateUsers
 * @param {Array<Object>} updates - Array of objects containing update data for each user. Each object must contain at least `user_key`.
 * @returns {Promise<Object>} - Promise containing the server response object, or an error object on failure.
 * @async
 * @throws {Error} - If `apiFetch` encounters a network error or the API returns an error.
 * @see apiFetch
 */
export async function updateUsers(updates) {
  const apiFetch = getApiFetch();
  return await apiFetch('/api/users', {
    method: 'PUT',
    body: updates,
  });
}

/**
 * @description Verifies user password via API.
 * @function verifyUserPassword
 * @param {string} phone - User phone number.
 * @param {string} password - Password to verify.
 * @returns {Promise<Object>} - Promise containing user data object on success, or error object on failure.
 * @async
 * @throws {Error} - If `apiFetch` encounters a network error or the API returns an error.
 * @see apiFetch
 */
export async function verifyUserPassword(phone, password) {
  const apiFetch = getApiFetch();
  return await apiFetch('/api/users', {
    method: 'POST',
    body: { action: 'verify', phone, password },
  });
}

/**
 * @description Deletes a user permanently from the database via API.
 * @function deleteUser
 * @param {string} userKey - Unique key of the user to delete.
 * @returns {Promise<Object>} - Promise containing the server response object.
 * @async
 * @throws {Error} - If `apiFetch` encounters a network error or the API returns an error.
 * @see apiFetch
 */
export async function deleteUser(userKey) {
  const apiFetch = getApiFetch();
  return await apiFetch('/api/users', {
    method: 'DELETE',
    body: { user_key: userKey },
  });
}

/**
 * @description Updates last login timestamp for a user.
 * @function touchUserLastLogin
 * @param {string} userKey
 * @returns {Promise<Object>}
 */
export async function touchUserLastLogin(userKey) {
  const apiFetch = getApiFetch();
  return await apiFetch('/api/users', {
    method: 'POST',
    body: { action: 'touch_login', user_key: userKey },
  });
}

// Hybrid bridge for global scope
window.fetchUsers = fetchUsers;
window.addUser = addUser;
window.updateUser = updateUser;
window.updateUsers = updateUsers;
window.verifyUserPassword = verifyUserPassword;
window.deleteUser = deleteUser;
window.touchUserLastLogin = touchUserLastLogin;

console.log("[ESM Load] connectUsers.js: Hybrid bridge established.");
