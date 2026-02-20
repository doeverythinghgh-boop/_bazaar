/**
 * RULE: All comments and documentation must be in English only.
 * WARNING: Hover effects are strictly prohibited on this page to ensure touch-device compatibility.
 */
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
 * Fetches user profile data from the database.
 * @param {string} userKey 
 * @returns {Promise<object|null>}
 */
async function portfolioFetchUser(userKey) {
    console.log(`%c[Portfolio] 1. جلب بيانات التاجر (${userKey})...`, "color: blue;");
    try {
        const result = await db.execute({
            sql: "SELECT * FROM users WHERE user_key = ?",
            args: [userKey]
        });

        if (result.rows && result.rows.length > 0) {
            const user = result.rows[0];
            const name = user.business_name || user.username || user.display_name || "Unknown";
            console.log(`%c[Portfolio] 2. تم العثور على التاجر: ${name}`, "color: green;");

            // Save to Cache
            const existingCache = window.portfolioCache.load(userKey) || {};
            window.portfolioCache.save(userKey, {
                ...existingCache,
                user: user
            });

            return user;
        }
        console.warn(`%c[Portfolio] ⚠️ لم يتم العثور على تاجر بهذا المفتاح`, "color: orange;");
        return null;
    } catch (e) {
        console.error(`%c[Portfolio] ❌ خطأ أثناء جلب بيانات التاجر:`, "color: red;", e);
        return null;
    }
}

/**
 * Cache Helpers for Portfolio State
 */
const portfolioCache = {
    getKey: (userKey) => `portfolio_cache_${userKey}`,

    save: (userKey, state) => {
        try {
            const current = window.portfolioCache.load(userKey) || {};
            const data = {
                ...current,
                ...state,
                timestamp: Date.now()
            };
            sessionStorage.setItem(portfolioCache.getKey(userKey), JSON.stringify(data));
        } catch (e) { console.error("[Portfolio Cache] Save error:", e); }
    },

    load: (userKey) => {
        try {
            const raw = sessionStorage.getItem(portfolioCache.getKey(userKey));
            if (!raw) return null;
            const data = JSON.parse(raw);
            // Cache valid for 30 minutes
            if (Date.now() - data.timestamp > 30 * 60 * 1000) {
                sessionStorage.removeItem(portfolioCache.getKey(userKey));
                return null;
            }
            return data;
        } catch (e) { return null; }
    },

    clear: (userKey) => sessionStorage.removeItem(portfolioCache.getKey(userKey))
};

/**
 * Fetches approved products for a specific user with pagination.
 * @param {string} userKey 
 * @param {number} offset
 * @param {number} limit
 */
