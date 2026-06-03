/**
 * @file pages/merchant-portfolio/js/portfolio-search-controls.js
 * @description Merchant search state toggling and control logic.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


window.portfolioResetSellerSearch = function (options) {
    const settings = options || {};
    const searchState = window.portfolioEnsureSellerSearchState();
    const store = window.PortfolioStore || null;
    const resetPatch = {
        query: '',
        mainCategory: '',
        subCategory: '',
        sort: 'default',
        isActive: false,
        appliedQuery: '',
        appliedMainCategory: '',
        appliedSubCategory: '',
        appliedSort: 'default',
        results: [],
        totalMatched: 0,
        visibleCount: 0
    };

    if (settings.closePanel) {
        resetPatch.isOpen = false;
    }

    if (store?.patchSellerSearch) {
        store.patchSellerSearch(resetPatch, { source: 'merchant-search-reset' });
    } else {
        Object.assign(searchState, resetPatch);
    }

    const elements = window.portfolioGetSellerSearchTriggerElements();
    if (elements.panel) {
        elements.panel.style.display = window.portfolioEnsureSellerSearchState().isOpen ? 'flex' : 'none';
        if (elements.inputField) elements.inputField.value = '';
        if (window.portfolioEnsureSellerSearchState().isOpen && elements.inputField) {
            setTimeout(() => elements.inputField.focus(), 100);
        }
    }

    const state = store?.getState ? store.getState() : window.portfolioState;
    window.portfolioUpdateSellerSearchTriggerDisplays(state?.activeUser);
    window.portfolioUpdateSellerSearchMeta();
    window.portfolioUpdateSellerSearchButtonState();
    window.portfolioRestoreDefaultProductGrid();
};

window.portfolioCloseSellerSearchPanelSafely = function () {
    const searchState = window.portfolioEnsureSellerSearchState();
    if (!searchState.isOpen) return;

    const store = window.PortfolioStore || null;
    const elements = window.portfolioGetSellerSearchTriggerElements();

    if (store?.patchSellerSearch) {
        store.patchSellerSearch({ isOpen: false }, { source: 'merchant-search-autoclose' });
    } else {
        searchState.isOpen = false;
    }

    if (elements.panel) {
        elements.panel.style.display = 'none';
    }

    window.portfolioUpdateSellerSearchButtonState();
};

window.portfolioToggleSellerSearchPanel = function (user) {
    const searchState = window.portfolioEnsureSellerSearchState();
    const store = window.PortfolioStore || null;
    const elements = window.portfolioGetSellerSearchTriggerElements();
    if (!elements.panel) return;

    if (searchState.isOpen) {
        // Just close the panel, don't reset the search results
        if (store?.patchSellerSearch) {
            store.patchSellerSearch({ isOpen: false }, { source: 'merchant-search-toggle' });
        } else {
            searchState.isOpen = false;
        }
        elements.panel.style.display = 'none';
    } else {
        // Open the panel
        if (store?.patchSellerSearch) {
            store.patchSellerSearch({ isOpen: true }, { source: 'merchant-search-toggle' });
        } else {
            searchState.isOpen = true;
        }
        elements.panel.style.display = 'flex';
        // Auto-focus input
        if (elements.inputField) {
            setTimeout(() => elements.inputField.focus(), 100);
        }
    }

    window.portfolioUpdateSellerSearchTriggerDisplays(user);
    window.portfolioUpdateSellerSearchMeta();
    window.portfolioUpdateSellerSearchButtonState();
};

window.portfolioRefreshSellerSearchControls = function (user) {
    window.portfolioUpdateSellerSearchTriggerDisplays(user);
    window.portfolioUpdateSellerSearchMeta();
    window.portfolioUpdateSellerSearchButtonState();
    window.portfolioSyncSearchLoadMoreButton();
};

window.portfolioRefreshSellerSearch = function () {
    const state = window.PortfolioStore?.getState ? window.PortfolioStore.getState() : window.portfolioState;
    if (!state?.activeUser) return;
    window.portfolioRefreshSellerSearchControls(state.activeUser);
};

window.portfolioExitSellerSearch = function () {
    const searchState = window.portfolioEnsureSellerSearchState();
    const userKey = new URLSearchParams(window.location.search).get('user_key');
    const store = window.PortfolioStore || null;

    console.log(`[Search] Exiting search mode. Preserving query: "${searchState.query}"`);

    // 1. Reset active search state but KEEP the 'query' text for the user
    const patch = {
        isActive: false,
        appliedQuery: '',
        appliedMainCategory: '',
        appliedSubCategory: '',
        appliedSort: 'default',
        results: [],
        totalMatched: 0,
        visibleCount: 0
    };

    if (store?.patchSellerSearch) {
        store.patchSellerSearch(patch, { source: 'merchant-search-exit' });
    }

    // Also update memory state directly to ensure immediate consistency
    Object.assign(searchState, patch);

    // --- RESTORE PRE-SEARCH NAVIGATION STATE ---
    let preNav = window.portfolioPreSearchNavState;

    // If not in memory (e.g. after page reload), try loading from persistent storage
    if (!preNav && typeof window.portfolioLoadPreSearchStateFromLocal === 'function') {
        preNav = window.portfolioLoadPreSearchStateFromLocal(userKey);
        console.log(`[Search] Pre-search state loaded from persistent storage.`, preNav);
    }

    if (preNav) {
        window.pharmacyActiveCategoryId = null;
        window.pharmacyActiveSubCategoryId = null; // Clear briefly to allow re-render
        window.pharmacyRestoringState = {
            activeCategoryId: preNav.activeCategoryId,
            activeSubCategoryId: preNav.activeSubCategoryId,
            productsTitleHtml: preNav.productsTitleHtml,
            showFeaturedOnly: preNav.showFeaturedOnly,
            visibleCount: preNav.visibleCount,
            gridScroll: preNav.gridScroll,
            rowScroll: preNav.rowScroll,
            scroll: preNav.scroll ?? preNav.scrollY,
            scrollX: preNav.scrollX,
            scrollY: preNav.scrollY
        };
        // Update the window object too for future calls
        window.portfolioPreSearchNavState = preNav;
        console.log(`[Search] Restoring pre-search state:`, preNav);
    } else {
        window.pharmacyActiveCategoryId = null;
        window.pharmacyActiveSubCategoryId = null;
        window.pharmacyRestoringState = null;
    }

    // 2. Clear from persistence so it doesn't restore on page return/reload
    if (typeof window.portfolioClearSearchStateFromLocal === 'function') {
        window.portfolioClearSearchStateFromLocal(userKey);
    }

    // 4. Restore Default View
    if (typeof window.portfolioRestoreDefaultProductGrid === 'function') {
        window.portfolioRestoreDefaultProductGrid(preNav || null);
    }

    // 4. Update UI Elements
    const state = store?.getState ? store.getState() : window.portfolioState;
    if (typeof window.portfolioUpdateSellerSearchTriggerDisplays === 'function') {
        window.portfolioUpdateSellerSearchTriggerDisplays(state?.activeUser);
    }

    if (typeof window.portfolioUpdateSellerSearchButtonState === 'function') {
        window.portfolioUpdateSellerSearchButtonState();
    }

    // Hide the Exit Search button itself
    const exitBtn = document.getElementById('btn-portfolio-refresh');
    if (exitBtn) {
        exitBtn.style.display = 'none';
    }

    // Sync Load More Button
    if (typeof window.portfolioSyncSearchLoadMoreButton === 'function') {
        window.portfolioSyncSearchLoadMoreButton();
    }

    setTimeout(() => {
        if (typeof window.portfolioSaveNavigationState === 'function') {
            window.portfolioSaveNavigationState(userKey);
        }
        if (typeof window.portfolioClearPreSearchStateFromLocal === 'function') {
            window.portfolioClearPreSearchStateFromLocal(userKey);
        }
        window.portfolioPreSearchNavState = null;
    }, 250);
};
