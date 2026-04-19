/**
 * @file pages/merchant-portfolio/js/renderers/portfolio-render-info.js
 * @description Bio and address info rendering for merchant portfolio.
 */

window.portfolioRenderProfileInfo = function (user) {
    const bioEl = document.getElementById('portfolio-bio');
    bioEl.textContent = user.business_bio || '';

    const existingInfo = document.querySelector('.profile-info-list');
    if (existingInfo) existingInfo.remove();

    const infoContainer = document.createElement('div');
    infoContainer.id = 'portfolio-info-list';
    infoContainer.className = 'profile-info-list';

    let hasInfo = false;
    if (user.address && user.address.trim() !== '') {
        hasInfo = true;
        infoContainer.innerHTML += `
            <div class="info-item">
                <i class="fas fa-map-marker-alt"></i>
                <span>${user.address}</span>
            </div>
        `;
    }

    if (hasInfo) bioEl.after(infoContainer);
};
