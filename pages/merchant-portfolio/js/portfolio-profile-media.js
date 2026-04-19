/**
 * @file pages/merchant-portfolio/js/portfolio-profile-media.js
 * @description Profile image rendering helpers.
 */

window.portfolioRenderProfileImages = function (user) {
    const images = (typeof parseProfileImages === 'function')
        ? parseProfileImages(user.user_image)
        : { avatar: user.user_image, cover: null };

    const avatarImg = document.getElementById('portfolio-avatar');
    const avatarFallback = document.getElementById('portfolio-avatar-fallback');
    const showAvatarFallback = () => {
        if (avatarImg) avatarImg.style.display = 'none';
        if (avatarFallback) avatarFallback.style.display = 'flex';
    };
    const showAvatarImage = (src) => {
        if (avatarImg) {
            avatarImg.style.display = 'block';
            avatarImg.src = src;
        }
        if (avatarFallback) avatarFallback.style.display = 'none';
    };

    if (user.user_key === 'guest_user') {
        showAvatarFallback();
    } else if (images.avatar) {
        const imgUrl = typeof getPublicR2FileUrl === 'function'
            ? getPublicR2FileUrl(images.avatar)
            : `${((typeof window.getBazaarInfrastructureConfig === 'function'
                ? window.getBazaarInfrastructureConfig().r2PublicUrl
                : null) || '')}/${images.avatar}`;
        showAvatarImage(imgUrl);
    } else {
        showAvatarFallback();
    }

    if (typeof portfolioInitializeSlider === 'function') {
        portfolioInitializeSlider(images.covers);
    }
};
