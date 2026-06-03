/**
 * @file js/api-client/real-estate.js
 * @description Direct REST client real-estate service for Suez Bazaar property listings.
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

    const REAL_ESTATE_LISTINGS_COLLECTION = "real_estate_listings";

    const REAL_ESTATE_SELECTION_COLUMNS = {
        property_types: "property_type",
        finishing_types: "finishing_type",
        offer_types: "offer_type"
    };

    function nowIso() {
        return new Date().toISOString();
    }

    function normalizeSelections(value) {
        if (!value || typeof value !== "object" || Array.isArray(value)) return {};
        return Object.entries(value).reduce((acc, [key, item]) => {
            if (item !== null && item !== undefined && String(item).trim()) {
                acc[key] = String(item).trim();
            }
            return acc;
        }, {});
    }

    function normalizeImages(value) {
        if (Array.isArray(value)) {
            return value.map((item) => String(item || "").trim()).filter(Boolean).join(",");
        }
        return String(value || "")
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
            .join(",");
    }

    function formatRealEstateArea(area) {
        const value = String(area || "").trim();
        if (!value) return "";
        const unit = (typeof window !== "undefined" && typeof window.langu === "function")
            ? window.langu("real_estate_area_unit")
            : null;
        return `${value} ${unit || ('m' + String.fromCharCode(0x00B2))}`;
    }

    function buildRealEstateTitle(row) {
        const propType = row.property_type ? String(row.property_type).replace(/[_-]+/g, " ") : "عقار";
        const area = row.area_sqm ? formatRealEstateArea(row.area_sqm) : "";
        return [propType, area].filter(Boolean).join(" - ") || `RealEstate ${row.real_estate_key}`;
    }

    function mapRealEstateRow(row) {
        if (!row) return null;
        const selections = normalizeSelections({
            property_types: row.property_type,
            finishing_types: row.finishing_type,
            offer_types: row.offer_type
        });
        const imageNames = normalizeImages(row.image_names);
        const title = buildRealEstateTitle(row);
        const parsedSubCategory = parseInt(row.sub_category_id, 10);

        return {
            ...row,
            selections,
            images: imageNames ? imageNames.split(",") : [],
            image_names: imageNames,
            real_estate_key: row.real_estate_key,
            product_key: row.real_estate_key,
            productName: title,
            product_price: row.price,
            product_description: row.notes || "",
            ImageName: imageNames,
            MainCategory: 16,
            SubCategory: Number.isFinite(parsedSubCategory) ? parsedSubCategory : 1,
            is_approved: 1,
            _source: "real_estate",
            item_type: "real_estate",
            is_real_estate_listing: true,
        };
    }

    function buildWritePayload(payload = {}, existing = null) {
        const fallbackSelections = {
            property_types: payload.property_type ?? existing?.property_type,
            finishing_types: payload.finishing_type ?? existing?.finishing_type,
            offer_types: payload.offer_type ?? existing?.offer_type
        };
        const selections = normalizeSelections(payload.selections || fallbackSelections);
        const timestamp = nowIso();
        const imageNames = normalizeImages(
            payload.image_names !== undefined
                ? payload.image_names
                : (payload.ImageName !== undefined ? payload.ImageName : existing?.image_names)
        );

        const base = {
            user_key: String(payload.user_key || existing?.user_key || "").trim(),
            sub_category_id: String(payload.sub_category_id ?? existing?.sub_category_id ?? ""),
            price: parseFloat(payload.price ?? existing?.price ?? 0),
            area_sqm: payload.area_sqm ? parseFloat(payload.area_sqm) : null,
            rooms: payload.rooms ? parseInt(payload.rooms, 10) : null,
            bathrooms: payload.bathrooms ? parseInt(payload.bathrooms, 10) : null,
            floor_level: payload.floor_level ? parseInt(payload.floor_level, 10) : null,
            address: String(payload.address ?? existing?.address ?? ""),
            location_lat: payload.location_lat ? parseFloat(payload.location_lat) : null,
            location_lng: payload.location_lng ? parseFloat(payload.location_lng) : null,
            notes: String(payload.notes ?? existing?.notes ?? ""),
            image_names: imageNames,
            is_featured: parseInt(payload.is_featured ?? existing?.is_featured ?? 0, 10) ? 1 : 0,
            status: parseInt(payload.status ?? existing?.status ?? 1, 10),
            updated_at: timestamp,
        };

        Object.entries(REAL_ESTATE_SELECTION_COLUMNS).forEach(([selectionKey, column]) => {
            base[column] = selections[selectionKey] || null;
        });

        return base;
    }

    async function fetchRealEstate(filters = {}) {
        console.log("[ApiClient RealEstate] Fetching property listings...");
        let rows = await global.ApiClientDb.externalSpecialty.listAllDocs(REAL_ESTATE_LISTINGS_COLLECTION, { maxRows: 5000 });

        if (filters.realEstateKey) {
            rows = rows.filter((row) => String(row.real_estate_key || "") === String(filters.realEstateKey));
        }
        if (filters.realEstateKeys?.length) {
            const keySet = new Set(filters.realEstateKeys.map((item) => String(item)));
            rows = rows.filter((row) => keySet.has(String(row.real_estate_key || "")));
        }
        if (filters.userKey) {
            rows = rows.filter((row) => String(row.user_key || "") === String(filters.userKey));
        }
        if (filters.featured !== undefined && filters.featured !== null) {
            const featured = parseInt(filters.featured, 10) ? 1 : 0;
            rows = rows.filter((row) => (parseInt(row.is_featured ?? 0, 10) ? 1 : 0) === featured);
        }
        if (filters.status !== undefined && filters.status !== null) {
            const status = parseInt(filters.status, 10);
            rows = rows.filter((row) => parseInt(row.status ?? 1, 10) === status);
        } else {
            rows = rows.filter((row) => parseInt(row.status ?? 1, 10) === 1);
        }
        if (filters.subCategoryId) {
            rows = rows.filter((row) => String(row.sub_category_id || "") === String(filters.subCategoryId));
        }

        rows = rows.sort((a, b) => {
            const featuredCompare = (parseInt(b.is_featured ?? 0, 10) ? 1 : 0) - (parseInt(a.is_featured ?? 0, 10) ? 1 : 0);
            if (featuredCompare) return featuredCompare;
            return Number(b.id || 0) - Number(a.id || 0) || String(b.created_at || "").localeCompare(String(a.created_at || ""));
        });

        if (!filters.realEstateKey && filters.limit) {
            rows = rows.slice(filters.offset || 0, (filters.offset || 0) + filters.limit);
        }

        const sellerKeys = Array.from(new Set(rows.map((row) => row.user_key).filter(Boolean)));
        const sellers = (window.FirestoreIdentityApi && typeof window.FirestoreIdentityApi.hydrateUsers === "function" && sellerKeys.length)
            ? await Promise.all(sellerKeys.map((key) => window.FirestoreIdentityApi.getDoc("users", key)))
            : [];
        const sellerMap = new Map(sellers.filter(Boolean).map((seller) => [seller.user_key || seller._firestore_id, seller]));

        return rows.map((row) => {
            const seller = sellerMap.get(row.user_key) || {};
            return mapRealEstateRow({
                ...row,
                seller_name: seller.username || "",
                seller_phone: seller.phone || "",
                seller_business_name: seller.business_name || "",
                seller_whatsapp: seller.business_whatsapp || "",
                seller_location: seller.location || "",
                seller_image: seller.user_image || "",
                seller_links: typeof seller.links === "string" ? seller.links : JSON.stringify(seller.links || {}),
            });
        });
    }

    async function createRealEstate(payload) {
        const realEstateKey = String(payload.real_estate_key || "").trim();
        if (!realEstateKey) throw new Error("REAL_ESTATE_KEY_REQUIRED");
        console.log(`[ApiClient RealEstate] Creating property: ${realEstateKey}`);

        const data = buildWritePayload(payload);
        if (!data.user_key || Number.isNaN(data.price) || !data.image_names) {
            throw new Error("VALIDATION_ERROR");
        }

        const timestamp = nowIso();
        await global.ApiClientDb.externalSpecialty.setDoc(REAL_ESTATE_LISTINGS_COLLECTION, realEstateKey, {
            real_estate_key: realEstateKey,
            user_key: data.user_key,
            sub_category_id: data.sub_category_id,
            price: data.price,
            area_sqm: data.area_sqm,
            rooms: data.rooms,
            bathrooms: data.bathrooms,
            floor_level: data.floor_level,
            property_type: data.property_type,
            finishing_type: data.finishing_type,
            offer_type: data.offer_type,
            address: data.address,
            location_lat: data.location_lat,
            location_lng: data.location_lng,
            notes: data.notes,
            image_names: data.image_names,
            is_featured: data.is_featured,
            status: data.status,
            created_at: timestamp,
            updated_at: timestamp,
        });

        const rows = await fetchRealEstate({ realEstateKey, status: data.status });
        return rows[0] || null;
    }

    async function updateRealEstate(payload) {
        const realEstateKey = String(payload.real_estate_key || "").trim();
        if (!realEstateKey) throw new Error("REAL_ESTATE_KEY_REQUIRED");
        console.log(`[ApiClient RealEstate] Updating property: ${realEstateKey}`);

        const currentRaw = await global.ApiClientDb.externalSpecialty.getDoc(REAL_ESTATE_LISTINGS_COLLECTION, realEstateKey);
        if (!currentRaw) throw new Error("REAL_ESTATE_NOT_FOUND");

        const data = buildWritePayload(payload, currentRaw);
        await global.ApiClientDb.externalSpecialty.setDoc(REAL_ESTATE_LISTINGS_COLLECTION, realEstateKey, {
            ...currentRaw,
            real_estate_key: realEstateKey,
            sub_category_id: data.sub_category_id,
            price: data.price,
            area_sqm: data.area_sqm,
            rooms: data.rooms,
            bathrooms: data.bathrooms,
            floor_level: data.floor_level,
            property_type: data.property_type,
            finishing_type: data.finishing_type,
            offer_type: data.offer_type,
            address: data.address,
            location_lat: data.location_lat,
            location_lng: data.location_lng,
            notes: data.notes,
            image_names: data.image_names,
            is_featured: data.is_featured,
            status: data.status,
            updated_at: data.updated_at,
        });

        const rows = await fetchRealEstate({ realEstateKey, status: data.status });
        return rows[0] || null;
    }

    async function deleteRealEstate(realEstateKey) {
        console.log(`[ApiClient RealEstate] Deleting property: ${realEstateKey}`);
        await global.ApiClientDb.externalSpecialty.deleteDoc(REAL_ESTATE_LISTINGS_COLLECTION, realEstateKey);
        return true;
    }

    global.ApiClientRealEstate = {
        fetchRealEstate,
        createRealEstate,
        updateRealEstate,
        deleteRealEstate
    };

    console.log("[ApiClient RealEstate] Real estate service emulated successfully.");
})(typeof globalThis !== 'undefined' ? globalThis : window);
