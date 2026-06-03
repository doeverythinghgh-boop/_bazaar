/**
 * @file main-category-events.js
 * @description Event handlers and bindings for the main category page.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


/**
 * @description Bind gallery control buttons (view all and toggle).
 * @function mainCategory_bindGalleryControls
 * @returns {void}
 */
function mainCategory_bindGalleryControls() {
    try {
        var viewAllBtn = document.getElementById('main-category-view-all-btn');
        var toggleBtn = document.getElementById('main-category-view-toggle');
        if (viewAllBtn) viewAllBtn.addEventListener('click', mainCategory_onViewAllClick);
        if (toggleBtn) toggleBtn.addEventListener('click', mainCategory_onToggleViewClick);
    } catch (error) {
        console.error('[MainCategory] Failed to bind gallery controls:', error);
    }
}

/**
 * @description Handle subcategory card click.
 * @function mainCategory_onSubcategoryClick
 * @param {MouseEvent} event - Click event.
 * @returns {void}
 */
function mainCategory_onSubcategoryClick(event) {
    try {
        var target = event.currentTarget;
        if (!target) return;

        var mainId = target.getAttribute('data-main-id');
        var subId = target.getAttribute('data-sub-id');
        var targetMainId = target.getAttribute('data-target-main-id');

        if (targetMainId && !subId) {
            LocalDBStorage.setItem('selectedMainCategory', JSON.stringify({
                id: String(targetMainId),
                timestamp: Date.now()
            }));
            window.location.href = '/pages/main-category/main-category.html?id=' + encodeURIComponent(String(targetMainId));
            return;
        }

        if (!mainId || !subId) return;

        // ✅ New: Navigate directly to search page with these filters
        var searchData = {
            mainId: String(mainId),
            subId: String(subId),
            timestamp: Date.now()
        };
        LocalDBStorage.setItem('pendingCategorySearch', JSON.stringify(searchData));

        // Clear search session state to force fresh results
        LocalDBSession.removeItem('search_page_state');

        // Smooth transition to NEW Subcategory Products page
        var subcategoryUrl = '/pages/subcategory-products/subcategory-products.html?mainId='
            + encodeURIComponent(String(mainId))
            + '&subId='
            + encodeURIComponent(String(subId));
        if (typeof navigateTo === 'function') {
            navigateTo(subcategoryUrl, "Category Products");
        } else {
            window.location.href = subcategoryUrl;
        }
    } catch (error) {
        console.error('[MainCategory] Failed to handle subcategory click:', error);
    }
}

/**
 * @description Handle product click to open product view.
 * @function mainCategory_onProductClick
 * @param {MouseEvent} event - Click event.
 * @returns {void}
 */
function mainCategory_onProductClick(event) {
    try {
        var target = event.currentTarget;
        if (!target) return;

        var raw = target.getAttribute('data-product');
        if (!raw) return;

        var product = JSON.parse(raw);
        if (!product) return;

        if (typeof mapProductData === 'function' && typeof loadProductView === 'function') {
            var mapped = mapProductData(product);
            loadProductView(mapped, true);
        }
    } catch (error) {
        console.error('[MainCategory] Failed to open product view:', error);
    }
}

/**
 * @description Handle view-all click to open search page with filters.
 * @function mainCategory_onViewAllClick
 * @returns {void}
 */
function mainCategory_onViewAllClick() {
    try {
        if (!mainCategoryState.mainId || !mainCategoryState.subId) return;

        var searchData = {
            mainId: mainCategoryState.mainId,
            subId: mainCategoryState.subId,
            timestamp: Date.now()
        };
        LocalDBStorage.setItem('pendingCategorySearch', JSON.stringify(searchData));

        window.dispatchEvent(new Event('request-category-search'));

        var searchNavBtn = document.getElementById('index-search-btn');
        if (searchNavBtn) {
            searchNavBtn.click();
        } else {
            window.location.href = '/pages/search/search.html';
        }
    } catch (error) {
        console.error('[MainCategory] Failed to open search:', error);
    }
}

/**
 * @description Handle gallery view toggle (grid/list).
 * @function mainCategory_onToggleViewClick
 * @returns {void}
 */
function mainCategory_onToggleViewClick() {
    try {
        var galleryContent = document.getElementById('main-category-gallery-content');
        var toggleBtn = document.getElementById('main-category-view-toggle');
        if (!galleryContent || !toggleBtn) return;

        galleryContent.classList.toggle('list-view');
        var isList = galleryContent.classList.contains('list-view');
        toggleBtn.innerHTML = isList ? '<i class="fas fa-th"></i>' : '<i class="fas fa-list"></i>';

        var items = galleryContent.querySelectorAll('.main-category-product-item');
        for (var i = 0; i < items.length; i++) {
            if (typeof items[i].classList !== 'undefined') {
                if (isList) {
                    items[i].classList.add('list-mode');
                } else {
                    items[i].classList.remove('list-mode');
                }
            }
        }
    } catch (error) {
        console.error('[MainCategory] Failed to toggle view:', error);
    }
}
