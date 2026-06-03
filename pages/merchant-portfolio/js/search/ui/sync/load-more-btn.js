/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

window.portfolioSyncSearchLoadMoreButton = function () {
    const searchState = window.portfolioEnsureSellerSearchState();
    const elements = window.portfolioGetSellerSearchTriggerElements();
    const state = window.PortfolioStore?.getState ? window.PortfolioStore.getState() : window.portfolioState;
    const userKey = new URLSearchParams(window.location.search).get('user_key');
    const actionsContainer = document.getElementById('portfolio-products-actions');

    const setActionsVisible = (isVisible) => {
        if (actionsContainer) actionsContainer.style.display = isVisible ? 'flex' : 'none';
    };

    // --- SYNC EXIT SEARCH BUTTON (btn-portfolio-refresh) ---
    const EXIT_BTN_ID = 'btn-portfolio-refresh';
    const allRefreshBtns = document.querySelectorAll(`#${EXIT_BTN_ID}`);

    // Defensive check: if multiple buttons with same ID exist, clean them up to fix duplication
    if (allRefreshBtns.length > 1) {
        console.warn(`[Portfolio][Search] Detected ${allRefreshBtns.length} duplicate exit buttons. Cleaning up.`);
        for (let i = 1; i < allRefreshBtns.length; i++) {
            allRefreshBtns[i].remove();
        }
    }

    let exitBtn = document.getElementById(EXIT_BTN_ID);
    if (!exitBtn) {
        if (actionsContainer) {
            console.log("[Portfolio][Search] Injecting Exit Search button defensively.");
            actionsContainer.insertAdjacentHTML('beforeend', `
                <button id="${EXIT_BTN_ID}" class="glass-btn sm-btn" data-lkey="exit_search" style="display: none;">
                    <i id="${EXIT_BTN_ID}-icon" class="fas fa-arrow-left"></i> 
                    <span id="${EXIT_BTN_ID}-text"></span>
                </button>
            `);
            exitBtn = document.getElementById(EXIT_BTN_ID);
            if (exitBtn) {
                exitBtn.onclick = () => {
                    if (typeof window.portfolioExitSellerSearch === 'function') {
                        window.portfolioExitSellerSearch();
                    }
                };
            }
        }
    }

    if (exitBtn) {
        exitBtn.style.display = searchState.isActive ? 'flex' : 'none';

        // Fix "strange attributes" by forcing classes and syncing text every time
        if (!exitBtn.classList.contains('glass-btn')) exitBtn.classList.add('glass-btn');
        if (!exitBtn.classList.contains('sm-btn')) exitBtn.classList.add('sm-btn');

        const textEl = document.getElementById(`${EXIT_BTN_ID}-text`);
        if (textEl) {
            textEl.textContent = (typeof window.portfolioSellerSearchL === 'function')
                ? window.portfolioSellerSearchL('exit_search', 'الخروج من البحث', 'Exit Search')
                : 'Exit Search';
        }
    }

    if (!elements.loadMoreButton) {
        setActionsVisible(!!searchState.isActive);
        return;
    }

    // If global search is active, the search logic always wins
    if (searchState.isActive) {
        const hasMoreSearchResults = searchState.visibleCount < searchState.totalMatched;
        setActionsVisible(true);
        elements.loadMoreButton.style.display = hasMoreSearchResults ? 'flex' : 'none';
        elements.loadMoreButton.disabled = searchState.isLoading;
        elements.loadMoreButton.innerHTML = searchState.isLoading
            ? `${window.portfolioSellerSearchL('search_loading_status', 'جاري التحميل...', 'Loading...')} <i class="fas fa-spinner fa-spin"></i>`
            : window.portfolioSellerSearchL('search_modal_load_more', 'عرض المزيد', 'Load More');
        return;
    }

    // CRITICAL: If a pharmacy sub-category is active or we are in the middle of a restoration,
    if (window.pharmacyActiveSubCategoryId || window.pharmacyRestoringState?.activeSubCategoryId) {
        const subPagination = window.portfolioGetActivePharmacySubPagination(userKey);
        if (subPagination) {
            setActionsVisible(subPagination.hasMore);
            elements.loadMoreButton.style.display = subPagination.hasMore ? 'flex' : 'none';
            elements.loadMoreButton.disabled = false;
            elements.loadMoreButton.innerHTML = window.portfolioSellerSearchL('search_modal_load_more', '\u0639\u0631\u0636 \u0627\u0644\u0645\u0632\u064a\u062f', 'Load More');
            return;
        }
        return;
    }

    const shouldShowDefaultLoadMore = !!state?.hasMoreProducts;
    setActionsVisible(shouldShowDefaultLoadMore);
    elements.loadMoreButton.style.display = shouldShowDefaultLoadMore ? 'flex' : 'none';
    elements.loadMoreButton.disabled = false;
    elements.loadMoreButton.innerHTML = window.portfolioSellerSearchL('search_modal_load_more', 'عرض المزيد', 'Load More');
};
