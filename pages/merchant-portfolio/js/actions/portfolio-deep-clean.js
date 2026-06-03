/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */
/**
 * @file pages/merchant-portfolio/js/actions/portfolio-deep-clean.js
 * @description Provides a deep-cleaning utility to wipe all local/session storage related to a merchant.
 */

(function () {
    /**
     * Performs a comprehensive wipe of all persisted data for the specific merchant and the app's global product state.
     * @param {string} userKey - The merchant's unique key.
     */
    window.portfolioDeepCleanAndReload = async function (userKey) {
        if (!userKey) {
            console.error('[DeepClean] Cannot proceed without userKey.');
            return;
        }

        console.log(`[DeepClean] Starting deep clean for merchant: ${userKey}`);

        try {
            // 1. SCANNED WIPE: Aggressively target anything starting with known prefixes
            const targetPrefixes = [
                'pp_',
                'suez_bazaar_',
                'draft_',
                'pharmacy_',
                'port_',
                'search_',
                'selectedMerchantKey',
                'selectedMainCategory',
                'pendingCategorySearch',
                'pendingSearchQuery',
                'portfolio_cache_'
            ];

            // LocalDBStorage Sweep
            const localToRemove = [];
            for (let i = 0; i < LocalDBStorage.length; i++) {
                const key = LocalDBStorage.key(i);
                if (!key) continue;
                // Target by prefix OR if it contains the specific userKey (merchant-scoped data)
                if (targetPrefixes.some(p => key.startsWith(p)) || key.includes(userKey)) {
                    localToRemove.push(key);
                }
            }
            localToRemove.forEach(k => LocalDBStorage.removeItem(k));

            // LocalDBSession Sweep
            const sessionToRemove = [];
            for (let i = 0; i < LocalDBSession.length; i++) {
                const key = LocalDBSession.key(i);
                if (!key) continue;
                if (targetPrefixes.some(p => key.startsWith(p)) || key.includes(userKey)) {
                    sessionToRemove.push(key);
                }
            }
            sessionToRemove.forEach(k => LocalDBSession.removeItem(k));

            // 2. DOM-DRIVEN WIPE: Reset attributes on the grid itself
            const grid = document.getElementById('portfolio-products-grid');
            if (grid) {
                grid.innerHTML = '';
                if (grid.dataset) {
                    Object.keys(grid.dataset).forEach(dataKey => delete grid.dataset[dataKey]);
                }
            }

            // 3. LOGICAL WIPE: Explicitly call managers if they exist
            if (window.portfolioResetSellerSearch) window.portfolioResetSellerSearch({ closePanel: true });

            const state = window.PortfolioStore?.getState ? window.PortfolioStore.getState() : window.portfolioState;
            if (state && state.sellerSearch) state.sellerSearch = {};
            if (window.portfolioState) window.portfolioState.sellerSearch = {};

            if (window.ProductStateManager?.clear) window.ProductStateManager.clear();
            if (window.PharmacyAPI?.clearCache) window.PharmacyAPI.clearCache();
            if (window.PharmacyRequestCart?.clearMerchant) window.PharmacyRequestCart.clearMerchant(userKey);
            if (window.portfolioPersistence?.clearMerchant) window.portfolioPersistence.clearMerchant(userKey);

            // 4. HISTORY WIPE: Reset history state to prevent restoration from popstate
            if (window.history && window.history.replaceState) {
                window.history.replaceState({}, '', window.location.href);
            }

            console.log(`[DeepClean] Nuclear purge complete for merchant: ${userKey}. Reloading...`);

            // 5. Hard Reload
            window.location.reload(true);

        } catch (error) {
            console.error('[DeepClean] Error during cleaning process:', error);
            // Even on error, try to reload to recover state
            window.location.reload();
        }
    };
})();
