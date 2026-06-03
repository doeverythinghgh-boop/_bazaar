/**
 * @file pages/merchant-portfolio/js/pharmacy/pharmacy-ui-sub-renderer.js
 * @description Rendering logic and pagination for pharmacy sub-category ingredients.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


(function () {
    const { renderIngredientCards } = window.pharmacyUIIngredients;

    function renderSubCategoryContent(container, ingredients, visibleCount, scrollY, subCategory, cacheKey, userKey) {
        console.log(`[Mirror][Start] renderSubCategoryContent: Rendering ${visibleCount} items for "${subCategory.id}"...`);
        console.time(`[Mirror][Runtime] renderSubCategoryContent`);

        const safeVisibleCount = Math.min(
            Array.isArray(ingredients) ? ingredients.length : 0,
            Math.max(0, Number(visibleCount) || 5)
        );
        if (window.pharmacyUIBase?.state) window.pharmacyUIBase.state.visibleCount = safeVisibleCount;

        container.innerHTML = '';
        renderIngredientCards(container, ingredients.slice(0, safeVisibleCount), (window.pharmacyState?.referenceData) || {});

        // Scroll Restoration
        if (scrollY > 0) {
            console.log(`[Mirror][Restoration] Restoring sub-category scroll position: ${scrollY}px`);
            setTimeout(() => {
                window.scrollTo({ top: scrollY, behavior: 'instant' });
            }, 100);
        }

        // Pagination setup
        const loadMoreBtn = document.getElementById('btn-load-more-products');
        const actionsContainer = document.getElementById('portfolio-products-actions');
        if (actionsContainer) actionsContainer.style.display = ingredients.length > safeVisibleCount ? 'flex' : 'none';
        if (loadMoreBtn) {
            loadMoreBtn.style.display = ingredients.length > safeVisibleCount ? 'flex' : 'none';
        }

        if (window.portfolioPersistence && userKey && cacheKey) {
            const savedState = window.portfolioPersistence.get(userKey, 'pharmacy_sub_state', cacheKey, 0) || {};
            savedState.ingredients = ingredients;
            savedState.visibleCount = safeVisibleCount;
            if (scrollY > 0) savedState.scrollY = scrollY;
            window.portfolioPersistence.save(userKey, 'pharmacy_sub_state', cacheKey, 0, savedState);
        }

        if (typeof window.portfolioSyncSearchLoadMoreButton === 'function') {
            window.portfolioSyncSearchLoadMoreButton();
        }
        console.timeEnd(`[Mirror][Runtime] renderSubCategoryContent`);
        console.log(`[Mirror][End] renderSubCategoryContent: Finished.`);
    }

    window.pharmacyUISubRenderer = {
        renderSubCategoryContent
    };
})();
