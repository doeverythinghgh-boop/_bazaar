/**
 * @file js/api-client/cars.js
 * @description Direct REST client cars service for Suez Bazaar vehicle listings.
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

    const VEHICLE_LISTINGS_COLLECTION = "vehicle_listings";

    const CAR_SELECTION_COLUMNS = {
        brands: "brand_id",
        body_types: "body_type_id",
        fuel_types: "fuel_type_id",
        transmission_types: "transmission_type_id",
        car_conditions: "condition_id",
        special_types: "special_type_id",
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

    function buildCarTitle(row) {
        const brand = row.brand_id ? String(row.brand_id).replace(/[_-]+/g, " ") : "";
        const year = row.year ? String(row.year) : "";
        return [brand, year].filter(Boolean).join(" ") || `Car ${row.car_key}`;
    }

    function mapCarRow(row) {
        if (!row) return null;
        const selections = normalizeSelections({
            brands: row.brand_id,
            body_types: row.body_type_id,
            fuel_types: row.fuel_type_id,
            transmission_types: row.transmission_type_id,
            car_conditions: row.condition_id,
            special_types: row.special_type_id,
        });
        const carImageNames = normalizeImages(row.car_image_names);
        const title = buildCarTitle(row);

        return {
            ...row,
            selections,
            images: carImageNames ? carImageNames.split(",") : [],
            car_image_names: carImageNames,
            car_key: row.car_key,
            product_key: row.car_key,
            productName: title,
            product_price: row.price,
            product_description: row.notes || "",
            ImageName: carImageNames,
            MainCategory: 7,
            SubCategory: 1,
            is_approved: 1,
            _source: "car",
            item_type: "car",
            is_car_listing: true,
        };
    }

    function buildWritePayload(payload = {}, existing = null) {
        const fallbackSelections = {
            brands: existing?.brand_id,
            body_types: existing?.body_type_id,
            fuel_types: existing?.fuel_type_id,
            transmission_types: existing?.transmission_type_id,
            car_conditions: existing?.condition_id,
            special_types: existing?.special_type_id,
        };
        const selections = normalizeSelections(payload.selections || fallbackSelections);
        const timestamp = nowIso();
        const imageNames = normalizeImages(
            payload.car_image_names !== undefined
                ? payload.car_image_names
                : (payload.ImageName !== undefined ? payload.ImageName : existing?.car_image_names)
        );

        const base = {
            user_key: String(payload.user_key || existing?.user_key || "").trim(),
            year: parseInt(payload.year ?? existing?.year ?? 0, 10),
            price: parseFloat(payload.price ?? existing?.price ?? 0),
            notes: String(payload.notes ?? existing?.notes ?? ""),
            car_image_names: imageNames,
            is_featured: parseInt(payload.is_featured ?? existing?.is_featured ?? 0, 10) ? 1 : 0,
            status: parseInt(payload.status ?? existing?.status ?? 1, 10),
            updated_at: timestamp,
        };

        Object.entries(CAR_SELECTION_COLUMNS).forEach(([selectionKey, column]) => {
            base[column] = selections[selectionKey] || null;
        });

        return base;
    }

    async function fetchCars(filters = {}) {
        console.log("[ApiClient Cars] Fetching vehicle listings...");
        let rows = await global.ApiClientDb.externalSpecialty.listAllDocs(VEHICLE_LISTINGS_COLLECTION, { maxRows: 5000 });

        if (filters.carKey) {
            rows = rows.filter((row) => String(row.car_key || "") === String(filters.carKey));
        }
        if (filters.carKeys?.length) {
            const keySet = new Set(filters.carKeys.map((item) => String(item)));
            rows = rows.filter((row) => keySet.has(String(row.car_key || "")));
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

        rows = rows.sort((a, b) => {
            const featuredCompare = (parseInt(b.is_featured ?? 0, 10) ? 1 : 0) - (parseInt(a.is_featured ?? 0, 10) ? 1 : 0);
            if (featuredCompare) return featuredCompare;
            return Number(b.id || 0) - Number(a.id || 0) || String(b.created_at || "").localeCompare(String(a.created_at || ""));
        });

        if (!filters.carKey && filters.limit) {
            rows = rows.slice(filters.offset || 0, (filters.offset || 0) + filters.limit);
        }

        const sellerKeys = Array.from(new Set(rows.map((row) => row.user_key).filter(Boolean)));
        const sellers = (window.FirestoreIdentityApi && typeof window.FirestoreIdentityApi.hydrateUsers === "function" && sellerKeys.length)
            ? await Promise.all(sellerKeys.map((key) => window.FirestoreIdentityApi.getDoc("users", key)))
            : [];
        const sellerMap = new Map(sellers.filter(Boolean).map((seller) => [seller.user_key || seller._firestore_id, seller]));

        return rows.map((row) => {
            const seller = sellerMap.get(row.user_key) || {};
            return mapCarRow({
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

    async function createCar(payload) {
        const carKey = String(payload.car_key || "").trim();
        if (!carKey) throw new Error("CAR_KEY_REQUIRED");
        console.log(`[ApiClient Cars] Creating car: ${carKey}`);

        const data = buildWritePayload(payload);
        if (!data.user_key || !data.year || Number.isNaN(data.price) || !data.car_image_names) {
            throw new Error("VALIDATION_ERROR");
        }

        const timestamp = nowIso();
        await global.ApiClientDb.externalSpecialty.setDoc(VEHICLE_LISTINGS_COLLECTION, carKey, {
            car_key: carKey,
            user_key: data.user_key,
            year: data.year,
            price: data.price,
            notes: data.notes,
            brand_id: data.brand_id,
            body_type_id: data.body_type_id,
            fuel_type_id: data.fuel_type_id,
            transmission_type_id: data.transmission_type_id,
            condition_id: data.condition_id,
            special_type_id: data.special_type_id,
            car_image_names: data.car_image_names,
            is_featured: data.is_featured,
            status: data.status,
            created_at: timestamp,
            updated_at: timestamp,
        });

        const rows = await fetchCars({ carKey, status: data.status });
        return rows[0] || null;
    }

    async function updateCar(payload) {
        const carKey = String(payload.car_key || "").trim();
        if (!carKey) throw new Error("CAR_KEY_REQUIRED");
        console.log(`[ApiClient Cars] Updating car: ${carKey}`);

        const currentRaw = await global.ApiClientDb.externalSpecialty.getDoc(VEHICLE_LISTINGS_COLLECTION, carKey);
        if (!currentRaw) throw new Error("CAR_NOT_FOUND");

        const data = buildWritePayload(payload, currentRaw);
        await global.ApiClientDb.externalSpecialty.setDoc(VEHICLE_LISTINGS_COLLECTION, carKey, {
            ...currentRaw,
            car_key: carKey,
            year: data.year,
            price: data.price,
            notes: data.notes,
            brand_id: data.brand_id,
            body_type_id: data.body_type_id,
            fuel_type_id: data.fuel_type_id,
            transmission_type_id: data.transmission_type_id,
            condition_id: data.condition_id,
            special_type_id: data.special_type_id,
            car_image_names: data.car_image_names,
            is_featured: data.is_featured,
            status: data.status,
            updated_at: data.updated_at,
        });

        const rows = await fetchCars({ carKey, status: data.status });
        return rows[0] || null;
    }

    async function deleteCar(carKey) {
        console.log(`[ApiClient Cars] Deleting car: ${carKey}`);
        await global.ApiClientDb.externalSpecialty.deleteDoc(VEHICLE_LISTINGS_COLLECTION, carKey);
        return true;
    }

    global.ApiClientCars = {
        fetchCars,
        createCar,
        updateCar,
        deleteCar
    };

    console.log("[ApiClient Cars] Cars service emulated successfully.");
})(typeof globalThis !== 'undefined' ? globalThis : window);
