/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

window.portfolioGetActivePharmacySubPagination = function (userKey) {
    const activeSubId = window.pharmacyActiveSubCategoryId || window.pharmacyRestoringState?.activeSubCategoryId || null;
    if (!activeSubId || !userKey || !window.portfolioPersistence) return null;

    const cacheKey = `subcat_${activeSubId}`;
    const subData = window.portfolioPersistence.get(userKey, 'pharmacy_sub_state', cacheKey, 0);
    const ingredients = Array.isArray(subData?.ingredients) ? subData.ingredients : [];
    if (!ingredients.length) return null;

    const visibleFromUi = Number(window.pharmacyUIBase?.state?.visibleCount);
    const visibleFromState = Number(subData?.visibleCount);
    const visibleCount = Math.min(
        ingredients.length,
        Math.max(
            0,
            Number.isFinite(visibleFromUi) && visibleFromUi > 0
                ? visibleFromUi
                : (Number.isFinite(visibleFromState) && visibleFromState > 0 ? visibleFromState : 5)
        )
    );

    return {
        activeSubId,
        cacheKey,
        subData,
        ingredients,
        visibleCount,
        total: ingredients.length,
        hasMore: visibleCount < ingredients.length
    };
};

window.portfolioLoadMorePharmacySubResults = function () {
    const userKey = new URLSearchParams(window.location.search).get('user_key');
    const subPagination = window.portfolioGetActivePharmacySubPagination ? window.portfolioGetActivePharmacySubPagination(userKey) : null;

    if (!subPagination || !subPagination.hasMore) {
        return false;
    }

    console.log(`[Mirror][Pagination] Pharmacy sub-category pagination triggered for ID: ${subPagination.activeSubId}`);
    const PAGE_SIZE = 5;
    const newVisibleCount = Math.min(subPagination.total, subPagination.visibleCount + PAGE_SIZE);

    // Correct Container: Pharmacy uses a separate container for sub-categories
    let productsContainer = document.getElementById('pharmacy-filtered-products-container');
    if (!productsContainer && window.pharmacyUILayout?.ensureFilteredProductsContainer) {
        const row = document.getElementById('pharmacy-subcats-row');
        if (row) productsContainer = window.pharmacyUILayout.ensureFilteredProductsContainer(row);
    }

    // Fallback to main grid if filtered container is not found (though unlikely in this context)
    if (!productsContainer) {
        productsContainer = document.getElementById('portfolio-products-grid');
    }

    const subCategory = { id: subPagination.activeSubId };

    if (window.pharmacyUISubRenderer && typeof window.pharmacyUISubRenderer.renderSubCategoryContent === 'function' && productsContainer) {
        console.log(`[Mirror][Pagination] Increasing visibleCount from ${subPagination.visibleCount} to ${newVisibleCount}`);
        window.pharmacyUISubRenderer.renderSubCategoryContent(
            productsContainer,
            subPagination.ingredients,
            newVisibleCount,
            0,
            subCategory,
            subPagination.cacheKey,
            userKey
        );
        return true;
    }

    return false;
};
