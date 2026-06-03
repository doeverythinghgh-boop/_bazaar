/**
 * @file js/config-specialty.js
 * @description Business specialty parsing and portfolio behavior configuration.
 * @module config-specialty
 */

console.log("[ESM Load] js/config-specialty.js: Initializing...");

/**
 * Parses the raw business category selection string or object.
 * @param {string|Object} rawBusinessCategory 
 * @returns {Object}
 */
export function parseBusinessCategorySelection(rawBusinessCategory) {
  if (!rawBusinessCategory) return {};

  if (typeof window.normalizeBusinessCategoryMap === "function") {
    return window.normalizeBusinessCategoryMap(rawBusinessCategory);
  }

  let parsed = rawBusinessCategory;
  if (typeof parsed === "string") {
    const trimmed = parsed.trim();
    if (!trimmed) return {};
    if (!trimmed.startsWith("{")) {
      return { [trimmed]: [] };
    }

    try {
      parsed = JSON.parse(trimmed);
    } catch (error) {
      console.warn("[Config] Failed to parse business_category:", error);
      return {};
    }
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {};
  }

  return parsed;
}

/**
 * Gets flat entries of main and sub categories.
 * @param {string|Object} rawBusinessCategory 
 * @returns {Array<Object>}
 */
export function getBusinessSpecialtyEntries(rawBusinessCategory) {
  const categoryMap = parseBusinessCategorySelection(rawBusinessCategory);
  const entries = [];

  Object.entries(categoryMap).forEach(([mainId, subIds]) => {
    const normalizedMainId = String(mainId || "").trim();
    if (!normalizedMainId) return;

    if (!Array.isArray(subIds) || subIds.length === 0) {
      entries.push({ mainId: normalizedMainId, subId: null });
      return;
    }

    subIds.forEach((subId) => {
      const normalizedSubId = String(subId || "").trim();
      if (!normalizedSubId) return;
      entries.push({ mainId: normalizedMainId, subId: normalizedSubId });
    });
  });

  return entries;
}

/**
 * Resolves titles for business categories.
 * @param {Object} categoryMap 
 * @returns {Array<Object>}
 */
export function resolveBusinessSpecialtyTitles(categoryMap) {
  const categories = Array.isArray(window.appCategoriesList?.categories) ? window.appCategoriesList.categories : [];
  const lang = window.app_language || "ar";
  const titles = [];

  Object.entries(categoryMap || {}).forEach(([mainId, subIds]) => {
    const mainCategory = categories.find((item) => String(item.id) === String(mainId));
    const mainTitle = typeof mainCategory?.title === "object"
      ? (mainCategory.title[lang] || mainCategory.title.ar || "")
      : (mainCategory?.title || "");

    if (!mainTitle) {
      titles.push({ mainId: String(mainId), subId: null, label: `#${mainId}` });
      return;
    }

    if (!Array.isArray(subIds) || subIds.length === 0) {
      titles.push({ mainId: String(mainId), subId: null, label: mainTitle });
      return;
    }

    subIds.forEach((subId) => {
      const subCategory = Array.isArray(mainCategory?.subcategories)
        ? mainCategory.subcategories.find((item) => String(item.id) === String(subId))
        : null;
      const subTitle = typeof subCategory?.title === "object"
        ? (subCategory.title[lang] || subCategory.title.ar || "")
        : (subCategory?.title || "");

      titles.push({
        mainId: String(mainId),
        subId: String(subId),
        label: subTitle || mainTitle
      });
    });
  });

  return titles;
}

/**
 * Registry of behavior rules for different specialties.
 */
