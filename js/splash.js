/**
 * splash.js - PWA Splash Screen Logic
 * Mirrors Android's SplashImageManager behavior.
 */

(function () {
    // [CRITICAL] Android Isolation: Android uses Native Splash. 
    // Return immediately to avoid redundant logic, timers, and failsafes.
    if (window.Android || (window.BridgeManager && window.BridgeManager.isAndroid())) {
        return;
    }

    window.splashStartTime = performance.now();


    const taglines = {
        ar: [
            "بازار السويس... فرصة واحدة تجمع كل الفرص",
            "اكتشف آلاف المنتجات من موردين موثوقين في السويس",
            "تابع طلبك حتى باب منزلك",
            "عروض وخصومات حصرية من الموردين",
            "جودة مضمونة وتقييم شفاف من المشترين",
            "من المورد للمستهلك مباشرة جودة وسعر أفضل"
        ],
        en: [
            "Suez Bazaar... One opportunity for all opportunities",
            "Discover thousands of products from trusted suppliers in Suez",
            "Track your order to your doorstep",
            "Exclusive offers and discounts from suppliers",
            "Guaranteed quality and transparent buyer reviews",
            "Directly from supplier to consumer - better quality and price"
        ]
    };

    const categories = [
        "Arts & Crafts.webp", "Avon.webp", "Charity Work.webp", "Clothing & Fashion.webp",
        "Events & Gifts.webp", "Food & Beverages.webp", "General Services.webp",
        "Health & Beauty.webp", "Home & Furniture.webp", "Medical Services.webp",
        "My Way.webp", "Oriflame.webp", "Pets.webp", "Real Estate.webp",
        "Sports.webp", "Tech & Electronics.webp", "Vehicles Market.webp", "Wholesalers.webp"
    ];

    function initSplash() {
        console.log("🎬 [Splash] Initializing splash interface...");

        // 1. If running inside Android bridge, remove PWA splash immediately 
        if (window.BridgeManager && window.BridgeManager.isAndroid()) {
            const splash = document.getElementById('pwa-splash-screen');
            if (splash) splash.remove();
            console.log("📱 [Splash] Android environment detected. PWA UI suppressed to favor Native Splash.");
            return;
        }

        const lang = localStorage.getItem('app_language') || 'ar';
        const taglineEl = document.querySelector('.splash-tagline');
        const carouselTrack = document.querySelector('.splash-carousel-track');

        // --- Sequential Logic Implementation ---

        // 1. Tagline Sequence
        let taglineIndex = parseInt(localStorage.getItem('pwa_splash_tagline_idx') || '0');
        const list = taglines[lang] || taglines.ar;
        if (taglineEl) {
            taglineEl.textContent = list[taglineIndex % list.length];
        }
        localStorage.setItem('pwa_splash_tagline_idx', (taglineIndex + 1) % list.length);

        // 2. Image Sequence (Rotation)
        let imageOffset = parseInt(localStorage.getItem('pwa_splash_image_offset') || '0');
        if (carouselTrack) {
            console.log(`🖼️ [Splash] Populating carousel (Offset: ${imageOffset})...`);
            // Rotate the base list based on saved offset
            const baseList = [...categories];
            const rotation = imageOffset % baseList.length;
            const rotatedList = baseList.slice(rotation).concat(baseList.slice(0, rotation));

            // Increment offset for next time (move by 3 to show significantly different start)
            localStorage.setItem('pwa_splash_image_offset', (imageOffset + 3) % baseList.length);

            // Create [A][B][A][B] pattern for 4 sets (Quadruple)
            const displayList = [...rotatedList, ...rotatedList, ...rotatedList, ...rotatedList];

            displayList.forEach(imgName => {
                const item = document.createElement('div');
                item.className = 'splash-carousel-item';
                const img = document.createElement('img');
                img.src = `images/mainCategories/${encodeURIComponent(imgName)}`;
                img.alt = imgName.replace('.webp', '');
                img.onerror = () => console.warn(`[Splash] Failed to load image: ${img.src}`);
                item.appendChild(img);
                carouselTrack.appendChild(item);
            });
        }
    }

    /**
     * Navigates to the home page.
     * Shared by hideSplashScreen and failsafe.
     */
    function performHomeNavigation() {
        if (window.isNavigatingToHome) return;
        window.isNavigatingToHome = true;

        console.log("🏁 [Splash] Navigation trigger: transitioning to home.html.");
        window.location.href = "/pages/home/home.html";
    }

    /**
     * Finalizes the transition from splash screen to main content.
     * Enforces a minimum 4-second duration for PWA.
     * Android transitions immediately to home.html to start loading in background.
     */
    window.hideSplashScreen = function () {
        const isAndroid = window.BridgeManager && window.BridgeManager.isAndroid();
        console.log(`🎬 [Splash] hideSplashScreen triggered. isAndroid: ${isAndroid}`);
        const minDuration = isAndroid ? 0 : 4000;

        const elapsed = performance.now() - window.splashStartTime;
        const remaining = Math.max(0, minDuration - elapsed);

        if (isAndroid) {
            console.log("⚡ [Splash] Android optimized flow: Navigating immediately to avoid blank screen.");
            performHomeNavigation();
            return;
        } else {
            console.log(`✨ [Splash] PWA Flow: Finalizing animation in ${remaining.toFixed(0)}ms.`);
        }

        setTimeout(() => {
            const splash = document.getElementById('pwa-splash-screen');
            if (splash) {
                splash.classList.add('hidden');
                setTimeout(() => {
                    if (splash.parentNode) splash.parentNode.removeChild(splash);
                    performHomeNavigation();
                }, 400);
            } else {
                performHomeNavigation();
            }
        }, remaining);
    };

    // Initialize when DOM is ready but CSS might still be loading
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSplash);
    } else {
        initSplash();
    }

    // [Failsafe] Ensure navigation occurs even if hideSplashScreen is never called
    // 7 seconds max wait time
    setTimeout(() => {
        const splash = document.getElementById('pwa-splash-screen');
        const isHidden = !splash || splash.classList.contains('hidden') || splash.style.display === 'none';

        if (!isHidden) {
            console.warn('[Splash] Failsafe trigger: hiding splash screen forcefully.');
            if (splash) {
                splash.style.display = 'none';
                if (splash.parentNode) splash.parentNode.removeChild(splash);
            }
            performHomeNavigation();
        } else if (window.location.pathname === "/" || window.location.pathname === "/index.html") {
            // If we are still on index.html after 7s, force navigation regardless of splash state
            console.warn('[Splash] Failsafe trigger: still on index.html, forcing navigation.');
            performHomeNavigation();
        }
    }, 7000);
})();
