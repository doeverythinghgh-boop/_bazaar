/**
 * @file js/shared/user-form-service.js
 * @description Shared helpers for user-facing forms such as register and profile.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


(() => {
  const FormRules = {
    MIN_USERNAME: 3,
    MAX_USERNAME: 30,
    MIN_PASSWORD: 4,
    MIN_BUSINESS_NAME: 3,
    MAX_BUSINESS_NAME: 120,
    MIN_BUSINESS_BIO: 10,
    MAX_BUSINESS_BIO: 1500,
    MIN_ADDRESS: 5,
    MAX_ADDRESS: 240,
    MAX_LOCATIONS: 20,
  };

  function sanitizeTextValue(value, { maxLength = 0, allowNewlines = false } = {}) {
    let normalized = String(value || "")
      .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "");

    if (allowNewlines) {
      normalized = normalized
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .replace(/[ \t]+\n/g, "\n")
        .trim();
    } else {
      normalized = normalized.replace(/\s+/g, " ").trim();
    }

    if (maxLength > 0) {
      normalized = normalized.slice(0, maxLength);
    }

    return normalized;
  }

  function getSelectedAccountType(selector, fallback = 1) {
    const roleCheckboxes = document.querySelectorAll(selector);
    let roles = window.ACCOUNT_ROLES?.BUYER || fallback;

    roleCheckboxes.forEach((chk) => {
      if (chk.checked) {
        roles |= parseInt(chk.value, 10);
      }
    });

    const finalRoles = roles | 1;

    return typeof window.normalizeAccountType === "function"
      ? window.normalizeAccountType(finalRoles)
      : finalRoles;
  }

  function isBusinessAccount(accountType) {
    const buyerRole = window.ACCOUNT_ROLES?.BUYER || 1;
    return parseInt(accountType || buyerRole, 10) > buyerRole;
  }

  function parseSettings(rawSettings) {
    if (!rawSettings) return {};
    if (typeof rawSettings === "object" && !Array.isArray(rawSettings)) {
      return rawSettings;
    }

    try {
      return JSON.parse(rawSettings || "{}");
    } catch (_) {
      return {};
    }
  }

  function normalizePhones(phones) {
    if (typeof AuthValidators?.normalizePhonesList === "function") {
      return AuthValidators.normalizePhonesList(phones || []);
    }
    return Array.isArray(phones) ? phones : [];
  }

  function extractPrimaryPhone(phones) {
    const normalized = normalizePhones(phones);
    return normalized.find((item) => item.is_primary)?.number || "";
  }

  function arePhoneListsEqual(left, right) {
    const normalizedLeft = normalizePhones(left);
    const normalizedRight = normalizePhones(right);
    return window.UserService?.deepEqual
      ? window.UserService.deepEqual(normalizedLeft, normalizedRight)
      : JSON.stringify(normalizedLeft) === JSON.stringify(normalizedRight);
  }

  function normalizeBusinessCategoryJson(rawValue) {
    let parsed = {};

    try {
      parsed = typeof rawValue === "string" ? JSON.parse(rawValue || "{}") : (rawValue || {});
    } catch (_) {
      parsed = {};
    }

    const normalized = typeof window.normalizeBusinessCategoryMap === "function"
      ? window.normalizeBusinessCategoryMap(parsed)
      : parsed;

    return JSON.stringify(normalized || {});
  }

  function getBusinessState({ businessName = "", businessTagline = "", categoryJson = "{}", categoriesList = [] } = {}) {
    const normalizedName = String(businessName || "").trim();
    const normalizedTagline = String(businessTagline || "").trim();
    const normalizedCategoryJson = normalizeBusinessCategoryJson(categoryJson);
    let parsedCategories = {};
    let hasCategorySelection = false;
    let hasSubcategorySelection = false;

    try {
      parsedCategories = JSON.parse(normalizedCategoryJson);
      const mainIds = Object.keys(parsedCategories);
      hasCategorySelection = mainIds.length > 0;

      hasSubcategorySelection = mainIds.some((mainId) => {
        const selectedSubs = Array.isArray(parsedCategories[mainId]) ? parsedCategories[mainId] : [];
        if (selectedSubs.length > 0) return true;

        const mainCategory = categoriesList.find((item) => String(item.id) === String(mainId));
        const subcategories = Array.isArray(mainCategory?.subcategories) ? mainCategory.subcategories : [];
        return subcategories.length === 0;
      });
    } catch (_) {
      parsedCategories = {};
    }

    return {
      businessName: normalizedName,
      businessTagline: normalizedTagline,
      categoryJson: normalizedCategoryJson,
      parsedCategories,
      isBusinessNameValid: normalizedName.length >= FormRules.MIN_BUSINESS_NAME,
      isBusinessTaglineValid: normalizedTagline.length >= FormRules.MIN_BUSINESS_BIO,
      hasCategorySelection,
      hasSubcategorySelection,
    };
  }

  function buildSettingsPayload({
    accountType = 1,
    isDelivered = 0,
    ratingEnabled = true,
    ratingMode = "stars_comments",
    productRatingEnabled = true,
    productRatingMode = "stars_comments",
    locations = [],
    currentSettings = {},
  } = {}) {
    const nextSettings = { ...parseSettings(currentSettings), isDelivered: parseInt(isDelivered || 0, 10) || 0 };

    if (isBusinessAccount(accountType)) {
      nextSettings.ratingEnabled = !!ratingEnabled;
      nextSettings.ratingMode = ratingMode === "stars_only" ? "stars_only" : "stars_comments";
      nextSettings.productRatingEnabled = !!productRatingEnabled;
      nextSettings.productRatingMode = productRatingMode === "stars_only" ? "stars_only" : "stars_comments";
    } else {
      delete nextSettings.ratingEnabled;
      delete nextSettings.ratingMode;
      delete nextSettings.productRatingEnabled;
      delete nextSettings.productRatingMode;
    }

    if (Array.isArray(locations)) {
      nextSettings.locations = window.UserLocationsClient
        ? window.UserLocationsClient.normalizeLocations(locations)
        : locations;
    }

    return nextSettings;
  }

  function normalizeLinksObject(rawLinks) {
    if (window.MultiLinksClient && typeof window.MultiLinksClient.normalizeLinksObject === "function") {
      return window.MultiLinksClient.normalizeLinksObject(rawLinks);
    }
    // Return raw input (parsed if string) to avoid wiping data during early initialization race conditions
    try {
      return typeof rawLinks === 'string' ? JSON.parse(rawLinks || "{}") : (rawLinks || {});
    } catch (_) {
      return rawLinks || {};
    }
  }

  function compactLinksForStorage(rawLinks) {
    const normalized = normalizeLinksObject(rawLinks);
    if (window.MultiLinksClient && typeof window.MultiLinksClient.compactLinksForStorage === "function") {
      return window.MultiLinksClient.compactLinksForStorage(normalized);
    }
    return normalized;
  }

  function buildBusinessBio({ tagline = "", bio = "" } = {}) {
    return [
      sanitizeTextValue(tagline, { maxLength: FormRules.MAX_BUSINESS_NAME }), // reusing business name max as safe default
      sanitizeTextValue(bio, { maxLength: FormRules.MAX_BUSINESS_BIO, allowNewlines: true }),
    ].filter(Boolean).join("\n\n");
  }

  function normalizeDiscountPercent(value) {
    const parsed = parseFloat(value);
    if (!Number.isFinite(parsed)) return 0;
    return Math.min(100, Math.max(0, parsed));
  }

  function validateBusinessProfile({
    accountType = 1,
    businessName = "",
    businessBio = "",
    categoryJson = "{}",
    categoriesList = [],
    requireDescription = true,
  } = {}) {
    const isBusiness = isBusinessAccount(accountType);
    const normalizedName = sanitizeTextValue(businessName, { maxLength: FormRules.MAX_BUSINESS_NAME });
    const normalizedBio = sanitizeTextValue(businessBio, { maxLength: FormRules.MAX_BUSINESS_BIO, allowNewlines: true });
    const normalizedCategoryJson = normalizeBusinessCategoryJson(categoryJson);

    if (!isBusiness) {
      return {
        isValid: true,
        errors: {},
        normalized: {
          businessName: normalizedName,
          businessBio: normalizedBio,
          categoryJson: normalizedCategoryJson,
        },
      };
    }

    const state = getBusinessState({
      businessName: normalizedName,
      businessTagline: normalizedBio,
      categoryJson: normalizedCategoryJson,
      categoriesList,
    });
    const errors = {};

    if (!state.isBusinessNameValid) {
      errors.business_name = "BUSINESS_NAME_REQUIRED";
    }
    if (requireDescription && normalizedBio.length < FormRules.MIN_BUSINESS_BIO) {
      errors.business_bio = "BUSINESS_TAGLINE_REQUIRED";
    }
    if (!(state.hasCategorySelection && state.hasSubcategorySelection)) {
      errors.business_category = "NO_CATEGORY";
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      state,
      normalized: {
        businessName: normalizedName,
        businessBio: normalizedBio,
        categoryJson: normalizedCategoryJson,
      },
    };
  }

  function validateLocationRequirement(accountType, locations = [], draftCoords = "", draftAddr = "") {
    const isBusiness = isBusinessAccount(accountType);
    const primary = window.UserLocationsClient ? window.UserLocationsClient.getPrimary(locations) : (locations[0] || null);

    // Check if user is currently editing or has a draft
    const hasDraft = !!(String(draftCoords || "").trim() || String(draftAddr || "").trim());
    const hasSaved = !!(locations && locations.length);

    if (!isBusiness) {
      // For Buyers: Optional, but if started (draft or saved), it must be complete
      if (!hasSaved && !hasDraft) return { isValid: true };

      const coords = String(primary?.coords || draftCoords || "").trim();
      const addr = String(primary?.address || draftAddr || "").trim();

      if (!coords || !addr) {
        return {
          isValid: false,
          errorCode: "LOCATION_INCOMPLETE_BUYER",
          message: "loc_err_buyer_half_filled"
        };
      }
      return { isValid: true };
    }

    // For Business: Mandatory and must be complete
    if (!primary?.coords && !String(draftCoords || "").trim()) {
      return {
        isValid: false,
        errorCode: "LOCATION_REQUIRED",
        message: "register_error_location_required"
      };
    }

    const coords = String(primary?.coords || draftCoords || "").trim();
    const addr = String(primary?.address || draftAddr || "").trim();

    if (!coords || !addr) {
      return {
        isValid: false,
        errorCode: "LOCATION_INCOMPLETE_BUSINESS",
        message: "loc_err_primary_incomplete"
      };
    }

    return { isValid: true };
  }

  window.UserFormService = {
    FormRules,
    getSelectedAccountType,
    isBusinessAccount,
    parseSettings,
    normalizePhones,
    extractPrimaryPhone,
    arePhoneListsEqual,
    normalizeBusinessCategoryJson,
    getBusinessState,
    buildSettingsPayload,
    normalizeLinksObject,
    compactLinksForStorage,
    sanitizeTextValue,
    buildBusinessBio,
    normalizeDiscountPercent,
    validateBusinessProfile,
    validateLocationRequirement,
  };
})();
