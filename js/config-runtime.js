/**
 * @file js/config-runtime.js
 * @description Core runtime configuration and shared constants.
 * @module config-runtime
 */

console.log("[ESM Load] js/config-runtime.js: Initializing...");

const runtimeConfig = typeof window.getBazaarRuntimeConfig === 'function'
  ? window.getBazaarRuntimeConfig()
  : { infrastructure: {}, auth: {} };

const infraConfig = runtimeConfig.infrastructure || {};
const authConfig = runtimeConfig.auth || {};
const pagesHost = infraConfig.pagesUrl ? new URL(infraConfig.pagesUrl).hostname : "";
const vercelHost = infraConfig.vercelUrl ? new URL(infraConfig.vercelUrl).hostname : "";

export const VERCEL_URL = infraConfig.vercelUrl || "";

const extraHosts = Array.isArray(infraConfig.allowedHosts) ? infraConfig.allowedHosts : [];
export const allowedHosts = [
  "127.0.0.1",
  "localhost",
  pagesHost,
  vercelHost,
  ...extraHosts
].filter(Boolean);

export const baseURL = allowedHosts.includes(location.hostname) ? VERCEL_URL : "";
export const SUPER_ADMIN_KEY = authConfig.superAdminKey || "";

export const ACCOUNT_ROLES = {
  BUYER: 1,
  SERVICE_PROVIDER: 32
};

export const DELIVERY_SERVICE_CATEGORY_ID = "46";

export const SYSTEM_ROLES = {
  USER: "user",
  ADMIN: "admin",
  SUPER_ADMIN: "super_admin"
};

/**
 * Normalizes account type using bitwise operations.
 * @param {number|string} accountType 
 * @returns {number}
 */
export function normalizeAccountType(accountType) {
  let raw = parseInt(accountType, 10);
  if (Number.isNaN(raw) || raw < 0) raw = 0;

  const R = ACCOUNT_ROLES || {};
  let normalized = 0;

  if ((raw & (R.BUYER || 1)) === (R.BUYER || 1)) normalized |= (R.BUYER || 1);
  if ((raw & (R.SERVICE_PROVIDER || 32)) === (R.SERVICE_PROVIDER || 32)) normalized |= (R.SERVICE_PROVIDER || 32);

  if (!normalized) normalized = (R.BUYER || 1);
  return normalized;
}

/**
 * Checks if a user has a specific role.
 * @param {number|string} accountType 
 * @param {number} role 
 * @returns {boolean}
 */
export const checkRole = (accountType, role) => {
  const normalized = normalizeAccountType(accountType);
  return (normalized & role) === role;
};

// -----------------------------------------------------------------------------
// Hybrid Export Bridge (Legacy Compatibility)
// -----------------------------------------------------------------------------
window.VERCEL_URL = VERCEL_URL;
window.allowedHosts = allowedHosts;
window.baseURL = baseURL;
window.SUPER_ADMIN_KEY = SUPER_ADMIN_KEY;
window.ACCOUNT_ROLES = ACCOUNT_ROLES;
window.DELIVERY_SERVICE_CATEGORY_ID = DELIVERY_SERVICE_CATEGORY_ID;
window.SYSTEM_ROLES = SYSTEM_ROLES;
window.normalizeAccountType = normalizeAccountType;
window.checkRole = checkRole;

console.log("[ESM Load] js/config-runtime.js: Hybrid bridge established.");
