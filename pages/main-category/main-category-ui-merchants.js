
/**
 * @description Render merchant/provider gallery items.
 * @function mainCategory_renderMerchantGallery
 * @param {Array<Object>} merchants - Merchant list.
 * @returns {void}
 */
function mainCategory_renderMerchantGallery(merchants) {
    try {
        var galleryContent = document.getElementById('main-category-gallery-content');
        if (!galleryContent) return;

        galleryContent.innerHTML = '';
        galleryContent.classList.remove('list-view');
        galleryContent.classList.add('merchants-view');

        for (var i = 0; i < merchants.length; i++) {
            var merchantEl = mainCategory_createMerchantItem(merchants[i]);
            galleryContent.appendChild(merchantEl);
        }
    } catch (error) {
        console.error('[MainCategory] Failed to render merchant gallery:', error);
    }
}

/**
 * @description Create a merchant/provider card element.
 * @function mainCategory_createMerchantItem
 * @param {Object} merchant - Merchant data.
 * @returns {HTMLDivElement}
 */
function mainCategory_createMerchantItem(merchant) {
    try {
        var item = document.createElement('div');
        item.className = 'main-category-merchant-item';
        item.id = 'merchant-item-' + (merchant.user_key || merchant.id);

        var images = (typeof parseProfileImages === 'function')
            ? parseProfileImages(merchant.user_image)
            : { avatar: merchant.user_image };

        var avatarUrl = null;
        if (images.avatar) {
            avatarUrl = (typeof getPublicR2FileUrl === 'function')
                ? getPublicR2FileUrl(images.avatar)
                : images.avatar;
        }

        var businessName = merchant.business_name || merchant.username || 'Unnamed Provider';
        var bio = merchant.business_bio || (window.langu ? window.langu('gen_no_bio') : 'لا يوجد وصف متاح حالياً');

        var mediaHtml = avatarUrl
            ? `<img src="${avatarUrl}" class="merchant-avatar" alt="${businessName}" onerror="this.parentElement.innerHTML='<div class=\'merchant-avatar-placeholder\'><i class=\'fas fa-user\'></i></div>'">`
            : `<div class="merchant-avatar-placeholder"><i class="fas fa-user"></i></div>`;

        item.innerHTML = `
            <div class="merchant-card-content">
                <div class="merchant-avatar-wrapper">
                    ${mediaHtml}
                </div>
                <div class="merchant-info">
                    <h3 class="merchant-name">${businessName}</h3>
                    <p class="merchant-bio">${bio}</p>
                </div>
            </div>
        `;

        item.addEventListener('click', function() {
            var uKey = merchant.user_key || merchant.id;
            if (typeof window.portfolioLaunch === 'function') {
                window.portfolioLaunch(uKey);
            } else {
                LocalDBStorage.setItem('selectedMerchantKey', uKey);
                window.location.href = '/pages/merchant-portfolio/merchant-portfolio.html?user_key=' + encodeURIComponent(uKey);
            }
        });

        return item;
    } catch (error) {
        console.error('[MainCategory] Failed to build merchant item:', error);
        return document.createElement('div');
    }
}
