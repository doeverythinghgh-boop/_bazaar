/**
 * @file portfolio-fetch-ui-sync.js
 * @description UI synchronization logic for product fetching.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

window.portfolioInitFetchSkeleton = function (grid, limit) {
    if (!grid) return;
    const prodSec = document.getElementById('portfolio-products-section');
    if (prodSec) prodSec.style.display = 'block';
    grid.style.display = 'grid';
    grid.innerHTML = '';
    for (let i = 0; i < limit; i += 1) {
        grid.insertAdjacentHTML('beforeend', `
            <div class="product-skeleton-card skeleton-container">
                <div class="skeleton-img skeleton-item"></div>
                <div class="skeleton-text skeleton-item"></div>
                <div class="skeleton-price skeleton-item"></div>
            </div>
        `);
    }
};

window.portfolioUpdateFetchButton = function (btn, isLoading) {
    if (!btn) return;
    btn.disabled = isLoading;
    if (isLoading) {
        btn.innerText = window.langu?.('search_loading_status') || 'جاري التحميل...';
    } else {
        btn.innerText = window.langu?.('search_modal_load_more') || 'عرض المزيد';
    }
};
