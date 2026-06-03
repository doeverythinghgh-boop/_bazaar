/**
 * @file pages/merchant-portfolio/js/pharmacy/pharmacy-ui-sub-handler.js
 * @description Click handling and state management for pharmacy sub-categories.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


(function () {
    const { renderFeedback, fetchJsonCached } = window.pharmacyUIBase;

    async function handleSubCategoryClick(e, category, subCategory, pill, row, productsContainer) {
        const urlParams = new URLSearchParams(window.location.search).get('user_key');
        const userKey = urlParams;

        if (e && e.isTrusted) {
            console.log(`[Event] User Clicked: Sub-Category "${subCategory.id}"`);

            // Clear persistent search on category switch
            if (typeof window.portfolioClearSearchStateFromLocal === 'function') {
                window.portfolioClearSearchStateFromLocal(userKey);
            }

            console.log(`[Search] Sub-category changed. Search text and filters preserved.`);
        }

        console.log(`[Mirror][Start] handleSubCategoryClick: Processing section "${subCategory.id}"...`);
        console.time(`[Mirror][Runtime] Sub-Category Loading: ${subCategory.id}`);

        // Save previous sub-category scroll before switching
        if (window.pharmacyActiveSubCategoryId && window.portfolioPersistence) {
            const prevState = window.portfolioPersistence.get(userKey, 'pharmacy_sub_state', `subcat_${window.pharmacyActiveSubCategoryId}`, 0) || {};
            prevState.scrollY = window.scrollY;
            window.portfolioPersistence.save(userKey, 'pharmacy_sub_state', `subcat_${window.pharmacyActiveSubCategoryId}`, 0, prevState);
        }

        window.pharmacyActiveSubCategoryId = subCategory.id;
        Array.from(row.children).forEach((child) => child.classList.remove('is-active'));
        pill.classList.add('is-active');

        // Proactively save state on real user click only. Restoration saves after render.
        if (e && e.isTrusted && typeof window.portfolioSaveNavigationState === 'function') {
            window.portfolioSaveNavigationState(userKey);
        }

        // State Management: Load full state from LocalDBStorage
        let subState = null;
        const cacheKeyParams = `subcat_${subCategory.id}`;
        if (window.portfolioPersistence) {
            console.time(`[Mirror][Runtime] Sub-Category Cache Lookup`);
            subState = window.portfolioPersistence.get(userKey, 'pharmacy_sub_state', cacheKeyParams, 0);
            console.timeEnd(`[Mirror][Runtime] Sub-Category Cache Lookup`);
        }

        let ingredients = subState?.ingredients || null;
        let restoredVisibleCount = subState?.visibleCount || 5;
        let restoredScrollY = subState?.scrollY || 0;

        // Priority: If we are specifically restoring from a 'Back' action (pharmacyRestoringState),
        // use those values if they are more specific to this current session interaction.
        if (window.pharmacyRestoringState && window.pharmacyRestoringState.activeSubCategoryId == subCategory.id) {
            if (window.pharmacyRestoringState.visibleCount) restoredVisibleCount = window.pharmacyRestoringState.visibleCount;
            if (window.pharmacyRestoringState.scroll) restoredScrollY = window.pharmacyRestoringState.scroll;
        }

        if (!ingredients) {
            console.log(`[Status] Sub-category cache miss. Fetching ingredients...`);
            renderFeedback(productsContainer, {
                isLoading: true,
                iconClass: 'fas fa-spinner',
                message: window.portfolioSellerSearchL('search_loading_status', 'جاري التحميل...', 'Loading...')
            });

            try {
                if (subCategory.isCustom) {
                    ingredients = await window.PharmacyAPI.getProductsBySubCategory(userKey, subCategory.id);
                } else {
                    const [categoryData, subRefData] = await Promise.all([
                        fetchJsonCached(category.dataFile),
                        category.refFile ? fetchJsonCached(category.refFile) : Promise.resolve(null)
                    ]);
                    const subData = Array.isArray(categoryData?.sub)
                        ? categoryData.sub.find((item) => String(item.id) === String(subCategory.id))
                        : null;
                    const staticIngredients = (subData?.active_ingredients || subCategory.active_ingredients || []).slice();

                    let customAddedProducts = [];
                    try {
                        customAddedProducts = await window.PharmacyAPI.getProductsBySubCategory(userKey, subCategory.id);
                    } catch (error) {
                        console.warn("Failed to fetch custom override products", error);
                    }
                    const customizedCatalogIds = new Set(customAddedProducts
                        .map((product) => product?.original_catalog_id)
                        .filter(Boolean)
                        .map(String));
                    const visibleStaticIngredients = staticIngredients.filter((item) => {
                        const rawId = Array.isArray(item?.id) ? item.id[0] : item?.id;
                        return !customizedCatalogIds.has(String(rawId));
                    });
                    ingredients = [...customAddedProducts, ...visibleStaticIngredients];
                }

                if (window.portfolioPersistence && ingredients && ingredients.length > 0) {
                    const newState = { ingredients, visibleCount: 5, scrollY: 0 };
                    window.portfolioPersistence.save(userKey, 'pharmacy_sub_state', cacheKeyParams, 0, newState);
                }
            } catch (error) {
                console.error('[Portfolio Pharmacy] Failed to load sub-category:', error);
                renderFeedback(productsContainer, {
                    iconClass: 'fas fa-exclamation-circle',
                    message: window.portfolioSellerSearchL('port_fetch_error_text', 'حدث خطأ أثناء جلب الخدمات', 'Unable to load products')
                });
                console.timeEnd(`[Runtime] Sub-Category Loading: ${subCategory.id}`);
                return;
            }
        } else {
            console.log(`[Status] Sub-category ingredients loaded from cache (${ingredients.length} items).`);
        }

        if (!ingredients || ingredients.length === 0) {
            productsContainer.innerHTML = '';
            renderFeedback(productsContainer, {
                iconClass: 'fas fa-box-open',
                message: window.portfolioSellerSearchL('no_products', 'لا توجد خدمات مضافة لهذا القسم', 'No products available')
            });
            const loadMoreBtn = document.getElementById('btn-load-more-products');
            if (loadMoreBtn) loadMoreBtn.style.display = 'none';
            return;
        }

        // Render products and restore scroll
        if (typeof window.pharmacyUISubRenderer?.renderSubCategoryContent === 'function') {
            window.pharmacyUISubRenderer.renderSubCategoryContent(productsContainer, ingredients, restoredVisibleCount, restoredScrollY, subCategory, cacheKeyParams, userKey);
        }

        if (typeof window.portfolioSaveNavigationState === 'function') {
            setTimeout(() => window.portfolioSaveNavigationState(userKey), 0);
        }

        console.timeEnd(`[Mirror][Runtime] Sub-Category Loading: ${subCategory.id}`);
        console.log(`[Mirror][End] handleSubCategoryClick: Section "${subCategory.id}" ready.`);

        // Handle horizontal row scroll restoration (pills list) when returning from a product page
        if (window.pharmacyRestoringState && window.pharmacyRestoringState.activeSubCategoryId == subCategory.id) {
            if (window.pharmacyRestoringState.rowScroll) {
                console.log(`[Diagnostic] Restoring horizontal row scroll: ${window.pharmacyRestoringState.rowScroll}px`);
                row.scrollLeft = window.pharmacyRestoringState.rowScroll;
            }
        }
    }

    window.pharmacyUISubHandler = {
        handleSubCategoryClick
    };
})();
