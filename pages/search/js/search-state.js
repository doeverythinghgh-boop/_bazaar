/**
 * @file search-state.js
 * @description Manages persistence of search criteria and results.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


const SearchState = {
    /**
     * @function save
     * @description Saves current UI state to LocalDBSession.
     */
    save() {
        console.log(" [Search Module - State] save() Started");
        const { modeTrigger, searchModalInput, mainCatTrigger, subCatTrigger, sortTrigger } = searchElements;

        // Get current scroll position
        const scrollY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;

        const state = {
            searchMode: modeTrigger.dataset.value || "products",
            searchTerm: (searchModalInput ? searchModalInput.value : "").trim(),
            mainCategory: mainCatTrigger.dataset.value || "",
            subCategory: subCatTrigger.dataset.value || "",
            sortOrder: sortTrigger.dataset.value || "default",
            results: currentResults || [],
            searchOffset: searchOffset || 0,
            scrollY: Math.round(scrollY)
        };
        LocalDBSession.setItem(SEARCH_SESSION_KEY, JSON.stringify(state));
        console.info(` [Search Module - State] UI state (Scroll: ${state.scrollY}px) persisted to LocalDBSession.`);
        console.log(" [Search Module - State] save() Finished");
    },

    /**
     * @function restore
     * @description Restores UI state from LocalDBSession.
     */
    async restore() {
        console.log(" [Search Module - State] restore() Started");
        const { searchModalInput, searchTextDisplay, modeTrigger, modeDisplay, sortTrigger, sortDisplay, mainCatTrigger, mainCatDisplay, subCatTrigger, subCatDisplay } = searchElements;
        const savedState = LocalDBSession.getItem(SEARCH_SESSION_KEY);
        if (!savedState) {
            console.info(" [Search Module - State] No saved state found");
            console.log(" [Search Module - State] restore() Finished");
            return false;
        }

        try {
            console.info(" [Search Module - State] Parsing saved state...");
            const state = JSON.parse(savedState);

            // 1. Text Query
            if (searchModalInput) searchModalInput.value = state.searchTerm || "";
            if (searchTextDisplay) {
                searchTextDisplay.textContent = state.searchTerm || window.langu('search_modal_input_placeholder');
                if (state.searchTerm) delete searchTextDisplay.dataset.lkey;
                else searchTextDisplay.dataset.lkey = "search_modal_input_placeholder";
            }

            // 2. Search Mode
            if (state.searchMode && modeTrigger) {
                modeTrigger.dataset.value = state.searchMode;
                const modeLabel = state.searchMode === 'merchants' ? window.langu('search_mode_sellers') : window.langu('search_mode_products');
                if (modeDisplay) {
                    modeDisplay.textContent = modeLabel;
                    delete modeDisplay.dataset.lkey;
                }
                updateInputAttributes(state.searchMode);
            }

            // 3. Sort Order
            if (state.sortOrder && state.sortOrder !== 'default' && sortTrigger) {
                sortTrigger.dataset.value = state.sortOrder;
                const labelKey = state.sortOrder === "price-asc" ? 'search_modal_sort_price_asc' : 'search_modal_sort_price_desc';
                if (sortDisplay) {
                    sortDisplay.textContent = window.langu(labelKey);
                    delete sortDisplay.dataset.lkey;
                }
            }

            // 4. Categories
            if (state.mainCategory && mainCatTrigger) {
                const normalizedSelection = typeof window.normalizeCategorySelection === 'function'
                    ? window.normalizeCategorySelection(state.mainCategory, state.subCategory || "")
                    : { mainId: state.mainCategory, subId: state.subCategory || "" };
                mainCatTrigger.dataset.value = normalizedSelection.mainId;
                const data = window.appCategoriesList || await fetchAppCategories();
                const foundMain = data.categories.find(c => String(c.id) === String(normalizedSelection.mainId));
                if (foundMain) {
                    const title = typeof foundMain.title === 'object' ? (foundMain.title[window.app_language] || foundMain.title['ar']) : foundMain.title;
                    if (mainCatDisplay) { mainCatDisplay.textContent = title; delete mainCatDisplay.dataset.lkey; }

                    if (foundMain.subcategories && foundMain.subcategories.length > 0) {
                        subCatTrigger.classList.remove("disabled");
                        if (normalizedSelection.subId) {
                            subCatTrigger.dataset.value = normalizedSelection.subId;
                            const foundSub = foundMain.subcategories.find(s => String(s.id) === String(normalizedSelection.subId));
                            if (foundSub) {
                                const subTitle = typeof foundSub.title === 'object' ? (foundSub.title[window.app_language] || foundSub.title['ar']) : foundSub.title;
                                if (subCatDisplay) { subCatDisplay.textContent = subTitle; delete subCatDisplay.dataset.lkey; }
                            }
                        }
                    }
                }
            }

            // 5. Results
            if (state.results && state.results.length > 0) {
                console.info(" [Search Module - State] Restoring previous search results");
                currentResults = state.results;
                searchOffset = state.searchOffset || currentResults.length;
                displaySearchResults(currentResults, state.searchMode || "products");

                // 6. Persistent Scroll Restoration
                if (state.scrollY && state.scrollY > 10) {
                    console.info(` [Search Module - State] Attempting scroll restoration to ${state.scrollY}px`);
                    let attempts = 0;
                    const targetY = state.scrollY;
                    const restoreInterval = setInterval(() => {
                        window.scrollTo(0, targetY);
                        if (document.documentElement) document.documentElement.scrollTop = targetY;
                        if (document.body) document.body.scrollTop = targetY;

                        attempts++;
                        const currentY = window.scrollY || document.documentElement.scrollTop || 0;
                        if (Math.abs(currentY - targetY) < 10 || attempts > 30) {
                            clearInterval(restoreInterval);
                            console.info(` [Search Module - State] Scroll restored to ${targetY}px after ${attempts} attempts.`);
                        }
                    }, 100);
                }
            }
            console.log(" [Search Module - State] restore() Finished Successfully");
            return true;
        } catch (e) {
            console.error(" [Search Module - State] Restore failed:", e);
            console.log(" [Search Module - State] restore() Finished with Error");
            return false;
        }
    },

    /**
     * @function clear
     */
    clear() {
        console.log(" [Search Module - State] clear() Started");
        LocalDBSession.removeItem(SEARCH_SESSION_KEY);
        console.info(" [Search Module - State] LocalDBSession cleared");
        console.log(" [Search Module - State] clear() Finished");
    }
};
