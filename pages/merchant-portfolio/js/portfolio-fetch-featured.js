/**
 * RULE: All comments and documentation must be in English only.
 * WARNING: Hover effects are strictly prohibited on this page to ensure touch-device compatibility.
 */
/**
 * @file pages/merchant-portfolio/js/portfolio-fetch-featured.js
 * @description Handles featured products persistence and fetching.
 */

window.portfolioUpdateFeaturedIDs = async function (userKey, featuredIds) {
    try {
        const PortfolioAPI = window.PortfolioAPI || {};
        console.log(`%c[Portfolio] Updating nested featured data for ${userKey}...`, 'color: blue;');

        const user = await window.portfolioFetchUser(userKey);
        if (!user) return false;

        const currentData = user.user_image;
        let imgJson = {};

        try {
            imgJson = (typeof currentData === 'string') ? JSON.parse(currentData) : (currentData || {});
            if (typeof imgJson !== 'object' || Array.isArray(imgJson)) imgJson = { avatar: currentData };
        } catch (error) {
            imgJson = { avatar: currentData };
        }

        imgJson.featured_ids = Array.isArray(featuredIds) ? featuredIds : [];

        const result = await updateUser({
            user_key: userKey,
            user_image: JSON.stringify(imgJson)
        });

        if (result && !result.error) {
            if (PortfolioAPI.saveCache) {
                const cache = PortfolioAPI.loadCache(userKey) || {};
                PortfolioAPI.saveCache(userKey, {
                    ...cache,
                    user: {
                        ...(cache.user || user),
                        ...user,
                        user_image: JSON.stringify(imgJson)
                    }
                });
            }
            console.log('%c[Portfolio] Featured IDs updated successfully.', 'color: green;');
            return true;
        }

        return false;
    } catch (error) {
        console.error('[Portfolio] Update Featured IDs Error:', error);
        return false;
    }
};

window.portfolioFetchAllFeaturedProducts = async function () {
    if (!window.portfolioFeaturedState || window.portfolioFeaturedState.featuredIds.size === 0) return [];

    const idArray = Array.from(window.portfolioFeaturedState.featuredIds);
    const PortfolioAPI = window.PortfolioAPI || {};
    const data = PortfolioAPI.fetchFeaturedProducts
        ? await PortfolioAPI.fetchFeaturedProducts(idArray)
        : [];

    return Array.isArray(data) ? data : [];
};
