/**
 * @file pages/merchant-portfolio/js/portfolio-search-setup.js
 * @description Merchant search setup and event wiring.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


/**
 * Helper to inject the search modal HTML if not present.
 */
window.portfolioEnsureSearchModalInjected = async function() {
    if (document.getElementById('portfolio-search-modal-overlay')) return true;

    try {
        console.log(`[Search-Upgrade] Injecting standalone search modal component...`);
        const response = await fetch('components/portfolio-search-modal.html');
        if (!response.ok) throw new Error('Failed to load search modal component');

        const html = await response.text();
        const injectionPoint = document.getElementById('portfolio-main-container') || document.body;
        injectionPoint.insertAdjacentHTML('beforeend', html);
        return true;
    } catch (err) {
        console.error(`[Search-Upgrade] Error injecting search modal:`, err);
        return false;
    }
};

window.portfolioSetupSellerSearch = async function (user) {
    // 1. Ensure modal is in DOM before wiring
    const injected = await window.portfolioEnsureSearchModalInjected();
    if (!injected) return;

    const elements = window.portfolioGetSellerSearchTriggerElements();
    if (!elements.panel || !elements.toggleButton) return;

    const searchState = window.portfolioEnsureSellerSearchState();
    const store = window.PortfolioStore || null;

    // --- Main Toggle Action ---
    elements.toggleButton.onclick = function (event) {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }
        window.portfolioToggleSellerSearchPanel(user);
    };

    // --- Modal Internal Actions ---
    if (elements.closeButton) {
        elements.closeButton.onclick = () => window.portfolioCloseSellerSearchPanelSafely();
    }

    // Integrated Search Input Logic (Apple-style)
    if (elements.inputField) {
        // Sync initial state
        elements.inputField.value = searchState.query || '';

        elements.inputField.oninput = function() {
            const val = elements.inputField.value.trim();
            if (elements.clearTextButton) {
                elements.clearTextButton.style.display = val.length > 0 ? 'block' : 'none';
            }
            // Update state without triggering search (Real-time removal)
            if (store?.patchSellerSearch) {
                store.patchSellerSearch({ query: val }, { source: 'modal-input-sync' });
            } else {
                searchState.query = val;
            }
        };

        // Trigger search on Enter
        elements.inputField.onkeypress = function(e) {
            if (e.key === 'Enter') {
                window.portfolioExecuteSellerSearch(user);
            }
        };
    }

    if (elements.clearTextButton) {
        elements.clearTextButton.onclick = function() {
            elements.inputField.value = '';
            elements.inputField.dispatchEvent(new Event('input'));
            elements.inputField.focus();
        };
    }

    if (elements.clearButton) {
        elements.clearButton.onclick = function () {
            window.portfolioResetSellerSearch();
            // Re-open/keep open modal after reset
            if (store?.patchSellerSearch) {
                store.patchSellerSearch({ isOpen: true }, { source: 'merchant-search-clear' });
            } else {
                searchState.isOpen = true;
            }
            elements.panel.style.display = 'flex';
            if (elements.inputField) elements.inputField.value = '';
            window.portfolioUpdateSellerSearchMeta();
            window.portfolioUpdateSellerSearchButtonState();
        };
    }

    // --- Filter Triggers (Now inside Modal) ---
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
                        }, { source: 'merchant-search-main-category' });
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
                        }, { source: 'merchant-search-sub-category' });
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
                { value: 'default', label: window.portfolioSellerSearchL('search_modal_sort_default', 'الترتيب الافتراضي', 'Default Sorting') },
                { value: 'price-asc', label: window.portfolioSellerSearchL('search_modal_sort_price_asc', 'الأقل سعراً', 'Price: Low to High') },
                { value: 'price-desc', label: window.portfolioSellerSearchL('search_modal_sort_price_desc', 'الأعلى سعراً', 'Price: High to Low') }
            ];

            await window.portfolioShowQuickSelectModal(
                window.portfolioSellerSearchL('search_modal_sort_label', 'ترتيب حسب', 'Sort By'),
                options,
                searchState.sort,
                (selected) => {
                    if (store?.patchSellerSearch) {
                        store.patchSellerSearch({ sort: String(selected.value || 'default') }, { source: 'merchant-search-sort' });
                    } else {
                        searchState.sort = String(selected.value || 'default');
                    }
                    window.portfolioUpdateSellerSearchTriggerDisplays(user);
                },
                'warning'
            );
        };
    }

    if (elements.searchButton) {
        elements.searchButton.onclick = () => window.portfolioExecuteSellerSearch(user);
    }

    // --- Modal Outside Listeners ---
    if (!window.portfolioSearchListenersAttached) {
        // Restricted closure: Modal can only be closed via the dedicated close button (now in footer)
        // or explicit actions. Click-outside closure is disabled per user request.

        window.portfolioSearchListenersAttached = true;
    }

    window.portfolioRefreshSellerSearchControls(user);
};
