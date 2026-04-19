/**
 * @file pages/merchant-portfolio/js/portfolio-render-utils.js
 * @description Utility functions for portfolio rendering.
 */

/**
 * Generates HTML for star rating.
 * @param {number} rating
 * @returns {string} HTML string
 */
function portfolioGenerateStars(rating) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
        if (rating >= i) {
            html += '<i class="fas fa-star"></i>';
        } else if (rating >= i - 0.5) {
            html += '<i class="fas fa-star-half-alt"></i>';
        } else {
            html += '<i class="far fa-star"></i>';
        }
    }
    return html;
}

// Global exposure
window.portfolioGenerateStars = portfolioGenerateStars;
