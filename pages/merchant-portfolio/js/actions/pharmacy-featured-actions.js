/**
 * @file pages/merchant-portfolio/js/actions/pharmacy-featured-actions.js
 * @description Toggle actions for pharmacy featured products.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

(function () {
    function getLabel(key, fallback) {
        return typeof window.langu === 'function' ? (window.langu(key) || fallback || key) : (fallback || key);
    }

    window.togglePharmacyFeaturedProduct = async function (item, isChecked, el) {
        const utils = window.pharmacyFeaturedUtils;
        if (!utils) {
            console.warn('[Pharmacy-Swal-Diagnostic] Featured toggle stopped. Reason: pharmacyFeaturedUtils is not loaded.');
            return false;
        }

        const identity = utils.getFeaturedIdentity(item);
        if (!identity) {
            console.warn('[Pharmacy-Swal-Diagnostic] Featured toggle stopped. Reason: item identity could not be resolved.');
            return false;
        }

        console.log(`[Pharmacy-Featured] Manual toggle requested for item: ${identity.id} (Checked: ${isChecked})`);

        const result = await Swal.fire({
            title: getLabel('gen_swal_title_confirm', 'تأكيد'),
            text: isChecked
                ? getLabel('port_featured_add_confirm', 'هل تريد إضافة هذا المنتج إلى المميزة؟')
                : getLabel('port_featured_remove_confirm', 'هل تريد إزالة هذا المنتج من المميزة؟'),
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: getLabel('alert_confirm_btn', 'تأكيد'),
            cancelButtonText: getLabel('alert_cancel_btn', 'إلغاء'),
            customClass: {
                popup: 'swal-modern-mini-popup',
                title: 'swal-modern-mini-title',
                htmlContainer: 'swal-modern-mini-text',
                confirmButton: 'swal-modern-mini-confirm',
                cancelButton: 'swal-modern-mini-cancel'
            }
        });

        if (!result.isConfirmed) {
            console.log('[Pharmacy-Featured] Toggle cancelled by user.');
            return false;
        }

        console.log('[Pharmacy-Featured] Action confirmed. Updating local state...');
        if (isChecked) {
            utils.upsertFeaturedItem(identity);
        } else {
            utils.removeFeaturedItem(identity);
        }

        if (el) {
            el.classList.toggle('active', !!isChecked);
        }

        const userKey = new URLSearchParams(window.location.search).get('user_key');
        const items = utils.getFeaturedItems();
        
        console.log(`[Pharmacy-Featured] Persisting ${items.length} featured items to server...`);
        const success = userKey && typeof window.portfolioUpdatePharmacyFeaturedItems === 'function'
            ? await window.portfolioUpdatePharmacyFeaturedItems(userKey, items)
            : false;

        if (!success) {
            console.error('[Pharmacy-Featured] Server persistence failed. Reverting local state.');
            if (isChecked) utils.removeFeaturedItem(identity);
            else utils.upsertFeaturedItem(identity);
            if (el) el.classList.toggle('active', !isChecked);
            return false;
        }

        console.log('[Pharmacy-Featured] Successfully updated featured products.');

        // Optimization: If there is a listener for 'pharmacy-featured-items-changed', 
        // it will likely trigger the scroller render anyway.
        // We only call it explicitly if the function exists and we want immediate feedback.
        if (typeof window.renderCommercialFeaturedScroller === 'function') {
            console.log('[Pharmacy-Featured] Refreshing scroller UI...');
            window.renderCommercialFeaturedScroller();
        }

        return true;
    };
})();
