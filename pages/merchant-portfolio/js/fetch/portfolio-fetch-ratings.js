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
 * @file pages/merchant-portfolio/js/portfolio-fetch-ratings.js
 * @description Handles rating CRUD and raters fetching.
 */

window.portfolioSubmitRatingToDB = async function (targetUserKey, ratingData) {
    try {
        const result = window.PortfolioAPI?.submitMerchantRating
            ? await window.PortfolioAPI.submitMerchantRating(targetUserKey, ratingData)
            : null;
        return result && result.success ? result : null;
    } catch (error) {
        console.error('[Portfolio] Submit Rating Error:', error);
        return null;
    }
};

window.portfolioUpdateRatingInDB = async function (targetUserKey, actorUserKey, ratingRef, ratingData) {
    try {
        const result = window.PortfolioAPI?.updateMerchantRating
            ? await window.PortfolioAPI.updateMerchantRating(targetUserKey, actorUserKey, ratingRef, ratingData)
            : null;
        return result && result.success ? result : null;
    } catch (error) {
        console.error('[Portfolio] Edit Rating Error:', error);
        return null;
    }
};

window.portfolioDeleteRatingInDB = async function (targetUserKey, actorUserKey, ratingRef) {
    try {
        const result = window.PortfolioAPI?.deleteMerchantRating
            ? await window.PortfolioAPI.deleteMerchantRating(targetUserKey, actorUserKey, ratingRef)
            : null;
        return result && result.success ? result : null;
    } catch (error) {
        console.error('[Portfolio] Delete Rating Error:', error);
        return null;
    }
};

window.portfolioFetchRaters = async function (userKeys) {
    if (!userKeys || userKeys.length === 0) return {};

    try {
        return window.PortfolioAPI?.fetchRaters
            ? await window.PortfolioAPI.fetchRaters(userKeys)
            : {};
    } catch (error) {
        console.error('[Portfolio] Fetch Raters Error:', error);
        return {};
    }
};
