/**
 * @file pages/merchant-portfolio/js/send-request-ui.js
 * @description UI management and DOM updates for the Pharmacy Request page.
 */

const RequestUI = {
    /**
     * @function updateMerchantHeader
     * @description Updates the merchant branding (name and logo) on the page.
     */
    updateMerchantHeader(merchant) {
        const nameEl = document.getElementById('merchant-name');
        const avatarEl = document.getElementById('merchant-avatar');

        if (nameEl) {
            nameEl.textContent = merchant.username || merchant.name || 'صيدلية';
        }

        if (avatarEl && merchant.user_image) {
            // Resolution logic using parseProfileImages
            const images = (typeof parseProfileImages === 'function') 
                ? parseProfileImages(merchant.user_image)
                : { avatar: merchant.user_image };
            
            let avatarFile = images.avatar;
            const spec = merchant.specialty_profile || {};
            if (spec.business_image) avatarFile = spec.business_image;

            let finalAvatarUrl = avatarFile;
            if (typeof PortfolioAPI !== 'undefined' && PortfolioAPI.getPublicImageUrl) {
                finalAvatarUrl = PortfolioAPI.getPublicImageUrl(avatarFile);
            } else if (typeof window.getPublicR2FileUrl === 'function') {
                finalAvatarUrl = window.getPublicR2FileUrl(avatarFile);
            }
            avatarEl.src = finalAvatarUrl;
        }
    },

    /**
     * @function renderPreviews
     * @description Renders or updates the image previews grid.
     */
    renderPreviews() {
        const grid = document.getElementById('previews-grid');
        if (!grid) return;

        grid.innerHTML = '';
        window.RequestState.attachedImages.forEach((file, idx) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const item = document.createElement('div');
                item.className = 'preview-item';
                item.innerHTML = `
                    <img src="${e.target.result}">
                    <button class="remove-btn" onclick="RequestMedia.removeImage(${idx})"><i class="fas fa-times"></i></button>
                `;
                grid.appendChild(item);
            };
            reader.readAsDataURL(file);
        });

        this.updateUploaderState();
    },

    /**
     * @function updateUploaderState
     * @description Enables/disables uploader buttons based on image count limit.
     */
    updateUploaderState() {
        const actions = document.getElementById('req-uploader-actions');
        if (!actions) return;

        const isFull = window.RequestState.attachedImages.length >= window.RequestState.maxImages;
        actions.style.pointerEvents = isFull ? 'none' : 'auto';
        actions.style.opacity = isFull ? '0.5' : '1';
    }
};

window.RequestUI = RequestUI;
