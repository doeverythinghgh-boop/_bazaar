/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */
(function() {
    if (!window.PharmacyProductManagerModule) return;
    const { state } = window.PharmacyProductManagerModule;

    window.PharmacyProductManagerModule.handlers.toggleVisibility = function(productId, isVisible) {
        console.log(`[Pharmacy-Swal-Diagnostic] Visibility toggle request. Product=${productId}, NewState=${isVisible ? 'Visible' : 'Hidden'}`);
        const globalState = window.globalPreferenceState;
        if (!globalState) {
            console.warn(`[Pharmacy-Swal-Diagnostic] Visibility toggle aborted: globalPreferenceState missing.`);
            return false;
        }

        const normalizedId = String(productId);
        if (!isVisible) globalState.hidden_catalog_products.add(normalizedId);
        else globalState.hidden_catalog_products.delete(normalizedId);

        // ASYNC TASK: Offload UI counter updates and storage persistence to prevent main thread blocking
        setTimeout(() => {
            try {
                console.log(`[Pharmacy-Swal-Diagnostic] Background Task: Syncing state for Product=${normalizedId}`);
                
                // 1. Update UI counters in main page
                const subId = window.PharmacyProductManagerModule.state.sync.resolveSubCategory(normalizedId);
                if (subId) {
                    window.PharmacyProductManagerModule.state.sync.updateCounterUI(subId, globalState.hidden_catalog_products);
                }

                // 2. Persistent State Handling
                if (window.pharmacySetDirtyState) {
                    const userKey = new URLSearchParams(window.location.search).get('user_key');
                    const isDirty = window.pharmacyIsStateDirty(globalState);

                    LocalDBStorage.setItem(`pharmacy_pending_prefs_${userKey}`, JSON.stringify({
                        hidden_main_categories: Array.from(globalState.hidden_main_categories),
                        hidden_sub_categories: Array.from(globalState.hidden_sub_categories),
                        hidden_catalog_products: Array.from(globalState.hidden_catalog_products)
                    }));

                    window.pharmacySetDirtyState(isDirty, globalState, userKey);
                }
                console.log(`[Pharmacy-Swal-Diagnostic] Background Task: Sync complete.`);
            } catch (error) {
                console.error(`[Pharmacy-Swal-Diagnostic] Background Task Error during visibility sync:`, error);
            }
        }, 0);

        return true;
    };
    console.log("[Pharmacy-Manager] Visibility Handler loaded.");
})();