export const specialtyBehaviorRegistry = {
  defaultRules: {
    portfolio: {
      showProfileTags: true,
      showProductsSection: true,
      showFeaturedSection: true,
      showContactSection: true,
      showRatingsSection: true,
      allowCatalogManagement: true,
      allowSearchWithinCatalog: true,
      canFeatureCatalog: true,
      catalogPresentation: "catalog",
      catalogSectionFallback: "cfg_list_products",
      featuredSectionFallback: "cfg_featured_products",
      searchPanelTitleFallback: "cfg_search_products",
      emptyCatalogFallback: "cfg_no_products",
      emptyFeaturedFallback: "cfg_no_featured_products"
    }
  },
  profileRules: {
    quote_request: {
      portfolio: {
        catalogPresentation: "service",
        catalogSectionFallback: "cfg_list_services",
        featuredSectionFallback: "cfg_featured_services",
        searchPanelTitleFallback: "cfg_search_services",
        emptyCatalogFallback: "cfg_no_services",
        emptyFeaturedFallback: "cfg_no_featured_services"
      }
    },
    delivery_request: {
      portfolio: {
        catalogSectionFallback: "cfg_delivery_services",
        featuredSectionFallback: "cfg_featured_delivery",
        searchPanelTitleFallback: "cfg_search_delivery",
        emptyCatalogFallback: "cfg_no_delivery",
        emptyFeaturedFallback: "cfg_no_featured_delivery"
      }
    },
    booking_profile: { portfolio: { catalogPresentation: "service", catalogSectionFallback: "cfg_edu_services", featuredSectionFallback: "cfg_edu_featured", searchPanelTitleFallback: "cfg_search_services", emptyCatalogFallback: "cfg_no_services", emptyFeaturedFallback: "cfg_no_featured_services" } },
    digital_profile: { portfolio: { catalogPresentation: "service", catalogSectionFallback: "cfg_creative_services", featuredSectionFallback: "cfg_creative_featured", searchPanelTitleFallback: "cfg_search_services", emptyCatalogFallback: "cfg_no_services", emptyFeaturedFallback: "cfg_no_featured_services" } },
    membership_profile: { portfolio: { catalogPresentation: "service", catalogSectionFallback: "cfg_service_list", featuredSectionFallback: "cfg_featured_services", searchPanelTitleFallback: "cfg_search_services", emptyCatalogFallback: "cfg_no_services", emptyFeaturedFallback: "cfg_no_featured_services" } }
  },
  categoryRules: {
    "1": { portfolio: { catalogSectionFallback: "cfg_fashion_collection", featuredSectionFallback: "cfg_fashion_featured", searchPanelTitleFallback: "cfg_fashion_search", modeBadgeFallback: "cfg_fashion_badge" } },
    "2": { portfolio: { catalogSectionFallback: "cfg_food_list", featuredSectionFallback: "cfg_food_featured", searchPanelTitleFallback: "cfg_food_search", modeBadgeFallback: "cfg_food_badge" } },
    "3": { portfolio: { catalogSectionFallback: "cfg_tech_products", featuredSectionFallback: "cfg_tech_featured", searchPanelTitleFallback: "cfg_tech_search", modeBadgeFallback: "cfg_tech_badge" } },
    "6": { portfolio: { catalogSectionFallback: "cfg_service_list", featuredSectionFallback: "cfg_featured_services", searchPanelTitleFallback: "cfg_search_services", modeBadgeFallback: "cfg_service_badge" } },
    "7": { portfolio: { catalogSectionFallback: "cfg_vehicle_listings", featuredSectionFallback: "cfg_vehicle_featured", searchPanelTitleFallback: "cfg_vehicle_search", modeBadgeFallback: "cfg_vehicle_badge" } },
    "20": { portfolio: { catalogSectionFallback: "cfg_med_services", featuredSectionFallback: "cfg_featured_services", searchPanelTitleFallback: "cfg_med_search", modeBadgeFallback: "cfg_med_badge" } },
    "46": { portfolio: { catalogSectionFallback: "cfg_delivery_services", featuredSectionFallback: "cfg_featured_delivery", searchPanelTitleFallback: "cfg_search_delivery", modeBadgeFallback: "cfg_activity_delivery" } }
  }
};

