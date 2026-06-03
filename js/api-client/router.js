/**
 * @file js/api-client/router.js
 * @description Centralized browser-side router for Suez Bazaar API emulation.
 * Intercepts apiFetch calls and dispatches them directly to Client-Side API services.
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

    function clampRating(value) {
        const num = parseFloat(value);
        if (isNaN(num)) return 0;
        return Math.min(5, Math.max(0, Math.round(num * 10) / 10));
    }

    async function parseRequestPayload(options) {
        if (!options.body) return {};
        if (typeof options.body === "string") {
            try {
                return JSON.parse(options.body);
            } catch (_) {
                return {};
            }
        }
        return options.body;
    }

    async function handleApiFetch(endpoint, options = {}) {
        const method = String(options.method || "GET").toUpperCase();
        const url = new URL(endpoint, global.location.origin);
        const path = url.pathname;
        const params = url.searchParams;

        console.log(`[ApiClient Router] Routing Request: ${method} ${path}`);

        try {
            // --- 1. Users & Tokens (FirestoreIdentityApi) ---
            if (path === "/api/users") {
                if (typeof global.FirestoreIdentityApi?.handleApiFetch === "function") {
                    return await global.FirestoreIdentityApi.handleApiFetch(endpoint, options);
                }
                throw new Error("FirestoreIdentityApi not loaded");
            }
            if (path === "/api/tokens") {
                if (typeof global.FirestoreIdentityApi?.handleApiFetch === "function") {
                    return await global.FirestoreIdentityApi.handleApiFetch(endpoint, options);
                }
                throw new Error("FirestoreIdentityApi not loaded");
            }

            // --- 2. Products ---
            if (path === "/api/products") {
                if (method === "GET") {
                    const sourceType = String(params.get("listing") || params.get("listing_type") || params.get("source") || "").trim().toLowerCase();
                    const filters = {
                        productKey: params.get("product_key"),
                        productKeys: params.get("product_keys") ? params.get("product_keys").split(",").filter(Boolean) : null,
                        userKey: params.get("user_key"),
                        searchTerm: params.get("searchTerm"),
                        mainCategory: params.get("MainCategory"),
                        subCategory: params.get("SubCategory"),
                        status: params.get("status"),
                        limit: params.get("limit") ? parseInt(params.get("limit"), 10) : null,
                        offset: params.get("offset") ? parseInt(params.get("offset"), 10) : null,
                        listingType: sourceType,
                    };
                    const products = await global.ApiClientProducts.fetchProducts(filters);
                    if (filters.productKey) {
                        return products[0] || null;
                    }
                    return products;
                }

                const body = await parseRequestPayload(options);
                if (method === "POST") {
                    if (body.action === "rate_product" || body.action === "edit_product_rating") {
                        const ratings = await global.ApiClientProducts.saveProductRating(body.product_key, body.actor_user_key, body.rating_data || {});
                        return { success: true, ratings };
                    }
                    if (body.action === "delete_product_rating") {
                        await global.ApiClientProducts.deleteProductRating(body.product_key, body.actor_user_key);
                        return { success: true };
                    }
                    return await global.ApiClientProducts.createProduct(body);
                }

                if (method === "PUT") {
                    return await global.ApiClientProducts.updateProduct(body);
                }

                if (method === "DELETE") {
                    const productKey = params.get("product_key");
                    await global.ApiClientProducts.deleteProduct(productKey);
                    return { deleted: true, product_key: productKey };
                }
            }

            // --- 3. Cars ---
            if (path === "/api/cars") {
                if (method === "GET") {
                    const filters = {
                        carKey: params.get("car_key"),
                        carKeys: params.get("car_keys") ? params.get("car_keys").split(",").filter(Boolean) : null,
                        userKey: params.get("user_key"),
                        featured: params.get("featured"),
                        status: params.get("status"),
                        limit: params.get("limit") ? parseInt(params.get("limit"), 10) : null,
                        offset: params.get("offset") ? parseInt(params.get("offset"), 10) : null,
                    };
                    const cars = await global.ApiClientCars.fetchCars(filters);
                    if (filters.carKey) {
                        return cars[0] || null;
                    }
                    return cars;
                }

                const body = await parseRequestPayload(options);
                if (method === "POST") {
                    return await global.ApiClientCars.createCar(body);
                }
                if (method === "PUT") {
                    return await global.ApiClientCars.updateCar(body);
                }
                if (method === "DELETE") {
                    const carKey = params.get("car_key") || body.car_key;
                    await global.ApiClientCars.deleteCar(carKey);
                    return { success: true };
                }
            }

            // --- 4. Real Estate ---
            if (path === "/api/real-estate") {
                if (method === "GET") {
                    const filters = {
                        realEstateKey: params.get("real_estate_key"),
                        realEstateKeys: params.get("real_estate_keys") ? params.get("real_estate_keys").split(",").filter(Boolean) : null,
                        userKey: params.get("user_key"),
                        featured: params.get("featured"),
                        status: params.get("status"),
                        subCategoryId: params.get("sub_category_id"),
                        limit: params.get("limit") ? parseInt(params.get("limit"), 10) : null,
                        offset: params.get("offset") ? parseInt(params.get("offset"), 10) : null,
                    };
                    const properties = await global.ApiClientRealEstate.fetchRealEstate(filters);
                    if (filters.realEstateKey) {
                        return properties[0] || null;
                    }
                    return properties;
                }

                const body = await parseRequestPayload(options);
                if (method === "POST") {
                    return await global.ApiClientRealEstate.createRealEstate(body);
                }
                if (method === "PUT") {
                    return await global.ApiClientRealEstate.updateRealEstate(body);
                }
                if (method === "DELETE") {
                    const realEstateKey = params.get("real_estate_key") || body.real_estate_key;
                    await global.ApiClientRealEstate.deleteRealEstate(realEstateKey);
                    return { success: true };
                }
            }

            // --- 5. Merchant Portfolio & Ratings ---
            if (path === "/api/merchant-portfolio") {
                const action = params.get("action");
                if (method === "GET" && action === "get_user") {
                    const userKey = params.get("user_key");
                    const user = await global.FirestoreIdentityApi.getDoc("users", userKey);
                    if (!user) return { error: "User not found" };
                    const ratingsMap = await global.FirestoreIdentityApi.hydrateUsers([user]);
                    return ratingsMap[0] || user;
                }

                const body = await parseRequestPayload(options);
                if (method === "POST") {
                    const payload = body.rating_data || body;
                    const actorUserKey = body.actor_user_key || payload.rater_id;
                    const raterName = payload.rater_name || "";
                    const ratingValue = payload.rating || 0;
                    const note = payload.note || "";
                    const merchantUserKey = body.target_user_key || payload.merchant_user_key;

                    if (action === "rate_user" || action === "edit_rating") {
                        // Rate/Edit rating directly on merchant_ratings_v2 Firestore
                        const id = `mrt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
                        await global.FirestoreIdentityApi.setDoc("merchant_ratings_v2", id, {
                            id,
                            merchant_user_key: merchantUserKey,
                            actor_user_key: actorUserKey,
                            actor_name: raterName,
                            rating: clampRating(ratingValue),
                            note,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                        });
                        const user = await global.FirestoreIdentityApi.getDoc("users", merchantUserKey);
                        const ratingsMap = await global.FirestoreIdentityApi.hydrateUsers([user]);
                        return { success: true, ratings: ratingsMap[0]?.ratings || [] };
                    }

                    if (action === "delete_rating") {
                        const rows = await global.FirestoreIdentityApi.findByField("merchant_ratings_v2", "merchant_user_key", merchantUserKey);
                        const toDelete = rows.filter((row) => String(row.actor_user_key || "") === String(actorUserKey || ""));
                        await Promise.all(
                            toDelete.map((row) => global.FirestoreIdentityApi.deleteDoc("merchant_ratings_v2", row._firestore_id || row.id))
                        );
                        const user = await global.FirestoreIdentityApi.getDoc("users", merchantUserKey);
                        const ratingsMap = await global.FirestoreIdentityApi.hydrateUsers([user]);
                        return { success: true, ratings: ratingsMap[0]?.ratings || [] };
                    }
                }
            }

            // --- 6. Content (Ads, Featured, Updates) ---
            if (path === "/api/get-ads") {
                return await global.ApiClientContent.handleGetAds();
            }
            if (path === "/api/save-ads") {
                const body = await parseRequestPayload(options);
                return await global.ApiClientContent.handleSaveAds(body);
            }
            if (path === "/api/get-featured") {
                return await global.ApiClientContent.handleGetFeatured();
            }
            if (path === "/api/save-featured") {
                const body = await parseRequestPayload(options);
                return await global.ApiClientContent.handleSaveFeatured(body);
            }
            if (path === "/api/updates") {
                if (method === "GET") {
                    return await global.ApiClientContent.handleGetUpdates();
                }
                if (method === "POST") {
                    return await global.ApiClientContent.handleTouchUpdate();
                }
            }

            // --- 7. Device Integrity ---
            if (path === "/api/device-integrity") {
                console.log("[ApiClient Router] Routing Device Integrity check to real serverless backend");
                const vercelUrl = (global.BazaarRuntimeConfig && global.BazaarRuntimeConfig.infrastructure && global.BazaarRuntimeConfig.infrastructure.vercelUrl)
                    || "https://bazaar-suez.vercel.app";
                const targetUrl = `${vercelUrl}/api/device-integrity`;
                console.log(`[ApiClient Router] Fetching from live backend: ${targetUrl}`);
                
                const fetchOptions = {
                    method: method,
                    headers: {
                        "Content-Type": "application/json",
                        ...(options.headers || {})
                    },
                    body: typeof options.body === "string" ? options.body : JSON.stringify(options.body || {})
                };
                
                try {
                    const response = await fetch(targetUrl, fetchOptions);
                    console.log(`[ApiClient Router] Integrity server status: ${response.status}`);
                    const contentType = response.headers.get("content-type") || "";
                    if (!response.ok) {
                        const errText = await response.text().catch(() => "Unknown error");
                        console.error(`[ApiClient Router] Integrity server verification failed: ${response.status} - ${errText}`);
                        throw new Error(`Integrity server failed: ${response.status} ${errText}`);
                    }
                    if (contentType.includes("application/json")) {
                        return await response.json();
                    } else {
                        return await response.text();
                    }
                } catch (error) {
                    console.error("[ApiClient Router] Network error fetching integrity from server:", error);
                    throw error;
                }
            }

            // --- 8. Pharmacy Catalog ---
            if (path === "/api/pharmacy/custom-categories") {
                if (method === "GET") {
                    return await global.ApiClientPharmacy.handleGetCustomCategories(params.get("user_key"));
                }
                const body = await parseRequestPayload(options);
                if (method === "POST") {
                    return await global.ApiClientPharmacy.handleCreateCustomCategory(body);
                }
                if (method === "PUT") {
                    return await global.ApiClientPharmacy.handleUpdateCustomCategory(body);
                }
                if (method === "DELETE") {
                    const id = params.get("id") || body.id;
                    return await global.ApiClientPharmacy.handleDeleteCustomCategory(id);
                }
            }

            if (path === "/api/pharmacy/preferences") {
                if (method === "GET") {
                    return await global.ApiClientPharmacy.handleGetPreferences(params.get("user_key"));
                }
                if (method === "POST") {
                    const body = await parseRequestPayload(options);
                    return await global.ApiClientPharmacy.handleSavePreferences(body);
                }
            }

            if (path === "/api/pharmacy/product-metadata") {
                if (method === "GET") {
                    return await global.ApiClientPharmacy.handleGetProductMetadata(params.get("product_id"), params.get("merchant_key"));
                }
                if (method === "DELETE") {
                    return await global.ApiClientPharmacy.handleDeleteProductMetadata(params.get("product_id"), params.get("merchant_key"));
                }
                if (method === "POST" || method === "PUT") {
                    const body = await parseRequestPayload(options);
                    return await global.ApiClientPharmacy.handleSaveProductMetadata(method, body);
                }
            }

            if (path === "/api/pharmacy/sub-category-products") {
                if (method === "GET") {
                    return await global.ApiClientPharmacy.handleGetSubCategoryProducts(params.get("sub_id") || params.get("sub_cat_id"));
                }
            }

            // --- 9. Database Analysis (Diagnostics) ---
            if (path === "/api/database-analysis") {
                return {
                    schemaMetadata: {
                        description: "Emulated Client-Side database schema. All SQL components have been removed.",
                        type: "object"
                    },
                    tableNames: ["users", "marketplace_products", "vehicle_listings", "real_estate_listings", "pharmacy_products_metadata"],
                    tablesInfo: {},
                    createStatements: {}
                };
            }

            console.error(`[ApiClient Router] Unsupported path: ${path}`);
            return { error: `Unsupported API route: ${path}`, code: "UNSUPPORTED_ROUTE" };

        } catch (error) {
            console.error(`[ApiClient Router] Request failed for ${method} ${path}:`, error);
            return { error: error.message || "ApiClient router execution failed", code: "INTERNAL_ERROR" };
        }
    }

    global.ApiClientRouter = {
        handleApiFetch
    };

    console.log("[ApiClient Router] Routing and dispatch system initialized successfully.");
})(typeof globalThis !== 'undefined' ? globalThis : window);
