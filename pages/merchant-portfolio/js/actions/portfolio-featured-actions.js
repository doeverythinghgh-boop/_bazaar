/**
 * @file pages/merchant-portfolio/js/portfolio-featured-actions.js
 * @description Featured actions and persistence.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
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
    const urlParams = new URLSearchParams(window.location.search);
    const portfolioUserKey = urlParams.get('user_key');
    const resolved = typeof window.resolvePortfolioProductById === 'function'
        ? window.resolvePortfolioProductById(productId, portfolioUserKey)
        : null;
    const product = resolved?.product || null;
    const isCar = product?.item_type === 'car' || product?.is_car_listing;

    if (isCar && PortfolioAPI.setCarFeatured) {
        const updated = await PortfolioAPI.setCarFeatured(product.car_key || product.product_key || sId, isChecked);
        if (updated?.error) {
            Swal.fire(L('port_rate_error_title') || 'خطأ', updated.error, 'error');
            return;
        }
        product.is_featured = isChecked ? 1 : 0;
        if (el) {
            if (isChecked) el.classList.add('active');
            else el.classList.remove('active');
        }
        if (typeof renderCommercialFeaturedScroller === 'function') {
            renderCommercialFeaturedScroller();
        }
        return;
    }

    if (el) {
        if (isChecked) el.classList.add('active');
        else el.classList.remove('active');
    }

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
                const imgData = typeof merchantData.featured_items_data === 'string' ? JSON.parse(merchantData.featured_items_data) : merchantData.featured_items_data;
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
                    let imgData = typeof cache.user.featured_items_data === 'string' ? JSON.parse(cache.user.featured_items_data) : cache.user.featured_items_data;
                    if (typeof imgData !== 'object' || Array.isArray(imgData)) imgData = {};
                    imgData.featured_ids = finalIds;
                    cache.user.featured_items_data = JSON.stringify(imgData);
                    PortfolioAPI.saveCache(targetUserKey, cache);
                    if (controller.getActiveUser && String(controller.getActiveUser()?.user_key || '') === String(targetUserKey)) {
                        controller.setActiveUser({
                            ...controller.getActiveUser(),
                            featured_items_data: cache.user.featured_items_data
                        }, { userKey: targetUserKey, persist: true });
                    }
                } catch (error) {
                    if (window.PortfolioErrorUtils?.log) {
                        window.PortfolioErrorUtils.log("PortfolioFeaturedActions", "Failed to update featured cache snapshot.", error);
                    } else {
                        console.error('[Featured] Cache update error:', error);
                    }
                }
            }
        }
    }
}

window.toggleFeaturedProduct = toggleFeaturedProduct;