async function portfolioFetchProducts(userKey, offset = 0, limit = 5) {
    console.log(`%c[Portfolio] 3. جلب منتجات التاجر (البداية: ${offset}، العدد: ${limit})...`, "color: blue;");
    const grid = document.getElementById('portfolio-products-grid');
    const empty = document.getElementById('portfolio-empty');

    // SMART SKELETON LOADER INJECTION
    if (grid && offset === 0) {
        grid.innerHTML = ''; // Clear for fresh load
        for (let i = 0; i < limit; i++) {
            const skeleton = `
                <div class="product-skeleton-card skeleton-container">
                    <div class="skeleton-img skeleton-item"></div>
                    <div class="skeleton-text skeleton-item"></div>
                    <div class="skeleton-price skeleton-item"></div>
                </div>`;
            grid.insertAdjacentHTML('beforeend', skeleton);
        }
    }
    if (empty) empty.style.display = 'none';

    // 0. Permission Logic
    const currentUser = typeof SessionManager !== 'undefined' ? SessionManager.getUser() : null;
    const isAdmin = currentUser && (
        (typeof ADMIN_IDS !== 'undefined' && ADMIN_IDS.includes(currentUser.user_key)) ||
        (typeof SUPER_ADMIN_KEY !== 'undefined' && currentUser.user_key === SUPER_ADMIN_KEY)
    );
    const isOwner = currentUser && (currentUser.user_key === userKey);
    const hasPermission = currentUser && (isOwner || isAdmin);

    // 1. Build SQL query based on permission
    let sql = "SELECT * FROM marketplace_products WHERE user_key = ? AND is_approved = 1 ORDER BY id DESC LIMIT ? OFFSET ?";

    if (hasPermission) {
        // Include pending products for owner/admin
        sql = "SELECT * FROM marketplace_products WHERE user_key = ? AND (is_approved = 1 OR is_approved = 0) ORDER BY id DESC LIMIT ? OFFSET ?";
        console.log(`%c[Portfolio] Fetching both Approved and Pending products (Authorized)...`, "color: brown;");
    }

    // Direct DB Query for Products with LIMIT and OFFSET
    const result = await db.execute({
        sql: sql,
        args: [userKey, limit, offset]
    });

    const products = result.rows;

    // Debug: Log first product to check data structure
    if (products && products.length > 0) {
        console.log('[Portfolio Fetch] Sample product data:', products[0]);
    }

    if (products && products.length > 0) {
        console.log(`%c[Portfolio] 4. تم جلب ${products.length} منتج`, "color: green;");

        // Show Section and Grid
        const productsSection = document.getElementById('portfolio-products-section');
        if (productsSection) productsSection.style.display = 'block';
        if (grid) {
            grid.style.display = 'grid';
            // Clear skeletons on first load only
            if (offset === 0) grid.innerHTML = '';
        }

        // Render products (append mode if offset > 0)
        portfolioRenderProducts(products, offset > 0);

        // Save to Cache
        if (typeof portfolioState !== 'undefined') {
            const existingCache = portfolioCache.load(userKey) || { products: [] };
            const updatedProducts = offset === 0 ? products : [...existingCache.products, ...products];

            portfolioCache.save(userKey, {
                products: updatedProducts,
                offset: offset + products.length,
                isExpanded: true
            });

            // Update local state to match cache
            portfolioState.productOffset = offset + products.length;
            portfolioState.isFirstLoad = false;
        }

        // Actions Container Visibility
        const actionsContainer = document.getElementById('portfolio-products-actions');
        if (actionsContainer) actionsContainer.style.display = 'flex';

        const loadMoreBtn = document.getElementById('btn-load-more-products');
        const searchSellerBtn = document.getElementById('btn-portfolio-search-seller');

        // Always show search button if products exist
        if (searchSellerBtn) searchSellerBtn.style.display = 'flex';

        // Show Load More only if we hit the limit
        if (products.length === limit) {
            if (loadMoreBtn) loadMoreBtn.style.display = 'flex';
        } else {
            if (loadMoreBtn) loadMoreBtn.style.display = 'none';
        }
    } else {
        // No Products Case
        const productsSection = document.getElementById('portfolio-products-section');
        if (offset === 0) {
            if (productsSection) productsSection.style.display = 'none';
            console.log(`%c[Portfolio] ℹ️ لا توجد منتجات لهذا التاجر حالياً`, "color: gray;");
            if (empty) empty.style.display = 'block';
            portfolioCache.clear(userKey);
        } else {
            const loadMoreBtn = document.getElementById('btn-load-more-products');
            if (loadMoreBtn) loadMoreBtn.style.display = 'none';
        }
    }

} catch (e) {
    console.error(`%c[Portfolio] ❌ خطأ أثناء جلب المنتجات:`, "color: red;", e);
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

/**
 * Fetches details (name, image) for a list of user keys.
 * @param {Array<string>} userKeys 
 * @returns {Promise<Object>} Map of userKey -> {username, user_image}
 */
async function portfolioFetchRaters(userKeys) {
    if (!userKeys || userKeys.length === 0) return {};

    console.log(`%c[Portfolio] 6. جلب بيانات المقيمين (${userKeys.length})...`, "color: blue;");

    try {
        // Construct standard SQL with placeholders
        // Note: Turso/LibSQL client might accept array for IN clause differently depending on version.
        // Safe approach: create placeholders string "?, ?, ?"
        const placeholders = userKeys.map(() => '?').join(',');
        const sql = `SELECT user_key, username, user_image FROM users WHERE user_key IN (${placeholders})`;

        const result = await db.execute({
            sql: sql,
            args: userKeys
        });

        const ratersMap = {};
        result.rows.forEach(row => {
            ratersMap[row.user_key] = {
                username: row.username,
                user_image: row.user_image
            };
        });

        console.log(`%c[Portfolio] 7. تم جلب بيانات ${Object.keys(ratersMap).length} مقيم.`, "color: green;");
        return ratersMap;

    } catch (e) {
        console.error("[Portfolio] Fetch Raters Error:", e);
        return {};
    }
}

// Make global - Assign to window modules
window.portfolioCache = portfolioCache;
window.portfolioFetchUser = portfolioFetchUser;
window.portfolioFetchProducts = portfolioFetchProducts;
window.portfolioSubmitRatingToDB = portfolioSubmitRatingToDB;
window.portfolioFetchRaters = portfolioFetchRaters;
