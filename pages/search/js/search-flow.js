/**
 * @file search-flow.js
 * @description Coordinates the search process from validation to UI update.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


const SearchFlow = {
    _debounceTimer: null,
    schedule(delay = 250) {
        console.log(` [Search Module - Flow] schedule() Called with delay: ${delay}ms`);
        clearTimeout(this._debounceTimer);
        this._debounceTimer = setTimeout(() => {
            console.info(" [Search Module - Flow] Debounce timer finished, calling execute()");
            this.execute().catch((error) => console.error(" [Search Module - Flow] Debounced search failed:", error));
        }, delay);
        console.log(" [Search Module - Flow] schedule() Finished");
    },
    /**
     * @function execute
     * @description Validates criteria, calls API, and triggers rendering.
     */
    async execute() {
        console.log(" [Search Module - Flow] execute() Started");
        const { performSearchBtn, modeTrigger, searchModalInput, mainCatTrigger, subCatTrigger, searchResultsContainer } = searchElements;

        try {
            // 1. Reset Pagination for new search
            console.info(" [Search Module - Flow] Resetting pagination");
            searchOffset = 0;
            currentResults = [];

            // 2. Collect & Normalize Inputs
            const mode = modeTrigger.dataset.value || "products";
            const rawTerm = searchModalInput ? searchModalInput.value.trim() : "";
            const searchTerm = typeof normalizeArabicText === 'function' ? normalizeArabicText(rawTerm) : rawTerm;
            const mainCategory = mainCatTrigger.dataset.value || "";
            const subCategory = subCatTrigger.dataset.value || "";

            console.info(` [Search Module - Flow] Search Criteria -> Mode: ${mode}, Term: '${searchTerm}', MainCat: ${mainCategory}, SubCat: ${subCategory}`);

            // 3. Validation Cases
            if (!searchTerm && !mainCategory) {
                console.warn(" [Search Module - Flow] Validation Failed: No search criteria provided.");
                if (searchResultsContainer) searchResultsContainer.innerHTML = "";

                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        title: window.langu('search_modal_no_criteria_error') || 'يرجى إدخال نص للبحث أو اختيار قسم أولاً.',
                        icon: 'info',
                        confirmButtonText: window.langu('alert_confirm_btn') || 'موافق',
                        customClass: {
                            popup: 'swal-modern-mini-popup swal-theme-primary',
                            title: 'swal-modern-mini-title',
                            confirmButton: 'swal-modern-mini-confirm'
                        }
                    });
                }
                console.log(" [Search Module - Flow] execute() Finished (Validation Error)");
                return;
            }

            // Product mode text length restriction
            if (mode === "products" && searchTerm && searchTerm.length < 3) {
                console.warn(" [Search Module - Flow] Validation Failed: Search term too short for products mode.");
                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        title: window.langu('search_modal_input_min_length_error'),
                        icon: 'warning',
                        confirmButtonText: window.langu('alert_confirm_btn'),
                        customClass: { popup: 'swal-modern-mini-popup', title: 'swal-modern-mini-title', confirmButton: 'swal-modern-mini-confirm' }
                    });
                }
                console.log(" [Search Module - Flow] execute() Finished (Validation Error)");
                return;
            }

            // 4. Loading State
            console.info(" [Search Module - Flow] Showing loading spinner");
            if (searchResultsContainer) {
                searchResultsContainer.innerHTML = '<div class="loader" style="margin: 40px auto;"></div>';
            }

            // 5. API Call
            console.info(" [Search Module - Flow] Calling SearchAPI.fetchResults()");
            const results = await SearchAPI.fetchResults({
                mode,
                searchTerm,
                mainCategory,
                subCategory,
                userKey: (merchantContext ? merchantContext.key : null),
                limit: SEARCH_LIMIT,
                offset: searchOffset
            });

            // 6. Success Flow
            console.info(` [Search Module - Flow] API returned ${results ? results.length : 0} results`);
            currentResults = results;
            searchOffset += results.length;
            displaySearchResults(currentResults, mode, false); // false = not appending
            SearchState.save();
            console.log(" [Search Module - Flow] execute() Finished Successfully");

        } catch (error) {
            console.error(" [Search Module - Flow] Search execution failed:", error);
            if (searchResultsContainer) {
                searchResultsContainer.innerHTML = `<p class="search-error-message">${window.langu('search_modal_error_generic')}</p>`;
            }
            console.log(" [Search Module - Flow] execute() Finished with Error");
        }
    },

    /**
     * @function loadMore
     * @description Fetches the next page of results.
     */
    async loadMore() {
        console.log(" [Search Module - Flow] loadMore() Started");
        const { modeTrigger, searchModalInput, mainCatTrigger, subCatTrigger, searchResultsContainer } = searchElements;
        const loadMoreBtn = document.getElementById('search-load-more-btn');

        try {
            if (loadMoreBtn) {
                loadMoreBtn.disabled = true;
                loadMoreBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${window.langu('search_loading_status') || 'جاري التحميل...'}`;
                console.info(" [Search Module - Flow] loadMoreBtn set to loading state");
            }

            const mode = modeTrigger.dataset.value || "products";
            const rawTerm = searchModalInput ? searchModalInput.value.trim() : "";
            const searchTerm = typeof normalizeArabicText === 'function' ? normalizeArabicText(rawTerm) : rawTerm;
            const mainCategory = mainCatTrigger.dataset.value || "";
            const subCategory = subCatTrigger.dataset.value || "";

            console.info(` [Search Module - Flow] Calling API for next page (Offset: ${searchOffset})`);
            const results = await SearchAPI.fetchResults({
                mode,
                searchTerm,
                mainCategory,
                subCategory,
                userKey: (merchantContext ? merchantContext.key : null),
                limit: SEARCH_LIMIT,
                offset: searchOffset
            });

            if (results && results.length > 0) {
                console.info(` [Search Module - Flow] API returned ${results.length} more results`);
                currentResults = [...currentResults, ...results];
                searchOffset += results.length;
                displaySearchResults(results, mode, true); // true = appending
                SearchState.save();
            } else {
                console.info(" [Search Module - Flow] No more results from API");
                if (loadMoreBtn) loadMoreBtn.style.display = 'none';
            }
            console.log(" [Search Module - Flow] loadMore() Finished Successfully");

        } catch (error) {
            console.error(" [Search Module - Flow] Load more failed:", error);
            if (loadMoreBtn) {
                loadMoreBtn.disabled = false;
                loadMoreBtn.innerHTML = window.langu('search_retry_status') || 'حاول مرة أخرى';
            }
            console.log(" [Search Module - Flow] loadMore() Finished with Error");
        }
    }
};

// Map functions to window for global access from HTML
window.performSearch = () => {
    console.log(" [Search Module - Flow] Global performSearch() triggered");
    SearchFlow.schedule();
};
window.loadMoreSearch = () => {
    console.log(" [Search Module - Flow] Global loadMoreSearch() triggered");
    SearchFlow.loadMore();
};
