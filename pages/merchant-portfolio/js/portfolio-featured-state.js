/**
 * @file pages/merchant-portfolio/js/portfolio-featured-state.js
 * @description State setup for merchant featured products.
 */

window.portfolioFeaturedState = {
    featuredIds: new Set(),
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

    if (user.featured_ids) {
        try {
            const ids = JSON.parse(user.featured_ids);
            if (Array.isArray(ids)) {
                state.featuredIds = new Set(ids.map((id) => String(id)));
            }
            return;
        } catch (e) { }
    }

    if (user.user_image) {
        try {
            const imgData = typeof user.user_image === 'string' ? JSON.parse(user.user_image) : user.user_image;
            if (imgData && imgData.featured_ids && Array.isArray(imgData.featured_ids)) {
                state.featuredIds = new Set(imgData.featured_ids.map((id) => String(id)));
                console.log('[Featured] Initialized IDs:', Array.from(state.featuredIds));
            }
        } catch (e) {
            console.warn('[Featured] user_image is not a JSON, no featured IDs found.');
        }
    }
}

window.initFeaturedState = initFeaturedState;