/**
 * Builds a comprehensive specialty profile for a user or category selection.
 * @param {Object|string} userOrBusinessCategory 
 * @param {Object} extra 
 * @returns {Object}
 */
export function buildBusinessSpecialtyProfile(userOrBusinessCategory, extra = {}) {
  const user = (userOrBusinessCategory && typeof userOrBusinessCategory === "object" && !Array.isArray(userOrBusinessCategory))
    ? userOrBusinessCategory
    : { business_category: userOrBusinessCategory, ...extra };

  const categoryMap = parseBusinessCategorySelection(user.business_category);
  const entries = getBusinessSpecialtyEntries(categoryMap);
  const mainCategoryIds = Object.keys(categoryMap);
  const nonDeliveryMainCategoryIds = mainCategoryIds.filter((mainId) => String(mainId) !== String(window.DELIVERY_SERVICE_CATEGORY_ID || "46"));
  const accountType = window.normalizeAccountType(user.account_type);
  const specialtyTitles = resolveBusinessSpecialtyTitles(categoryMap);
  const capabilityDeliver = typeof window.userCanActAsDelivery === "function"
    ? window.userCanActAsDelivery(user)
    : (typeof window.userHasDeliveryServiceCategory === "function" ? window.userHasDeliveryServiceCategory(user.business_category) : false);
  
  const behaviorProfiles = entries.map((entry) => {
    if (typeof window.ProductCategoryUi?.resolveCategoryProfile === "function") {
      return window.ProductCategoryUi.resolveCategoryProfile(entry.mainId, entry.subId);
    }
    return {
      profileKey: "default",
      mainId: entry.mainId,
      subId: entry.subId
    };
  });
  
  const behaviorFamilies = Array.from(new Set(behaviorProfiles.map((item) => (
    typeof window.ProductCategoryUi?.isServiceProfile === "function" && window.ProductCategoryUi.isServiceProfile(item)
      ? "service"
      : "product"
  ))));
  
  const behaviorProfileKeys = Array.from(new Set(behaviorProfiles.map((item) => String(item?.profileKey || "default"))));
  const primaryBehavior = behaviorProfiles[0] || null;

  let primaryMainCategoryId = nonDeliveryMainCategoryIds[0] || mainCategoryIds[0] || null;
  if (nonDeliveryMainCategoryIds.length > 1) {
    primaryMainCategoryId = nonDeliveryMainCategoryIds
      .map((mainId) => ({ mainId, score: Array.isArray(categoryMap[mainId]) ? categoryMap[mainId].length : 0 }))
      .sort((a, b) => b.score - a.score)[0]?.mainId || primaryMainCategoryId;
  }

  return {
    version: 1,
    accountType,
    categoryMap,
    entries,
    mainCategoryIds,
    nonDeliveryMainCategoryIds,
    primaryMainCategoryId,
    hasBusinessSpecialties: mainCategoryIds.length > 0,
    hasSellableSpecialties: nonDeliveryMainCategoryIds.length > 0,
    isServiceProvider: window.checkRole(accountType, window.ACCOUNT_ROLES.SERVICE_PROVIDER),
    isBuyer: window.checkRole(accountType, window.ACCOUNT_ROLES.BUYER),
    isServiceBusiness: behaviorFamilies.includes("service"),
    isProductBusiness: behaviorFamilies.includes("product"),
    canDeliver: capabilityDeliver,
    titles: specialtyTitles,
    behaviorProfiles,
    behaviorFamilies,
    behaviorProfileKeys,
    primaryBehavior
  };
}

/**
 * Resolves the view model for a merchant portfolio based on specialty rules.
 * @param {Object} user 
 * @returns {Object}
 */
