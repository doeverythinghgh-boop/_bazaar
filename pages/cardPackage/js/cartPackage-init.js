/**
 * @file pages/cardPackage/js/cartPackage-init.js
 * @description Initialization logic for the Cart/Package page.
 * Handles loading of resources, initializing modules, and managing the loader.
 */

async function cartPackage_initContent() {
    const initStartTime = performance.now();
    console.log("🚀 [Cart] Starting content initialization...");

    const loaderElement = document.getElementById("loader-container");
    const contentLayout = document.getElementById("cartPage_cartLayout");
    const emptyCartState = document.getElementById("cartPage_emptyCart");

    // Ensure loader is visible and content is hidden initially
    if (loaderElement) loaderElement.style.display = "block";
    if (contentLayout) contentLayout.style.display = "none";
    if (emptyCartState) emptyCartState.style.display = "none";

    try {
        // Step 1: Wait for essential scripts/modules if they are async loaded 
        // (In this case, they are defer scripts, so they should be ready on DOMContentLoaded, 
        // but we can simulate a check or wait for specific data if needed).

        // Simulating a delay or wait for "all files" logic if strictly needed, 
        // but since scripts are 'defer', we proceed to logic initialization.

        // Step 2: Initialize Cart Logic
        console.log("⚙️ [Cart] Initializing cart modules...");

        // Initialize Events
        if (typeof cartPage_setupEventListeners === 'function') {
            cartPage_setupEventListeners();
            console.log("   - Events initialized.");
        }

        // Load Delivery Config (Changes: This is usually async)
        if (typeof DeliveryConfigLoader !== 'undefined') {
            console.log("   - Loading Delivery Configuration...");
            await DeliveryConfigLoader.load();
        }

        // Render Cart (This calculates totals, checks empty state, etc.)
        if (typeof cartPage_loadCart === 'function') {
            console.log("   - Rendering Cart Items...");
            await cartPage_loadCart();
        }

        // Check Cart State to toggle visibility
        const cartCount = typeof getCartItemCount === 'function' ? getCartItemCount() : 0;

        // Slight delay to ensure DOM painting or just valid "loading" feel as requested "until all files loaded"
        // Since 'defer' scripts run before this, we are effectively waiting for logic to complete.

        console.log("🌍 [Cart] Re-applying translations...");
        if (typeof applyAppTranslations === 'function') {
            applyAppTranslations();
        }

        // Step 3: Show Content
        if (cartCount > 0) {
            if (contentLayout) contentLayout.style.display = "grid"; // or flex/grid based on CSS
            if (emptyCartState) emptyCartState.style.display = "none";
        } else {
            // Cart is empty
            if (contentLayout) contentLayout.style.display = "none";
            if (emptyCartState) emptyCartState.style.display = "block";
        }

        console.log(`✅ [Cart] Ready in ${(performance.now() - initStartTime).toFixed(0)}ms.`);

    } catch (error) {
        console.error("❌ [Cart] Initialization failed:", error);
        // Show error state or empty cart by default
        if (emptyCartState) emptyCartState.style.display = "block";
    } finally {
        // Hide Loader
        if (loaderElement) loaderElement.style.display = "none";
    }
}

document.addEventListener('DOMContentLoaded', async function () {
    // 1. Theme
    if (typeof initAppTheme === 'function') initAppTheme();

    // 2. Translations
    if (typeof loadIndexTranslations === 'function') {
        await window.loadIndexTranslations();
    }

    // 3. Session
    if (typeof SessionManager !== 'undefined') {
        SessionManager.init();
    }

    // 4. Header
    if (typeof AppHeader !== 'undefined' && AppHeader.init) {
        await AppHeader.init('header-injection-point', 'index-cart-btn');
    }

    // 5. Apply Trans
    if (typeof applyAppTranslations === 'function') {
        applyAppTranslations();
    }

    // 6. Init Cart Page Content
    await cartPackage_initContent();
});
