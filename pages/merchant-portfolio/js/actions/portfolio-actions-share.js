/**
 * RULE: All comments and documentation must be in English only.
 * WARNING: Hover effects are strictly prohibited on this page to ensure touch-device compatibility.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

/**
 * @file pages/merchant-portfolio/js/portfolio-actions-share.js
 * @description Handles sharing the portfolio.
 */

/**
 * Handles sharing the portfolio link.
 * @param {Object} user
 */
function portfolioHandleShare(user) {
    const productionDomain = (typeof window.getBazaarInfrastructureConfig === 'function'
        ? window.getBazaarInfrastructureConfig().pagesUrl
        : null) || window.location.origin;
    const shareUrl = `${productionDomain}/pages/merchant-portfolio/merchant-portfolio.html?user_key=${user.user_key}`;
    const merchantLabel = typeof window.langu === 'function' ? window.langu('portfolio_title') || 'ملف مقدم الخدمة' : 'ملف مقدم الخدمة';
    const shareTitle = `${merchantLabel}: ${user.business_name || user.username}`;

    // 1. Try Native Bridge first (BridgeManager handles both Android and simulated iOS bridge)
    console.log(" [Share] Intent detected. Checking bridge compatibility...");
    if (window.BridgeManager && window.BridgeManager.isAndroid()) {
        console.info(" [Share] Relaying to Native BridgeManager.");
        window.BridgeManager.share(shareTitle, shareUrl);
    }
    // 2. Try Standard navigator.share (Reliable on mobile browsers)
    else if (navigator.share) {
        console.info(" [Share] Using navigator.share Web API.");
        navigator.share({
            title: shareTitle,
            url: shareUrl
        }).catch(console.error);
    }
    // 3. Fallback: Clipboard
    else {
        console.warn(" [Share] No share API found. Falling back to clipboard.");
        navigator.clipboard.writeText(shareUrl).then(() => {
            const L = (key, fallback) => (typeof window.langu === 'function' ? window.langu(key) : null) || fallback;
            Swal.fire({
                icon: 'success',
                title: L('port_share_copied_title', 'تم نسخ الرابط!'),
                text: L('port_share_copied_text', 'تم نسخ رابط الملف الشخصي للحافظة'),
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 2000,
                customClass: {
                    popup: 'swal-modern-mini-popup'
                }
            });
        });
    }
}

// Global exposure
window.portfolioHandleShare = portfolioHandleShare;