export function resolvePortfolioSpecialtyViewModel(user) {
  const profile = buildBusinessSpecialtyProfile(user);
  const registry = specialtyBehaviorRegistry || {};
  const baseRules = registry.defaultRules?.portfolio || {};
  const profileRules = registry.profileRules || {};
  const categoryRules = registry.categoryRules || {};
  const mergedRules = { ...baseRules };

  profile.behaviorProfileKeys.forEach((profileKey) => {
    const rules = profileRules[String(profileKey)]?.portfolio;
    if (rules && typeof rules === "object") Object.assign(mergedRules, rules);
  });
  profile.mainCategoryIds.forEach((mainId) => {
    const rules = categoryRules[String(mainId)]?.portfolio;
    if (rules && typeof rules === "object") Object.assign(mergedRules, rules);
  });

  const catalogEnabled = profile.isServiceProvider && profile.hasBusinessSpecialties;
  const catalogPresentation = String(mergedRules.catalogPresentation || (profile.isServiceBusiness ? "service" : "catalog"));
  const featuredAllowed = catalogEnabled && mergedRules.showFeaturedSection !== false && mergedRules.canFeatureCatalog !== false;

  return {
    profile,
    showProfileTags: mergedRules.showProfileTags !== false,
    showProductsSection: catalogEnabled && mergedRules.showProductsSection !== false,
    showFeaturedSection: featuredAllowed,
    showContactSection: mergedRules.showContactSection !== false,
    showRatingsSection: mergedRules.showRatingsSection !== false,
    allowCatalogManagement: catalogEnabled && mergedRules.allowCatalogManagement !== false,
    allowSearchWithinCatalog: catalogEnabled && mergedRules.allowSearchWithinCatalog !== false,
    canFeatureCatalog: catalogEnabled && mergedRules.canFeatureCatalog !== false,
    hasCatalogAccess: catalogEnabled,
    catalogPresentation,
    catalogSectionTitle: typeof window.langu === "function" ? window.langu(mergedRules.catalogSectionFallback || baseRules.catalogSectionFallback || "cfg_list_products") : (mergedRules.catalogSectionFallback || "Products"),
    featuredSectionTitle: typeof window.langu === "function" ? window.langu(mergedRules.featuredSectionFallback || baseRules.featuredSectionFallback || "cfg_featured_products") : (mergedRules.featuredSectionFallback || "Featured"),
    searchPanelTitle: typeof window.langu === "function" ? window.langu(mergedRules.searchPanelTitleFallback || baseRules.searchPanelTitleFallback || "cfg_search_products") : (mergedRules.searchPanelTitleFallback || "Search"),
    emptyCatalogText: typeof window.langu === "function" ? window.langu(mergedRules.emptyCatalogFallback || baseRules.emptyCatalogFallback || "cfg_no_products") : (mergedRules.emptyCatalogFallback || "No products"),
    emptyFeaturedText: typeof window.langu === "function" ? window.langu(mergedRules.emptyFeaturedFallback || baseRules.emptyFeaturedFallback || "cfg_no_featured_products") : (mergedRules.emptyFeaturedFallback || "No featured products"),
    modeBadgeLabel: typeof window.langu === "function" ? window.langu(mergedRules.modeBadgeFallback || "") : (mergedRules.modeBadgeFallback || "")
  };
}

/**
 * Resolves metadata for business specialty display.
 * @param {Object} userOrProfile 
 * @returns {Object}
 */
