/**
 * @file pages/merchant-portfolio/js/portfolio-featured-state.js
 * @description State setup for merchant featured products.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


window.portfolioFeaturedState = {
    featuredIds: new Set(),
    pharmacyFeaturedItems: [],
    pharmacyFeaturedKeys: new Set(),
    allProducts: [],
    animationFrame: null,
    isPaused: false,
    lastTimestamp: 0,
    scrollPos: 0,
    scrollSpeed: 25,
    storageKey: 'port_feat_scroll_'
};

function initFeaturedState(user) {
    const state = window.portfolioFeaturedState;
    state.featuredIds = new Set();
    state.pharmacyFeaturedItems = [];
    state.pharmacyFeaturedKeys = new Set();

    if (user.featured_ids) {
        try {
            const ids = JSON.parse(user.featured_ids);
            if (Array.isArray(ids)) {
                state.featuredIds = new Set(ids.map((id) => String(id)));
            }
        } catch (error) {
            if (window.PortfolioErrorUtils?.log) {
                window.PortfolioErrorUtils.log("PortfolioFeaturedState", "Failed to parse featured_ids; fallback.", error);
            } else {
                console.error("[PortfolioFeaturedState] Failed to parse featured_ids; fallback.", error);
            }
        }
    }

    if (user.featured_items_data) {
        try {
            const imgData = typeof user.featured_items_data === 'string' ? JSON.parse(user.featured_items_data) : user.featured_items_data;
            if (state.featuredIds.size === 0 && imgData && imgData.featured_ids && Array.isArray(imgData.featured_ids)) {
                state.featuredIds = new Set(imgData.featured_ids.map((id) => String(id)));
                console.log('[Featured] Initialized IDs:', Array.from(state.featuredIds));
            }
            if (imgData && Array.isArray(imgData.pharmacy_featured_ids)) {
                if (window.pharmacyFeaturedUtils?.setFeaturedItems) {
                    window.pharmacyFeaturedUtils.setFeaturedItems(imgData.pharmacy_featured_ids);
                } else {
                    state.pharmacyFeaturedItems = imgData.pharmacy_featured_ids;
                    state.pharmacyFeaturedKeys = new Set(imgData.pharmacy_featured_ids.map((item) => `${item?.type || 'catalog'}:${item?.id || item}`));
                }
                console.log('[PharmacyFeatured] Initialized IDs:', Array.from(state.pharmacyFeaturedKeys));
            }
        } catch (error) {
            if (window.PortfolioErrorUtils?.log) {
                window.PortfolioErrorUtils.log("PortfolioFeaturedState", "Failed to parse featured_items_data for featured IDs.", error);
            } else {
                console.warn('[Featured] featured_items_data is not a JSON, no featured IDs found.', error);
            }
        }
    }
}

window.initFeaturedState = initFeaturedState;
