/**
 * RULE: All comments and documentation must be in English only.
 * WARNING: Hover effects are strictly prohibited on this page to ensure touch-device compatibility.
 */
/**
 * @file pages/merchant-portfolio/js/portfolio-cache.js
 * @description Handles session cache for the merchant portfolio page.
 */

window.portfolioCache = {
    getKey: function (userKey) {
        return `portfolio_cache_${userKey}`;
    },

    save: function (userKey, state) {
        try {
            const current = window.portfolioCache.load(userKey) || {};
            const data = {
                ...current,
                ...state,
                timestamp: Date.now()
            };
            sessionStorage.setItem(window.portfolioCache.getKey(userKey), JSON.stringify(data));
        } catch (error) {
            console.error("[Portfolio Cache] Save error:", error);
        }
    },

    load: function (userKey) {
        try {
            const raw = sessionStorage.getItem(window.portfolioCache.getKey(userKey));
            if (!raw) return null;

            const data = JSON.parse(raw);
            if (Date.now() - data.timestamp > 30 * 60 * 1000) {
                sessionStorage.removeItem(window.portfolioCache.getKey(userKey));
                return null;
            }

            return data;
        } catch (error) {
            return null;
        }
    },

    clear: function (userKey) {
        sessionStorage.removeItem(window.portfolioCache.getKey(userKey));
    }
};
