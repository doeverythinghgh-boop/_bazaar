/**
 * @file js/global-categories.js
 * @description Global category normalization and category-list bootstrap state.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


window.appCategoriesList = null;

window.normalizeCategorySelection = function (mainId, subId = null) {
  return {
    mainId: mainId == null ? "" : String(mainId),
    subId: subId == null ? "" : String(subId)
  };
};

window.getCompatibleCategorySelections = function (mainId, subId = null) {
  const normalized = window.normalizeCategorySelection(mainId, subId);
  return [normalized];
};

window.normalizeBusinessCategoryMap = function (raw) {
  if (!raw) return {};

  let parsed = raw;
  if (typeof parsed === "string") {
    const trimmed = parsed.trim();
    if (!trimmed) return {};
    if (!trimmed.startsWith("{")) {
      return { [String(trimmed)]: [] };
    }
    try {
      parsed = JSON.parse(trimmed);
    } catch (error) {
      console.warn("[CategoryCompatibility] Failed to parse business category map:", error);
      return {};
    }
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {};
  }

  const normalized = {};
  Object.entries(parsed).forEach(([mainId, subIds]) => {
    const mainKey = String(mainId);
    const subList = Array.isArray(subIds) ? subIds.map(String) : [];
    normalized[mainKey] = subList;
  });

  return normalized;
};

window.selectedSearchProductsSet = new Set();

async function fetchAppCategories() {
  if (window.appCategoriesList) return window.appCategoriesList;
  try {
    const response = await fetch(`/shared/list.json?v=${Date.now()}`);
    if (!response.ok) throw new Error("Failed to load list.json");
    window.appCategoriesList = await response.json();
    console.log("[Global] Categories list loaded successfully.");
    return window.appCategoriesList;
  } catch (error) {
    console.error("[Global] Error loading categories list:", error);
    return null;
  }
}
