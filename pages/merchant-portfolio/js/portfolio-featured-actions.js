/**
 * @file pages/merchant-portfolio/js/portfolio-featured-actions.js
 * @description Featured actions and persistence.
 */

async function toggleFeaturedProduct(productId, isChecked, el, userKeyOverride) {
    const PortfolioAPI = window.PortfolioAPI || {};
    const controller = window.portfolioPageController || {};
    const L = (key) => typeof window.langu === 'function' ? window.langu(key) : key;
    const confirmTitle = L('gen_swal_title_confirm');
    const confirmText = isChecked ? L('port_featured_add_confirm') : L('port_featured_remove_confirm');

    const result = await Swal.fire({
        title: confirmTitle,
        text: confirmText,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: L('alert_confirm_btn'),
        cancelButtonText: L('alert_cancel_btn'),
        customClass: {
            popup: 'swal-modern-mini-popup',
            title: 'swal-modern-mini-title',
            htmlContainer: 'swal-modern-mini-text',
            confirmButton: 'swal-modern-mini-confirm',
            cancelButton: 'swal-modern-mini-cancel'
        }
    });

    if (!result.isConfirmed) {
        return;
    }

    const state = window.portfolioFeaturedState;
    const sId = String(productId);

    if (el) {
        if (isChecked) el.classList.add('active');
        else el.classList.remove('active');
    }

    const urlParams = new URLSearchParams(window.location.search);
    const portfolioUserKey = urlParams.get('user_key');
    const targetUserKey = userKeyOverride || portfolioUserKey;

    if (isChecked) {
        if (targetUserKey === portfolioUserKey) state.featuredIds.add(sId);
    } else if (targetUserKey === portfolioUserKey) {
        state.featuredIds.delete(sId);
    }

    if (typeof renderCommercialFeaturedScroller === 'function' && targetUserKey === portfolioUserKey) {
        renderCommercialFeaturedScroller();
    }

    if (targetUserKey && typeof window.portfolioUpdateFeaturedIDs === 'function') {
        let finalIds = [];
        if (targetUserKey !== portfolioUserKey) {
            const merchantData = await window.portfolioFetchUser(targetUserKey);
            if (merchantData) {
                const imgData = typeof merchantData.user_image === 'string' ? JSON.parse(merchantData.user_image) : merchantData.user_image;
                let ids = new Set((imgData && imgData.featured_ids) ? imgData.featured_ids.map((id) => String(id)) : []);
                if (isChecked) ids.add(sId); else ids.delete(sId);
                finalIds = Array.from(ids);
            }
        } else {
            finalIds = Array.from(state.featuredIds);
        }

        const success = await window.portfolioUpdateFeaturedIDs(targetUserKey, finalIds);
        if (success && PortfolioAPI.loadCache) {
            const cache = PortfolioAPI.loadCache(targetUserKey);
            if (cache && cache.user) {
                try {
                    let imgData = typeof cache.user.user_image === 'string' ? JSON.parse(cache.user.user_image) : cache.user.user_image;
                    if (typeof imgData !== 'object') imgData = { avatar: cache.user.user_image };
                    imgData.featured_ids = finalIds;
                    cache.user.user_image = JSON.stringify(imgData);
                    PortfolioAPI.saveCache(targetUserKey, cache);
                    if (controller.getActiveUser && String(controller.getActiveUser()?.user_key || '') === String(targetUserKey)) {
                        controller.setActiveUser({
                            ...controller.getActiveUser(),
                            user_image: cache.user.user_image
                        }, { userKey: targetUserKey, persist: true });
                    }
                } catch (e) {
                    console.error('[Featured] Cache update error:', e);
                }
            }
        }
    }
}

window.toggleFeaturedProduct = toggleFeaturedProduct;
