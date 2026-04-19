/**
 * @file pages/merchant-portfolio/js/portfolio-search-ui.js
 * @description Seller search UI state, triggers, and modal helpers.
 */

window.portfolioGetSellerSearchTriggerElements = function () {
    return {
        panel: document.getElementById('portfolio-inline-search-panel'),
        toggleButton: document.getElementById('btn-portfolio-search-commercial'),
        clearButton: document.getElementById('btn-portfolio-search-clear'),
        searchButton: document.getElementById('portfolio-inline-perform-search-btn'),
        textTrigger: document.getElementById('portfolio-inline-search-text-trigger'),
        textDisplay: document.getElementById('portfolio-inline-search-text-display'),
        mainTrigger: document.getElementById('portfolio-inline-main-category-trigger'),
        mainDisplay: document.getElementById('portfolio-inline-main-category-display'),
        subTrigger: document.getElementById('portfolio-inline-sub-category-trigger'),
        subDisplay: document.getElementById('portfolio-inline-sub-category-display'),
        sortTrigger: document.getElementById('portfolio-inline-sort-trigger'),
        sortDisplay: document.getElementById('portfolio-inline-sort-display'),
        meta: document.getElementById('portfolio-inline-search-meta'),
        results: document.getElementById('portfolio-inline-search-results'),
        loadMoreButton: document.getElementById('btn-load-more-products')
    };
};

window.portfolioUpdateSellerSearchButtonState = function () {
    const searchState = window.portfolioEnsureSellerSearchState();
    const elements = window.portfolioGetSellerSearchTriggerElements();
    if (!elements.toggleButton) return;

    if (searchState.isOpen || searchState.isActive) {
        elements.toggleButton.classList.add('active');
    } else {
        elements.toggleButton.classList.remove('active');
    }
};

window.portfolioUpdateSellerSearchMeta = function () {
    const searchState = window.portfolioEnsureSellerSearchState();
    const elements = window.portfolioGetSellerSearchTriggerElements();
    if (!elements.meta || !elements.results) return;

    if (!searchState.isOpen && !searchState.isActive) {
        elements.meta.style.display = 'none';
        return;
    }

    elements.meta.style.display = 'flex';
    if (searchState.isActive) {
        const resultsLabel = window.portfolioSellerSearchL('port_search_results_count', 'نتيجة', 'results');
        elements.results.textContent = `${searchState.visibleCount} / ${searchState.totalMatched} ${resultsLabel}`;
    } else {
        elements.results.textContent = window.portfolioSellerSearchL('port_search_ready', 'جاهز للبحث', 'Ready to search');
    }
};

window.portfolioSyncSearchLoadMoreButton = function () {
    const searchState = window.portfolioEnsureSellerSearchState();
    const elements = window.portfolioGetSellerSearchTriggerElements();
    const state = window.PortfolioStore?.getState ? window.PortfolioStore.getState() : window.portfolioState;
    if (!elements.loadMoreButton) return;

    if (searchState.isActive) {
        const hasMoreSearchResults = searchState.visibleCount < searchState.totalMatched;
        elements.loadMoreButton.style.display = hasMoreSearchResults ? 'flex' : 'none';
        elements.loadMoreButton.disabled = searchState.isLoading;
        elements.loadMoreButton.innerHTML = searchState.isLoading
            ? `${window.portfolioSellerSearchL('search_loading_status', 'جاري التحميل...', 'Loading...')} <i class="fas fa-spinner fa-spin"></i>`
            : window.portfolioSellerSearchL('search_modal_load_more', 'عرض المزيد', 'Load More');
        return;
    }

    const shouldShowDefaultLoadMore = !!state?.hasMoreProducts;
    elements.loadMoreButton.style.display = shouldShowDefaultLoadMore ? 'flex' : 'none';
    elements.loadMoreButton.disabled = false;
    elements.loadMoreButton.innerHTML = window.portfolioSellerSearchL('search_modal_load_more', 'عرض المزيد', 'Load More');
};

