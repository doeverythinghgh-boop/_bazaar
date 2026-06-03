/**
 * @file pages/products/shared/model/product-model.js
 * @description Shared product normalization helpers for pages/products.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


window.ProductModel = window.ProductModel || (function createProductModel() {
    function normalize(rawProduct) {
        if (!rawProduct || typeof rawProduct !== 'object') return null;
        if (typeof window.mapProductData === 'function') {
            return window.mapProductData(rawProduct);
        }

        const rawImages = rawProduct.ImageName || rawProduct.image_names || rawProduct.car_image_names || rawProduct.renderedImgUrl || rawProduct.image_url || rawProduct.images || rawProduct.image || rawProduct.product_image || rawProduct.imageSrc || rawProduct.img || '';
        const imageNames = (Array.isArray(rawImages) ? rawImages : (typeof rawImages === 'string' ? rawImages.split(',') : []))
            .map((name) => String(name || '').trim())
            .filter(Boolean);
        const imageSrcArray = imageNames.map((name) => {
            return (typeof getPublicR2FileUrl === 'function') ? getPublicR2FileUrl(name) : name;
        }).filter(Boolean);

        const price = rawProduct.product_price ?? rawProduct.pricePerItem ?? rawProduct.Price ?? rawProduct.price ?? 0;
        const quantity = rawProduct.product_quantity ?? rawProduct.availableQuantity ?? rawProduct.Quantity ?? rawProduct.quantity ?? 0;

        const inferredSource = rawProduct._source || '';
        const inferredItemType = rawProduct.item_type
            || (inferredSource === 'car' ? 'car' : '')
            || (inferredSource === 'real_estate' ? 'real_estate' : '');
        const isCarListing = rawProduct.is_car_listing || inferredSource === 'car' || inferredItemType === 'car';
        const isRealEstateListing = rawProduct.is_real_estate_listing || inferredSource === 'real_estate' || inferredItemType === 'real_estate';
        const rawMainCategory = rawProduct.MainCategory ?? rawProduct.mainCategory ?? rawProduct.mainId;
        const rawSubCategory = rawProduct.SubCategory ?? rawProduct.subCategory ?? rawProduct.subId;
        const hasExplicitCategory = rawMainCategory != null && rawMainCategory !== '' && rawSubCategory != null && rawSubCategory !== '';
        const isPharmacyCategory = String(rawMainCategory) === '20' && String(rawSubCategory) === '204';
        const isPharmacyMetadata = isPharmacyCategory || (!hasExplicitCategory && (rawProduct.pharmacy_metadata || rawProduct.pharmacyMetadata || inferredSource === 'pharmacy'));

        return {
            product_key: rawProduct.product_key || rawProduct.key || rawProduct.id || rawProduct.car_key || rawProduct.real_estate_key || rawProduct.product_id,
            productName: rawProduct.productName || rawProduct.product_name || rawProduct.Name || rawProduct.name || 'منتج غير مسمى',
            user_key: rawProduct.user_key || rawProduct.merchant_user_key || rawProduct.provider_key || rawProduct.seller_key,
            pricePerItem: price,
            product_price: price,
            original_price: rawProduct.original_price,
            image: imageSrcArray.length > 0 ? imageSrcArray[0] : null,
            imageSrc: imageSrcArray,
            image_name: Array.isArray(rawImages) ? rawImages.join(',') : rawImages,
            ImageName: Array.isArray(rawImages) ? rawImages.join(',') : rawImages,
            availableQuantity: quantity,
            product_quantity: quantity,
            sellerMessage: rawProduct.user_message || rawProduct.sellerMessage || '',
            user_message: rawProduct.user_message || rawProduct.sellerMessage || '',
            description: rawProduct.product_description || rawProduct.description || '',
            product_description: rawProduct.product_description || rawProduct.description || '',
            user_note: rawProduct.user_note || rawProduct.product_notes || '',
            sellerName: rawProduct.seller_name || rawProduct.sellerName || rawProduct.seller_username || 'مقدم خدمة غير معروف',
            sellerPhone: rawProduct.seller_phone || rawProduct.sellerPhone || '',
            seller_location: rawProduct.seller_location || '',
            seller_settings: rawProduct.seller_settings || null,
            MainCategory: rawMainCategory,
            SubCategory: rawSubCategory,
            realPrice: rawProduct.realPrice ?? rawProduct.real_price ?? price,
            heavyLoad: rawProduct.heavyLoad ?? rawProduct.heavy_load ?? 0,
            limitPackage: rawProduct.limitPackage ?? 0,
            isDelivered: rawProduct.isDelivered ?? 0,
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
            item_type: inferredItemType || rawProduct.item_type,
            car_key: rawProduct.car_key,
            real_estate_key: rawProduct.real_estate_key,
            is_car_listing: isCarListing,
            is_real_estate_listing: isRealEstateListing,
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
            ratings: rawProduct.ratings ?? '[]',
            type: rawProduct.serviceType ?? rawProduct.type,
            _source: inferredSource || rawProduct._source,
            _isMapped: true
        };
    }

    function toEditFormValues(product) {
        const normalized = normalize(product) || {};
        return {
            productName: normalized.productName || '',
            description: normalized.product_description || normalized.description || '',
            sellerMessage: normalized.user_message || normalized.sellerMessage || '',
            notes: normalized.user_note || '',
            quantity: normalized.product_quantity ?? normalized.availableQuantity ?? '',
            price: normalized.product_price ?? normalized.pricePerItem ?? '',
            originalPrice: normalized.original_price ?? '',
            realPrice: normalized.realPrice ?? '',
            heavyLoad: normalized.heavyLoad == 1
        };
    }

    function isLiteProduct(product) {
        const normalized = normalize(product);
        if (!normalized || !normalized.product_key) return false;
        return (
            !normalized.description ||
            !normalized.sellerName ||
            normalized.sellerName === 'مقدم خدمة غير معروف' ||
            (normalized.imageSrc && normalized.imageSrc.length === 1)
        );
    }

    return {
        isLiteProduct,
        normalize,
        toEditFormValues
    };
})();
