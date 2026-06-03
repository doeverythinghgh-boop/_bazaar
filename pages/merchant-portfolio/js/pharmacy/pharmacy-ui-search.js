/**
 * @file pages/merchant-portfolio/js/pharmacy/pharmacy-ui-search.js
 * @description Handles rendering of search results for pharmacy storefront.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


(function () {
    const { renderFeedback, getLanguageValue } = window.pharmacyUIBase;
    const { ensureSubcategoriesRow, ensureFilteredProductsContainer } = window.pharmacyUILayout;
    const { renderIngredientCards } = window.pharmacyUIIngredients;

    window.portfolioRenderPharmacySearchResults = async function (results) {
        const PAGE_SIZE = 5;
        const grid = document.getElementById('portfolio-products-grid');
        if (!grid) return;
        const row = ensureSubcategoriesRow(grid);

        const container = ensureFilteredProductsContainer(row);
        row.style.display = 'none'; // Hide subcategories row during text search per user request

        if (!results || results.length === 0) {
            container.innerHTML = '';
            renderFeedback(container, {
                iconClass: 'fas fa-box-open',
                message: window.portfolioSellerSearchL('no_products', 'لا توجد نتائج بحث مطابقة', 'No search results found')
            });
            const ss = window.portfolioEnsureSellerSearchState?.();
            if (ss) {
                ss.totalMatched = 0;
                ss.visibleCount = 0;
            }
            const loadMoreBtn = document.getElementById('btn-load-more-products');
            if (loadMoreBtn) loadMoreBtn.style.display = 'none';
            if (typeof window.portfolioSyncSearchLoadMoreButton === 'function') {
                window.portfolioSyncSearchLoadMoreButton();
            }
            return;
        }

        const refData = (window.pharmacyState?.referenceData) || {};
        const normalizedItems = results.map(item => ({
            id: item.id,
            name_ar: item.productName || item.name_ar,
            name_en: item.name_en || item.productName,
            brand_ar: item.brand_ar || [],
            brand_en: item.brand_en || [],
            image_url: item.image_url,
            is_prescription_required: !!item.is_prescription_required,
            isMerchant: !!item.isMerchant,
            mainId: item.mainId || item.MainCategory,
            subId: item.subId || item.SubCategory,
            mainTitle: item.mainTitle || (item.MainCategory ? window.portfolioResolveCategoryTitle(item.MainCategory) : ''),
            subTitle: item.subTitle || (item.SubCategory ? window.portfolioResolveCategoryTitle(item.MainCategory, item.SubCategory) : ''),
            isSearchResult: true,
            description_ar: item.description_ar,
            description_en: item.description_en,
            price: item.price,
            unit_ar: item.unit_ar,
            unit_en: item.unit_en,
            active_ingredients_list: item.active_ingredients_list || item.active_ingredients || item.ingredients
        }));

        const ss = window.portfolioEnsureSellerSearchState();

        // Consolidate visibleCount: in-memory state wins because load-more updates it before re-rendering.
        const searchMeta = window.portfolioLoadSearchStateFromLocal?.(new URLSearchParams(window.location.search).get('user_key'));

        let visibleCount = PAGE_SIZE;
        if (ss.isActive && Number.isFinite(Number(ss.visibleCount)) && Number(ss.visibleCount) > 0) {
            visibleCount = Number(ss.visibleCount);
        } else if (searchMeta && searchMeta.isActive && searchMeta.visibleCount) {
            visibleCount = searchMeta.visibleCount;
            console.log(`[Event] Search Restoration: Using persistent visibleCount of ${visibleCount} items.`);
        } else if (window.pharmacyRestoringState?.isSearchResult && window.pharmacyRestoringState?.visibleCount) {
            visibleCount = window.pharmacyRestoringState.visibleCount;
        }

        visibleCount = Math.min(normalizedItems.length, Math.max(0, Number(visibleCount) || PAGE_SIZE));
        if (window.pharmacyUIBase?.state) window.pharmacyUIBase.state.visibleCount = visibleCount;

        console.time('[Runtime] Search Results Rendering');
        container.innerHTML = '';

        const title = document.createElement('h2');
        title.className = 'pharmacy-search-results-title';
        title.innerHTML = `<i class="fas fa-search"></i> ${window.portfolioSellerSearchL('search_results_title', 'نتائج البحث', 'Search Results')}`;
        container.appendChild(title);

        // Helper to attach teleport clicks
        const attachClick = (item, card) => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (typeof window.portfolioPharmacyTeleport === 'function') {
                    window.portfolioPharmacyTeleport(item);
                }
            });
        };

        const renderBatch = (items) => {
            renderIngredientCards(container, items, refData, true);
            const allCards = container.querySelectorAll('.portfolio-product-card');
            // Attach clicks to new cards only
            const startIndex = allCards.length - items.length;
            items.forEach((item, i) => {
                attachClick(item, allCards[startIndex + i]);
            });
        };

        renderBatch(normalizedItems.slice(0, visibleCount));

        // Update "Load More" button for search results
        const loadMoreBtn = document.getElementById('btn-load-more-products');
        const actionsContainer = document.getElementById('portfolio-products-actions');
        if (actionsContainer) actionsContainer.style.display = 'flex';
        if (loadMoreBtn) {
            loadMoreBtn.style.display = normalizedItems.length > visibleCount ? 'flex' : 'none';
        }
        console.timeEnd('[Runtime] Search Results Rendering');

        // --- UPDATE GLOBAL SEARCH STATE ---
        const store = window.PortfolioStore || null;
        if (store?.patchSellerSearch) {
            store.patchSellerSearch({
                totalMatched: normalizedItems.length,
                visibleCount: visibleCount
            }, { source: 'pharmacy-search-render-sync' });
        } else {
            ss.totalMatched = normalizedItems.length;
            ss.visibleCount = visibleCount;
        }

        // --- SYNC GLOBAL SEARCH UI ---
        if (typeof window.portfolioSyncSearchLoadMoreButton === 'function') {
            window.portfolioSyncSearchLoadMoreButton();
        }
        if (typeof window.portfolioUpdateSellerSearchButtonState === 'function') {
            window.portfolioUpdateSellerSearchButtonState();
        }

        console.log(`[Status] Displaying ${visibleCount} of ${normalizedItems.length} search results.`);
    };
})();
