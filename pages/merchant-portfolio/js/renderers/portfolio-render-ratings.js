/**
 * @file pages/merchant-portfolio/js/renderers/portfolio-render-ratings.js
 * @description Star ratings summary and review window trigger logic.
 */

window.portfolioRenderProfileRatings = function (user, options) {
    const { settings, specialtyViewModel } = options;
    const ratingEnabled = settings.ratingEnabled !== false;
    const ratingMode = settings.ratingMode || 'stars_comments';
    window.portfolioRatingConfig = { ratingEnabled, ratingMode };

    const ratingSummaryEl = document.getElementById('portfolio-rating-summary');
    const rateBtnEl = document.getElementById('btn-rate-merchant');

    const userCaps = typeof window.resolveUserCapabilities === 'function' ? window.resolveUserCapabilities(user) : {};

    if (!ratingEnabled || specialtyViewModel?.showRatingsSection === false || (userCaps.isBuyer && !userCaps.isServiceProvider)) {
        if (ratingSummaryEl) ratingSummaryEl.style.display = 'none';
        if (rateBtnEl) rateBtnEl.style.display = 'none';
        return;
    }

    if (ratingSummaryEl) ratingSummaryEl.style.display = 'flex';
    if (rateBtnEl) rateBtnEl.style.display = 'inline-flex';

    let ratings = [];
    try {
        if (Array.isArray(user.ratings)) ratings = user.ratings;
        else if (typeof user.ratings === 'string' && user.ratings.trim() !== '') ratings = JSON.parse(user.ratings);
        else if (user.ratings && typeof user.ratings === 'object') ratings = user.ratings;
    } catch (e) {
        try {
            const normalized = String(user.ratings || '').replace(/\\'/g, "'").replace(/'/g, '"');
            ratings = JSON.parse(normalized);
        } catch (e2) {
            console.error('Error parsing ratings', e2);
            ratings = [];
        }
    }
    if (!Array.isArray(ratings)) ratings = [];

    let average = 0;
    if (ratings.length > 0) {
        const sum = ratings.reduce((a, b) => a + (b.rating || 0), 0);
        average = (sum / ratings.length).toFixed(1);
    }

    const starsContainer = document.getElementById('portfolio-stars');
    if (typeof portfolioGenerateStars === 'function') {
        starsContainer.innerHTML = portfolioGenerateStars(average);
    }

    const countEl = document.getElementById('portfolio-rating-count');
    const ratingsCountLabel = typeof window.langu === 'function'
        ? window.langu('ratings_count') || '({count} تقييم)'
        : '({count} تقييم)';
    countEl.textContent = ratingsCountLabel.replace('{count}', ratings.length);

    if (ratingEnabled && ratings.length > 0) {
        countEl.style.cursor = 'pointer';
        countEl.style.textDecoration = 'underline';
        countEl.onclick = () => { if (typeof portfolioShowReviews === 'function') portfolioShowReviews(ratings); };
        starsContainer.style.cursor = 'pointer';
        starsContainer.onclick = () => { if (typeof portfolioShowReviews === 'function') portfolioShowReviews(ratings); };
    } else {
        countEl.style.cursor = 'default';
        countEl.style.textDecoration = 'none';
        countEl.onclick = null;
        starsContainer.style.cursor = 'default';
        starsContainer.onclick = null;
    }
};
