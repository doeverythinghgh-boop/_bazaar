/**
 * @file js/PRODUCT_SERVICE/productMapper.js
 * @description Centralized mapper to transform raw product data from various API endpoints into a unified frontend format.
 * This ensures consistency across different views (Categories, Search, Sales Movement, etc.) and makes maintenance easier.
 * @author Hisham
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


function productMapperText(key, fallback) {
    const value = typeof window.langu === "function" ? window.langu(key) : null;
    return (!value || value === key) ? fallback : value;
}

/**
 * @description Maps raw product data to a unified format used by the Product View and Cart.
 * @function mapProductData
 * @param {Object} rawProduct - The raw product object from the API.
 * @returns {Object} The formatted product object for the frontend.
 * @global
 */
var mapProductData = function (rawProduct) {
    if (!rawProduct || typeof rawProduct !== "object") {
        console.warn("[ProductMapper] Attempted to map invalid product data.");
        return null;
    }

    if (rawProduct.error) {
        console.warn("[ProductMapper] Cannot map an error object:", rawProduct.error);
        return null;
    }

    if (rawProduct._isMapped) {
        return rawProduct;
    }

    var rawImages = rawProduct.ImageName || rawProduct.image_names || rawProduct.car_image_names || rawProduct.renderedImgUrl || rawProduct.image_url || rawProduct.images || rawProduct.image || rawProduct.product_image || rawProduct.imageSrc || rawProduct.img || "";
    var imageNames = Array.isArray(rawImages) ? rawImages : (typeof rawImages === "string" ? rawImages.split(",") : []);
    imageNames = imageNames.map(function (name) {
        return String(name || "").trim();
    }).filter(Boolean);
    var imageSrcArray = imageNames.map(function (name) {
        return (typeof getPublicR2FileUrl === "function") ? getPublicR2FileUrl(name) : name;
    }).filter(Boolean);

    var price = (rawProduct.product_price !== undefined) ? rawProduct.product_price :
        (rawProduct.pricePerItem !== undefined ? rawProduct.pricePerItem :
            (rawProduct.Price !== undefined ? rawProduct.Price : rawProduct.price));

    var quantity = (rawProduct.product_quantity !== undefined) ? rawProduct.product_quantity :
        (rawProduct.availableQuantity !== undefined ? rawProduct.availableQuantity :
            (rawProduct.Quantity !== undefined ? rawProduct.Quantity : rawProduct.quantity));

    var realPrice = (rawProduct.realPrice !== undefined) ? rawProduct.realPrice : (rawProduct.real_price !== undefined ? rawProduct.real_price : price);
    var heavyLoad = (rawProduct.heavyLoad !== undefined) ? rawProduct.heavyLoad : (rawProduct.heavy_load !== undefined ? rawProduct.heavy_load : 0);

    var sellerName = rawProduct.seller_name || rawProduct.sellerName || rawProduct.seller_username || productMapperText("product_mapper_unknown_provider", "مقدم خدمة غير معروف");
    var sellerPhone = rawProduct.seller_phone || rawProduct.sellerPhone || "";

    var rawType = rawProduct.serviceType !== undefined ? rawProduct.serviceType : rawProduct.type;
    var categoryProfile = (window.ProductCategoryUi && typeof window.ProductCategoryUi.resolveProductProfile === "function")
        ? window.ProductCategoryUi.resolveProductProfile(rawProduct)
        : null;

    var inferredSource = rawProduct._source || "";
    var inferredItemType = rawProduct.item_type ||
        (inferredSource === "car" ? "car" : "") ||
        (inferredSource === "real_estate" ? "real_estate" : "");
    var isCarListing = rawProduct.is_car_listing || inferredSource === "car" || inferredItemType === "car";
    var isRealEstateListing = rawProduct.is_real_estate_listing || inferredSource === "real_estate" || inferredItemType === "real_estate";
    var rawMainCategory = rawProduct.MainCategory ?? rawProduct.mainCategory ?? rawProduct.mainId;
    var rawSubCategory = rawProduct.SubCategory ?? rawProduct.subCategory ?? rawProduct.subId;
    var hasExplicitCategory = rawMainCategory != null && rawMainCategory !== "" && rawSubCategory != null && rawSubCategory !== "";
    var isPharmacyCategory = String(rawMainCategory) === "20" && String(rawSubCategory) === "204";
    var isPharmacyMetadata = isPharmacyCategory || (!hasExplicitCategory && (rawProduct.pharmacy_metadata || rawProduct.pharmacyMetadata || inferredSource === "pharmacy"));

    return {
        product_key: rawProduct.product_key || rawProduct.key || rawProduct.id || rawProduct.car_key || rawProduct.real_estate_key || rawProduct.product_id,
        productName: rawProduct.productName || rawProduct.product_name || rawProduct.Name || rawProduct.name || productMapperText("product_mapper_unnamed_product", "منتج غير مسمى"),
        user_key: rawProduct.user_key || rawProduct.merchant_user_key || rawProduct.provider_key || rawProduct.seller_key,
        pricePerItem: price,
        product_price: price,
        original_price: rawProduct.original_price,
        image: imageSrcArray.length > 0 ? imageSrcArray[0] : null,
        imageSrc: imageSrcArray,
        image_name: Array.isArray(rawImages) ? rawImages.join(",") : rawImages,
        ImageName: Array.isArray(rawImages) ? rawImages.join(",") : rawImages,
        availableQuantity: quantity,
        product_quantity: quantity,
        sellerMessage: rawProduct.user_message || rawProduct.sellerMessage || "",
        user_message: rawProduct.user_message || rawProduct.sellerMessage || "",
        description: rawProduct.product_description || rawProduct.description || "",
        product_description: rawProduct.product_description || rawProduct.description || "",
        user_note: rawProduct.user_note || rawProduct.product_notes || "",
        sellerName: sellerName,
        sellerPhone: sellerPhone,
        seller_location: rawProduct.seller_location || "",
        seller_settings: rawProduct.seller_settings || null,
        MainCategory: rawMainCategory,
        SubCategory: rawSubCategory,
        realPrice: realPrice,
        heavyLoad: heavyLoad,
        limitPackage: rawProduct.limitPackage !== undefined ? rawProduct.limitPackage : 0,
        isDelivered: rawProduct.isDelivered !== undefined ? rawProduct.isDelivered : 0,
        ratings: rawProduct.ratings !== undefined ? rawProduct.ratings : "[]",
        type: rawType,
        item_type: inferredItemType || rawProduct.item_type,
        car_key: rawProduct.car_key,
        real_estate_key: rawProduct.real_estate_key,
        is_car_listing: isCarListing,
        is_real_estate_listing: isRealEstateListing,
        pharmacy_metadata: isPharmacyMetadata,
        pharmacyMetadata: isPharmacyMetadata,
        pharmacyCatalogItem: rawProduct.pharmacyCatalogItem || null,
        pharmacy_name_en: rawProduct.pharmacy_name_en || rawProduct.name_en,
        pharmacy_brand_ar: rawProduct.pharmacy_brand_ar || rawProduct.brand_ar,
        pharmacy_brand_en: rawProduct.pharmacy_brand_en || rawProduct.brand_en,
        pharmacy_barcode: rawProduct.pharmacy_barcode || rawProduct.barcode,
        pharmacy_manufacturer: rawProduct.pharmacy_manufacturer || rawProduct.manufacturer,
        pharmacy_discount: rawProduct.pharmacy_discount ?? rawProduct.discount,
        pharmacy_status: rawProduct.pharmacy_status ?? rawProduct.status,
        pharmacy_rx_required: rawProduct.pharmacy_rx_required ?? rawProduct.is_prescription_required,
        pharmacy_form_ref: rawProduct.pharmacy_form_ref || rawProduct.form_ref,
        pharmacy_strength_ref: rawProduct.pharmacy_strength_ref || rawProduct.strength_ref,
        pharmacy_active_ingredients: rawProduct.pharmacy_active_ingredients || rawProduct.active_ingredients || rawProduct.active_ingredients_list,
        year: rawProduct.year,
        selections: rawProduct.selections,
        area_sqm: rawProduct.area_sqm,
        rooms: rawProduct.rooms,
        bathrooms: rawProduct.bathrooms,
        floor_level: rawProduct.floor_level,
        address: rawProduct.address,
        location_lat: rawProduct.location_lat,
        location_lng: rawProduct.location_lng,
        car_image_names: rawProduct.car_image_names,
        image_names: rawProduct.image_names,
        itemFamily: "category",
        itemTypeKey: categoryProfile?.profileKey || (String(rawType) === "2" ? "legacy_service" : "legacy_product"),
        categoryProfileKey: categoryProfile?.profileKey || null,
        hidePrice: false,
        categoryFlags: null,
        listingPage: "/pages/products/productView/productView.html",
        addPage: "/pages/products/productAdd/productAdd.html",
        editPage: "/pages/products/productEdit/productEdit.html",
        _source: inferredSource || rawProduct._source,
        _isMapped: true
    };
};

window.mapProductData = mapProductData;
