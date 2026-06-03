/**
 * @file pages/merchant-portfolio/js/pharmacy/pharmacy-ui-layout.js
 * @description Layout management for pharmacy storefront.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


(function () {
    function ensureSubcategoriesRow(grid) {
        let row = document.getElementById('pharmacy-subcats-row');
        if (!row) {
            row = document.createElement('div');
            row.id = 'pharmacy-subcats-row';
            row.className = 'pharmacy-subcategories-row';
            if (grid.parentNode) {
                grid.parentNode.insertBefore(row, grid.nextSibling);
            }
        }
        row.innerHTML = '';
        row.style.display = 'none';
        return row;
    }

    function ensureFilteredProductsContainer(anchorNode) {
        let container = document.getElementById('pharmacy-filtered-products-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'pharmacy-filtered-products-container';
            container.className = 'pharmacy-filtered-products-grid';
            if (anchorNode.parentNode) {
                anchorNode.parentNode.insertBefore(container, anchorNode.nextSibling);
            }
        }
        return container;
    }

    window.pharmacyUILayout = {
        ensureSubcategoriesRow,
        ensureFilteredProductsContainer
    };
})();
