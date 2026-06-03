/**
 * @file search-filters.js
 * @description Logic for handling category and other search filters.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


/**
 * @function showQuickSelectModal
 * @description Modern mini style modal for selection.
 */
async function showQuickSelectModal(title, options, currentValue, callback, theme = 'primary') {
    console.log(` [Search Module - Filters] showQuickSelectModal() Started with title: ${title}`);
    const { value: ignore } = await Swal.fire({
        title: title,
        html: `
      <div class="quick-select-list">
        ${options.map(opt => `
          <div class="quick-select-item ${String(opt.value) === String(currentValue) ? 'active' : ''}" data-value="${opt.value}" data-label="${opt.label}">
            <span class="quick-select-text">${opt.label}</span>
            ${String(opt.value) === String(currentValue) ? '<i class="fas fa-check-circle quick-select-check"></i>' : ''}
          </div>
        `).join('')}
      </div>
    `,
        showConfirmButton: false,
        showCloseButton: true,
        width: 'min(90vw, 320px)',
        customClass: {
            popup: `swal-modern-mini-popup swal-theme-${theme}`,
            title: 'swal-modern-mini-title',
            htmlContainer: 'swal-modern-mini-text'
        },
        didOpen: () => {
            console.info(" [Search Module - Filters] Quick Select Modal opened");
            const popup = Swal.getPopup();
            popup.querySelectorAll('.quick-select-item').forEach(item => {
                item.addEventListener('click', () => {
                    console.log(` [Search Module - Filters] Option selected: ${item.dataset.value}`);
                    callback({ value: item.dataset.value, label: item.dataset.label });
                    Swal.close();
                });
            });
        }
    });
    console.log(" [Search Module - Filters] showQuickSelectModal() Finished");
}

/**
 * @function loadCategoryFilters
 * @description Populates main and sub category filters.
 */
