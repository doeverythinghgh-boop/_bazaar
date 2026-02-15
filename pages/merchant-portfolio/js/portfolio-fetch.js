/**
 * @file pages/merchant-portfolio/js/portfolio-fetch.js
 * @description Handles data fetching from Turso Database directly for the portfolio.
 */

// Import Turso Client (ESM via CDN for browser usage)
import { createClient } from "https://esm.sh/@libsql/client@0.6.0/web";

// Configuration (Mirrored from api/products.js / database-analysis.js)
// NOTE: In a real production app, this should be proxied. 
// Given the current environment constraint (static site), we use direct connection.
const dbConfig = {
    url: "libsql://bazaar-bazaar.aws-eu-west-1.turso.io",
    authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NjE5ODExODcsImlkIjoiMjk3ZTJkOTgtODkxZi00MjVmLWI0YjQtOGNlNTM2MmM5ZTQ4IiwicmlkIjoiNjRkMTg0YWQtZTJhMC00YmEwLWI3NzUtN2Q3MjlkYmQ5YmY1In0.z-P7Vt-ixn5pMmgoOKAsQes4knj9FBY017xqogMD1YklBaRFBAFvhMLREu9uQrj9n3LOfX7R77MVVgePyfV4CA"
};

const db = createClient(dbConfig);

/**
 * Fetches user data by user_key.
 * @param {string} userKey 
 * @returns {Promise<Object|null>}
 */
async function portfolioFetchUser(userKey) {
    console.log(`%c[Portfolio] 1. بدء جلب بيانات التاجر: ${userKey}`, "color: blue; font-weight: bold;");
    try {
        const result = await db.execute({
            sql: "SELECT username, user_image, business_name, business_bio, business_category, business_sub_categories, isDelivered, ratings, phone, business_whatsapp, address, location, user_key FROM users WHERE user_key = ?",
            args: [userKey]
        });

        if (result.rows && result.rows.length > 0) {
            console.log(`%c[Portfolio] 2. تم العثور على بيانات التاجر بنجاح via Turso`, "color: green;");
            console.log("[Portfolio] Data:", result.rows[0]);
            return result.rows[0];
        }
        console.warn(`%c[Portfolio] ⚠️ لم يتم العثور على تاجر بهذا المفتاح`, "color: orange;");
        return null;
    } catch (e) {
        console.error(`%c[Portfolio] ❌ خطأ أثناء جلب بيانات التاجر:`, "color: red;", e);
        return null;
    }
}

/**
 * Fetches approved products for a specific user.
 * @param {string} userKey 
 */
async function portfolioFetchProducts(userKey, retry = false) {
    console.log(`%c[Portfolio] 3. بدء جلب منتجات التاجر...`, "color: blue;");
    const loader = document.getElementById('portfolio-loading');
    const grid = document.getElementById('portfolio-products-grid');
    const empty = document.getElementById('portfolio-empty');

    if (loader) loader.style.display = 'block';
    if (empty) empty.style.display = 'none';

    try {
        // Direct DB Query for Products
        const result = await db.execute({
            sql: "SELECT * FROM marketplace_products WHERE user_key = ? AND is_approved = 1 ORDER BY id DESC",
            args: [userKey]
        });

        const products = result.rows;
        
        if (loader) loader.style.display = 'none';

        if (products && products.length > 0) {
            console.log(`%c[Portfolio] 4. تم جلب ${products.length} منتج للتاجر`, "color: green;");
            portfolioRenderProducts(products);
        } else {
            console.log(`%c[Portfolio] ℹ️ لا توجد منتجات لهذا التاجر حالياً`, "color: gray;");
            if (empty) empty.style.display = 'block';
        }

    } catch (e) {
        console.error(`%c[Portfolio] ❌ خطأ أثناء جلب المنتجات:`, "color: red;", e);
        if (loader) loader.style.display = 'none';
    }
}

/**
 * Submits a new rating for a user.
 * @param {string} targetUserKey 
 * @param {Object} ratingData 
 * @returns {Promise<boolean>}
 */
async function portfolioSubmitRatingToDB(targetUserKey, ratingData) {
    try {
        // 1. Get current ratings
        const currentRes = await db.execute({
            sql: "SELECT ratings FROM users WHERE user_key = ?",
            args: [targetUserKey]
        });

        if (currentRes.rows.length === 0) throw new Error("User not found");

        let currentRatings = [];
        try {
            if (currentRes.rows[0].ratings) {
                currentRatings = JSON.parse(currentRes.rows[0].ratings);
            }
        } catch (e) { console.error("Parse error", e); }

        // 2. Append new rating
        currentRatings.push(ratingData);

        // 3. Update DB
        await db.execute({
            sql: "UPDATE users SET ratings = ? WHERE user_key = ?",
            args: [JSON.stringify(currentRatings), targetUserKey]
        });

        return true;
    } catch (e) {
        console.error("[Portfolio] Submit Rating Error:", e);
        return false;
    }
}

// Make global - Assign to window modules
// Note: Since this is module type, we need to explicitly attach to window
window.portfolioFetchUser = portfolioFetchUser;
window.portfolioFetchProducts = portfolioFetchProducts;
window.portfolioSubmitRatingToDB = portfolioSubmitRatingToDB;
