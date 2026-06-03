/**
 * @file pages/products/shared/view/product-ratings-core.js
 * @description Shared parsing and rendering helpers for product/service ratings.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

(function initProductRatingsCore() {
    function L(key, fallback) {
        const value = (typeof window.langu === "function") ? window.langu(key) : null;
        return (!value || value === key) ? fallback : value;
    }

    function parseJsonSafe(raw, fallback) {
        try {
            if (raw === null || raw === undefined || raw === "") return fallback;
            if (typeof raw === "string") return JSON.parse(raw);
            if (typeof raw === "object") return raw;
        } catch { }
        return fallback;
    }

    function parseProductRatingSettings(rawSettings) {
        const settings = parseJsonSafe(rawSettings, {});
        return {
            enabled: settings.productRatingEnabled !== false,
            mode: settings.productRatingMode === "stars_only" ? "stars_only" : "stars_comments"
        };
    }

    function parseRatings(rawRatings) {
        const ratings = parseJsonSafe(rawRatings, []);
        return Array.isArray(ratings) ? ratings : [];
    }

    function generateStars(rating) {
        const parsed = parseFloat(rating || 0);
        const full = Math.floor(parsed);
        const hasHalf = parsed - full >= 0.5;
        let html = "";
        for (let index = 1; index <= 5; index += 1) {
            if (index <= full) html += '<i class="fas fa-star" style="color:#f59e0b;"></i>';
            else if (index === full + 1 && hasHalf) html += '<i class="fas fa-star-half-alt" style="color:#f59e0b;"></i>';
            else html += '<i class="far fa-star" style="color:#d1d5db;"></i>';
        }
        return html;
    }

    async function fetchRatersMap(userKeys) {
        if (!userKeys || !userKeys.length) return {};
        try {
            const data = await apiFetch(`/api/users?user_keys=${userKeys.join(",")}`);
            if (!Array.isArray(data)) return {};
            const out = {};
            data.forEach((user) => {
                out[user.user_key] = { username: user.username, user_image: user.user_image };
            });
            return out;
        } catch (error) {
            return {};
        }
    }

    window.ProductRatingsCore = {
        L,
        parseJsonSafe,
        parseProductRatingSettings,
        parseRatings,
        generateStars,
        fetchRatersMap
    };
})();

