/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */
/**
 * @file pages/merchant-control-panel/js/control-panel-state.js
 * @description State container for the merchant control panel.
 */

(function () {
    'use strict';

    window.MerchantControlPanelState = {
        merchant: null,
        currentUser: null,
        categoryTree: [],
        selectedMainId: '',
        selectedSubId: '',
        products: [],
        offset: 0,
        limit: 5,
        hasMore: false,
        mode: 'category',
        featuredOnly: false,
        featuredIds: new Set(),
        listingType: 'products',
        lockedCategoryFromUrl: false,
        isLoading: false,

        // --- Cache Management ---
        getCacheKey(mainId, subId, mode, userKey) {
            return `mcp_cache_${userKey}_${mainId || 'all'}_${subId || 'all'}_${mode}`;
        },
        saveCache() {
            try {
                if (!this.merchant || !this.merchant.user_key) return;
                const key = this.getCacheKey(this.selectedMainId, this.selectedSubId, this.mode, this.merchant.user_key);
                const data = {
                    products: this.products,
                    offset: this.offset,
                    hasMore: this.hasMore,
                    timestamp: Date.now()
                };
                LocalDBStorage.setItem(key, JSON.stringify(data));
                LocalDBStorage.setItem(`mcp_last_category_${this.merchant.user_key}`, JSON.stringify({
                    mainId: this.selectedMainId,
                    subId: this.selectedSubId,
                    mode: this.mode,
                    featuredOnly: this.featuredOnly,
                    listingType: this.listingType,
                    timestamp: Date.now()
                }));
            } catch (e) {
                console.error('[MerchantControlPanel] Failed to save cache', e);
            }
        },
        loadCache(mainId, subId, mode, userKey) {
            try {
                const key = this.getCacheKey(mainId, subId, mode, userKey);
                const data = LocalDBStorage.getItem(key);
                if (!data) return null;
                const parsed = JSON.parse(data);
                // Expire cache after 1 hour (3600000 ms)
                if (Date.now() - parsed.timestamp > 3600000) return null;
                return parsed;
            } catch (e) {
                return null;
            }
        },
        getLastVisitedCategory(userKey) {
            try {
                const data = LocalDBStorage.getItem(`mcp_last_category_${userKey}`);
                if (!data) return null;
                const parsed = JSON.parse(data);
                if (Date.now() - parsed.timestamp > 3600000) return null;
                return parsed;
            } catch (e) {
                return null;
            }
        }
    };
})();
