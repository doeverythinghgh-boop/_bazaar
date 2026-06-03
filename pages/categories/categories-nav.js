/**
 * @file pages/categories/categories-nav.js
 * @description Core navigation functions for categories.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


/**
 * @description Navigate to the main-category page using the category id in the URL.
 * @function categories_navigateToMainCategory
 */
function categories_navigateToMainCategory(category) {
    try {
        if (!category || typeof category.id === 'undefined') return;

        // Standalone navigation
        window.location.href = '/pages/main-category/main-category.html?id=' + encodeURIComponent(String(category.id));
    } catch (error) {
        console.error('[categories_navigateToMainCategory] Error:', error);
    }
}

/**
 * @description Handle main category click and route to the dedicated page.
 * @function categories_onMainCategoryClick
 */
function categories_onMainCategoryClick(event) {
    try {
        const item = event.currentTarget;
        if (!item || !item.__categoryData) return;

        item.classList.add("pulse-click");
        setTimeout(() => item.classList.remove("pulse-click"), 400);

        categories_navigateToMainCategory(item.__categoryData);
    } catch (error) {
        console.error('[categories_onMainCategoryClick] Error:', error);
    }
}
