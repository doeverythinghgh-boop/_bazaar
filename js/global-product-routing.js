/**
 * @file js/global-product-routing.js
 * @description ESM-backed product/session globals and page-routing helpers.
 */

import {
  buildProductAddUrl,
  buildProductEditUrl,
  buildProductViewUrl,
  getProductKey,
  getProviderKey,
  inferListingType
} from "/pages/products/shared/modules/product-routes.js";

window.userSession = window.userSession || null;
window.productSession = window.productSession || null;
window.mainCategorySelectToAdd = window.mainCategorySelectToAdd || null;
window.subCategorySelectToAdd = window.subCategorySelectToAdd || null;
window.productTypeToAdd = window.productTypeToAdd || null;
window.myProducts = window.myProducts || null;

function loadProductView(productData, options = {}) {
  const viewOptions = typeof options === "boolean" ? { showAddToCart: options } : options;
  const mappedData = (typeof window.mapProductData === "function")
    ? window.mapProductData(productData)
    : productData;

  if (!mappedData) {
    console.error("[ProductView] Failed to process product data or data is invalid.");
    return;
  }

  if (!getProductKey(mappedData)) {
    console.error("[ProductView] Cannot open page without a valid product_key.", mappedData);
    return;
  }

  window.ProductStateManager?.setProductForView?.(mappedData, viewOptions);

  const pageUrl = buildProductViewUrl(mappedData);
  console.log(`[ProductView] Navigating to standalone page: ${pageUrl}`);
  window.location.href = pageUrl;
}

function includeProductCategoryInFilter(filter, productData) {
  const pMainId = String(productData.MainCategory || "");
  const pSubId = String(productData.SubCategory || "");
  if (!pMainId || pMainId === "undefined") return filter;

  if (!filter[pMainId]) {
    filter[pMainId] = (pSubId && pSubId !== "undefined") ? [pSubId] : [];
  } else if (pSubId && pSubId !== "undefined" && !filter[pMainId].includes(pSubId)) {
    filter[pMainId].push(pSubId);
  }
  return filter;
}

function loadProductForm(options = {}) {
  const { editMode = false, productData = null, provider_key = null } = options;
  const categories = window.ProductStateManager?.getSelectedCategories?.();

  if (!editMode && !categories) {
    console.error("[ProductForm] Categories not selected");
    return;
  }

  if (editMode && productData && typeof window.ProductStateManager !== "undefined") {
    window.ProductStateManager.setSelectedCategories(productData.MainCategory || null, productData.SubCategory || null);
  }

  if (editMode && productData) {
    window.ProductStateManager?.setProductForView?.(productData);

    let userSpecialties = window.userSession ? window.userSession.business_category : null;
    if (!userSpecialties && typeof window.SessionManager !== "undefined" && typeof window.SessionManager.getUser === "function") {
      userSpecialties = window.SessionManager.getUser()?.business_category;
    }

    let filter = null;
    if (typeof window.ProductCategoryScope !== "undefined") {
      filter = window.ProductCategoryScope.normalizeFilterMap(userSpecialties);
      filter = includeProductCategoryInFilter(filter, productData);
    } else {
      filter = userSpecialties;
    }

    window.ProductStateManager?.setFormScopeFilter?.(filter);
  }

  let activeProviderKey = provider_key;
  if (editMode && productData && getProviderKey(productData)) {
    activeProviderKey = getProviderKey(productData);
  }
  if (!activeProviderKey && window.userSession) {
    activeProviderKey = window.userSession.user_key;
  }

  const pagePath = editMode
    ? buildProductEditUrl(productData, {
      providerKey: activeProviderKey,
      productKey: getProductKey(productData),
      listingType: inferListingType(productData)
    })
    : buildProductAddUrl({ providerKey: activeProviderKey });

  console.log(`[ProductForm] Loading ${editMode ? "edit" : "add"} product page for category ${(categories && categories.mainId) || "-"} / ${(categories && categories.subId) || "-"}`);
  window.location.href = pagePath;
}

async function showAddProductModal(options = {}) {
  try {
    const addContainer = document.getElementById("index-productAdd-container");
    const activeUrl = addContainer ? addContainer.getAttribute("data-page-url") : null;
    const hasCategories = !!window.ProductStateManager?.getSelectedCategories?.();

    if (activeUrl && hasCategories) {
      console.log("[AddProduct] Active draft detected, skipping category selection.");
      loadProductForm({ editMode: false });
      return;
    }

    if (typeof window.fetchAppCategories === "function") {
      await window.fetchAppCategories();
    }

    const scopedFilter = options?.filter || (window.userSession ? window.userSession.business_category : null);
    if (typeof window.ProductStateManager !== "undefined") {
      window.ProductStateManager.setSelectedCategories(null, null);
      window.ProductStateManager.setFormScopeFilter(
        typeof window.ProductCategoryScope !== "undefined"
          ? window.ProductCategoryScope.normalizeFilterMap(scopedFilter)
          : scopedFilter
      );
    }

    const availableTypes = (typeof window.ProductCategoryScope !== "undefined")
      ? window.ProductCategoryScope.detectAvailableTypes(scopedFilter)
      : { hasProduct: true, hasService: false };

    if (!availableTypes.hasProduct) {
      console.warn("[AddProduct] No allowed categories for this user to add products.");
      return;
    }

    loadProductForm({ editMode: false, provider_key: options.provider_key });
  } catch (error) {
    console.error("[AddProduct] Error determining add path:", error);
  }
}

window.loadProductView = loadProductView;
window.loadProductForm = loadProductForm;
window.showAddProductModal = showAddProductModal;

export { loadProductForm, loadProductView, showAddProductModal };
