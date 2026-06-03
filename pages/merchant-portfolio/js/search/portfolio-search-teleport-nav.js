/**
 * @file pages/merchant-portfolio/js/portfolio-search-teleport-nav.js
 * @description Specialized navigation and state preservation for pharmacy teleportation.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


window.portfolioPharmacyTeleport = async function (item) {
    console.log(`[Pharmacy Search] Instant navigation triggered - skipping teleport effects.`);

    // 1. Highlight Main Category Card (Visual Only) - DISABLED
    /*
    const grid = document.getElementById('portfolio-products-grid');
    let targetMainTitle = ...;
    ...
    */

    // 2. Fetch the category object to render subcategories silently - DISABLED visual part
    // But we might need the object if we wanted to maintain some state

    // 4. Cleanup UI but KEEP the search results in the container
    window.portfolioCloseSellerSearchPanelSafely();

    // 5. Navigate to Standalone Page IMMEDIATELY (No 1.5s delay, no visual teleport)
    // Prepare metadata for navigation
    const merchant = window.portfolioState?.activeUser || {};

    const grid = document.getElementById('portfolio-products-grid');
    const row = document.getElementById('pharmacy-subcats-row');

    // Save current storefront state for the 'Back' button
    const currentScroll = document.documentElement.scrollTop || document.body.scrollTop || window.scrollY || 0;
    console.log(`[Scroll Debug] Leaving via Instant Navigation. Saving Vertical Scroll: ${currentScroll}px`);

    let searchQ = '';
    let searchMain = '';
    let searchSub = '';
    if (typeof window.portfolioEnsureSellerSearchState === 'function') {
        const ss = window.portfolioEnsureSellerSearchState();
        searchQ = ss.query || '';
        searchMain = ss.mainCategory || '';
        searchSub = ss.subCategory || '';
    }

    const storefrontState = {
        userKey: merchant.user_key || null,
        scroll: currentScroll,
        gridScroll: grid ? grid.scrollLeft : 0,
        rowScroll: row ? row.scrollLeft : 0,
        searchQuery: searchQ,
        searchMainCategory: searchMain,
        searchSubCategory: searchSub,
        activeCategory: window.portfolioState?.activeCategory || null,
        activeSubCategory: window.portfolioState?.activeSubCategory || null,
        activeCategoryId: window.pharmacyActiveCategoryId || null,
        activeSubCategoryId: window.pharmacyActiveSubCategoryId || null,
        visibleCount: window.pharmacyUIBase?.state?.visibleCount || 5,
        isSearchResult: true,
        timestamp: Date.now()
    };
    LocalDBSession.setItem('pharmacy_storefront_back_state', JSON.stringify(storefrontState));
    if (typeof window.portfolioSaveNavigationState === 'function') {
        window.portfolioSaveNavigationState(merchant.user_key);
    }

    // Save product and merchant data for instant hydration
    LocalDBSession.setItem(`pharmacy_view_${item.id}`, JSON.stringify({ item, merchant }));

    // Navigate
    window.location.href = window.ProductRoutes?.buildProductViewUrl
        ? window.ProductRoutes.buildProductViewUrl({ product_key: item.id, user_key: merchant.user_key, pharmacy_metadata: true }, { pharmacy: true })
        : `/pages/products/productView/productView.html?product_key=${encodeURIComponent(item.id)}&provider_key=${encodeURIComponent(merchant.user_key)}&pharmacy=1`;
};
