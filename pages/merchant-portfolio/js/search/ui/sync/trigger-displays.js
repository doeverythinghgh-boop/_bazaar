/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

window.portfolioUpdateSellerSearchTriggerDisplays = function (user) {
    const searchState = window.portfolioEnsureSellerSearchState();
    const elements = window.portfolioGetSellerSearchTriggerElements();
    const categoryOptions = window.portfolioBuildSellerCategoryOptions(user);
    const store = window.PortfolioStore || null;
    const activeSpecialty = window.portfolioActiveSpecialty?.getActive ? window.portfolioActiveSpecialty.getActive() : null;

    if (activeSpecialty) {
        if (store?.patchSellerSearch) {
            store.patchSellerSearch({
                mainCategory: String(activeSpecialty.mainId || ''),
                subCategory: String(activeSpecialty.subId || '')
            }, { source: 'active-specialty-search-sync' });
        } else {
            searchState.mainCategory = String(activeSpecialty.mainId || '');
            searchState.subCategory = String(activeSpecialty.subId || '');
        }
        if (elements.mainTrigger) elements.mainTrigger.style.display = 'none';
        if (elements.subTrigger) elements.subTrigger.style.display = 'none';
        if (elements.sortTrigger) elements.sortTrigger.style.display = 'flex';
        if (elements.inputField) {
            elements.inputField.value = searchState.query || '';
            if (elements.clearTextButton) {
                elements.clearTextButton.style.display = (searchState.query || '').length > 0 ? 'block' : 'none';
            }
        }
        if (elements.sortDisplay) {
            if (searchState.sort === 'price-asc') {
                elements.sortDisplay.textContent = window.portfolioSellerSearchL('search_modal_sort_price_asc', 'الأقل سعراً', 'Price: Low to High');
                elements.sortDisplay.removeAttribute('data-lkey');
            } else if (searchState.sort === 'price-desc') {
                elements.sortDisplay.textContent = window.portfolioSellerSearchL('search_modal_sort_price_desc', 'الأعلى سعراً', 'Price: High to Low');
                elements.sortDisplay.removeAttribute('data-lkey');
            } else {
                window.portfolioResetSellerSearchDisplayKey(elements.sortDisplay, 'search_modal_sort_label', 'ترتيب حسب', 'Sort By');
            }
        }
        return;
    }

    console.log(`[Developer] --- START Search Filter Display Logic ---`);
    console.log(`[Developer] DOM Elements Check:`, {
        mainTriggerExists: !!elements.mainTrigger,
        subTriggerExists: !!elements.subTrigger,
        sortTriggerExists: !!elements.sortTrigger,
        filtersContainerExists: !!document.getElementById('portfolio-search-modal-filters')
    });

    console.log(`[Developer] Total Main Categories available: ${categoryOptions.length}`);
    if (categoryOptions.length > 0) {
        categoryOptions.forEach(cat => {
            console.log(`[Developer]  - Main Category: ID=${cat.id}, Title="${cat.title}", Sub-categories count: ${Array.isArray(cat.subcategories) ? cat.subcategories.length : 0}`);
        });
    }

    // Developer Note: Checking for single category auto-selection logic
    if (categoryOptions.length === 1) {
        const singleMainId = String(categoryOptions[0].id);
        if (searchState.mainCategory !== singleMainId) {
            console.log(`[Developer] Auto-selecting single main category: ${categoryOptions[0].title} (${singleMainId})`);
            if (store?.patchSellerSearch) {
                store.patchSellerSearch({ mainCategory: singleMainId, subCategory: '' }, { source: 'auto-select-main' });
            } else {
                searchState.mainCategory = singleMainId;
                searchState.subCategory = '';
            }
        }
        console.log(`[Developer] Hiding Main Category trigger because there is only 1 category option.`);
        if (elements.mainTrigger) elements.mainTrigger.style.display = 'none';
    } else {
        console.log(`[Developer] Showing Main Category trigger because there are ${categoryOptions.length} category options.`);
        if (elements.mainTrigger) elements.mainTrigger.style.display = 'flex';
    }

    if (elements.inputField) {
        elements.inputField.value = searchState.query || '';
        if (elements.clearTextButton) {
            elements.clearTextButton.style.display = (searchState.query || '').length > 0 ? 'block' : 'none';
        }
    }

    if (elements.textDisplay) {
        if (searchState.query) {
            elements.textDisplay.textContent = window.portfolioTrimSellerSearchText(searchState.query);
            elements.textDisplay.removeAttribute('data-lkey');
        } else {
            window.portfolioResetSellerSearchDisplayKey(elements.textDisplay, 'search_modal_input_placeholder', 'نص', 'Text');
        }
    }

    const mainCategory = categoryOptions.find((item) => item.id === String(searchState.mainCategory));
    if (elements.mainDisplay) {
        if (mainCategory) {
            elements.mainDisplay.textContent = mainCategory.title;
            elements.mainDisplay.removeAttribute('data-lkey');
        } else {
            window.portfolioResetSellerSearchDisplayKey(elements.mainDisplay, 'search_modal_main_category_label', 'الفئة الرئيسية', 'Main Category');
        }
    }

    const subcategories = Array.isArray(mainCategory?.subcategories) ? mainCategory.subcategories : [];
    console.log(`[Developer] Selected Main Category: ${searchState.mainCategory || 'None'}, Available Sub-categories: ${subcategories.length}`);

    // Developer Note: Checking for single sub-category auto-selection logic
    if (subcategories.length === 1) {
        const singleSubId = String(subcategories[0].id);
        if (searchState.subCategory !== singleSubId) {
            console.log(`[Developer] Auto-selecting single sub-category: ${subcategories[0].title} (${singleSubId})`);
            if (store?.patchSellerSearch) {
                store.patchSellerSearch({ subCategory: singleSubId }, { source: 'auto-select-sub' });
            } else {
                searchState.subCategory = singleSubId;
            }
        }
        console.log(`[Developer] Hiding Sub Category trigger because there is exactly 1 sub-category option.`);
        if (elements.subTrigger) {
            elements.subTrigger.style.display = 'none';
        }
    } else {
        if (elements.subTrigger) {
            if (subcategories.length > 0) {
                console.log(`[Developer] Showing Sub Category trigger because there are ${subcategories.length} sub-category options.`);
                elements.subTrigger.style.display = 'flex';
            } else {
                console.log(`[Developer] Hiding Sub Category trigger because there are 0 sub-category options.`);
                elements.subTrigger.style.display = 'none';
            }
        }

        if (searchState.subCategory && !subcategories.some((item) => item.id === String(searchState.subCategory))) {
            searchState.subCategory = '';
        }
    }

    const selectedSub = subcategories.find((item) => item.id === String(searchState.subCategory));
    if (elements.subDisplay) {
        if (selectedSub) {
            elements.subDisplay.textContent = selectedSub.title;
            elements.subDisplay.removeAttribute('data-lkey');
        } else {
            window.portfolioResetSellerSearchDisplayKey(elements.subDisplay, 'search_modal_sub_category_label', 'الفئة الفرعية', 'Sub Category');
        }
    }

    if (elements.subTrigger) {
        if (subcategories.length > 1) { // Only enable if there are choices
            elements.subTrigger.classList.remove('disabled');
        } else {
            elements.subTrigger.classList.add('disabled');
        }
    }

    if (elements.sortDisplay) {
        if (searchState.sort === 'price-asc') {
            elements.sortDisplay.textContent = window.portfolioSellerSearchL('search_modal_sort_price_asc', 'الأقل سعراً', 'Price: Low to High');
            elements.sortDisplay.removeAttribute('data-lkey');
        } else if (searchState.sort === 'price-desc') {
            elements.sortDisplay.textContent = window.portfolioSellerSearchL('search_modal_sort_price_desc', 'الأعلى سعراً', 'Price: High to Low');
            elements.sortDisplay.removeAttribute('data-lkey');
        } else {
            window.portfolioResetSellerSearchDisplayKey(elements.sortDisplay, 'search_modal_sort_label', 'ترتيب حسب', 'Sort By');
        }
    }

    if (elements.sortTrigger) {
        console.log(`[Developer] Sort trigger visibility is always handled via CSS/HTML or default display. Currently sort is displayed by default.`);
    }

    // --- ADVANCED UI DIAGNOSTICS ---
    const filtersContainer = document.getElementById('portfolio-search-modal-filters');
    if (!filtersContainer) {
        console.log(`[Developer] Search modal filters container not found yet. Skipping UI sync.`);
        console.log(`[Developer] --- END Search Filter Display Logic ---`);
        return;
    }

    console.log(`[Developer] --- UI RENDERING DIAGNOSTICS (THE MIRROR) ---`);
    const computedFilters = window.getComputedStyle(filtersContainer);
    console.log(`[Developer] Filters Container (Parent):`, {
        display: computedFilters.display,
        visibility: computedFilters.visibility,
        opacity: computedFilters.opacity,
        width: computedFilters.width,
        height: computedFilters.height,
        padding: computedFilters.padding,
        inlineStyleDisplay: filtersContainer.style.display,
        actualOffsetHeight: filtersContainer.offsetHeight,
        actualClientHeight: filtersContainer.clientHeight
    });

    if (elements.mainTrigger) {
        const computedMain = window.getComputedStyle(elements.mainTrigger);
        console.log(`[Developer] Main Category Trigger (Child):`, {
            display: computedMain.display,
            inlineStyleDisplay: elements.mainTrigger.style.display,
            actualOffsetHeight: elements.mainTrigger.offsetHeight,
            textContent: elements.mainDisplay ? elements.mainDisplay.textContent : 'N/A'
        });
    }

    if (elements.subTrigger && elements.subTrigger.parentElement) {
        const computedSub = window.getComputedStyle(elements.subTrigger.parentElement);
        console.log(`[Developer] Sub Category Trigger (Child):`, {
            display: computedSub.display,
            inlineStyleDisplay: elements.subTrigger.parentElement.style.display,
            actualOffsetHeight: elements.subTrigger.parentElement.offsetHeight
        });
    }

    if (elements.sortTrigger) {
        const computedSort = window.getComputedStyle(elements.sortTrigger);
        console.log(`[Developer] Sort Trigger (Child):`, {
            display: computedSort.display,
            inlineStyleDisplay: elements.sortTrigger.style.display,
            actualOffsetHeight: elements.sortTrigger.offsetHeight
        });
    }

    const resultsContainer = document.getElementById('portfolio-search-modal-results');
    if (resultsContainer) {
         console.log(`[Developer] Results Container Status:`, {
             inlineStyleDisplay: resultsContainer.style.display,
             offsetHeight: resultsContainer.offsetHeight
         });
    }

    console.log(`[Developer] --- END Search Filter Display Logic ---`);
};
