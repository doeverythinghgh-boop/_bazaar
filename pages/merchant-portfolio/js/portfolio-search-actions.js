/**
 * @file pages/merchant-portfolio/js/portfolio-search-actions.js
 * @description Seller search execution and wiring.
 */

window.portfolioRenderActiveSellerSearchResults = function () {
    const searchState = window.portfolioEnsureSellerSearchState();
    const visibleProducts = searchState.results.slice(0, searchState.visibleCount);

    if (typeof window.portfolioRenderProducts === 'function') {
        window.portfolioRenderProducts(visibleProducts, false);
    }

    window.portfolioUpdateSellerSearchMeta();
    window.portfolioSyncSearchLoadMoreButton();
};

window.portfolioExecuteSellerSearch = async function (user) {
    if (!user?.user_key) return;

    const searchState = window.portfolioEnsureSellerSearchState();
    const store = window.PortfolioStore || null;
    const criteria = {
        query: String(searchState.query || '').trim(),
        mainCategory: String(searchState.mainCategory || '').trim(),
        subCategory: String(searchState.subCategory || '').trim(),
        sort: searchState.sort || 'default'
    };

    if (!window.portfolioHasSellerSearchCriteria(criteria)) {
        window.portfolioResetSellerSearch();
        return;
    }

    try {
        window.portfolioSetSellerSearchLoading(true);
        const fetchedProducts = await window.portfolioFetchSellerSearchSource(user.user_key);
        const filteredProducts = window.portfolioFilterSellerProducts(fetchedProducts, criteria);

        if (store?.patchSellerSearch) {
            store.patchSellerSearch({
                isActive: true,
                appliedQuery: criteria.query,
                appliedMainCategory: criteria.mainCategory,
                appliedSubCategory: criteria.subCategory,
                appliedSort: criteria.sort,
                results: filteredProducts,
                totalMatched: filteredProducts.length,
                visibleCount: Math.min(searchState.limit, filteredProducts.length)
            }, { source: 'seller-search-execute' });
        } else {
            searchState.isActive = true;
            searchState.appliedQuery = criteria.query;
            searchState.appliedMainCategory = criteria.mainCategory;
            searchState.appliedSubCategory = criteria.subCategory;
            searchState.appliedSort = criteria.sort;
            searchState.results = filteredProducts;
            searchState.totalMatched = filteredProducts.length;
            searchState.visibleCount = Math.min(searchState.limit, filteredProducts.length);
        }

        window.portfolioRenderActiveSellerSearchResults();
        window.portfolioUpdateSellerSearchButtonState();
    } catch (error) {
        console.error('[Portfolio] Seller search failed:', error);
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: window.portfolioSellerSearchL('port_fetch_error_title', 'خطأ', 'Error'),
                text: window.portfolioSellerSearchL(
                    'port_search_execute_error',
                    'تعذر تنفيذ البحث الآن. حاول مرة أخرى.',
                    'Unable to perform search right now. Please try again.'
                ),
                icon: 'error',
                buttonsStyling: false,
                customClass: {
                    popup: 'swal-modern-mini-popup',
                    title: 'swal-modern-mini-title',
                    confirmButton: 'swal-modern-mini-confirm'
                }
            });
        }
    } finally {
        window.portfolioSetSellerSearchLoading(false);
    }
};

window.portfolioLoadMoreSellerSearchResults = function () {
    const searchState = window.portfolioEnsureSellerSearchState();
    const store = window.PortfolioStore || null;
    if (!searchState.isActive) return false;

    const nextVisibleCount = Math.min(searchState.visibleCount + searchState.limit, searchState.totalMatched);
    if (nextVisibleCount <= searchState.visibleCount) {
        window.portfolioSyncSearchLoadMoreButton();
        return true;
    }

    const nextBatch = searchState.results.slice(searchState.visibleCount, nextVisibleCount);
    if (store?.patchSellerSearch) {
        store.patchSellerSearch({ visibleCount: nextVisibleCount }, { source: 'seller-search-load-more' });
    } else {
        searchState.visibleCount = nextVisibleCount;
    }

    if (typeof window.portfolioRenderProducts === 'function') {
        window.portfolioRenderProducts(nextBatch, true);
    }

    window.portfolioUpdateSellerSearchMeta();
    window.portfolioSyncSearchLoadMoreButton();
    return true;
};

window.portfolioRestoreDefaultProductGrid = function () {
    const baseProducts = window.portfolioGetBaseProductsForSearch();
    if (typeof window.portfolioRenderProducts === 'function') {
        window.portfolioRenderProducts(baseProducts, false);
    }

    window.portfolioSyncSearchLoadMoreButton();
};

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
        store.patchSellerSearch(resetPatch, { source: 'seller-search-reset' });
    } else {
        Object.assign(searchState, resetPatch);
    }

    const elements = window.portfolioGetSellerSearchTriggerElements();
    if (elements.panel) {
        elements.panel.style.display = window.portfolioEnsureSellerSearchState().isOpen ? 'block' : 'none';
    }

    const state = store?.getState ? store.getState() : window.portfolioState;
    window.portfolioUpdateSellerSearchTriggerDisplays(state?.activeUser);
    window.portfolioUpdateSellerSearchMeta();
    window.portfolioUpdateSellerSearchButtonState();
    window.portfolioRestoreDefaultProductGrid();
};

