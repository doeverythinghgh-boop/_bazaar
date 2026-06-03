/**
 * @file portfolio-actions-add-product.js
 * @description Handler for adding products in the merchant portfolio.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

window.portfolioHandleAddProductClick = function (user) {
    const PortfolioAPI = window.PortfolioAPI || {};
    let filter = null;
    try {
        if (user.business_category) {
            filter = typeof user.business_category === 'string'
                ? JSON.parse(user.business_category)
                : user.business_category;
        }
    } catch (error) {
        console.error("[Portfolio] Failed to parse business_category:", error);
    }

    if (!filter || Object.keys(filter).length === 0) {
        if (typeof Swal !== 'undefined') {
            const L = (key, fallback) => (typeof window.langu === 'function' ? window.langu(key) : null) || fallback;
            Swal.fire({
                title: L('port_profile_specialties_required_title', 'خطوة مطلوبة'),
                text: L('port_profile_specialties_required_text', 'يرجى تحديث تخصصات النشاط في ملفك الشخصي أولاً لتتمكن من إضافة خدماتك بالقسم الصحيح.'),
                icon: 'info',
                confirmButtonText: L('port_profile_specialties_required_confirm', 'تعديل البيانات'),
                buttonsStyling: false,
                customClass: {
                    popup: 'swal-modern-mini-popup',
                    title: 'swal-modern-mini-title',
                    htmlContainer: 'swal-modern-mini-text',
                    confirmButton: 'swal-modern-mini-confirm'
                }
            }).then(function (result) {
                if (result.isConfirmed) {
                    const settingsBtn = document.getElementById('btn-settings-mini');
                    if (settingsBtn) settingsBtn.click();
                }
            });
        }
        return;
    }

    if (typeof showAddProductModal === 'function') {
        if (PortfolioAPI.clearCache) PortfolioAPI.clearCache(user.user_key);
        showAddProductModal({
            filter: filter,
            provider_key: user.user_key,
            title: (typeof window.langu === 'function' ? window.langu('port_add_product_modal_title') : null) || 'إضافة منتج جديد'
        });
    } else {
        console.warn("[Portfolio] showAddProductModal not found.");
    }
};