export function resolveBusinessSpecialtyDisplayMeta(userOrProfile) {
  const profile = userOrProfile?.categoryMap
    ? userOrProfile
    : buildBusinessSpecialtyProfile(userOrProfile);

  if (!profile) {
    return { primaryCategoryTitle: "", primaryCategoryIcon: "fas fa-store", modeBadgeLabel: "", behaviorLabel: "" };
  }

  const categories = Array.isArray(window.appCategoriesList?.categories) ? window.appCategoriesList.categories : [];
  const lang = window.app_language || "ar";
  const primaryMain = categories.find((item) => String(item.id) === String(profile.primaryMainCategoryId || ""));
  const primaryCategoryTitle = typeof primaryMain?.title === "object"
    ? (primaryMain.title[lang] || primaryMain.title.ar || "")
    : (primaryMain?.title || "");
  const primaryCategoryIcon = primaryMain?.icon || "fas fa-store";
  const primaryBehavior = profile.primaryBehavior || null;

  let behaviorLabel = "";
  if (primaryBehavior && typeof window.ProductCategoryUi?.getProfileLabel === "function") {
    behaviorLabel = window.ProductCategoryUi.getProfileLabel(primaryBehavior);
  } else if (profile.isServiceBusiness) {
    behaviorLabel = lang === "en" ? "Service Business" : "نشاط خدمي";
  } else if (profile.hasBusinessSpecialties) {
    behaviorLabel = lang === "en" ? "Storefront" : "نشاط تجاري";
  }

  const viewModel = resolvePortfolioSpecialtyViewModel({ 
    business_category: JSON.stringify(profile.categoryMap), 
    account_type: profile.accountType 
  });

  const modeBadgeLabel = viewModel?.modeBadgeLabel || primaryCategoryTitle || behaviorLabel;

  return { primaryCategoryTitle, primaryCategoryIcon, modeBadgeLabel, behaviorLabel };
}

/**
 * Resolves the accent color/theme for a business specialty.
 * @param {Object} userOrProfile 
 * @returns {Object}
 */
export function resolveBusinessSpecialtyAccent(userOrProfile) {
  const profile = userOrProfile?.categoryMap
    ? userOrProfile
    : buildBusinessSpecialtyProfile(userOrProfile);
  const primaryMainId = String(profile?.primaryMainCategoryId || "");

  const accentMap = {
    "1": { color: "#b45309", soft: "rgba(245, 158, 11, 0.16)", border: "rgba(180, 83, 9, 0.2)" },
    "2": { color: "#b91c1c", soft: "rgba(239, 68, 68, 0.14)", border: "rgba(185, 28, 28, 0.2)" },
    "3": { color: "#1d4ed8", soft: "rgba(59, 130, 246, 0.14)", border: "rgba(29, 78, 216, 0.2)" },
    "6": { color: "#0f766e", soft: "rgba(20, 184, 166, 0.14)", border: "rgba(15, 118, 110, 0.2)" },
    "7": { color: "#334155", soft: "rgba(148, 163, 184, 0.18)", border: "rgba(51, 65, 85, 0.22)" },
    "20": { color: "#0f766e", soft: "rgba(16, 185, 129, 0.14)", border: "rgba(15, 118, 110, 0.2)" },
    "46": { color: "#7c3aed", soft: "rgba(139, 92, 246, 0.14)", border: "rgba(124, 58, 237, 0.2)" }
  };

  return accentMap[primaryMainId] || { color: "", soft: "", border: "" };
}

// -----------------------------------------------------------------------------
// Hybrid Export Bridge (Legacy Compatibility)
// -----------------------------------------------------------------------------
window.parseBusinessCategorySelection = parseBusinessCategorySelection;
window.getBusinessSpecialtyEntries = getBusinessSpecialtyEntries;
window.resolveBusinessSpecialtyTitles = resolveBusinessSpecialtyTitles;
window.specialtyBehaviorRegistry = specialtyBehaviorRegistry;
window.buildBusinessSpecialtyProfile = buildBusinessSpecialtyProfile;
window.resolvePortfolioSpecialtyViewModel = resolvePortfolioSpecialtyViewModel;
window.resolveBusinessSpecialtyDisplayMeta = resolveBusinessSpecialtyDisplayMeta;
window.resolveBusinessSpecialtyAccent = resolveBusinessSpecialtyAccent;

console.log("[ESM Load] js/config-specialty.js: Hybrid bridge established.");
