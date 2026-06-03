/**
 * @file pages/merchant-portfolio/js/core/navigation/navigation-persistence.js
 * @description Logic for saving and loading navigation state to/from storage.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 */

(function () {
    /**
     * Captures and saves the current navigation environment to LocalDBStorage.
     */
    window.portfolioSaveNavigationState = function (userKey) {
        if (!userKey) return;

        // GLOBAL PROTECTION: Block saving if specifically requested (e.g. during refresh)
        if (window.portfolioNavigationSavingBlocked) {
            console.log(`[Diagnostic] NavigationState: SAVE BLOCKED via global flag.`);
            return;
        }

        const currentScroll = Math.round(window.portfolioGetPortfolioScrollY ? window.portfolioGetPortfolioScrollY() : 0);

        // CRITICAL: Protection against overwriting a good saved scroll with 0 during restoration
        if (!window.portfolioNavigationRestorationComplete && currentScroll === 0) {
            console.log(`[Diagnostic] NavigationState: SAVE BLOCKED. Reason: Restoration in progress and currentScroll is 0.`);
            return;
        }

        console.time('[Runtime] NavigationState: Capture');

        const searchState = window.portfolioEnsureSellerSearchState?.() || {};
        const currentSubId = window.pharmacyActiveSubCategoryId || null;

        if (searchState.isActive && typeof window.portfolioSaveSearchStateToLocal === 'function') {
            window.portfolioSaveSearchStateToLocal(userKey);
        }

        // Deep Dive: If a sub-category is active, get its specific visibleCount from persistence
        let subVisibleCount = searchState.visibleCount || 5;
        if (!searchState.isActive && currentSubId && window.portfolioPersistence) {
            const cacheKey = `subcat_${currentSubId}`;
            const subData = window.portfolioPersistence.get(userKey, 'pharmacy_sub_state', cacheKey, 0) || {};
            const activeVisibleCount = Number(window.pharmacyUIBase?.state?.visibleCount);
            if (Number.isFinite(activeVisibleCount) && activeVisibleCount > 0) {
                subData.visibleCount = activeVisibleCount;
            }
            if (currentScroll > 0 || !subData.scrollY) {
                subData.scrollY = currentScroll;
            }
            if (subData.ingredients || subData.visibleCount || subData.scrollY) {
                window.portfolioPersistence.save(userKey, 'pharmacy_sub_state', cacheKey, 0, subData);
            }
            if (subData && subData.visibleCount) {
                subVisibleCount = subData.visibleCount;
            }
        }

        const appState = window.PortfolioStore?.getState ? window.PortfolioStore.getState() : window.portfolioState;

        // Determine correct visible count based on context (Search vs Pharmacy Sub vs Generic)
        let finalVisibleCount = 5;
        if (searchState.isActive) {
            finalVisibleCount = searchState.visibleCount || 5;
        } else if (currentSubId) {
            finalVisibleCount = subVisibleCount; // already resolved for pharmacy sub
        } else {
            // Generic portfolio pagination uses productOffset
            finalVisibleCount = appState?.productOffset || 5;
        }

        const state = {
            userKey,
            activeCategoryId: window.pharmacyActiveCategoryId || null,
            activeSubCategoryId: currentSubId,

            // Search Context
            searchQuery: searchState.query || '',
            searchMainCategory: searchState.mainCategory || '',
            searchSubCategory: searchState.subCategory || '',
            isSearchResult: !!searchState.isActive,
            visibleCount: finalVisibleCount,
            showFeaturedOnly: !!appState?.showFeaturedOnly,

            // Scroll Context
            scroll: currentScroll,
            gridScroll: Math.round(document.getElementById('portfolio-products-grid')?.scrollLeft || 0),
            rowScroll: Math.round(document.getElementById('pharmacy-subcats-row')?.scrollLeft || 0),

            searchTotalMatched: searchState.totalMatched || 0,
            timestamp: Date.now()
        };

        try {
            const stateStr = JSON.stringify(state);
            LocalDBStorage.setItem(window.portfolioGetStorageKey(userKey), stateStr);
            LocalDBSession.setItem('pharmacy_storefront_back_state', stateStr);
            console.timeEnd('[Runtime] NavigationState: Capture');
            console.log(`[Mirror][State] Navigation Context Saved:`, {
                scroll: `${state.scroll}px`,
                subCategory: state.activeSubCategoryId,
                visible: state.visibleCount,
                reason: window.portfolioLastNavSaveReason || 'auto'
            });
        } catch (e) {
            console.warn('[NavigationState] Failed to save state:', e);
        }
    };

    /**
     * Loads the saved navigation environment from LocalDBStorage.
     */
    window.portfolioLoadNavigationState = function (userKey) {
        if (!userKey) return null;
        try {
            const sessionSaved = LocalDBSession.getItem('pharmacy_storefront_back_state');
            if (sessionSaved) {
                const sessionParsed = JSON.parse(sessionSaved);
                if (
                    sessionParsed &&
                    typeof sessionParsed === 'object' &&
                    (!sessionParsed.userKey || String(sessionParsed.userKey) === String(userKey))
                ) {
                    const localParsed = window.portfolioReadLocalNavigationState(userKey);
                    if (window.portfolioImproveRestoredScroll) {
                        window.portfolioImproveRestoredScroll(userKey, sessionParsed, localParsed);
                    }
                    console.log(`[NavigationState] Loaded immediate session state for ${userKey}.`);
                    return sessionParsed;
                }
            }

            const parsed = window.portfolioReadLocalNavigationState(userKey);
            if (!parsed) return null;

            // Invalidate if older than 12 hours for fresh start
            const TTL = 12 * 60 * 60 * 1000;
            if (Date.now() - parsed.timestamp > TTL) {
                console.log(`[NavigationState] Saved state for ${userKey} expired. Skipping.`);
                LocalDBStorage.removeItem(window.portfolioGetStorageKey(userKey));
                return null;
            }

            return window.portfolioImproveRestoredScroll ? window.portfolioImproveRestoredScroll(userKey, parsed, null) : parsed;
        } catch (e) {
            console.error('[NavigationState] Failed to load state:', e);
            return null;
        }
    };

    /**
     * Clears the saved navigation environment.
     */
    window.portfolioClearNavigationState = function (userKey) {
        if (!userKey) return;
        LocalDBStorage.removeItem(window.portfolioGetStorageKey(userKey));
        LocalDBSession.removeItem('pharmacy_storefront_back_state');
    };
})();
