/**
 * @file main-category-ui.js
 * @description UI rendering functions for the main category page.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


/**
 * @description Resolve display title based on current language.
 * @function mainCategory_getDisplayTitle
 * @param {Object|string} titleObj - Title object or string.
 * @returns {string}
 */
function mainCategory_getDisplayTitle(titleObj) {
    if (!titleObj) return '';
    if (typeof titleObj === 'string') return titleObj;
    return titleObj[window.app_language] || titleObj.ar || '';
}

/**
 * @description Update gallery controls visibility.
 */
function mainCategory_updateGalleryControls(visible, subcategory) {
    var viewAllBtn = document.getElementById('main-category-view-all-btn');
    var toggleBtn = document.getElementById('main-category-view-toggle');
    if (!viewAllBtn || !toggleBtn) return;

    viewAllBtn.style.display = visible ? 'inline-flex' : 'none';
    toggleBtn.style.display = visible ? 'inline-flex' : 'none';
}

/**
 * @description Reset the gallery toggle icon.
 */
function mainCategory_resetToggleIcon() {
    var toggleBtn = document.getElementById('main-category-view-toggle');
    if (toggleBtn) toggleBtn.innerHTML = '<i class="fas fa-list"></i>';
}

/**
 * @description Render a localized empty state message.
 */
function mainCategory_renderEmptyState(message) {
    var subContainer = document.getElementById('main-category-subcategories');
    var galleryContent = document.getElementById('main-category-gallery-content');
    if (subContainer) subContainer.innerHTML = '<div class="main-category-empty">' + message + '</div>';
    if (galleryContent) galleryContent.innerHTML = '';
}

/**
 * @description Highlight the active subcategory card.
 */
function mainCategory_markActiveSubcategory(activeElement) {
    var container = document.getElementById('main-category-subcategories');
    if (!container) return;
    var items = container.querySelectorAll('.main-category-subcategory-card');
    items.forEach(el => el.classList.remove('main-category-subcategory-card--active'));
    activeElement.classList.add('main-category-subcategory-card--active');
}
