/**
 * @file pages/merchant-portfolio/js/send-request-ui.js
 * @description UI management and DOM updates for the Merchant Direct Request page.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


const RequestUI = {
    escapeHtml(value) {
        return String(value || '').replace(/[&<>"']/g, (char) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[char]));
    },

    /**
     * @function updateMerchantHeader
     * @description Updates the merchant branding (name and logo) on the page.
     */
    updateMerchantHeader(merchant) {
        const nameEl = document.getElementById('merchant-name');
        const avatarEl = document.getElementById('merchant-avatar');

        if (nameEl) {
            nameEl.textContent = merchant.username || merchant.name || (window.langu ? window.langu('seller') : 'البائع');
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

    toggleDetailsCard() {
        const card = document.getElementById('req-details-card');
        const toggleBtn = document.getElementById('req-details-card-toggle');
        if (!card || !toggleBtn) return;

        const isCollapsed = card.classList.toggle('collapsed');
        toggleBtn.setAttribute('aria-expanded', String(!isCollapsed));
    },

    updateDetailsCardToggle() {
        const section = document.getElementById('req-queued-products-section');
        const toggleBtn = document.getElementById('req-details-card-toggle');
        const card = document.getElementById('req-details-card');
        if (!toggleBtn || !card || !section) return;

        const hasQueuedProducts = section.style.display !== 'none';
        toggleBtn.style.display = hasQueuedProducts ? 'inline-flex' : 'none';
        // If there are queued products, collapse the details card by default
        if (hasQueuedProducts) {
            if (!card.classList.contains('collapsed')) {
                card.classList.add('collapsed');
                toggleBtn.setAttribute('aria-expanded', 'false');
            }
        } else if (card.classList.contains('collapsed')) {
            // If no queued products, ensure the card is expanded
            card.classList.remove('collapsed');
            toggleBtn.setAttribute('aria-expanded', 'true');
        }
    },

    renderQueuedProducts() {
        console.info('[RequestUI] renderQueuedProducts() started.');
        const section = document.getElementById('req-queued-products-section');
        const list = document.getElementById('req-queued-products-list');
        const merchantKey = window.RequestState?.merchant?.user_key;
        if (!section || !list || !merchantKey || !window.PharmacyRequestCart) return;

        const products = window.PharmacyRequestCart.getItems(merchantKey);
        section.style.display = products.length ? 'block' : 'none';
        list.innerHTML = '';

        products.forEach((product) => {
            const item = document.createElement('div');
            item.className = 'request-product-item';
            item.dataset.productId = product.productId;
            item.innerHTML = `
                <img class="request-product-img" src="${this.escapeHtml(product.image || '/assets/images/placeholder.png')}" alt="${this.escapeHtml(product.name)}" onerror="this.onerror=null; this.src='/assets/images/placeholder.png';">
                <div class="request-product-info">
                    <strong class="request-product-name">${this.escapeHtml(product.name || product.productId)}</strong>
                    <div class="request-product-qty">
                        <button type="button" class="request-product-qty-btn" data-action="dec" aria-label="decrease">-</button>
                        <span class="request-product-qty-val">${product.quantity}</span>
                        <button type="button" class="request-product-qty-btn" data-action="inc" aria-label="increase">+</button>
                    </div>
                </div>
                <button type="button" class="request-product-remove" data-action="remove" aria-label="remove">
                    <i class="fas fa-times"></i>
                </button>
            `;
            list.appendChild(item);
        });

        console.info(`[RequestUI] renderQueuedProducts() rendered ${products.length} product(s).`);
        list.querySelectorAll('[data-action]').forEach((btn) => {
            btn.addEventListener('click', (event) => {
                const row = event.currentTarget.closest('.request-product-item');
                const productId = row?.dataset?.productId;
                const current = window.PharmacyRequestCart.getItems(merchantKey).find((entry) => entry.productId === productId);
                if (!current) return;

                const action = event.currentTarget.dataset.action;
                if (action === 'inc') {
                    window.PharmacyRequestCart.updateQuantity(merchantKey, productId, current.quantity + 1);
                } else if (action === 'dec') {
                    window.PharmacyRequestCart.updateQuantity(merchantKey, productId, Math.max(1, current.quantity - 1));
                } else if (action === 'remove') {
                    window.PharmacyRequestCart.remove(merchantKey, productId);
                }
                this.renderQueuedProducts();
            });
        });
        this.updateDetailsCardToggle();
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
