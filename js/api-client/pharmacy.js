/**
 * @file js/api-client/pharmacy.js
 * @description Direct REST client pharmacy service for Suez Bazaar pharmacy module.
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

    const CUSTOM_CATEGORIES_COLLECTION = "pharmacy_custom_categories";
    const PRODUCTS_METADATA_COLLECTION = "pharmacy_products_metadata";
    const MERCHANT_PREFERENCES_COLLECTION = "pharmacy_merchant_preferences";

    function parseMaybeJson(value, fallback) {
        if (value === null || value === undefined || value === "") return fallback;
        if (typeof value !== "string") return value;
        try {
            return JSON.parse(value);
        } catch (_) {
            return fallback;
        }
    }

    function stringifyForStorage(value, fallback = null) {
        if (value === undefined) return fallback;
        if (value === null) return null;
        if (typeof value === "string") return value;
        return JSON.stringify(value);
    }

    // --- 1. Custom Categories ---
    async function handleGetCustomCategories(userKey) {
        console.log(`[ApiClient Pharmacy] Fetching custom categories for: ${userKey}`);
        const rows = await global.ApiClientDb.externalSpecialty.listAllDocs(CUSTOM_CATEGORIES_COLLECTION);
        return rows
            .filter((row) => String(row.user_key || "") === String(userKey))
            .sort((a, b) => String(a.created_at || "").localeCompare(String(b.created_at || "")));
    }

    async function handleCreateCustomCategory(body = {}) {
        const { id, user_key, title_ar, title_en, level, parent_id, image_names } = body;
        if (!id || !user_key || !title_ar || !level) {
            throw new Error("MISSING_REQUIRED_FIELDS");
        }
        console.log(`[ApiClient Pharmacy] Creating custom category: ${title_ar} (${id})`);
        const timestamp = new Date().toISOString();
        await global.ApiClientDb.externalSpecialty.setDoc(CUSTOM_CATEGORIES_COLLECTION, id, {
            id,
            user_key,
            title_ar,
            title_en: title_en || null,
            level,
            parent_id: parent_id || null,
            image_names: image_names || null,
            created_at: timestamp,
            updated_at: timestamp,
        });
        return { success: true, id };
    }

    async function handleUpdateCustomCategory(body = {}) {
        const { id, title_ar, title_en } = body;
        if (!id || !title_ar) {
            throw new Error("MISSING_REQUIRED_FIELDS");
        }
        console.log(`[ApiClient Pharmacy] Updating custom category: ${title_ar} (${id})`);
        const current = await global.ApiClientDb.externalSpecialty.getDoc(CUSTOM_CATEGORIES_COLLECTION, id);
        await global.ApiClientDb.externalSpecialty.setDoc(CUSTOM_CATEGORIES_COLLECTION, id, {
            ...(current || { id }),
            title_ar,
            title_en: title_en || null,
            updated_at: new Date().toISOString(),
        });
        return { success: true };
    }

    async function handleDeleteCustomCategory(id) {
        if (!id) throw new Error("ID_REQUIRED");
        console.log(`[ApiClient Pharmacy] Deleting custom category and cascade children for: ${id}`);
        const rows = await global.ApiClientDb.externalSpecialty.listAllDocs(CUSTOM_CATEGORIES_COLLECTION);
        const idsToDelete = rows
            .filter((row) => String(row.id || row._firestore_id || "") === String(id) || String(row.parent_id || "") === String(id))
            .map((row) => row.id || row._firestore_id)
            .filter(Boolean);
        await Promise.all(idsToDelete.map((docId) => global.ApiClientDb.externalSpecialty.deleteDoc(CUSTOM_CATEGORIES_COLLECTION, docId)));
        return { success: true };
    }

    // --- 2. Preferences ---
    async function handleGetPreferences(userKey) {
        console.log(`[ApiClient Pharmacy] Fetching preferences for merchant: ${userKey}`);
        if (!userKey) {
            return { hidden_main_categories: [], hidden_sub_categories: [], hidden_catalog_products: [] };
        }
        const rows = await global.ApiClientDb.externalSpecialty.findByField(MERCHANT_PREFERENCES_COLLECTION, "user_key", userKey, { limit: 1 });
        const row = Array.isArray(rows) && rows.length ? rows[0] : null;
        if (!row) {
            return { hidden_main_categories: [], hidden_sub_categories: [], hidden_catalog_products: [] };
        }
        return {
            hidden_main_categories: parseMaybeJson(row.hidden_main_categories, []),
            hidden_sub_categories: parseMaybeJson(row.hidden_sub_categories, []),
            hidden_catalog_products: parseMaybeJson(row.hidden_catalog_products, [])
        };
    }

    async function handleSavePreferences(body = {}) {
        const { user_key, data } = body;
        if (!user_key || !data) {
            throw new Error("MISSING_REQUIRED_FIELDS");
        }
        console.log(`[ApiClient Pharmacy] Saving preferences for merchant: ${user_key}`);
        await global.ApiClientDb.externalSpecialty.setDoc(MERCHANT_PREFERENCES_COLLECTION, user_key, {
            user_key,
            hidden_main_categories: stringifyForStorage(data.hidden_main_categories || [], "[]"),
            hidden_sub_categories: stringifyForStorage(data.hidden_sub_categories || [], "[]"),
            hidden_catalog_products: stringifyForStorage(data.hidden_catalog_products || [], "[]"),
        });
        return { success: true };
    }

    // --- 3. Product Metadata ---
    async function handleGetProductMetadata(productId, merchantKey) {
        if (productId) {
            console.log(`[ApiClient Pharmacy] Fetching product metadata for: ${productId}`);
            const productRows = await global.ApiClientDb.externalSpecialty.findByField(PRODUCTS_METADATA_COLLECTION, "product_id", productId, { limit: 10 });
            const catalogRows = productRows.length
                ? []
                : await global.ApiClientDb.externalSpecialty.findByField(PRODUCTS_METADATA_COLLECTION, "original_catalog_id", productId, { limit: 10 });
            const rows = productRows.length ? productRows : catalogRows;
            const row = merchantKey
                ? rows.find((item) => String(item.user_key || item.merchant_key || "") === String(merchantKey))
                : rows[0];
            if (!row) {
                console.log(`[ApiClient Pharmacy] Product metadata not found for: ${productId}`);
                throw new Error("PRODUCT_NOT_FOUND");
            }
            return row;
        } else if (merchantKey) {
            console.log(`[ApiClient Pharmacy] Listing all products metadata for merchant: ${merchantKey}`);
            const rows = await global.ApiClientDb.externalSpecialty.listAllDocs(PRODUCTS_METADATA_COLLECTION);
            return rows
                .filter((row) => String(row.user_key || "") === String(merchantKey))
                .sort((a, b) => String(b.product_id || "").localeCompare(String(a.product_id || "")));
        } else {
            throw new Error("MISSING_PARAMS");
        }
    }

    async function handleDeleteProductMetadata(productId, merchantKey) {
        if (!productId || !merchantKey) throw new Error("MISSING_PARAMS");
        console.log(`[ApiClient Pharmacy] Deleting product metadata: ${productId}`);
        const current = await global.ApiClientDb.externalSpecialty.getDoc(PRODUCTS_METADATA_COLLECTION, productId);
        if (current && String(current.user_key || "") === String(merchantKey)) {
            await global.ApiClientDb.externalSpecialty.deleteDoc(PRODUCTS_METADATA_COLLECTION, productId);
        }
        return { success: true, message: "Product deleted" };
    }

    async function handleSaveProductMetadata(method, body = {}) {
        const hasImageNamesField = Object.prototype.hasOwnProperty.call(body || {}, "image_names");
        const {
            merchant_key,
            main_category_id,
            sub_category_id,
            name_ar,
            name_en,
            price,
            discount,
            stock_quantity,
            status,
            description,
            is_prescription_required,
            image_names,
            form_ref,
            strength_ref,
            active_ingredients,
            brand_ar,
            brand_en,
            barcode,
            manufacturer,
            original_catalog_id
        } = body;

        if (!merchant_key || !name_ar || price === undefined || price === null) {
            throw new Error("MISSING_PRODUCT_BASE_FIELDS");
        }

        const isRxReq = is_prescription_required ? 1 : 0;
        const activeIngStr = active_ingredients ? stringifyForStorage(active_ingredients) : null;
        const formRefStr = form_ref ? stringifyForStorage(form_ref) : null;
        const strRefStr = strength_ref ? stringifyForStorage(strength_ref) : null;

        if (method === "POST") {
            const productId = body.product_id || 'PHARM_PROD_' + Date.now();
            console.log(`[ApiClient Pharmacy] Creating product metadata: ${name_ar} (${productId})`);
            await global.ApiClientDb.externalSpecialty.setDoc(PRODUCTS_METADATA_COLLECTION, productId, {
                product_id: productId,
                user_key: merchant_key,
                name_ar,
                name_en: name_en || null,
                description: description || null,
                price: Number(price) || 0,
                discount: Number(discount) || 0,
                stock_quantity: stock_quantity !== undefined ? Number(stock_quantity) : 100,
                status: status !== undefined ? Number(status) : 1,
                brand_ar: brand_ar || null,
                brand_en: brand_en || null,
                barcode: barcode || null,
                manufacturer: manufacturer || null,
                image_names: image_names || null,
                is_prescription_required: isRxReq,
                active_ingredients: activeIngStr,
                form_ref: formRefStr,
                strength_ref: strRefStr,
                custom_main_cat_id: main_category_id || null,
                custom_sub_cat_id: sub_category_id || null,
                original_catalog_id: original_catalog_id || null,
            });
            return { product_id: productId };
        }

        if (method === "PUT") {
            const productId = body.product_id;
            if (!productId) throw new Error("MISSING_ID");
            console.log(`[ApiClient Pharmacy] Updating product metadata: ${productId}`);
            const current = await global.ApiClientDb.externalSpecialty.getDoc(PRODUCTS_METADATA_COLLECTION, productId);
            if (!current || String(current.user_key || "") !== String(merchant_key)) {
                throw new Error("PRODUCT_NOT_FOUND");
            }
            await global.ApiClientDb.externalSpecialty.setDoc(PRODUCTS_METADATA_COLLECTION, productId, {
                ...current,
                product_id: productId,
                user_key: merchant_key,
                name_ar,
                name_en: name_en || null,
                description: description || null,
                price: Number(price) || 0,
                discount: Number(discount) || 0,
                stock_quantity: stock_quantity !== undefined ? Number(stock_quantity) : 100,
                status: status !== undefined ? Number(status) : 1,
                brand_ar: brand_ar || null,
                brand_en: brand_en || null,
                barcode: barcode || null,
                manufacturer: manufacturer || null,
                ...(hasImageNamesField ? { image_names: image_names || null } : {}),
                is_prescription_required: isRxReq,
                active_ingredients: activeIngStr,
                form_ref: formRefStr,
                strength_ref: strRefStr,
                custom_main_cat_id: main_category_id || null,
                custom_sub_cat_id: sub_category_id || null,
                original_catalog_id: original_catalog_id || null,
            });
            return { product_id: productId };
        }
    }

    // --- 4. Sub-category Products ---
    async function handleGetSubCategoryProducts(subCatId) {
        console.log(`[ApiClient Pharmacy] Fetching products in sub category: ${subCatId}`);
        const rows = await global.ApiClientDb.externalSpecialty.listAllDocs(PRODUCTS_METADATA_COLLECTION);
        return rows.filter((row) => String(row.custom_sub_cat_id || row.sub_category_id || "") === String(subCatId));
    }

    global.ApiClientPharmacy = {
        handleGetCustomCategories,
        handleCreateCustomCategory,
        handleUpdateCustomCategory,
        handleDeleteCustomCategory,
        handleGetPreferences,
        handleSavePreferences,
        handleGetProductMetadata,
        handleDeleteProductMetadata,
        handleSaveProductMetadata,
        handleGetSubCategoryProducts
    };

    console.log("[ApiClient Pharmacy] Pharmacy service emulated successfully.");
})(typeof globalThis !== 'undefined' ? globalThis : window);
