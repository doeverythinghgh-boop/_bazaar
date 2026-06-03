/**
 * @file js/config-roles.js
 * @description Delivery, admin, role labels, and user capability helpers.
 * @module config-roles
 */

console.log("[ESM Load] js/config-roles.js: Initializing...");

/**
 * Checks if a business category includes delivery services.
 * @param {string|number} rawBusinessCategory 
 * @returns {boolean}
 */
export function userHasDeliveryServiceCategory(rawBusinessCategory) {
  const categoryMap = window.parseBusinessCategorySelection(rawBusinessCategory);
  return Object.prototype.hasOwnProperty.call(
    categoryMap,
    String(window.DELIVERY_SERVICE_CATEGORY_ID || "46")
  );
}

/**
 * Checks if a user can act as a delivery agent.
 * @param {Object} user 
 * @returns {boolean}
 */
export function userCanActAsDelivery(user) {
  if (!user || user.user_key === "guest_user") return false;
  return userHasDeliveryServiceCategory(user.business_category);
}

// Safely resolve runtime authentication configuration
const _runtimeAuth = (typeof window.getBazaarAuthConfig === 'function') 
  ? window.getBazaarAuthConfig() 
  : (window.BazaarRuntimeConfig?.auth || (typeof authConfig !== 'undefined' ? authConfig : {}));

/**
 * Super Admin Key from runtime configuration.
 */
export const SUPER_ADMIN_KEY = _runtimeAuth.superAdminKey || "682dri6b";

/**
 * Array of Admin IDs.
 */
export const ADMIN_IDS = (window.AppBehavior && window.AppBehavior.disableAdminFeatures === true)
  ? [SUPER_ADMIN_KEY].filter(Boolean)
  : (function() {
      const ids = Array.isArray(_runtimeAuth.adminIds) ? _runtimeAuth.adminIds.slice() : [];
      if (SUPER_ADMIN_KEY && !ids.includes(SUPER_ADMIN_KEY)) {
          ids.unshift(SUPER_ADMIN_KEY);
      }
      return ids;
    })();

/**
 * Checks if a user is an admin by their ID or role.
 * @param {Object} user 
 * @returns {boolean}
 */
export function isAdminUserByIds(user) {
  if (!user) return false;
  const explicitRole = typeof user.system_role === "string" ? user.system_role.trim().toLowerCase() : "";
  if (explicitRole === window.SYSTEM_ROLES.SUPER_ADMIN || explicitRole === window.SYSTEM_ROLES.ADMIN) {
    return true;
  }
  const configuredAdminIds = Array.isArray(ADMIN_IDS) ? ADMIN_IDS.map((value) => String(value)) : [];
  return configuredAdminIds.includes(String(user?.user_key || ""));
}

/**
 * Checks if a user is a super admin.
 * @param {Object} user 
 * @returns {boolean}
 */
export function isSuperAdminUserByIds(user) {
  if (!user) return false;
  const currentKey = String(user.user_key || "");
  const explicitRole = typeof user.system_role === "string" ? user.system_role.trim().toLowerCase() : "";
  if (explicitRole === window.SYSTEM_ROLES.SUPER_ADMIN) {
    return true;
  }
  return currentKey === String(SUPER_ADMIN_KEY);
}

/**
 * Resolves the system role of a user.
 * @param {Object} user 
 * @returns {string}
 */
export function resolveSystemRole(user) {
  if (!user || !user.user_key || user.user_key === "guest_user") return window.SYSTEM_ROLES.USER;

  const currentKey = String(user.user_key);
  
  if (currentKey === String(SUPER_ADMIN_KEY)) {
      return window.SYSTEM_ROLES.SUPER_ADMIN;
  }

  const configuredAdminIds = Array.isArray(ADMIN_IDS) ? ADMIN_IDS.map((value) => String(value)) : [];
  if (configuredAdminIds.includes(currentKey)) {
      return window.SYSTEM_ROLES.ADMIN;
  }

  return window.SYSTEM_ROLES.USER;
}

/**
 * Resolves comprehensive user capabilities.
 * @param {Object} user 
 * @returns {Object}
 */
