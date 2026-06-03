/**
 * @file search-pending.js
 * @description Handles search requests initiated from other pages (e.g., Portfolio).
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


const SearchPending = {
    /**
     * @function checkAndExecute
     * @description Detects pending queries in LocalDBStorage and applies them to UI.
     */
    checkAndExecute() {
        console.log(" [Search Module - Pending] checkAndExecute() Started");
        const { modeTrigger, modeDisplay, searchModalInput, searchTextDisplay, mainCatTrigger, mainCatDisplay, subCatTrigger, subCatDisplay } = searchElements;

        const pendingQuery = LocalDBStorage.getItem('pendingSearchQuery');
        const pendingMode = LocalDBStorage.getItem('pendingSearchMode');
        const pendingCatSearch = LocalDBStorage.getItem('pendingCategorySearch');

        if (!pendingQuery && !pendingCatSearch) {
            console.info(" [Search Module - Pending] No pending queries found");
            console.log(" [Search Module - Pending] checkAndExecute() Finished");
            return;
        }

        console.info(" [Search Module - Pending] Incoming request detected from external source.");

        // 1. Sync Search Mode
        if (pendingMode && modeTrigger) {
            console.info(` [Search Module - Pending] Syncing search mode: ${pendingMode}`);
            modeTrigger.dataset.value = pendingMode;
            const modeLabel = pendingMode === 'merchants' ? window.langu('search_mode_sellers') : window.langu('search_mode_products');
            if (modeDisplay) {
                modeDisplay.textContent = modeLabel;
                delete modeDisplay.dataset.lkey;
            }
            updateInputAttributes(pendingMode);
            LocalDBStorage.removeItem('pendingSearchMode');
        }

        // 2. Sync Text Query
        if (pendingQuery && searchModalInput) {
            console.info(` [Search Module - Pending] Syncing text query: ${pendingQuery}`);
            searchModalInput.value = pendingQuery;
            if (searchTextDisplay) {
                searchTextDisplay.textContent = pendingQuery.length > 8 ? pendingQuery.substring(0, 8) + '...' : pendingQuery;
                delete searchTextDisplay.dataset.lkey;
            }
            LocalDBStorage.removeItem('pendingSearchQuery');
        } else if (searchModalInput) {
            searchModalInput.value = "";
            if (searchTextDisplay) {
                searchTextDisplay.textContent = 'نص';
                searchTextDisplay.dataset.lkey = "search_modal_input_placeholder";
            }
        }

        // 3. Sync Categories & Capturing Merchant Context
        if (pendingCatSearch) {
            console.info(" [Search Module - Pending] Syncing category search...");
            try {
                const parsedCat = JSON.parse(pendingCatSearch);
                const normalizedSelection = typeof window.normalizeCategorySelection === 'function'
                    ? window.normalizeCategorySelection(parsedCat.mainId, parsedCat.subId || "")
                    : { mainId: parsedCat.mainId, subId: parsedCat.subId || "" };
                const { merchantName, merchantKey, fullSpecialty } = parsedCat;
                LocalDBStorage.removeItem('pendingCategorySearch');

                // Establish Merchant Context for triggers
                if (merchantName) {
                    console.info(` [Search Module - Pending] Merchant Context established: ${merchantName}`);
                    merchantContext = {
                        name: merchantName,
                        key: merchantKey || null,
                        specialties: fullSpecialty || null // Should be the structured object from user.business_category
                    };
                }

                console.info(" [Search Module - Pending] Starting category filter sync loop...");
                const filterCheckInterval = setInterval(async () => {
                    const data = window.appCategoriesList || await fetchAppCategories();
                    if (data && data.categories && data.categories.length > 0) {
                        clearInterval(filterCheckInterval);
                        console.info(" [Search Module - Pending] Category data found, applying filters");

                        const cats = data.categories;
                        const foundMain = cats.find(c => String(c.id) === String(normalizedSelection.mainId));

                        if (foundMain) {
                            mainCatTrigger.dataset.value = String(normalizedSelection.mainId);
                            const title = typeof foundMain.title === 'object' ? (foundMain.title[window.app_language] || foundMain.title['ar']) : foundMain.title;
                            if (mainCatDisplay) {
                                mainCatDisplay.textContent = title;
                                mainCatDisplay.removeAttribute('data-lkey'); // Use standard attribute removal
                                delete mainCatDisplay.dataset.lkey;
                                mainCatDisplay.setAttribute('data-customized', 'true');
                            }

                            if (foundMain.subcategories && foundMain.subcategories.length > 0) {
                                subCatTrigger.classList.remove("disabled");
                                if (normalizedSelection.subId) {
                                    const foundSub = foundMain.subcategories.find(s => String(s.id) === String(normalizedSelection.subId));
                                    if (foundSub) {
                                        subCatTrigger.dataset.value = String(normalizedSelection.subId);
                                        const subTitle = typeof foundSub.title === 'object' ? (foundSub.title[window.app_language] || foundSub.title['ar']) : foundSub.title;
                                        if (subCatDisplay) {
                                            subCatDisplay.textContent = subTitle;
                                            subCatDisplay.removeAttribute('data-lkey');
                                            delete subCatDisplay.dataset.lkey;
                                            subCatDisplay.setAttribute('data-customized', 'true');
                                        }
                                    }
                                }
                            }
                        }
                        console.info(" [Search Module - Pending] Sync complete, triggering SearchFlow.execute()");
                        SearchFlow.execute();
                    }
                }, 100);
                setTimeout(() => clearInterval(filterCheckInterval), 5000);
            } catch (e) {
                console.error(" [Search Module - Pending] Evaluation failed:", e);
                SearchFlow.execute();
            }
        } else {
            // Delay slightly to ensure UI is ready
            console.info(" [Search Module - Pending] Triggering delayed SearchFlow.execute()");
            setTimeout(() => SearchFlow.execute(), 300);
        }
        console.log(" [Search Module - Pending] checkAndExecute() setup Finished");
    }
};

