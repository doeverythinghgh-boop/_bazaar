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

    window.PharmacyProductManagerModule.state.sync = {
        /**
         * Resolves which sub-category a product ID belongs to using the shared index
         */
        resolveSubCategory: function(productId) {
            const resolved = state.subCategoryIndex?.[String(productId)];
            if (resolved) return String(resolved);

            // Fallback: search DOM counters if index is missing
            const allCounters = document.querySelectorAll('.btn-product-counter');
            for (const counter of allCounters) {
                const subId = counter.id.replace('product-counter-', '');
                if (String(productId).startsWith(subId)) return subId;
            }
            return null;
        },

        /**
         * Counts how many products in a sub-category are currently hidden
         */
        countHiddenProducts: function(subId, hiddenProductSet) {
            return Array.from(hiddenProductSet).filter(productId => {
                const mappedSubId = state.subCategoryIndex?.[String(productId)];
                return String(mappedSubId || '') === String(subId) || String(productId).startsWith(String(subId));
            }).length;
        },

        /**
         * Updates the badge counter in the main categories UI
         */
        updateCounterUI: function(subId, hiddenProductSet) {
            const hiddenCount = this.countHiddenProducts(subId, hiddenProductSet);
            const counterEl = document.getElementById(`product-counter-${subId}`);
            const manageBtn = document.getElementById(`btn-manage-${subId}`);

            if (hiddenCount > 0) {
                if (counterEl) {
                    counterEl.textContent = '-' + hiddenCount;
                } else if (manageBtn) {
                    const newCounter = document.createElement('span');
                    newCounter.className = 'btn-product-counter';
                    newCounter.id = `product-counter-${subId}`;
                    newCounter.textContent = '-' + hiddenCount;
                    manageBtn.appendChild(newCounter);
                }
            } else if (counterEl) {
                counterEl.remove();
            }
        }
    };
    console.log("[Pharmacy-Manager] State Sync loaded.");
})();