export function resolveUserCapabilities(user) {
  const R = window.ACCOUNT_ROLES || {};
  const systemRole = resolveSystemRole(user);
  const normalizedAccountType = window.normalizeAccountType(user?.account_type);
  const isBuyer = window.checkRole(normalizedAccountType, R.BUYER || 1);
  const isServiceProvider = window.checkRole(normalizedAccountType, R.SERVICE_PROVIDER || 32);
  const isCommercial = isServiceProvider;
  const canDeliver = typeof userCanActAsDelivery === "function" ? userCanActAsDelivery(user) : false;
  
  const isSuperAdmin = systemRole === window.SYSTEM_ROLES.SUPER_ADMIN;
  const isAdmin = isSuperAdmin || systemRole === window.SYSTEM_ROLES.ADMIN;

  return {
    accountType: normalizedAccountType,
    systemRole,
    isBuyer,
    isServiceProvider: isServiceProvider || isSuperAdmin,
    isCommercial: isCommercial || isSuperAdmin,
    isSeller: isCommercial || isSuperAdmin,
    canDeliver,
    isAdmin,
    isSuperAdmin
  };
}

/**
 * Resolves the default landing page for a user.
 * @param {Object} user 
 * @returns {string}
 */
export function resolveUserLandingPage(user) {
  return "/pages/home/home.html";
}

/**
 * Gets comparable role bits for a user.
 * @param {Object} user 
 * @returns {number}
 */
export function getComparableRoleBits(user) {
  const caps = resolveUserCapabilities(user);
  let bits = 0;
  if (caps.isBuyer) bits |= (window.ACCOUNT_ROLES?.BUYER || 1);
  if (caps.isServiceProvider) bits |= (window.ACCOUNT_ROLES?.SERVICE_PROVIDER || 32);
  return bits;
}

/**
 * Human-readable role labels.
 */
export const ROLE_LABELS = {
  get BUYER() { return typeof window.langu === 'function' ? window.langu('role_buyer') : 'Buyer'; },
  get SERVICE_PROVIDER() { return typeof window.langu === 'function' ? window.langu('role_service_provider') : 'merchant'; },
  get COMMERCIAL() { return typeof window.langu === 'function' ? window.langu('role_service_provider') : 'merchant'; },
  get DELIVERY() { return typeof window.langu === 'function' ? window.langu('role_delivery_agent') : 'Delivery Agent'; },
  get ADMIN() { return typeof window.langu === 'function' ? window.langu('role_admin') : 'Admin'; },
  get SUPER_ADMIN() { return typeof window.langu === 'function' ? window.langu('role_super_admin') : 'Super Admin'; }
};

/**
 * Translation keys for role descriptions.
 */
export const ROLE_DESCRIPTION_KEYS = {
  1: "role_desc_buyer",
  33: "role_desc_service",
  FALLBACK: "role_desc_fallback"
};

/**
 * Gets role description text.
 * @param {number|string} accountType 
 * @returns {string}
 */
export function getRoleDescriptionText(accountType) {
  const normalizedAccountType = window.normalizeAccountType(accountType);
  const descriptionKey = ROLE_DESCRIPTION_KEYS?.[normalizedAccountType]
    || ROLE_DESCRIPTION_KEYS?.FALLBACK
    || "role_desc_fallback";
  return typeof window.langu === "function" ? window.langu(descriptionKey) : descriptionKey;
}

/**
 * CSS icons for roles.
 */
export const ROLE_ICONS = {
  BUYER: "fas fa-user-check",
  SERVICE_PROVIDER: "fas fa-user-tie",
  COMMERCIAL: "fas fa-user-tie",
  ADMIN: "fas fa-user-gear",
  SUPER_ADMIN: "fas fa-chess-king",
  COMBINATIONS: {
    33: "fas fa-user-tie",
    FALLBACK: "fas fa-user-check"
  }
};

// -----------------------------------------------------------------------------
// Hybrid Export Bridge (Legacy Compatibility)
// -----------------------------------------------------------------------------
window.userHasDeliveryServiceCategory = userHasDeliveryServiceCategory;
window.userCanActAsDelivery = userCanActAsDelivery;
window.SUPER_ADMIN_KEY = SUPER_ADMIN_KEY;
window.ADMIN_IDS = ADMIN_IDS;
window.isAdminUserByIds = isAdminUserByIds;
window.isSuperAdminUserByIds = isSuperAdminUserByIds;
window.resolveSystemRole = resolveSystemRole;
window.resolveUserCapabilities = resolveUserCapabilities;
window.resolveUserLandingPage = resolveUserLandingPage;
window.getComparableRoleBits = getComparableRoleBits;
window.ROLE_LABELS = ROLE_LABELS;
window.ROLE_DESCRIPTION_KEYS = ROLE_DESCRIPTION_KEYS;
window.getRoleDescriptionText = getRoleDescriptionText;
window.ROLE_ICONS = ROLE_ICONS;

console.log("[ESM Load] js/config-roles.js: Hybrid bridge established.");
