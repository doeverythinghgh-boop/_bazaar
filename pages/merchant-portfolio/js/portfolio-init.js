/**
 * @file pages/merchant-portfolio/js/portfolio-init.js
 * @description Entry point for initializing the merchant portfolio page.
 */

/**
 * Initializes the portfolio page logic.
 */
async function initPortfolio() {
    console.log("[Portfolio] Initializing...");

    // 1. Get User Key from URL
    const urlParams = new URLSearchParams(window.location.search);
    const userKey = urlParams.get('user_key');

    if (!userKey) {
        console.error("[Portfolio] No user_key provided in URL.");
        document.getElementById('portfolio-error').style.display = 'block';
        return;
    }

    try {
        // 2. Fetch User Data
        const userData = await portfolioFetchUser(userKey);
        
        if (!userData) {
            throw new Error("User not found");
        }

        // 3. Render Profile
        portfolioRenderProfile(userData);

        // 4. Setup Actions (Share, Rate, Contact)
        portfolioSetupActions(userData);

        // 5. Setup Product Toggle
        const toggleBtn = document.getElementById('btn-toggle-products');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                const grid = document.getElementById('portfolio-products-grid');
                if (grid.style.display === 'none') {
                    grid.style.display = 'grid';
                    toggleBtn.innerHTML = '<i class="fas fa-chevron-up"></i> إخفاء المنتجات';
                    // Fetch products only on first expand if not already loaded
                    if (grid.children.length === 0) {
                        portfolioFetchProducts(userKey);
                    }
                } else {
                    grid.style.display = 'none';
                    toggleBtn.innerHTML = '<i class="fas fa-chevron-down"></i> عرض المنتجات';
                }
            });
        }

        // Show Container
        document.getElementById('portfolio-main-container').style.display = 'flex';

    } catch (error) {
        console.error("[Portfolio] Error:", error);
        document.getElementById('portfolio-error').style.display = 'block';
    }
}

// Export for HTML usage
window.initPortfolio = initPortfolio;