window.portfolioResetSellerSearchDisplayKey = function (element, key, fallbackAr, fallbackEn) {
    if (!element) return;
    element.dataset.lkey = key;
    element.textContent = window.portfolioSellerSearchL(key, fallbackAr, fallbackEn);
};

window.portfolioUpdateSellerSearchTriggerDisplays = function (user) {
    const searchState = window.portfolioEnsureSellerSearchState();
    const elements = window.portfolioGetSellerSearchTriggerElements();
    const categoryOptions = window.portfolioBuildSellerCategoryOptions(user);

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
    if (searchState.subCategory && !subcategories.some((item) => item.id === String(searchState.subCategory))) {
        searchState.subCategory = '';
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
        if (subcategories.length > 0) {
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
};

window.portfolioSetSellerSearchLoading = function (isLoading) {
    const searchState = window.portfolioEnsureSellerSearchState();
    const store = window.PortfolioStore || null;
    const elements = window.portfolioGetSellerSearchTriggerElements();
    if (store?.patchSellerSearch) {
        store.patchSellerSearch({ isLoading: !!isLoading }, { source: 'seller-search-loading' });
    } else {
        searchState.isLoading = !!isLoading;
    }

    if (elements.searchButton) {
        elements.searchButton.disabled = !!isLoading;
        elements.searchButton.innerHTML = isLoading
            ? '<i class="fas fa-spinner fa-spin"></i>'
            : '<i class="fas fa-search"></i>';
    }

    if (elements.clearButton) {
        elements.clearButton.disabled = !!isLoading;
    }

    window.portfolioSyncSearchLoadMoreButton();
};

window.portfolioShowQuickSelectModal = async function (title, options, currentValue, callback, theme = 'primary') {
    if (typeof Swal === 'undefined') return;

    await Swal.fire({
        title: title,
        html: `
            <div class="quick-select-list">
                ${options.map((option) => `
                    <div class="quick-select-item ${String(option.value) === String(currentValue) ? 'active' : ''}"
                         data-value="${option.value}"
                         data-label="${option.label}">
                        <span class="quick-select-text">${option.label}</span>
                        ${String(option.value) === String(currentValue) ? '<i class="fas fa-check-circle quick-select-check"></i>' : ''}
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
            const popup = Swal.getPopup();
            popup.querySelectorAll('.quick-select-item').forEach((item) => {
                item.addEventListener('click', () => {
                    callback({
                        value: item.dataset.value,
                        label: item.dataset.label
                    });
                    Swal.close();
                });
            });
        }
    });
};

window.portfolioOpenSellerSearchTextModal = async function () {
    const searchState = window.portfolioEnsureSellerSearchState();
    if (typeof Swal === 'undefined') return;

    const result = await Swal.fire({
        title: window.portfolioSellerSearchL('port_search_text_title', 'ابحث باسم المنتج أو الوصف', 'Search by product name or description'),
        input: 'text',
        inputValue: searchState.query,
        inputPlaceholder: window.portfolioSellerSearchL('port_search_text_placeholder', 'أدخل الاسم أو الوصف', 'Enter product name or description'),
        showCancelButton: true,
        confirmButtonText: window.portfolioSellerSearchL('alert_confirm_btn', 'موافق', 'OK'),
        cancelButtonText: window.portfolioSellerSearchL('alert_cancel_btn', 'إلغاء', 'Cancel'),
        buttonsStyling: false,
        customClass: {
            popup: 'swal-modern-mini-popup swal-theme-dark-blue',
            title: 'swal-modern-mini-title',
            input: 'swal-modern-mini-input',
            confirmButton: 'swal-modern-mini-confirm',
            cancelButton: 'swal-modern-mini-cancel'
        }
    });

    if (result.value !== undefined) {
        const nextQuery = String(result.value || '').trim();
        if (window.PortfolioStore?.patchSellerSearch) {
            window.PortfolioStore.patchSellerSearch({ query: nextQuery }, { source: 'seller-search-text' });
        } else {
            searchState.query = nextQuery;
        }
    }
};
