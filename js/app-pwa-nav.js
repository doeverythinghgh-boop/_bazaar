/**
 * @file js/app-pwa-nav.js
 * @description Manages the bottom navigation bar for iOS PWA Standalone mode.
 * Provides intelligent Back/Forward history navigation.
 * @version 1.0.0
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

/**
 * @function isIOSStandalone
 * @description Detects if the app is running on iOS in standalone (PWA) mode.
 * @returns {boolean}
 */
export function isIOSStandalone() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isStandalone = window.navigator.standalone === true;
    return isIOS && isStandalone;
}

/**
 * @function updateNavStates
 * @description Updates the visual state of back/forward buttons based on history.
 * @param {HTMLElement} backBtn
 * @param {HTMLElement} forwardBtn
 */
export function updateNavStates(backBtn, forwardBtn) {
    if (!backBtn || !forwardBtn) return;

    // In a PWA, history.length is our best indicator.
    // If length > 1, user can likely go back.
    if (window.history.length <= 1) {
        backBtn.classList.add('disabled');
    } else {
        backBtn.classList.remove('disabled');
    }

    // Forward state is harder to determine in JS for security reasons,
    // but we keep the button active so the user can try if they just went back.
    forwardBtn.classList.remove('disabled');
}

/**
 * @function initPWANav
 * @description Injects and initializes the navigation bar.
 */
export function initPWANav() {
    if (window.AppBehavior && window.AppBehavior.enablePWA === false) {
        return;
    }

    if (!isIOSStandalone()) {
        console.log("[PWA Nav] Not an iOS Standalone environment. Skipping navigation bar injection.");
        return;
    }

    console.log("[PWA Nav] iOS Standalone mode detected. Building navigation system...");

    // 1. Determine direction for icons
    const isRTL = document.documentElement.dir === 'rtl' || document.body.dir === 'rtl';

    // In Arabic (RTL):
    // Back = Right arrow (points to where we came from)
    // Forward = Left arrow (points to where we were going)
    const backIcon = isRTL ? 'fa-chevron-right' : 'fa-chevron-left';
    const forwardIcon = isRTL ? 'fa-chevron-left' : 'fa-chevron-right';

    // 2. Build HTML
    const navHTML = `
        <div id="pwa-ios-nav" role="navigation" aria-label="PWA Navigation">
            <button id="pwa-forward-btn" class="pwa-nav-btn" aria-label="Forward">
                <i class="fas ${forwardIcon}"></i>
            </button>
            <button id="pwa-back-btn" class="pwa-nav-btn" aria-label="Back">
                <i class="fas ${backIcon}"></i>
            </button>
        </div>
    `;

    // 3. Inject into DOM
    document.body.insertAdjacentHTML('beforeend', navHTML);
    document.body.classList.add('pwa-ios-standalone');

    const navBar = document.getElementById('pwa-ios-nav');
    if (navBar) navBar.style.display = 'flex';

    const backBtn = document.getElementById('pwa-back-btn');
    const forwardBtn = document.getElementById('pwa-forward-btn');

    // 4. Attach Listeners
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.history.back();
        });
    }

    if (forwardBtn) {
        forwardBtn.addEventListener('click', () => {
            window.history.forward();
        });
    }

    // 5. Initial State Check
    updateNavStates(backBtn, forwardBtn);

    // 6. Listen for history changes
    window.addEventListener('popstate', () => updateNavStates(backBtn, forwardBtn));

    // Re-check periodically as some SPA-like navigations don't trigger popstate
    setInterval(() => updateNavStates(backBtn, forwardBtn), 1000);
}

// Initialize on load if in module context (auto-run for PWA)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPWANav);
} else {
    initPWANav();
}

// Hybrid bridge
window.isIOSStandalone = isIOSStandalone;
window.updateNavStates = updateNavStates;
window.initPWANav = initPWANav;

console.log("[ESM Load] app-pwa-nav.js: Hybrid bridge established.");
