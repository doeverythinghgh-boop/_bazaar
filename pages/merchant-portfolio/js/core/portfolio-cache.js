/**
 * RULE: All comments and documentation must be in English only.
 * WARNING: Hover effects are strictly prohibited on this page to ensure touch-device compatibility.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
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
            LocalDBSession.setItem(window.portfolioCache.getKey(userKey), JSON.stringify(data));
        } catch (error) {
            console.error("[Portfolio Cache] Save error:", error);
        }
    },

    load: function (userKey) {
        try {
            const raw = LocalDBSession.getItem(window.portfolioCache.getKey(userKey));
            if (!raw) return null;

            const data = JSON.parse(raw);
            if (Date.now() - data.timestamp > 30 * 60 * 1000) {
                LocalDBSession.removeItem(window.portfolioCache.getKey(userKey));
                return null;
            }

            return data;
        } catch (error) {
            if (window.PortfolioErrorUtils?.log) {
                window.PortfolioErrorUtils.log("PortfolioCache", "Failed to read cache entry.", error);
            } else {
                console.error("[Portfolio Cache] Load error:", error);
            }
            return null;
        }
    },

    clear: function (userKey) {
        LocalDBSession.removeItem(window.portfolioCache.getKey(userKey));
    }
};
