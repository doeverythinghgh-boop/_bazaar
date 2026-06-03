/**
 * @file js/shared/user-service.js
 * @description Single source of truth for normalized user payloads in the browser.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

const SESSION_STORAGE_KEY = "loggedInUser";
const ORIGINAL_SESSION_STORAGE_KEY = "originalAdminSession";
const SESSION_CHANGED_EVENT = "user-session-changed";
const STORAGE_SCHEMA_VERSION = 2;
const warnedDeps = new Set();

function getDeps() {
  const injected = window.__USER_DEPS__ || {};
  return {
    UserFormService: injected.UserFormService || window.UserFormService,
    UserLocationsClient: injected.UserLocationsClient || window.UserLocationsClient,
    AuthValidators: injected.AuthValidators || window.AuthValidators,
    normalizeAccountType: injected.normalizeAccountType || window.normalizeAccountType,
    normalizeBusinessCategoryMap: injected.normalizeBusinessCategoryMap || window.normalizeBusinessCategoryMap,
    resolveSystemRole: injected.resolveSystemRole || window.resolveSystemRole,
    resolveUserCapabilities: injected.resolveUserCapabilities || window.resolveUserCapabilities,
  };
}

function warnMissingDependency(name) {
  if (!warnedDeps.has(name)) {
    warnedDeps.add(name);
    console.warn(`${name} not loaded`);
  }
}

function isPlainObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function safeParseJSON(value, fallback = {}) {
  if (value == null || value === "") return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch (_) {
      return fallback;
    }
  }
  return value;
}

function nowIso() {
  return new Date().toISOString();
}

function compareIsoTimestamps(left, right) {
  const leftTime = Date.parse(String(left || ""));
  const rightTime = Date.parse(String(right || ""));

  if (Number.isNaN(leftTime) && Number.isNaN(rightTime)) return 0;
  if (Number.isNaN(leftTime)) return -1;
  if (Number.isNaN(rightTime)) return 1;
  if (leftTime === rightTime) return 0;
  return leftTime > rightTime ? 1 : -1;
}

function stableNormalize(value) {
  if (Array.isArray(value)) {
    return value.map((item) => {
      const normalizedItem = stableNormalize(item);
      return typeof normalizedItem === "undefined" ? null : normalizedItem;
    });
  }

  if (isPlainObject(value)) {
    return Object.keys(value)
      .sort()
      .reduce((acc, key) => {
        const normalizedValue = stableNormalize(value[key]);
        if (typeof normalizedValue === "undefined") {
          acc[key] = null;
        } else {
          acc[key] = normalizedValue;
        }
        return acc;
      }, {});
  }

  return value;
}

function deepEqual(left, right) {
  try {
    return JSON.stringify(stableNormalize(left)) === JSON.stringify(stableNormalize(right));
  } catch (_) {
    return false;
  }
}

function deepMerge(target, source) {
  const output = { ...(isPlainObject(target) ? target : {}) };
  Object.keys(source || {}).forEach((key) => {
    if (isPlainObject(source[key]) && isPlainObject(output[key])) {
      output[key] = deepMerge(output[key], source[key]);
    } else {
      output[key] = source[key];
    }
  });
  return output;
}

function buildStorageEnvelope(rawUser) {
  return {
    schema_version: STORAGE_SCHEMA_VERSION,
    saved_at: nowIso(),
    user: sanitizeForStorage(rawUser),
  };
}

function unwrapStorageEnvelope(rawValue) {
  const parsed = safeParseJSON(rawValue, null);
  if (!parsed || typeof parsed !== "object") {
    return { envelope: null, user: null, isLegacy: false, isValid: false };
  }

  if (Object.prototype.hasOwnProperty.call(parsed, "user")) {
    return {
      envelope: parsed,
      user: parsed.user,
      isLegacy: false,
      isValid: true,
    };
  }

  return {
    envelope: null,
    user: parsed,
    isLegacy: true,
    isValid: true,
  };
}

function normalizeSettings(rawSettings) {
  const { UserFormService } = getDeps();
  if (!UserFormService) warnMissingDependency("UserFormService");

  const parsed = UserFormService?.parseSettings
    ? UserFormService.parseSettings(rawSettings)
    : safeParseJSON(rawSettings, {});

  return isPlainObject(parsed) ? { ...parsed } : {};
}

function normalizeDiscountPercent(value) {
  const { UserFormService } = getDeps();
  if (typeof UserFormService?.normalizeDiscountPercent === "function") {
    return UserFormService.normalizeDiscountPercent(value);
  }
  const parsed = parseFloat(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(100, Math.max(0, parsed));
}

function normalizeLinks(rawLinks) {
  const { UserFormService } = getDeps();
  if (!UserFormService) warnMissingDependency("UserFormService");

  const parsedLinks = safeParseJSON(rawLinks, {});
  const compacted = UserFormService?.compactLinksForStorage
    ? UserFormService.compactLinksForStorage(parsedLinks)
    : parsedLinks;

  return stableNormalize(isPlainObject(compacted) ? compacted : {});
}

function normalizePhoneValue(value) {
  const { AuthValidators } = getDeps();
  if (!AuthValidators) warnMissingDependency("AuthValidators");

  return typeof AuthValidators?.normalizePhone === "function"
    ? AuthValidators.normalizePhone(value || "")
    : String(value || "").trim();
}

function isValidPhoneValue(value) {
  const { AuthValidators } = getDeps();
  if (!AuthValidators) warnMissingDependency("AuthValidators");

  return typeof AuthValidators?.isValidPhone === "function"
    ? AuthValidators.isValidPhone(value)
    : !!String(value || "").trim();
}

function buildFallbackPhones(input) {
  const primaryPhone = normalizePhoneValue(input.phone || input.primary_phone || "");
  const whatsappPhone = normalizePhoneValue(input.business_whatsapp || input.whatsapp_phone || "");
  const entries = [];

  if (isValidPhoneValue(primaryPhone)) {
    entries.push({ number: primaryPhone, is_primary: true, has_whatsapp: true });
  }

  if (isValidPhoneValue(whatsappPhone) && whatsappPhone !== primaryPhone) {
    entries.push({ number: whatsappPhone, is_primary: false, has_whatsapp: true });
  }

  return entries;
}

function normalizePhonesInvariant(phones, input = {}) {
  const { UserFormService, AuthValidators } = getDeps();
  if (!UserFormService) warnMissingDependency("UserFormService");
  if (!AuthValidators) warnMissingDependency("AuthValidators");

  const sourcePhones = Array.isArray(phones) && phones.length ? phones : buildFallbackPhones(input);
  const normalizedSource = UserFormService?.normalizePhones
    ? UserFormService.normalizePhones(sourcePhones)
    : (typeof AuthValidators?.normalizePhonesList === "function"
      ? AuthValidators.normalizePhonesList(sourcePhones)
      : sourcePhones);

  const uniquePhones = [];
  const seen = new Set();

  (Array.isArray(normalizedSource) ? normalizedSource : []).forEach((entry) => {
    const number = normalizePhoneValue(entry?.number || "");
    if (!isValidPhoneValue(number) || seen.has(number)) return;

    seen.add(number);
    uniquePhones.push({
      number,
      is_primary: !!entry?.is_primary,
      has_whatsapp: entry?.has_whatsapp !== false,
    });
  });

  if (!uniquePhones.length) {
    return [];
  }

  let primaryIndex = uniquePhones.findIndex((entry) => entry.is_primary);
  if (primaryIndex < 0) primaryIndex = 0;

  return uniquePhones.map((entry, index) => ({
    number: entry.number,
    is_primary: index === primaryIndex,
    has_whatsapp: index === primaryIndex ? true : !!entry.has_whatsapp,
  }));
}

function normalizeLocationsForUser(user, rawSettings) {
  const { UserLocationsClient } = getDeps();
  if (!UserLocationsClient) {
    warnMissingDependency("UserLocationsClient");

    // Safety: If client is missing, do NOT wipe existing locations.
    // Extract from raw settings or user object to preserve data.
    const settings = normalizeSettings(rawSettings);
    const locations = Array.isArray(settings.locations) ? settings.locations : (Array.isArray(user?.locations) ? user.locations : []);

    return {
      locations,
      primary: locations.find(l => l.is_primary) || locations[0] || null,
      settings
    };
  }

  const merged = UserLocationsClient.mergeIntoSettings(rawSettings, {
    legacyCoords: user?.location || user?.Coordinates || user?.coordinates || user?.user_location || "",
    legacyAddress: user?.Address || user?.address || "",
  });

  return {
    locations: Array.isArray(merged.locations) ? merged.locations : [],
    primary: merged.primary || null,
    settings: merged.settings || normalizeSettings(rawSettings),
  };
}

function defineLegacyAccessors(target, explicitSystemRole) {
  Object.defineProperty(target, "Address", {
    configurable: true,
    enumerable: false,
    get() {
      return this.address || "";
    },
    set(value) {
      this.address = String(value || "").trim();
    },
  });

  if (!Object.prototype.hasOwnProperty.call(target, "capabilities")) {
    Object.defineProperty(target, "capabilities", {
      configurable: true,
      enumerable: false,
      get() {
        const { resolveUserCapabilities } = getDeps();
        return typeof resolveUserCapabilities === "function" ? resolveUserCapabilities(this) : undefined;
      },
    });
  }

  if (!Object.prototype.hasOwnProperty.call(target, "system_role")) {
    Object.defineProperty(target, "system_role", {
      configurable: true,
      enumerable: false,
      get() {
        if (explicitSystemRole) return explicitSystemRole;
        const { resolveSystemRole } = getDeps();
        return typeof resolveSystemRole === "function" ? resolveSystemRole(this) : undefined;
      },
    });
  }
}

function normalizeUser(rawUser = {}) {
  try {
    const deps = getDeps();
    const input = isPlainObject(rawUser) ? rawUser : {};
    const explicitSystemRole = typeof input.system_role === "string" && input.system_role.trim()
      ? input.system_role.trim()
      : "";
    const accountType = typeof deps.normalizeAccountType === "function"
      ? deps.normalizeAccountType(input.account_type || 1)
      : (parseInt(input.account_type || 1, 10) || 1);
    const normalizedPhones = normalizePhonesInvariant(input.phones, input);
    const primaryPhone = normalizedPhones.find((item) => item.is_primary)?.number || "";
    const whatsappPhone = normalizedPhones.find((item) => item.is_primary && item.has_whatsapp)?.number
      || normalizedPhones.find((item) => item.has_whatsapp)?.number
      || "";
    const businessWhatsapp = normalizedPhones.find((item) => !item.is_primary && item.has_whatsapp)?.number
      || whatsappPhone
      || normalizePhoneValue(input.business_whatsapp || "");
    const normalizedLocationState = normalizeLocationsForUser(input, input.settings);
    const normalizedSettings = stableNormalize({
      ...normalizeSettings(normalizedLocationState.settings),
      locations: normalizedLocationState.locations,
    });
    const discountPercent = normalizeDiscountPercent(
      input.discountPercent ?? input.discount_percent ?? normalizedSettings.discountPercent ?? 0
    );
    normalizedSettings.discountPercent = discountPercent;
    const normalizedLinks = normalizeLinks(input.links);
    const businessCategory = deps.UserFormService?.normalizeBusinessCategoryJson
      ? deps.UserFormService.normalizeBusinessCategoryJson(input.business_category || "{}")
      : JSON.stringify(stableNormalize(safeParseJSON(input.business_category, {})));

    const resolvedRole = explicitSystemRole || (typeof deps.resolveSystemRole === 'function' ? deps.resolveSystemRole(input) : '');

    const normalized = {
      ...input,
      username: String(input.username || "").trim(),
      system_role: resolvedRole,
      account_type: accountType,
      phones: normalizedPhones,
      phone: primaryPhone || normalizePhoneValue(input.phone || ""),
      primary_phone: primaryPhone,
      whatsapp_phone: whatsappPhone || primaryPhone || "",
      business_whatsapp: businessWhatsapp || "",
      phone_link: primaryPhone ? `tel:${primaryPhone}` : "",
      business_name: String(input.business_name || "").trim(),
      business_category: businessCategory,
      business_bio: String(input.business_bio || "").trim(),
      links: JSON.stringify(normalizedLinks),
      settings: JSON.stringify(normalizedSettings),
      isDelivered: normalizedSettings.isDelivered !== undefined
        ? normalizedSettings.isDelivered
        : (input.isDelivered !== undefined ? input.isDelivered : 0),
      location: normalizedLocationState.primary?.coords || input.location || "",
      address: normalizedLocationState.primary?.address || input.address || input.Address || "",
      limitPackage: parseFloat(input.limitPackage || 0) || 0,
      discountPercent,
      user_image: input.user_image || null,
    };

    delete normalized.capabilities;

    defineLegacyAccessors(normalized, resolvedRole);
    return normalized;
  } catch (error) {
    console.error("normalizeUser failed", error);
    return {};
  }
}

function mergeUser(currentUser, updates) {
  const baseUser = isPlainObject(currentUser) ? { ...currentUser } : {};
  const nextUpdates = isPlainObject(updates) ? { ...updates } : {};

  if (Object.prototype.hasOwnProperty.call(baseUser, "settings")) {
    baseUser.settings = normalizeSettings(baseUser.settings);
  }
  if (Object.prototype.hasOwnProperty.call(nextUpdates, "settings")) {
    nextUpdates.settings = normalizeSettings(nextUpdates.settings);
  }
  if (Object.prototype.hasOwnProperty.call(baseUser, "links")) {
    baseUser.links = normalizeLinks(baseUser.links);
  }
  if (Object.prototype.hasOwnProperty.call(nextUpdates, "links")) {
    nextUpdates.links = normalizeLinks(nextUpdates.links);
  }

  return normalizeUser(deepMerge(baseUser, nextUpdates));
}

function pickComparableUserShape(rawUser) {
  const user = normalizeUser(rawUser);
  const settings = normalizeSettings(user.settings);
  const locations = Array.isArray(settings.locations) ? settings.locations.slice() : [];
  const { locations: _locations, ...comparableSettings } = settings;

  locations.sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));

  return stableNormalize({
    username: user.username,
    account_type: user.account_type,
    phones: user.phones,
    location: user.location,
    address: user.address || "",
    settings: comparableSettings,
    locations,
    limitPackage: user.limitPackage,
    discountPercent: user.discountPercent,
    business_name: user.business_name,
    business_category: user.business_category,
    business_bio: user.business_bio,
    links: normalizeLinks(user.links),
    user_image: user.user_image || null,
  });
}

function sanitizeForStorage(rawUser) {
  const normalized = normalizeUser(rawUser);
  const storageShape = {
    ...normalized,
    address: normalized.address || "",
  };

  delete storageShape.Address;
  delete storageShape.capabilities;

  if (!Object.prototype.propertyIsEnumerable.call(normalized, "system_role")) {
    delete storageShape.system_role;
  }

  return storageShape;
}

function migrateStoredEntry(storageKey) {
  try {
    const rawValue = LocalDBStorage.getItem(storageKey);
    if (!rawValue) return null;

    const unwrapped = unwrapStorageEnvelope(rawValue);
    if (!unwrapped.isValid || !unwrapped.user) {
      console.warn(`[UserService] Removing corrupted storage entry for ${storageKey}`);
      LocalDBStorage.removeItem(storageKey);
      return null;
    }

    const normalizedUser = normalizeUser(unwrapped.user);
    const nextEnvelope = buildStorageEnvelope(normalizedUser);
    const hasSchemaMismatch = !unwrapped.envelope
      || parseInt(unwrapped.envelope.schema_version || 0, 10) !== STORAGE_SCHEMA_VERSION;
    const savedUserChanged = !deepEqual(
      sanitizeForStorage(unwrapped.user),
      nextEnvelope.user
    );

    if (hasSchemaMismatch || savedUserChanged || unwrapped.isLegacy) {
      const { UserFormService, UserLocationsClient } = getDeps();
      if (!UserFormService || !UserLocationsClient) {
        console.warn("[UserService] Deferred storage repair: critical dependencies missing.", {
          hasFormService: !!UserFormService,
          hasLocClient: !!UserLocationsClient
        });
      } else {
        LocalDBStorage.setItem(storageKey, JSON.stringify(nextEnvelope));
        console.info(`[UserService] Repaired storage entry for ${storageKey}`);
      }
    }

    return normalizedUser;
  } catch (error) {
    console.error(`[UserService] Failed to migrate storage entry for ${storageKey}`, error);
    LocalDBStorage.removeItem(storageKey);
    return null;
  }
}

function compareUserFreshness(currentUser, incomingUser) {
  const currentKey = String(currentUser?.user_key || "").trim();
  const incomingKey = String(incomingUser?.user_key || "").trim();

  if (!incomingKey && !currentKey) return 0;
  if (!currentKey && incomingKey) return 1;
  if (currentKey && !incomingKey) return -1;
  if (currentKey !== incomingKey) return 1;

  const fields = ["updated_at", "last_login_at", "saved_at"];
  for (const field of fields) {
    const comparison = compareIsoTimestamps(incomingUser?.[field], currentUser?.[field]);
    if (comparison !== 0) return comparison;
  }

  return 0;
}

function dispatchSessionChange(rawUser, meta = {}) {
  if (typeof window === "undefined" || typeof window.dispatchEvent !== "function") return;

  window.dispatchEvent(new CustomEvent(SESSION_CHANGED_EVENT, {
    detail: {
      user: rawUser ? normalizeUser(rawUser) : null,
      reason: meta.reason || "session-update",
      source: meta.source || "user-service",
      storageKey: SESSION_STORAGE_KEY,
      freshness: compareUserFreshness(null, rawUser),
    },
  }));
}

function save(rawUser) {
  const envelope = buildStorageEnvelope(rawUser);
  LocalDBStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(envelope));
  const user = normalizeUser(envelope.user);
  dispatchSessionChange(user, { reason: "save" });
  return user;
}

function get() {
  try {
    return migrateStoredEntry(SESSION_STORAGE_KEY);
  } catch (error) {
    console.error("[UserService] Failed to read stored user", error);
    return null;
  }
}

function clear() {
  LocalDBStorage.removeItem(SESSION_STORAGE_KEY);
  dispatchSessionChange(null, { reason: "clear" });
}

function saveOriginalSession(rawUser) {
  const envelope = buildStorageEnvelope(rawUser);
  LocalDBStorage.setItem(ORIGINAL_SESSION_STORAGE_KEY, JSON.stringify(envelope));
  return normalizeUser(envelope.user);
}

function getOriginalSession() {
  try {
    return migrateStoredEntry(ORIGINAL_SESSION_STORAGE_KEY);
  } catch (error) {
    console.error("[UserService] Failed to read original session", error);
    return null;
  }
}

function clearOriginalSession() {
  LocalDBStorage.removeItem(ORIGINAL_SESSION_STORAGE_KEY);
}

// Global scope bridge for backward compatibility
const UserService = {
  safeParseJSON,
  stableNormalize,
  deepEqual,
  deepMerge,
  compareIsoTimestamps,
  compareUserFreshness,
  storageSchemaVersion: STORAGE_SCHEMA_VERSION,
  events: {
    sessionChanged: SESSION_CHANGED_EVENT,
  },
  normalizeSettings,
  normalizeLinks,
  normalizeUser,
  mergeUser,
  pickComparableUserShape,
  sanitizeForStorage,
  buildStorageEnvelope,
  unwrapStorageEnvelope,
  migrateStoredEntry,
  save,
  get,
  clear,
  dispatchSessionChange,
  saveOriginalSession,
  getOriginalSession,
  clearOriginalSession,
};

window.UserService = UserService;

console.log("[ESM Load] user-service.js: Hybrid bridge established.");

