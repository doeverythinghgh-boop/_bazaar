/**
 * @file pages/productAdd/js/add1_ui_category.js
 * @description Category selector rendering and category-driven page refresh for Product Add.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


async function add1_applyCategoryDrivenUi() {
    if (typeof window.ProductCategoryPageCore === 'undefined' || typeof ProductStateManager === 'undefined') {
        return null;
    }

    const selected = ProductStateManager.getSelectedCategories() || {};
    if (window.ProductCategoryLogger) window.ProductCategoryLogger.info('AddPage', 'apply-category-driven-ui', selected);
    else console.log('[Add1][CategoryUI] apply-category-driven-ui', selected);
    return window.ProductCategoryPageCore.applyAddPage(selected.mainId || null, selected.subId || null);
}

async function add1_renderCategories() {
    try {
        if (typeof window.ProductCategoryPageCore === 'undefined') return;
        if (window.ProductCategoryLogger) window.ProductCategoryLogger.info('AddPage', 'render-categories-start');
        else console.log('[Add1][CategoryUI] render-categories-start');

        // Note: The selector dropdown has been removed because the MainCategory and SubCategory 
        // are now strictly passed via URL from the Merchant Control Panel.
        await add1_applyCategoryDrivenUi();

        if (window.ProductCategoryLogger) window.ProductCategoryLogger.info('AddPage', 'initial-category-ui-applied');
        else console.log('[Add1][CategoryUI] initial-category-ui-applied');

    } catch (error) {
        console.error('[Add1] Error rendering categories:', error);
    }
}

// End of file
