/**
 * @description Render header title for the selected main category.
 * @function mainCategory_renderHeader
 * @param {Object} category - Main category object.
 * @returns {void}
 */
function mainCategory_renderHeader(category) {
    try {
        var headerCard = document.getElementById('main-category-header-card');
        var titleEl = document.getElementById('main-category-title');
        var subtitleEl = document.getElementById('main-category-subtitle');
        var iconBox = document.getElementById('main-category-icon-box');
        if (!headerCard || !titleEl || !subtitleEl || !iconBox) return;

        titleEl.textContent = mainCategory_getDisplayTitle(category.title);
        subtitleEl.textContent = '';
        subtitleEl.style.display = 'none';

        if (category.image) {
            var imagePath = '/images/mainCategories/' + category.image;
            iconBox.innerHTML = '<img src="' + imagePath + '" alt="' + titleEl.textContent + '">';
            iconBox.style.background = 'transparent';
            iconBox.style.boxShadow = 'none';
        } else {
            iconBox.innerHTML = '';
            var iconNode = document.createElement('i');
            iconNode.className = category.icon || 'fas fa-layer-group';
            iconBox.appendChild(iconNode);
            iconBox.style.background = '';
            iconBox.style.boxShadow = '';
        }

        headerCard.style.display = 'flex';
    } catch (error) {
        console.error('[MainCategory] Failed to render header:', error);
    }
}
