/**
 * @file js/api-client/ads-featured.js
 * @description Direct REST Firebase Realtime DB client for advertisements, featured products, and updates.
 * Runs purely browser-side using BazaarRuntimeConfig.
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

    const RTDB_BASE_URL = "https://suze-bazaar-notifications-default-rtdb.europe-west1.firebasedatabase.app";

    function objectValues(value) {
        if (!value) return [];
        if (Array.isArray(value)) return value.filter(Boolean);
        if (typeof value === "object") return Object.values(value).filter(Boolean);
        return [];
    }

    function sortByPriorityThenCreated(a, b) {
        const priority = Number(a.order_priority || 0) - Number(b.order_priority || 0);
        if (priority) return priority;
        return String(b.created_at || "").localeCompare(String(a.created_at || ""));
    }

    function normalizeAd(row = {}, index = 0) {
        return {
            id: row.id ?? index + 1,
            img_path: row.img_path || row.img || "",
            search_query: row.search_query || row.query || "",
            is_active: Number(row.is_active ?? 1),
            order_priority: Number(row.order_priority ?? index),
            created_at: row.created_at || new Date().toISOString(),
        };
    }

    function normalizeFeaturedRowPayload(product, index = 0) {
        const source = product && typeof product === "object" ? product : {};
        const rawImage = String(source.product_image || source.ImageName || source.img || source.image || "").trim();
        const firstImage = rawImage.split(",")[0].trim();

        return {
            id: source.id ?? index + 1,
            product_key: String(source.product_key || source.key || "").trim(),
            product_name: String(source.product_name || source.productName || source.name || "").trim(),
            product_price: source.product_price ?? source.price ?? null,
            product_image: firstImage,
            main_category_id: source.main_category_id ?? (source.MainCategory != null ? String(source.MainCategory) : ""),
            sub_category_id: source.sub_category_id ?? (source.SubCategory != null ? String(source.SubCategory) : ""),
            user_key: String(source.user_key || source.merchant_user_key || source.provider_key || source.seller_key || "").trim(),
            is_active: Number(source.is_active ?? 1),
            order_priority: Number(source.order_priority ?? index),
            created_at: source.created_at || new Date().toISOString(),
        };
    }

    function buildFeaturedResponseItem(row) {
        return {
            key: row.product_key,
            product_key: row.product_key,
            id: row.product_key || row.id,
            name: row.product_name,
            productName: row.product_name,
            price: row.product_price,
            product_price: row.product_price,
            img: row.product_image,
            ImageName: row.product_image,
            MainCategory: row.main_category_id,
            SubCategory: row.sub_category_id,
            user_key: row.user_key,
        };
    }

    function mapById(rows, prefix) {
        return Object.fromEntries(rows.map((row, index) => {
            const key = String(row.id ?? `${prefix}_${index}`);
            return [key, row];
        }));
    }

    async function rtdbFetch(path, options = {}) {
        const url = `${RTDB_BASE_URL}/${path}.json`;
        const response = await fetch(url, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {}),
            }
        });
        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`RealtimeDB error at ${path}: ${response.status} – ${errText}`);
        }
        return await response.json();
    }

    async function handleGetAds() {
        console.log("[ApiClient Content] Fetching ads from RTDB...");
        const data = await rtdbFetch("app_advertisements");
        const rows = objectValues(data)
            .map((row, index) => normalizeAd(row, index))
            .filter((row) => Number(row.is_active || 0) === 1)
            .sort(sortByPriorityThenCreated);

        return rows.map((row) => ({
            img: row.img_path,
            query: row.search_query || "",
        }));
    }

    async function handleSaveAds(payload = {}) {
        console.log("[ApiClient Content] Saving ads to RTDB...");
        const ads = payload.ads || [];
        const rows = ads.map((ad, index) => normalizeAd({
            id: ad.id ?? index + 1,
            img_path: ad.img,
            search_query: ad.query || "",
            is_active: 1,
            order_priority: index,
        }, index));
        await rtdbFetch("app_advertisements", {
            method: "PUT",
            body: JSON.stringify(mapById(rows, "ad"))
        });
        await handleTouchUpdate();
        return { message: "Advertisements saved successfully.", count: rows.length };
    }

    async function handleGetFeatured() {
        console.log("[ApiClient Content] Fetching featured products from RTDB...");
        const data = await rtdbFetch("app_featured_products");
        const rows = objectValues(data)
            .map((row, index) => normalizeFeaturedRowPayload(row, index))
            .filter((row) => Number(row.is_active || 0) === 1)
            .sort(sortByPriorityThenCreated);

        return rows.map((row) => buildFeaturedResponseItem(row)).filter((item) => item.product_key || item.key);
    }

    async function handleSaveFeatured(payload = {}) {
        console.log("[ApiClient Content] Saving featured products to RTDB...");
        const products = payload.products || [];
        const rows = products.map((product, index) => normalizeFeaturedRowPayload({
            ...product,
            id: product.id ?? index + 1,
            is_active: 1,
            order_priority: index,
        }, index));
        await rtdbFetch("app_featured_products", {
            method: "PUT",
            body: JSON.stringify(mapById(rows, "featured"))
        });
        await handleTouchUpdate();
        return { saved: true, count: products.length };
    }

    async function handleGetUpdates() {
        console.log("[ApiClient Content] Fetching update timestamp from RTDB...");
        const update = await rtdbFetch("updates/1");
        return { datetime: update?.datetime || new Date().toISOString() };
    }

    async function handleTouchUpdate() {
        console.log("[ApiClient Content] Touching update timestamp in RTDB...");
        const datetime = new Date().toISOString();
        const update = {
            Id: 1,
            txt: "advertiesmet",
            datetime
        };
        await rtdbFetch("updates/1", {
            method: "PUT",
            body: JSON.stringify(update)
        });
        return { message: "Update timestamp updated successfully.", datetime };
    }

    global.ApiClientContent = {
        handleGetAds,
        handleSaveAds,
        handleGetFeatured,
        handleSaveFeatured,
        handleGetUpdates,
        handleTouchUpdate
    };

    console.log("[ApiClient Content] Content module initialized successfully.");
})(typeof globalThis !== 'undefined' ? globalThis : window);
