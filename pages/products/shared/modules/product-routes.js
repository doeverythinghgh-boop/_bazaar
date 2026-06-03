/**
 * @file pages/products/shared/modules/product-routes.js
 * @description ESM route builder for all product add/edit/view pages.
 */

const PRODUCT_PATHS = Object.freeze({
    view: "/pages/products/productView/productView.html",
    edit: "/pages/products/productEdit/productEdit.html",
    add: "/pages/products/productAdd/productAdd.html"
});

export function normalizeListingType(value) {
    const raw = String(value || "").trim().toLowerCase();
    if (raw === "car" || raw === "cars") return "car";
    if (raw === "real_estate" || raw === "real-estate" || raw === "realestate") return "real_estate";
    return "";
}

export function inferListingType(productData = null) {
    if (!productData) return "";
    if (productData.item_type === "car" || productData.is_car_listing || productData._source === "car" || productData.car_key) {
        return "car";
    }
    if (
        productData.item_type === "real_estate"
        || productData.is_real_estate_listing
        || productData._source === "real_estate"
        || productData.real_estate_key
    ) {
        return "real_estate";
    }
    return "";
}

export function isPharmacyProduct(productData = null) {
    return window.ProductPharmacyBridge?.isPharmacyProduct?.(productData) === true
        || productData?._source === "pharmacy"
        || productData?.pharmacy_metadata === true
        || productData?.pharmacyMetadata === true
        || !!productData?.pharmacyCatalogItem;
}

export function getProductKey(productData = null) {
    return String(
        productData?.product_key
        || productData?.car_key
        || productData?.real_estate_key
        || productData?.product_id
        || productData?.id
        || ""
    ).trim();
}

export function getProviderKey(productData = null, fallback = "") {
    return String(
        productData?.user_key
        || productData?.merchant_user_key
        || productData?.provider_key
        || productData?.seller_key
        || fallback
        || ""
    ).trim();
}

function appendCommonProductParams(params, productData = null, options = {}) {
    const providerKey = getProviderKey(productData, options.providerKey || options.provider_key || "");
    const productKey = options.productKey || options.product_key || getProductKey(productData);
    const listingType = normalizeListingType(options.listingType || options.listing || inferListingType(productData));

    if (providerKey) params.set("provider_key", providerKey);
    if (productKey) params.set("product_key", productKey);
    if (isPharmacyProduct(productData) || options.pharmacy === true) params.set("pharmacy", "1");
    if (listingType) params.set("listing", listingType);
}

export function buildProductViewUrl(productData = null, options = {}) {
    const params = new URLSearchParams();
    appendCommonProductParams(params, productData, options);
    return `${PRODUCT_PATHS.view}?${params.toString()}`;
}

export function buildProductEditUrl(productData = null, options = {}) {
    const params = new URLSearchParams();
    appendCommonProductParams(params, productData, options);
    return `${PRODUCT_PATHS.edit}?${params.toString()}`;
}

export function buildProductAddUrl(options = {}) {
    const params = new URLSearchParams();
    const providerKey = options.providerKey || options.provider_key || "";
    const listingType = normalizeListingType(options.listingType || options.listing || options.source);
    const mainCategory = options.MainCategory || options.mainCategory || (listingType === "car" ? "7" : (listingType === "real_estate" ? "16" : ""));
    const subCategory = options.SubCategory || options.subCategory || options.sub_category_id || (listingType === "car" ? "1" : "");

    if (providerKey) params.set("provider_key", providerKey);
    if (listingType) params.set("listing", listingType);
    if (mainCategory) params.set("MainCategory", mainCategory);
    if (subCategory) params.set("SubCategory", subCategory);

    const query = params.toString();
    return query ? `${PRODUCT_PATHS.add}?${query}` : PRODUCT_PATHS.add;
}

export function getProductRouteContext(search = window.location.search) {
    const params = new URLSearchParams(search);
    const sourceType = String(params.get("source") || "").trim().toLowerCase();
    const listingType = normalizeListingType(
        params.get("listing")
        || params.get("listing_type")
        || sourceType
        || (params.get("car_key") ? "car" : (params.get("real_estate_key") ? "real_estate" : ""))
    );
    const productKey = params.get("product_key")
        || params.get("key")
        || params.get("id")
        || params.get("car_key")
        || params.get("real_estate_key")
        || params.get("pharmacy_product_id")
        || "";
    const providerKey = params.get("provider_key") || params.get("m") || params.get("merchant_key") || "";
    const isPharmacyRoute = params.get("pharmacy") === "1" || sourceType === "pharmacy" || !!params.get("pharmacy_product_id");

    return {
        params,
        sourceType,
        listingType,
        productKey,
        providerKey,
        isPharmacyRoute
    };
}

export function seedProductAddCategoriesFromUrl(search = window.location.search) {
    const { params, listingType } = getProductRouteContext(search);
    const urlMainId = params.get("MainCategory");
    const urlSubId = params.get("SubCategory") || params.get("sub_category_id");
    const listingMainId = listingType === "car" ? "7" : (listingType === "real_estate" ? "16" : "");
    const listingSubId = listingType === "car" ? "1" : urlSubId;

    if (window.ProductStateManager && ((urlMainId && urlSubId) || listingMainId)) {
        window.ProductStateManager.setSelectedCategories(urlMainId || listingMainId, urlSubId || listingSubId || null);
    }
}

export const ProductRoutes = Object.freeze({
    paths: PRODUCT_PATHS,
    buildProductAddUrl,
    buildProductEditUrl,
    buildProductViewUrl,
    getProductKey,
    getProductRouteContext,
    getProviderKey,
    inferListingType,
    isPharmacyProduct,
    normalizeListingType,
    seedProductAddCategoriesFromUrl
});

window.ProductRoutes = ProductRoutes;