window.portfolioToggleSellerSearchPanel = function (user) {
    const searchState = window.portfolioEnsureSellerSearchState();
    const store = window.PortfolioStore || null;
    const elements = window.portfolioGetSellerSearchTriggerElements();
    if (!elements.panel) return;

    if (searchState.isOpen) {
        window.portfolioResetSellerSearch({ closePanel: true });
        return;
    }

    if (store?.patchSellerSearch) {
        store.patchSellerSearch({ isOpen: true }, { source: 'seller-search-toggle' });
    } else {
        searchState.isOpen = true;
    }
    elements.panel.style.display = 'block';
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

window.portfolioSetupSellerSearch = function (user) {
    const elements = window.portfolioGetSellerSearchTriggerElements();
    if (!elements.panel || !elements.toggleButton || !elements.searchButton || !elements.clearButton) return;

    const searchState = window.portfolioEnsureSellerSearchState();
    const store = window.PortfolioStore || null;

    elements.toggleButton.onclick = function () {
        window.portfolioToggleSellerSearchPanel(user);
    };

    elements.clearButton.onclick = function () {
        window.portfolioResetSellerSearch();
        if (store?.patchSellerSearch) {
            store.patchSellerSearch({ isOpen: true }, { source: 'seller-search-clear' });
        } else {
            searchState.isOpen = true;
        }
        elements.panel.style.display = 'block';
        window.portfolioUpdateSellerSearchMeta();
        window.portfolioUpdateSellerSearchButtonState();
    };

    if (elements.textTrigger) {
        elements.textTrigger.onclick = async function () {
            await window.portfolioOpenSellerSearchTextModal();
            window.portfolioUpdateSellerSearchTriggerDisplays(user);
        };
    }

    if (elements.mainTrigger) {
        elements.mainTrigger.onclick = async function () {
            const options = window.portfolioBuildSellerCategoryOptions(user).map((item) => ({
                value: item.id,
                label: item.title
            }));

            options.unshift({
                value: '',
                label: window.portfolioSellerSearchL('search_modal_main_category_default', 'كل الفئات الرئيسية', 'All Main Categories')
            });

            await window.portfolioShowQuickSelectModal(
                window.portfolioSellerSearchL('search_modal_main_category_label', 'الفئة الرئيسية', 'Main Category'),
                options,
                searchState.mainCategory,
                (selected) => {
                    if (store?.patchSellerSearch) {
                        store.patchSellerSearch({
                            mainCategory: String(selected.value || ''),
                            subCategory: ''
                        }, { source: 'seller-search-main-category' });
                    } else {
                        searchState.mainCategory = String(selected.value || '');
                        searchState.subCategory = '';
                    }
                    window.portfolioUpdateSellerSearchTriggerDisplays(user);
                },
                'success'
            );
        };
    }

    if (elements.subTrigger) {
        elements.subTrigger.onclick = async function () {
            if (elements.subTrigger.classList.contains('disabled')) return;

            const mainCategory = window.portfolioGetSellerCategoryById(user, searchState.mainCategory);
            const options = Array.isArray(mainCategory?.subcategories)
                ? mainCategory.subcategories.map((item) => ({
                    value: item.id,
                    label: item.title
                }))
                : [];

            options.unshift({
                value: '',
                label: window.portfolioSellerSearchL('search_modal_sub_category_default', 'كل الفئات الفرعية', 'All Sub Categories')
            });

            await window.portfolioShowQuickSelectModal(
                window.portfolioSellerSearchL('search_modal_sub_category_label', 'الفئة الفرعية', 'Sub Category'),
                options,
                searchState.subCategory,
                (selected) => {
                    if (store?.patchSellerSearch) {
                        store.patchSellerSearch({
                            subCategory: String(selected.value || '')
                        }, { source: 'seller-search-sub-category' });
                    } else {
                        searchState.subCategory = String(selected.value || '');
                    }
                    window.portfolioUpdateSellerSearchTriggerDisplays(user);
                },
                'info'
            );
        };
    }

    if (elements.sortTrigger) {
        elements.sortTrigger.onclick = async function () {
            const options = [
                {
                    value: 'default',
                    label: window.portfolioSellerSearchL('search_modal_sort_default', 'الترتيب الافتراضي', 'Default Sorting')
                },
                {
                    value: 'price-asc',
                    label: window.portfolioSellerSearchL('search_modal_sort_price_asc', 'الأقل سعراً', 'Price: Low to High')
                },
                {
                    value: 'price-desc',
                    label: window.portfolioSellerSearchL('search_modal_sort_price_desc', 'الأعلى سعراً', 'Price: High to Low')
                }
            ];

            await window.portfolioShowQuickSelectModal(
                window.portfolioSellerSearchL('search_modal_sort_label', 'ترتيب حسب', 'Sort By'),
                options,
                searchState.sort,
                (selected) => {
                    if (store?.patchSellerSearch) {
                        store.patchSellerSearch({
                            sort: String(selected.value || 'default')
                        }, { source: 'seller-search-sort' });
                    } else {
                        searchState.sort = String(selected.value || 'default');
                    }
                    window.portfolioUpdateSellerSearchTriggerDisplays(user);
                },
                'warning'
            );
        };
    }

    elements.searchButton.onclick = function () {
        window.portfolioExecuteSellerSearch(user);
    };

    window.portfolioRefreshSellerSearchControls(user);
};
