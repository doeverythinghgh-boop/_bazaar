/**
 * @file portfolio-init-restoration.js
 * @description State and scroll restoration logic for merchant portfolio initialization.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

window.portfolioRestoreNavigationState = function(userKey) {
    try {
        const savedState = window.portfolioLoadNavigationState ? window.portfolioLoadNavigationState(userKey) : null;
        if (savedState) {
            window.pharmacyRestoringState = savedState;
            // Guard: prevent resetSpecialtyRuntime from hiding the section during restoration
            window.__portfolioRestorationActive = true;
            window.__portfolioRestorationSnapshot = savedState; // Backup before cleanup may wipe it
            window.portfolioNavigationRestorationComplete = false; // Block saving during restoration phase
            console.log(`[Diagnostic] Persistent Navigation State found. Restoring:`, {
                categoryId: savedState.activeCategoryId,
                subId: savedState.activeSubCategoryId,
                visible: savedState.visibleCount,
                scroll: savedState.scroll,
                isSearchResult: savedState.isSearchResult
            });

            // PRE-INFLATE GRID HEIGHT FOR SCROLL RESTORATION:
            const prodSec = document.getElementById('portfolio-products-section');
            if (prodSec) {
                prodSec.style.display = 'block';
                console.log('[Diagnostic] portfolio-products-section pre-shown for restoration.');
            }
            if (savedState.scroll && savedState.scroll > 0) {
                const grid = document.getElementById('portfolio-products-grid');
                if (grid) {
                    const estimatedCardHeight = 180; // height of a typical card row
                    const count = Number(savedState.visibleCount) || 5;
                    const reservedHeight = estimatedCardHeight * count;
                    grid.style.minHeight = `${reservedHeight}px`;
                    console.log(`[Diagnostic] Pre-inflated portfolio grid height to ${reservedHeight}px for scroll restoration.`);
                }
            }

            // Sync with search state
            if (typeof window.portfolioEnsureSellerSearchState === 'function') {
                const searchState = window.portfolioEnsureSellerSearchState();
                if (savedState.searchQuery) searchState.query = savedState.searchQuery;
                if (savedState.searchMainCategory) searchState.mainCategory = savedState.searchMainCategory;
                if (savedState.searchSubCategory) searchState.subCategory = savedState.searchSubCategory;
            }
            return savedState;
        } else {
            console.log(`[Diagnostic] No persistent navigation state found for ${userKey}.`);
        }
    } catch (e) {
        console.error('[Diagnostic] Navigation state restoration failure:', e);
    }
    return null;
};

window.portfolioHandlePostRenderRestoration = function(userRes) {
    try {
        // Use backup snapshot in case pharmacyRestoringState was cleared by resetSpecialtyRuntime
        const restorationSource = window.pharmacyRestoringState || window.__portfolioRestorationSnapshot;

        if (restorationSource) {
            const parsed = restorationSource;
            // Ensure pharmacyRestoringState is set for any downstream consumers
            if (!window.pharmacyRestoringState) {
                window.pharmacyRestoringState = parsed;
                console.log('[Diagnostic] Restored pharmacyRestoringState from backup snapshot.');
            }
            console.log(`[Diagnostic] portfolio-init entering post-render restoration block. State exists in window.`);
            // Clear from storage so refresh doesn't trigger it again, but KEEP in window for components to use.
            LocalDBSession.removeItem('pharmacy_storefront_back_state');

            // Re-assert section visibility since resetSpecialtyRuntime may have hidden it
            const prodSecRestore = document.getElementById('portfolio-products-section');
            if (prodSecRestore && prodSecRestore.style.display === 'none') {
                prodSecRestore.style.display = 'block';
                console.log('[Diagnostic] Re-asserted portfolio-products-section visibility after cleanup.');
            }
            console.log(`[Diagnostic] LocalDBSession entry cleared.`);

            // 0. Restore Featured State
            if (parsed.showFeaturedOnly !== undefined) {
                const state = window.PortfolioStore?.getState ? window.PortfolioStore.getState() : window.portfolioState;
                if (state) {
                    state.showFeaturedOnly = !!parsed.showFeaturedOnly;
                    const toggle = document.getElementById('filter-featured-toggle-switch');
                    if (toggle) {
                        if (state.showFeaturedOnly) toggle.classList.add('active');
                        else toggle.classList.remove('active');
                    }
                }
            }

            // 1. Restore Search Query
            if (parsed.isSearchResult === true) {
                // Do not auto-click categories if we are restoring a search result
                parsed.activeCategoryId = null;
                parsed.activeSubCategoryId = null;

                // Trigger search execution to bring back results
                if (userRes && typeof window.portfolioExecuteSellerSearch === 'function') {
                    console.log(`[Scroll Debug] (Init) Triggering search execution to restore search results...`);
                    // Small delay to ensure rendering finished
                    setTimeout(() => window.portfolioExecuteSellerSearch(userRes), 150);
                }
            }

            // 2. Restore Scroll Position (Universal restoration)
            if (parsed.scroll !== undefined && parsed.scroll !== null && parsed.scroll > 0) {
                const targetScroll = parsed.scroll;
                let attempts = 0;
                console.log(`[Diagnostic] Starting universal scroll restoration interval to: ${targetScroll}px`);
                const scrollInterval = setInterval(() => {
                    const productsSection = document.getElementById('portfolio-products-section');
                    const grid = document.getElementById('portfolio-products-grid');
                    const docHeight = document.documentElement.scrollHeight;
                    const viewportHeight = window.innerHeight;

                    window.scrollTo({ top: targetScroll, behavior: 'instant' });
                    document.documentElement.scrollTop = targetScroll;
                    document.body.scrollTop = targetScroll;

                    const currentScroll = Math.round(document.documentElement.scrollTop || document.body.scrollTop || window.scrollY || 0);

                    const diff = Math.abs(currentScroll - targetScroll);
                    const isAtTarget = diff < 15;
                    const isPageTallEnough = docHeight >= (targetScroll + (viewportHeight / 2));

                    if (isAtTarget) {
                        console.log(`[Mirror][Success] Scroll restoration COMPLETE on attempt ${attempts + 1}. Final Position: ${currentScroll}px.`);
                        window.portfolioNavigationRestorationComplete = true;
                        window.__portfolioRestorationActive = false;
                        window.__portfolioRestorationSnapshot = null;
                        if (grid) grid.style.minHeight = '';
                        clearInterval(scrollInterval);
                    } else if (attempts >= 40) { // Increased to 40 attempts (4 seconds)
                        console.warn(`[Mirror][Failure] Scroll restoration ABORTED after 4s. Reason: Final mismatch.`, {
                            target: `${targetScroll}px`,
                            actual: `${currentScroll}px`,
                            diff: `${diff}px`,
                            isPageTallEnough,
                            docHeight: `${docHeight}px`,
                            productsFound: !!grid && grid.children.length > 0
                        });
                        window.portfolioNavigationRestorationComplete = true;
                        window.__portfolioRestorationActive = false;
                        window.__portfolioRestorationSnapshot = null;
                        if (grid) grid.style.minHeight = '';
                        clearInterval(scrollInterval);
                    } else if (attempts % 5 === 0) {
                        console.log(`[Mirror][Progress] Restoring scroll... Attempt ${attempts + 1}: Current=${currentScroll}px, Target=${targetScroll}px (Page Height: ${docHeight}px)`);
                    }
                    attempts++;
                }, 100);
            } else {
                console.log(`[Mirror][Skip] No scroll restoration needed (Target is 0 or null).`);
                window.portfolioNavigationRestorationComplete = true;
                window.__portfolioRestorationActive = false;
                window.__portfolioRestorationSnapshot = null;
            }
        } else {
            window.portfolioNavigationRestorationComplete = true; // No saved state
        }
    } catch (e) {
        console.warn('[Portfolio] State restoration failed:', e);
        window.portfolioNavigationRestorationComplete = true; // Ensure saving is unblocked on error
        window.__portfolioRestorationActive = false;
        window.__portfolioRestorationSnapshot = null;
    }
};
