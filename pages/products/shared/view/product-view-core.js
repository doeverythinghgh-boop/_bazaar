/**
 * @file pages/products/shared/view/product-view-core.js
 * @description Shared helpers for product view rendering.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


window.ProductViewCore = window.ProductViewCore || (function createProductViewCore() {
    function formatAmount(value) {
        const amount = parseFloat(value) || 0;
        return amount % 1 === 0 ? amount : amount.toFixed(2);
    }

    async function getCategoryNames(mainId, subId) {
        try {
            const data = window.appCategoriesList || await fetchAppCategories();
            if (!data) throw new Error(window.langu('pv_error_fetching_categories'));
            const mainCat = data.categories.find((item) => String(item.id) === String(mainId));
            if (!mainCat) return { main: window.langu('unknown_status'), sub: '-' };

            let subName = '-';
            if (subId && mainCat.subcategories) {
                const subCat = mainCat.subcategories.find((item) => String(item.id) === String(subId));
                if (subCat) {
                    const subTitleObj = subCat.title;
                    subName = typeof subTitleObj === 'object'
                        ? (subTitleObj[window.app_language] || subTitleObj.ar)
                        : subTitleObj;
                }
            }

            const mainTitleObj = mainCat.title;
            const mainName = typeof mainTitleObj === 'object'
                ? (mainTitleObj[window.app_language] || mainTitleObj.ar)
                : mainTitleObj;

            return { main: mainName, sub: subName };
        } catch (error) {
            console.error('[ProductViewCore] Error fetching category names:', error);
            return {
                main: window.langu('pv_load_failed'),
                sub: window.langu('pv_load_failed')
            };
        }
    }

    function renderPriceMeta(productData, dom) {
        const originalPriceVal = productData.original_price ? parseFloat(productData.original_price) : 0;
        const currentPriceVal = productData.pricePerItem ? parseFloat(productData.pricePerItem) : 0;

        if (originalPriceVal > 0 && originalPriceVal > currentPriceVal) {
            if (dom.originalPrice) {
                dom.originalPrice.textContent = `${formatAmount(originalPriceVal)} ${window.langu('pv_currency_egp')}`;
            }
            if (dom.originalPriceContainer) dom.originalPriceContainer.style.display = 'flex';

            if (dom.discountBadge) {
                const discountPct = Math.round(((originalPriceVal - currentPriceVal) / originalPriceVal) * 100);
                dom.discountBadge.textContent = `-${discountPct}%`;
                dom.discountBadge.style.display = 'block';
            }
            return;
        }

        if (dom.originalPrice) dom.originalPrice.textContent = '';
        if (dom.originalPriceContainer) dom.originalPriceContainer.style.display = 'none';
        if (dom.discountBadge) dom.discountBadge.style.display = 'none';
    }

    function applyStaticCopy() {
        const sellerLabel = document.querySelector('[data-lkey="pv_sold_by"]');
        if (sellerLabel) sellerLabel.textContent = window.langu('pv_sold_by');

        const portfolioBtnText = document.querySelector('[data-lkey="pv_view_portfolio"]');
        if (portfolioBtnText) portfolioBtnText.textContent = window.langu('pv_view_portfolio');
    }

    function resolveAccess(productData, user = window.userSession) {
        if (!user) {
            return { isSuperAdmin: false, isImpersonating: false, isOwner: false, hasAccess: false };
        }

        const capabilities = typeof window.resolveUserCapabilities === 'function'
            ? window.resolveUserCapabilities(user)
            : null;
        const isOwner = String(user.user_key) === String(productData.user_key);
        const isSuperAdmin = !!capabilities?.isSuperAdmin;
        const isImpersonating = !!LocalDBStorage.getItem('originalAdminSession');

        return {
            isSuperAdmin,
            isImpersonating,
            isOwner,
            hasAccess: isSuperAdmin || isImpersonating
        };
    }

    return {
        applyStaticCopy,
        formatAmount,
        getCategoryNames,
        renderPriceMeta,
        resolveAccess
    };
})();