async function loadCategoryFilters() {
    console.log(" [Search Module - Filters] loadCategoryFilters() Started");
    const { modeTrigger, modeDisplay, sortTrigger, sortDisplay, mainCatTrigger, mainCatDisplay, subCatTrigger, subCatDisplay } = searchElements;

    // 1. Search Mode Trigger
    if (modeTrigger) {
        modeTrigger.onclick = () => {
            console.log(" [Search Module - Filters] modeTrigger clicked");
            const options = [
                { value: "products", label: window.langu('search_mode_products') },
                { value: 'merchants', label: window.langu('search_mode_sellers') }
            ];
            showQuickSelectModal(window.langu('search_mode_label') || "نوع البحث", options, modeTrigger.dataset.value, (selected) => {
                modeTrigger.dataset.value = selected.value;
                if (modeDisplay) {
                    modeDisplay.textContent = selected.label;
                    delete modeDisplay.dataset.lkey;
                    modeDisplay.setAttribute('data-customized', 'true');
                }
                updateInputAttributes(selected.value);
                SearchState.save();
                console.info(" [Search Module - Filters] Search mode updated and state saved");
            }, 'primary');
        };
    }

    // 2. Sort Order Trigger
    if (sortTrigger) {
        sortTrigger.onclick = () => {
            console.log(" [Search Module - Filters] sortTrigger clicked");
            const options = [
                { value: "default", label: window.langu('search_modal_sort_default') },
                { value: "price-asc", label: window.langu('search_modal_sort_price_asc') },
                { value: "price-desc", label: window.langu('search_modal_sort_price_desc') }
            ];
            showQuickSelectModal(window.langu('search_modal_sort_label') || "الترتيب", options, sortTrigger.dataset.value, (selected) => {
                sortTrigger.dataset.value = selected.value;
                if (sortDisplay) {
                    const isDefault = selected.value === 'default';
                    sortDisplay.textContent = isDefault ? 'الترتيب' : selected.label;
                    if (!isDefault) {
                        delete sortDisplay.dataset.lkey;
                        sortDisplay.setAttribute('data-customized', 'true');
                    } else {
                        sortDisplay.dataset.lkey = "search_modal_sort_label";
                        sortDisplay.removeAttribute('data-customized');
                    }
                }
                displaySearchResults(currentResults, modeTrigger.dataset.value);
                SearchState.save();
                console.info(" [Search Module - Filters] Sort order updated and state saved");
            }, 'warning');
        };
    }

    try {
        console.info(" [Search Module - Filters] Fetching category data...");
        const data = window.appCategoriesList || await fetchAppCategories();
        if (!data) throw new Error("فشل تحميل فلاتر التصنيفات");
        const categories = data.categories;
        console.info(` [Search Module - Filters] Loaded ${categories.length} main categories`);

        mainCatTrigger.onclick = () => {
            console.log(" [Search Module - Filters] mainCatTrigger clicked");
            let options = categories.map(c => {
                const titleObj = c.title;
                const displayTitle = typeof titleObj === 'object' ? (titleObj[window.app_language] || titleObj['ar']) : titleObj;
                return { value: String(c.id), label: displayTitle };
            });

            // Filtering based on Merchant Context
            if (merchantContext && merchantContext.specialties) {
                const allowedIds = Object.keys(merchantContext.specialties).map(id => String(id));
                options = options.filter(opt => allowedIds.includes(String(opt.value)));
            }

            options.unshift({ value: "", label: window.langu('search_modal_main_category_default') });

            const dynamicTitle = merchantContext
                ? (window.langu('search_modal_merchant_specialties') || `تخصصات ${merchantContext.name}`)
                : (window.langu('search_modal_main_category_label') || "السوق الرئيسي");

            showQuickSelectModal(dynamicTitle, options, mainCatTrigger.dataset.value, (selected) => {
                if (mainCatTrigger.dataset.value !== selected.value) {
                    mainCatTrigger.dataset.value = selected.value;
                    if (mainCatDisplay) {
                        const isNone = selected.value === '';
                        mainCatDisplay.textContent = isNone ? 'الرئيسي' : selected.label;
                        if (!isNone) {
                            delete mainCatDisplay.dataset.lkey;
                            mainCatDisplay.setAttribute('data-customized', 'true');
                        } else {
                            mainCatDisplay.dataset.lkey = "search_modal_main_category_label";
                            mainCatDisplay.removeAttribute('data-customized');
                        }
                    }

                    subCatTrigger.dataset.value = "";
                    if (subCatDisplay) {
                        subCatDisplay.textContent = 'الفرعي';
                        subCatDisplay.dataset.lkey = "search_modal_sub_category_label";
                    }

                    const foundCat = categories.find(c => String(c.id) === String(selected.value));
                    if (foundCat && foundCat.subcategories && foundCat.subcategories.length > 0) {
                        subCatTrigger.classList.remove("disabled");
                    } else {
                        subCatTrigger.classList.add("disabled");
                    }
                    SearchState.save();
                    console.info(" [Search Module - Filters] Main category updated and state saved");
                }
            }, 'success');
        };

        subCatTrigger.onclick = () => {
            console.log(" [Search Module - Filters] subCatTrigger clicked");
            if (subCatTrigger.classList.contains("disabled")) {
                console.warn(" [Search Module - Filters] subCatTrigger is disabled");
                return;
            }
            const mainId = mainCatTrigger.dataset.value;
            const foundCat = categories.find(c => String(c.id) === String(mainId));
            if (!foundCat) return;

            let options = (foundCat.subcategories || []).map(s => {
                const titleObj = s.title;
                const displayTitle = typeof titleObj === 'object' ? (titleObj[window.app_language] || titleObj['ar']) : titleObj;
                return { value: String(s.id), label: displayTitle };
            });

            // Filtering Subs based on Merchant Context
            if (merchantContext && merchantContext.specialties && merchantContext.specialties[mainId]) {
                const allowedSubs = merchantContext.specialties[mainId].map(String);
                if (allowedSubs.length > 0) {
                    options = options.filter(opt => allowedSubs.includes(opt.value));
                }
            }

            options.unshift({ value: "", label: window.langu('search_modal_sub_category_default') });

            showQuickSelectModal(window.langu('search_modal_sub_category_label') || "السوق الفرعي", options, subCatTrigger.dataset.value, (selected) => {
                if (subCatTrigger.dataset.value !== selected.value) {
                    subCatTrigger.dataset.value = selected.value;
                    if (subCatDisplay) {
                        const isNone = selected.value === '';
                        subCatDisplay.textContent = isNone ? 'الفرعي' : selected.label;
                        if (!isNone) {
                            delete subCatDisplay.dataset.lkey;
                            subCatDisplay.setAttribute('data-customized', 'true');
                        } else {
                            subCatDisplay.dataset.lkey = "search_modal_sub_category_label";
                            subCatDisplay.removeAttribute('data-customized');
                        }
                    }
                    SearchState.save();
                    console.info(" [Search Module - Filters] Sub category updated and state saved");
                }
            }, 'info');
        };
        console.log(" [Search Module - Filters] loadCategoryFilters() Finished Successfully");
    } catch (error) {
        console.error(" [Search Module - Filters] Error loading categories:", error);
        console.log(" [Search Module - Filters] loadCategoryFilters() Finished with Error");
    }
}

/**
 * @function resetSearchFilters
 * @description Resets all filters and clears results.
 */
window.resetSearchFilters = function () {
    console.log(" [Search Module - Filters] resetSearchFilters() Started");
    const { searchModalInput, searchTextDisplay, mainCatTrigger, mainCatDisplay, subCatTrigger, subCatDisplay, searchResultsContainer, performSearchBtn } = searchElements;

    if (searchModalInput) searchModalInput.value = "";
    if (searchTextDisplay) {
        searchTextDisplay.textContent = 'نص';
        searchTextDisplay.dataset.lkey = "search_modal_input_placeholder";
    }

    if (mainCatTrigger) mainCatTrigger.dataset.value = "";
    if (mainCatDisplay) {
        mainCatDisplay.textContent = 'الرئيسي';
        mainCatDisplay.dataset.lkey = "search_modal_main_category_label";
        mainCatDisplay.removeAttribute('data-customized');
    }

    if (subCatTrigger) {
        subCatTrigger.dataset.value = "";
        subCatTrigger.classList.add("disabled");
    }
    if (subCatDisplay) {
        subCatDisplay.textContent = 'الفرعي';
        subCatDisplay.dataset.lkey = "search_modal_sub_category_label";
        subCatDisplay.removeAttribute('data-customized');
    }

    if (searchResultsContainer) searchResultsContainer.innerHTML = "";

    merchantContext = null;
    SearchState.clear();
    console.info(" [Search Module - Filters] Filters reset, state cleared");
    console.log(" [Search Module - Filters] resetSearchFilters() Finished");
};
