/**
 * @file search-init.js
 * @description Main entry point for initializing the search module.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


async function initSearchModal(containerId) {
    console.log(" [Search Module] - initSearchModal() Started");

    // 1. Force manual scroll restoration to prevent browser interference
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
        console.info(" [Search Module] - scrollRestoration set to manual");
    }

    // 2. Global SweetAlert2 Config to prevent scroll jumps
    if (typeof Swal !== 'undefined') {
        window.Swal = Swal.mixin({
            heightAuto: false,
            scrollbarPadding: false
        });
        console.info(" [Search Module] - SweetAlert2 globally configured for no-jump");
    }

    // Populate searchElements
    searchElements = {
        searchModalInput: document.getElementById("search-modal-input"),
        searchInputIcon: document.getElementById("search-input-icon"),
        searchResultsContainer: document.getElementById("search-results-container"),
        performSearchBtn: document.getElementById("search-perform-search-btn"),
        modeTrigger: document.getElementById("search-mode-trigger"),
        modeDisplay: document.getElementById("search-mode-display"),
        sortTrigger: document.getElementById("search-sort-trigger"),
        sortDisplay: document.getElementById("search-sort-display"),
        mainCatTrigger: document.getElementById("search-main-category-trigger"),
        mainCatDisplay: document.getElementById("search-main-category-display"),
        subCatTrigger: document.getElementById("search-sub-category-trigger"),
        subCatDisplay: document.getElementById("search-sub-category-display"),
        searchTextTrigger: document.getElementById("search-text-trigger"),
        searchTextDisplay: document.getElementById("search-text-display")
    };

    const { searchModalInput, searchResultsContainer, performSearchBtn, modeTrigger, searchTextTrigger } = searchElements;

    if (!searchModalInput || !searchResultsContainer || !performSearchBtn || !modeTrigger) {
        console.error(" [Search Module] - Essential DOM elements missing. Aborting init.");
        return;
    }

    // Admin Check
    try {
        console.info(" [Search Module] - Admin Check Started");
        const user = SessionManager.getUser();
        const capabilities = typeof window.resolveUserCapabilities === 'function'
            ? window.resolveUserCapabilities(user)
            : null;
        isAdminForSearch = !!capabilities?.isAdmin;
        if (isAdminForSearch) await loadSelectedSearchProducts();
    } catch (e) {
        console.error(" [Search Module] - Admin check failed", e);
    }

    // Clear previous results
    searchResultsContainer.innerHTML = "";

    // Handle Search Text Modal
    if (searchTextTrigger) {
        searchTextTrigger.onclick = async () => {
            console.log(" [Search Module] - searchTextTrigger.onclick Started");
            let dynamicTitle = (window.langu('search_modal_input_placeholder') || 'البحث');

            if (merchantContext) {
                dynamicTitle = (window.langu('search_modal_within_merchant') || `البحث في ${merchantContext.name}`);
            } else if (modeTrigger && modeTrigger.dataset.value === 'merchants') {
                dynamicTitle = (window.langu('search_mode_sellers') || 'البحث عن مقدم خدمة');
            }

            const { value: text } = await Swal.fire({
                title: dynamicTitle,
                input: 'text',
                inputValue: searchModalInput.value,
                inputPlaceholder: window.langu(searchModalInput.getAttribute('data-lkey-placeholder')) || 'ادخل نص البحث...',
                showCancelButton: true,
                confirmButtonText: window.langu('alert_confirm_btn') || 'موافق',
                cancelButtonText: window.langu('alert_cancel_btn') || 'إلغاء',
                buttonsStyling: false,
                customClass: {
                    popup: 'swal-modern-mini-popup swal-theme-dark-blue',
                    title: 'swal-modern-mini-title',
                    input: 'swal-modern-mini-input',
                    confirmButton: 'swal-modern-mini-confirm',
                    cancelButton: 'swal-modern-mini-cancel'
                }
            });

            if (text !== undefined) {
                const trimmed = text.trim();
                searchModalInput.value = trimmed;
                if (searchElements.searchTextDisplay) {
                    searchElements.searchTextDisplay.textContent = trimmed
                        ? (trimmed.length > 6 ? trimmed.substring(0, 6) + '...' : trimmed)
                        : 'نص';
                }
                SearchState.save();

                // Immediately trigger search if criteria met
                if (typeof SearchFlow !== 'undefined') {
                    SearchFlow.execute();
                }
            }
            console.log(" [Search Module] - searchTextTrigger.onclick Finished");
        };
    }

    // Load Filters & Events
    console.info(" [Search Module] - loadCategoryFilters() Started");
    await loadCategoryFilters();

    if (performSearchBtn) {
        performSearchBtn.onclick = () => {
            console.log(" [Search Module] - performSearchBtn.onclick triggered");
            SearchFlow.execute();
        };
    }

    // Omni-Listener for Scroll Saving
    let scrollTimeout;
    const handleScroll = () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            if (typeof SearchState !== 'undefined') {
                SearchState.save();
            }
        }, 400);
    };
    document.addEventListener('scroll', handleScroll, { passive: true, capture: true });

    // Final Save on Leave
    window.addEventListener('beforeunload', () => {
        console.info(" [Search Module] - beforeunload event triggered");
        if (typeof SearchState !== 'undefined') SearchState.save();
    });

    // New Restoration Strategy
    console.info(" [Search Module] - State Restoration Strategy Started");
    const hasExternalSearch = LocalDBStorage.getItem('pendingSearchQuery') || LocalDBStorage.getItem('pendingCategorySearch');
    if (!hasExternalSearch) {
        await SearchState.restore();
    } else {
        SearchState.clear();
    }

    // Pending Search
    console.info(" [Search Module] - SearchPending.checkAndExecute() Started");
    SearchPending.checkAndExecute();

    // Re-entry listener
    window.addEventListener('request-category-search', () => {
        console.info(" [Search Module] - request-category-search event received");
        SearchPending.checkAndExecute();
    });

    if (window.applyAppTranslations) window.applyAppTranslations();
    console.log(" [Search Module] - initSearchModal() Finished");
}
