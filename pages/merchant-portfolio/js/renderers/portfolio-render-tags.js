/**
 * @file pages/merchant-portfolio/js/renderers/portfolio-render-tags.js
 * @description Status tags and specialty labels rendering.
 */

window.portfolioRenderProfileTags = function (user, options) {
    const { specialtyViewModel, specialtyProfile, specialtyDisplayMeta, specialtyAccent } = options;
    const tagsContainer = document.getElementById('portfolio-tags');
    tagsContainer.innerHTML = '';

    if (specialtyDisplayMeta?.modeBadgeLabel) {
        const modeTag = document.createElement('span');
        modeTag.id = 'portfolio-tag-mode';
        modeTag.className = 'tag tag-mode';
        if (specialtyAccent?.color) modeTag.style.color = specialtyAccent.color;
        if (specialtyAccent?.soft) modeTag.style.background = specialtyAccent.soft;
        if (specialtyAccent?.border) modeTag.style.border = `1px solid ${specialtyAccent.border}`;
        modeTag.innerHTML = `<i class="${specialtyDisplayMeta.primaryCategoryIcon || 'fas fa-store'}"></i> ${specialtyDisplayMeta.modeBadgeLabel}`;
        tagsContainer.appendChild(modeTag);
    }

    if (user.username) {
        const usernameTag = document.createElement('span');
        usernameTag.className = 'tag tag-identity';
        usernameTag.innerHTML = `<i class="fas fa-at"></i> ${user.username}`;
        tagsContainer.appendChild(usernameTag);
    }

    if (specialtyProfile?.canDeliver || user.isDelivered == 1) {
        const deliveryTag = document.createElement('span');
        deliveryTag.id = 'portfolio-tag-delivery';
        deliveryTag.className = 'tag tag-delivery';
        const deliveryText = typeof window.langu === 'function' ? window.langu('provides_delivery') : 'يوفر توصيل';
        deliveryTag.innerHTML = `<i class="fas fa-truck"></i> ${deliveryText}`;
        tagsContainer.appendChild(deliveryTag);
    }

    if (Array.isArray(specialtyProfile?.titles)) {
        specialtyProfile.titles.forEach((specialty, index) => {
            const label = String(specialty?.label || '').trim();
            if (!label) return;
            const specialtyTag = document.createElement('span');
            specialtyTag.id = `portfolio-tag-specialty-${index + 1}`;
            specialtyTag.className = 'tag tag-specialty';
            specialtyTag.innerHTML = `<i class="fas fa-certificate"></i> ${label}`;
            tagsContainer.appendChild(specialtyTag);
        });
    }

    if (specialtyViewModel?.showProfileTags === false) {
        tagsContainer.style.display = 'none';
    } else if (tagsContainer.children.length > 0) {
        tagsContainer.style.display = 'flex';
    }
};
