/**
 * @file js/api-client/products.js
 * @description Direct REST client products service for Suez Bazaar marketplace, search, and ratings.
 * Runs purely browser-side using BazaarRuntimeConfig and ApiClientDb.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

(function (global) {
    "use strict";

    const PRODUCTS_COLLECTION = "marketplace_products";
    const RATINGS_COLLECTION = "product_ratings_v2";
    const EXTERNAL_RATINGS_COLLECTION = "product_ratings_v2";

    function clampRating(value) {
        return Math.max(1, Math.min(5, parseInt(value, 10) || 0));
    }

    function parseSettings(rawSettings) {
        if (!rawSettings) return {};
        if (typeof rawSettings === "object") return rawSettings;
        try {
            return JSON.parse(rawSettings);
        } catch (_) {
            return {};
        }
    }

    function getProductRatingPolicyFromSettings(rawSettings) {
        const settings = parseSettings(rawSettings);
        return {
            enabled: settings.productRatingEnabled !== false,
            mode: settings.productRatingMode === "stars_only" ? "stars_only" : "stars_comments",
        };
    }

    function normalizeProductRecord(row = {}) {
        const productKey = String(row.product_key || row._firestore_id || row.id || "").trim();
        return {
            ...row,
            id: Number(row.id || 0) || row.id || productKey,
            product_key: productKey,
            product_price: row.product_price === null || row.product_price === undefined ? null : Number(row.product_price),
            original_price: row.original_price === null || row.original_price === undefined ? null : Number(row.original_price),
            realPrice: row.realPrice === null || row.realPrice === undefined ? null : Number(row.realPrice),
            product_quantity: row.product_quantity === null || row.product_quantity === undefined ? null : parseInt(row.product_quantity, 10),
            MainCategory: row.MainCategory === null || row.MainCategory === undefined ? null : parseInt(row.MainCategory, 10),
            SubCategory: row.SubCategory === null || row.SubCategory === undefined || row.SubCategory === "" ? null : parseInt(row.SubCategory, 10),
            ImageIndex: row.ImageIndex === null || row.ImageIndex === undefined ? null : parseInt(row.ImageIndex, 10),
            serviceType: row.serviceType === null || row.serviceType === undefined ? null : parseInt(row.serviceType, 10),
            is_approved: row.is_approved === null || row.is_approved === undefined ? 0 : parseInt(row.is_approved, 10),
            heavyLoad: row.heavyLoad === null || row.heavyLoad === undefined ? null : Number(row.heavyLoad),
        };
    }

    function normalizeRatingRecord(row = {}) {
        const ratingId = String(row.id || row.rating_id || row._firestore_id || "").trim();
        const createdAt = row.created_at || row.date || new Date().toISOString();
        const updatedAt = row.updated_at || row.edited_at || createdAt;
        return {
            id: ratingId,
            product_key: String(row.product_key || "").trim(),
            actor_user_key: String(row.actor_user_key || row.rater_id || "").trim(),
            actor_name: String(row.actor_name || row.rater_name || ""),
            rating: clampRating(row.rating),
            note: String(row.note || ""),
            created_at: createdAt,
            updated_at: updatedAt,
            _firestore_id: row._firestore_id || ratingId,
        };
    }

    function toRatingView(row = {}) {
        const rating = normalizeRatingRecord(row);
        return {
            rating_id: rating.id,
            rater_id: rating.actor_user_key,
            rater_name: rating.actor_name,
            rating: rating.rating,
            note: rating.note || "",
            date: rating.created_at,
            edited_at: rating.updated_at !== rating.created_at ? rating.updated_at : undefined,
        };
    }

    function normalizeDigits(value) {
        if (!value) return "";
        const map = {
            "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
            "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9"
        };
        return String(value).replace(/[٠-٩]/g, (digit) => map[digit] || digit);
    }

    function normalizeArabicSearchTerm(term) {
        if (!term) return "";
        let cleaned = normalizeDigits(term).trim().toLowerCase();
        // Remove Arabic diacritics (harakat)
        cleaned = cleaned.replace(/[\u064B-\u065F]/g, "");
        // Normalize Alef
        cleaned = cleaned.replace(/[\u0622\u0623\u0625]/g, "\u0627");
        // Normalize Yeh
        cleaned = cleaned.replace(/\u0649/g, "\u064A");
        // Normalize Teh Marbuta
        cleaned = cleaned.replace(/\u0629/g, "\u0647");
        return cleaned;
    }

    function buildSearchableText(fields) {
        return (fields || [])
            .filter(Boolean)
            .map(normalizeArabicSearchTerm)
            .join(" ");
    }

    function productMatchesSearch(product, searchTerm) {
        if (!searchTerm) return true;
        const normalized = normalizeArabicSearchTerm(searchTerm);
        if (!normalized) return true;
        const text = buildSearchableText([
            product.productName,
            product.product_description,
            product.user_message,
            product.user_note,
        ]);
        return text.includes(normalized);
    }

    function productSort(a, b) {
        const approvedCompare = Number(b.is_approved || 0) - Number(a.is_approved || 0);
        if (approvedCompare) return approvedCompare;
        const updatedCompare = String(b.updated_at || b.created_at || "").localeCompare(String(a.updated_at || a.created_at || ""));
        if (updatedCompare) return updatedCompare;
        return Number(b.id || 0) - Number(a.id || 0);
    }

    function normalizeListingType(value) {
        const raw = String(value || "").trim().toLowerCase();
        if (raw === "car" || raw === "cars") return "car";
        if (raw === "real_estate" || raw === "real-estate" || raw === "realestate") return "real_estate";
        if (raw === "pharmacy") return "pharmacy";
        return "";
    }

    function mapCarListingRow(car = {}) {
        const brand = car.brand_id ? String(car.brand_id).replace(/[_-]+/g, " ") : "";
        const year = car.year ? String(car.year) : "";
        const title = [brand, year].filter(Boolean).join(" ") || `Car ${car.car_key}`;
        return {
            ...car,
            product_key: car.car_key,
            productName: title,
            product_price: car.price,
            product_description: car.notes || "",
            ImageName: car.car_image_names,
            MainCategory: 7,
            SubCategory: 1,
            is_approved: 1,
            _source: "car",
            item_type: "car",
            is_car_listing: true,
        };
    }

    function mapRealEstateListingRow(realEstate = {}) {
        const propType = realEstate.property_type ? String(realEstate.property_type).replace(/[_-]+/g, " ") : "عقار";
        const area = realEstate.area_sqm
            ? (typeof formatRealEstateArea === 'function' ? formatRealEstateArea(realEstate.area_sqm) : `${String(realEstate.area_sqm)} m²`)
            : "";
        const title = [propType, area].filter(Boolean).join(" - ") || `RealEstate ${realEstate.real_estate_key}`;
        return {
            ...realEstate,
            product_key: realEstate.real_estate_key,
            productName: title,
            product_price: realEstate.price,
            product_description: realEstate.notes || "",
            ImageName: realEstate.image_names,
            MainCategory: 16,
            SubCategory: parseInt(realEstate.sub_category_id, 10) || 1,
            is_approved: 1,
            _source: "real_estate",
            item_type: "real_estate",
            is_real_estate_listing: true,
        };
    }

    function mapPharmacyMetadataRow(pharm = {}, productKey = "") {
        const key = String(pharm.product_id || pharm._firestore_id || productKey || "").trim();
        return {
            ...pharm,
            product_key: key,
            product_id: key,
            user_key: pharm.user_key || pharm.merchant_key,
            productName: pharm.name_ar || pharm.name_en || "صيدلية",
            product_description: pharm.description || "",
            product_price: pharm.price || 0,
            product_quantity: pharm.stock_quantity ?? 0,
            ImageName: pharm.image_names || "",
            MainCategory: pharm.custom_main_cat_id || pharm.main_category_id || 20,
            SubCategory: pharm.custom_sub_cat_id || pharm.sub_category_id || 204,
            is_approved: 1,
            _source: "pharmacy",
            item_type: "pharmacy",
            pharmacy_metadata: true,
            pharmacyMetadata: true,
        };
    }

    async function findPharmacyMetadataByProductKey(productKey) {
        const key = String(productKey || "").trim();
        if (!key) return null;
        const byProductId = await global.ApiClientDb.externalSpecialty.findByField("pharmacy_products_metadata", "product_id", key, { limit: 1 });
        if (Array.isArray(byProductId) && byProductId.length) return byProductId[0];

        const byOriginalCatalogId = await global.ApiClientDb.externalSpecialty.findByField("pharmacy_products_metadata", "original_catalog_id", key, { limit: 1 });
        if (Array.isArray(byOriginalCatalogId) && byOriginalCatalogId.length) return byOriginalCatalogId[0];

        return null;
    }

    async function fetchExternalRatingRowsByKeys(productKeys) {
        if (!productKeys.length) return [];
        const results = await Promise.all(
            productKeys.map((key) => global.ApiClientDb.externalSpecialty.findByField(EXTERNAL_RATINGS_COLLECTION, "product_key", key))
        );
        return results.flat();
    }

    async function fetchExternalProductRatings(productKey) {
        const rows = await global.ApiClientDb.externalSpecialty.findByField(EXTERNAL_RATINGS_COLLECTION, "product_key", productKey);
        return rows
            .map((row) => toRatingView(normalizeRatingRecord(row)))
            .sort((a, b) => String(b.edited_at || b.date || "").localeCompare(String(a.edited_at || a.date || "")));
    }

    async function replaceExternalProductRatings(productKey, ratings = []) {
        if (!productKey) return [];
        await global.ApiClientDb.externalSpecialty.deleteByField(EXTERNAL_RATINGS_COLLECTION, "product_key", productKey);
        const list = Array.isArray(ratings) ? ratings : [];
        await Promise.all(list.map((rating) => {
            const id = rating?.rating_id || rating?.id || `prt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
            const createdAt = rating?.date || rating?.created_at || new Date().toISOString();
            const updatedAt = rating?.edited_at || rating?.updated_at || createdAt;
            return global.ApiClientDb.externalSpecialty.setDoc(EXTERNAL_RATINGS_COLLECTION, id, {
                id,
                product_key: productKey,
                actor_user_key: String(rating?.rater_id || rating?.actor_user_key || ""),
                actor_name: String(rating?.rater_name || rating?.actor_name || ""),
                rating: clampRating(rating?.rating),
                note: String(rating?.note || ""),
                created_at: createdAt,
                updated_at: updatedAt,
            });
        }));
        return list;
    }

    async function fetchProductRatings(productKey) {
        const rows = await global.ApiClientDb.products.findByField(RATINGS_COLLECTION, "product_key", productKey);
        return rows
            .map((row) => toRatingView(row))
            .sort((a, b) => String(b.edited_at || b.date || "").localeCompare(String(a.edited_at || a.date || "")));
    }

    async function replaceProductRatings(productKey, ratings = []) {
        if (!productKey) return [];
        await global.ApiClientDb.products.deleteByField(RATINGS_COLLECTION, "product_key", productKey);
        const list = Array.isArray(ratings) ? ratings : [];
        await Promise.all(list.map((rating) => {
            const id = rating?.rating_id || rating?.id || `prt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
            const createdAt = rating?.date || rating?.created_at || new Date().toISOString();
            const updatedAt = rating?.edited_at || rating?.updated_at || createdAt;
            return global.ApiClientDb.products.setDoc(RATINGS_COLLECTION, id, {
                id,
                product_key: productKey,
                actor_user_key: String(rating?.rater_id || rating?.actor_user_key || ""),
                actor_name: String(rating?.rater_name || rating?.actor_name || ""),
                rating: clampRating(rating?.rating),
                note: String(rating?.note || ""),
                created_at: createdAt,
                updated_at: updatedAt,
            });
        }));
        return list;
    }

    async function fetchProducts(filters = {}) {
        let rows = [];
        if (filters.productKey) {
            const listingType = normalizeListingType(filters.listingType);

            if (listingType === "car") {
                const carRows = await global.ApiClientDb.externalSpecialty.findByField("vehicle_listings", "car_key", filters.productKey);
                rows = carRows.map(mapCarListingRow);
            } else if (listingType === "real_estate") {
                const realEstateRows = await global.ApiClientDb.externalSpecialty.findByField("real_estate_listings", "real_estate_key", filters.productKey);
                rows = realEstateRows.map(mapRealEstateListingRow);
            } else if (listingType === "pharmacy") {
                const pharm = await findPharmacyMetadataByProductKey(filters.productKey);
                rows = pharm ? [mapPharmacyMetadataRow(pharm, filters.productKey)] : [];
            } else {
                rows = await global.ApiClientDb.products.findByField(PRODUCTS_COLLECTION, "product_key", filters.productKey, { limit: 1 });

                if (!rows.length) {
                    const direct = await global.ApiClientDb.products.getDoc(PRODUCTS_COLLECTION, filters.productKey);
                    rows = direct ? [direct] : [];
                }
            }

            if (!rows.length) {
                // Try fetching from external cars
                const carRows = await global.ApiClientDb.externalSpecialty.findByField("vehicle_listings", "car_key", filters.productKey);
                if (carRows.length) {
                    rows = carRows.map(mapCarListingRow);
                } else {
                    // Try fetching from external real estate
                    const realEstateRows = await global.ApiClientDb.externalSpecialty.findByField("real_estate_listings", "real_estate_key", filters.productKey);
                    if (realEstateRows.length) {
                        rows = realEstateRows.map(mapRealEstateListingRow);
                    } else {
                        // Try fetching merchant pharmacy metadata without probing a direct document id.
                        const pharm = await findPharmacyMetadataByProductKey(filters.productKey);
                        if (pharm) {
                            rows = [mapPharmacyMetadataRow(pharm, filters.productKey)];
                        } else if (filters.userKey) {
                            rows = [{
                                product_key: filters.productKey,
                                user_key: filters.userKey,
                                is_approved: 1,
                            }];
                        }
                    }
                }
            }
        } else if (filters.productKeys?.length) {
            rows = await global.ApiClientDb.products.findByFieldIn(PRODUCTS_COLLECTION, "product_key", filters.productKeys);
        } else if (filters.userKey && !filters.searchTerm && !filters.mainCategory && !filters.subCategory && filters.status === undefined) {
            rows = await global.ApiClientDb.products.findByField(PRODUCTS_COLLECTION, "user_key", filters.userKey);
        } else {
            rows = await global.ApiClientDb.products.listAllDocs(PRODUCTS_COLLECTION, { maxRows: 5000 });
        }

        rows = rows.map(normalizeProductRecord).filter((product) => product.product_key);

        if (filters.productKey && (filters.status === undefined || filters.status === null)) {
            rows = rows.filter((product) => Number(product.is_approved || 0) === 1);
        }
        if (filters.userKey && !filters.productKey) {
            rows = rows.filter((product) => String(product.user_key || "") === String(filters.userKey));
        }
        if (filters.mainCategory) {
            rows = rows.filter((product) => String(product.MainCategory) === String(parseInt(filters.mainCategory, 10)));
        }
        if (filters.subCategory) {
            rows = rows.filter((product) => String(product.SubCategory) === String(parseInt(filters.subCategory, 10)));
        }
        if (filters.status !== undefined && filters.status !== null && filters.status !== "any") {
            rows = rows.filter((product) => Number(product.is_approved || 0) === parseInt(filters.status, 10));
        }
        if (filters.searchTerm) {
            rows = rows.filter((product) => productMatchesSearch(product, filters.searchTerm));
        }

        rows.sort(productSort);

        if (!filters.productKey && filters.limit) {
            const offset = parseInt(filters.offset || 0, 10) || 0;
            rows = rows.slice(offset, offset + filters.limit);
        }

        const externalKeys = rows.filter((row) => row._source).map((row) => row.product_key).filter(Boolean);
        const marketplaceKeys = rows.filter((row) => !row._source).map((row) => row.product_key).filter(Boolean);

        const [mainRatingRows, externalRatingRows] = await Promise.all([
            marketplaceKeys.length
                ? global.ApiClientDb.products.findByFieldIn(RATINGS_COLLECTION, "product_key", marketplaceKeys)
                : Promise.resolve([]),
            externalKeys.length
                ? fetchExternalRatingRowsByKeys(externalKeys)
                : Promise.resolve([]),
        ]);
        const ratingRows = [...mainRatingRows, ...externalRatingRows];

        const ratingsMap = new Map();
        for (const row of ratingRows) {
            const rating = normalizeRatingRecord(row);
            if (!ratingsMap.has(rating.product_key)) ratingsMap.set(rating.product_key, []);
            ratingsMap.get(rating.product_key).push(toRatingView(rating));
        }
        for (const ratings of ratingsMap.values()) {
            ratings.sort((a, b) => String(b.edited_at || b.date || "").localeCompare(String(a.edited_at || a.date || "")));
        }

        const sellerKeys = Array.from(new Set(rows.map((row) => row.user_key).filter(Boolean)));
        let sellers = [];
        if (window.FirestoreIdentityApi && typeof window.FirestoreIdentityApi.hydrateUsers === "function" && sellerKeys.length) {
            try {
                sellers = await Promise.all(sellerKeys.map((key) => window.FirestoreIdentityApi.getDoc("users", key)));
            } catch (error) {
                console.warn("[ApiClient Products] Seller hydration failed. Continuing with product data only:", error);
                sellers = [];
            }
        }
        const sellerMap = new Map(sellers.filter(Boolean).map((seller) => [seller.user_key || seller._firestore_id, seller]));

        return rows.map((row) => {
            const seller = sellerMap.get(row.user_key) || {};
            return {
                ...row,
                seller_name: seller.username || "",
                seller_phone: seller.phone || "",
                seller_location: seller.location || "",
                limitPackage: seller.limitPackage,
                account_type: seller.account_type,
                seller_settings: typeof seller.settings === "string" ? seller.settings : JSON.stringify(seller.settings || {}),
                fcm_token: seller.fcm_token || null,
                platform: seller.platform || null,
                ratings: ratingsMap.get(row.product_key) || [],
            };
        });
    }

    function buildProductPayload(payload, current = {}) {
        const timestamp = new Date().toISOString();
        const productKey = String(payload.product_key || current.product_key || "").trim();
        return {
            ...current,
            ...payload,
            id: current.id || payload.id || Date.now(),
            productName: payload.productName,
            user_key: payload.user_key,
            product_key: productKey,
            product_description: payload.product_description || null,
            product_price: parseFloat(payload.product_price || 0),
            original_price: payload.original_price ? parseFloat(payload.original_price) : null,
            realPrice: payload.realPrice ? parseFloat(payload.realPrice) : null,
            product_quantity: parseInt(payload.product_quantity || 0, 10),
            user_message: payload.user_message || null,
            user_note: payload.user_note || null,
            ImageName: payload.ImageName || null,
            MainCategory: parseInt(payload.MainCategory, 10),
            SubCategory: payload.SubCategory ? parseInt(payload.SubCategory, 10) : null,
            ImageIndex: parseInt(payload.ImageIndex || 1, 10),
            serviceType: parseInt(payload.serviceType || 0, 10),
            is_approved: parseInt(payload.is_approved ?? 0, 10),
            heavyLoad: parseFloat(payload.heavyLoad || 0),
            created_at: current.created_at || payload.created_at || timestamp,
            updated_at: timestamp,
        };
    }

    async function createProduct(payload) {
        console.log(`[ApiClient Products] Creating product: ${payload.productName}`);
        const product = buildProductPayload(payload);
        await global.ApiClientDb.products.setDoc(PRODUCTS_COLLECTION, product.product_key, product);
        await replaceProductRatings(product.product_key, []);
        const rows = await fetchProducts({ productKey: product.product_key, status: payload.is_approved ?? 1 });
        return rows[0] || null;
    }

    async function updateProduct(payload) {
        console.log(`[ApiClient Products] Updating product: ${payload.product_key}`);
        const productKey = String(payload.product_key || "").trim();
        const current = await global.ApiClientDb.products.getDoc(PRODUCTS_COLLECTION, productKey);
        if (!current) throw new Error("PRODUCT_NOT_FOUND");

        const mappings = {
            productName: (value) => value,
            product_description: (value) => value,
            product_price: (value) => parseFloat(value),
            original_price: (value) => (value ? parseFloat(value) : null),
            product_quantity: (value) => parseInt(value, 10),
            user_message: (value) => value,
            user_note: (value) => value,
            ImageName: (value) => value,
            MainCategory: (value) => parseInt(value, 10),
            SubCategory: (value) => (value ? parseInt(value, 10) : null),
            ImageIndex: (value) => parseInt(value, 10),
            serviceType: (value) => parseInt(value, 10),
            is_approved: (value) => parseInt(value, 10),
            realPrice: (value) => (value ? parseFloat(value) : null),
            heavyLoad: (value) => parseFloat(value),
        };

        const updates = {};
        Object.entries(mappings).forEach(([field, mapper]) => {
            if (payload[field] !== undefined) {
                updates[field] = mapper(payload[field]);
            }
        });

        if (!Object.keys(updates).length) {
            throw new Error("NO_FIELDS_TO_UPDATE");
        }

        const nextProduct = {
            ...normalizeProductRecord(current),
            ...updates,
            product_key: productKey,
            updated_at: new Date().toISOString(),
        };

        await global.ApiClientDb.products.setDoc(PRODUCTS_COLLECTION, productKey, nextProduct);
        const rows = await fetchProducts({
            productKey,
            status: payload.is_approved,
        });
        return rows[0] || null;
    }

    async function deleteProduct(productKey) {
        console.log(`[ApiClient Products] Deleting product: ${productKey}`);
        await global.ApiClientDb.products.deleteByField(RATINGS_COLLECTION, "product_key", productKey);
        await global.ApiClientDb.products.deleteDoc(PRODUCTS_COLLECTION, productKey);
        return true;
    }

    async function saveProductRating(productKey, actorUserKey, ratingData) {
        console.log(`[ApiClient Products] Saving rating for product: ${productKey}`);
        const products = await fetchProducts({ productKey, status: "any" });
        if (!products.length) {
            throw new Error("PRODUCT_NOT_FOUND");
        }

        const current = products[0];
        const isExternal = !!(current._source);

        if (current.user_key && String(current.user_key) === String(actorUserKey)) {
            throw new Error("SELF_RATING_NOT_ALLOWED");
        }

        const seller = (window.FirestoreIdentityApi && typeof window.FirestoreIdentityApi.getDoc === "function" && current.user_key)
            ? await window.FirestoreIdentityApi.getDoc("users", current.user_key)
            : {};
        const policy = getProductRatingPolicyFromSettings(seller?.settings);
        if (!policy.enabled) {
            throw new Error("PRODUCT_RATING_DISABLED");
        }

        const ratings = isExternal
            ? await fetchExternalProductRatings(productKey)
            : await fetchProductRatings(productKey);

        const existingIndex = ratings.findIndex((item) => String(item.rater_id) === String(actorUserKey));
        const timestamp = new Date().toISOString();

        const nextRating = {
            rating_id: existingIndex >= 0 ? ratings[existingIndex].rating_id : `prt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
            rater_id: String(actorUserKey),
            rater_name: String(ratingData.rater_name || ratings[existingIndex]?.rater_name || ""),
            rating: clampRating(ratingData.rating),
            note: policy.mode === "stars_only" ? "" : String(ratingData.note || ""),
            date: existingIndex >= 0 ? ratings[existingIndex].date : timestamp,
            edited_at: existingIndex >= 0 ? timestamp : undefined,
        };

        if (existingIndex >= 0) ratings[existingIndex] = nextRating;
        else ratings.push(nextRating);

        if (isExternal) {
            await replaceExternalProductRatings(productKey, ratings);
        } else {
            await replaceProductRatings(productKey, ratings);
        }
        return ratings;
    }

    async function deleteProductRating(productKey, actorUserKey) {
        console.log(`[ApiClient Products] Deleting rating for product: ${productKey}`);
        const products = await fetchProducts({ productKey, status: "any" });
        const isExternal = products.length > 0 && !!(products[0]._source);

        if (isExternal) {
            const rows = await global.ApiClientDb.externalSpecialty.findByField(EXTERNAL_RATINGS_COLLECTION, "product_key", productKey);
            const toDelete = rows.filter((row) => String(row.actor_user_key || row.rater_id || "") === String(actorUserKey || ""));
            const remaining = rows
                .filter((row) => String(row.actor_user_key || row.rater_id || "") !== String(actorUserKey || ""))
                .map((row) => toRatingView(normalizeRatingRecord(row)));
            if (toDelete.length > 0) {
                await replaceExternalProductRatings(productKey, remaining);
            }
        } else {
            const rows = await global.ApiClientDb.products.findByField(RATINGS_COLLECTION, "product_key", productKey);
            const toDelete = rows.filter((row) => String(row.actor_user_key || row.rater_id || "") === String(actorUserKey || ""));
            await Promise.all(
                toDelete.map((row) => global.ApiClientDb.products.deleteDoc(RATINGS_COLLECTION, row._firestore_id || row.id))
            );
        }
        return true;
    }

    global.ApiClientProducts = {
        fetchProducts,
        createProduct,
        updateProduct,
        deleteProduct,
        saveProductRating,
        deleteProductRating
    };

    console.log("[ApiClient Products] Products service emulated successfully.");
})(typeof globalThis !== 'undefined' ? globalThis : window);
