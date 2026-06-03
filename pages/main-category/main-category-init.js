/**
 * @file main-category-init.js
 * @description Initialization logic for the main category page.
 * NOTE: mainCategoryState is declared in main-category-api.js (first script loaded).
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


/**
 * @description Show product gallery for the selected subcategory.
 * @async
 * @function mainCategory_showProductGallery
 * @param {string|number} mainId - Main category ID.
 * @param {string|number} subId - Subcategory ID.
 * @returns {Promise<void>}
 */
async function mainCategory_showProductGallery(mainId, subId) {
    try {
        var galleryContent = document.getElementById('main-category-gallery-content');
        if (!galleryContent) return;

        galleryContent.classList.remove('list-view');
        galleryContent.classList.remove('merchants-view');
        galleryContent.innerHTML = '<div class="loader" style="margin: 20px auto;"></div>';
        mainCategory_resetToggleIcon();

        var products = await mainCategory_getProductsByCategory(mainId, subId);
        var subcategory = await mainCategory_getSubcategoryById(mainId, subId);

        if (products && products.length) {
            mainCategory_renderProductGallery(products);
            mainCategory_updateGalleryControls(true, subcategory);
        } else {
            galleryContent.innerHTML = '<div class="main-category-empty">' + (window.langu ? window.langu('cat_no_products_message') : 'لا توجد خدمات') + '</div>';
            mainCategory_updateGalleryControls(false, subcategory);
        }
    } catch (error) {
        console.error('[MainCategory] Failed to show product gallery:', error);
    }
}

/**
 * @description Show merchant/provider gallery for a specific category.
 * @async
 * @function mainCategory_showMerchantGallery
 * @param {string|number} mainId - Main category ID.
 * @returns {Promise<void>}
 */
async function mainCategory_showMerchantGallery(mainId) {
    try {
        var galleryContent = document.getElementById('main-category-gallery-content');
        if (!galleryContent) return;

        galleryContent.innerHTML = '<div class="loader" style="margin: 20px auto;"></div>';

        // Hide subcategories container as delivery services usually don't have them in the UI
        var subContainer = document.getElementById('main-category-subcategories');
        if (subContainer) subContainer.style.display = 'none';

        var merchants = await mainCategory_getMerchantsByMainCategory(mainId);

        if (merchants && merchants.length) {
            mainCategory_renderMerchantGallery(merchants);
            mainCategory_updateGalleryControls(false, null);
        } else {
            galleryContent.innerHTML = '<div class="main-category-empty">' + (window.langu ? window.langu('cat_empty_list_error') : 'لا يوجد مقدمي خدمة حالياً') + '</div>';
            mainCategory_updateGalleryControls(false, null);
        }
    } catch (error) {
        console.error('[MainCategory] Failed to show merchant gallery:', error);
    }
}

/**
 * @description Initialize the main category page.
 * @async
 * @function mainCategory_init
 * @returns {Promise<void>}
 */
async function mainCategory_init() {
    try {
        mainCategory_bindGalleryControls();

        var selection = mainCategory_getSelection();
        if (!selection || !selection.id) {
            console.warn('[MainCategory] No selection found, redirecting home.');
            window.location.replace('/');
            return;
        }

        var category = mainCategory_getVirtualCategory(selection)
            || await mainCategory_getVirtualCategoryById(selection.id)
            || await mainCategory_getMainCategoryById(selection.id);
        if (!category) {
            mainCategory_renderEmptyState(window.langu('main_category_load_error') || 'Unable to load category data.');
            return;
        }

        // Wait for translations to be ready before rendering UI components that use window.langu
        if (window.loadIndexTranslations) {
            await window.loadIndexTranslations();
        }

        mainCategoryState.mainId = String(category.id);
        mainCategory_renderHeader(category);

        var galleryEl = document.getElementById('main-category-gallery');

        if (String(category.id) === '46') {
            // ✅ Show Gallery for Delivery Services
            if (galleryEl) galleryEl.style.display = 'block';
            await mainCategory_showMerchantGallery(category.id);
        } else {
            // ❌ Hide Gallery for any other category
            if (galleryEl) galleryEl.style.display = 'none';
            mainCategory_renderSubcategories(category);
        }
    } catch (error) {
        console.error('[MainCategory] Unexpected init error:', error);
        mainCategory_renderEmptyState(window.langu('main_category_unexpected_error') || 'An unexpected error occurred while loading.');
    }
}

// Initialize page after DOM and category data are ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mainCategory_init);
} else {
    mainCategory_init();
}
