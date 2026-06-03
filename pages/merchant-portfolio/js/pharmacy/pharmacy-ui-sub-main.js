/**
 * @file pages/merchant-portfolio/js/pharmacy/pharmacy-ui-sub-main.js
 * @description Main entry point for pharmacy sub-category display.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


(function () {
    const { state } = window.pharmacyUIBase;
    const { ensureFilteredProductsContainer } = window.pharmacyUILayout;

    async function showPharmacySubCategories(category, skipClear = false) {
        const row = document.getElementById('pharmacy-subcats-row');
        if (!row) return;

        const productsContainer = ensureFilteredProductsContainer(row);
        if (!skipClear) productsContainer.innerHTML = '';
        row.innerHTML = '';
        row.style.display = 'flex';

        const hiddenSub = state.hiddenSub || new Set();

        (category.sub || []).forEach((subCategory) => {
            if (hiddenSub.has(String(subCategory.id))) return;

            const pill = document.createElement('button');
            pill.type = 'button';
            pill.className = 'pharmacy-subcategory-pill';
            pill.dataset.subCategoryId = subCategory.id;
            pill.textContent = window.pharmacyUIBase.getLanguageValue(subCategory.title, subCategory.name_en);

            pill.addEventListener('click', async function (e) {
                if (typeof window.pharmacyUISubHandler?.handleSubCategoryClick === 'function') {
                    await window.pharmacyUISubHandler.handleSubCategoryClick(e, category, subCategory, pill, row, productsContainer);
                }
            });

            row.appendChild(pill);
        });

        if (window.pharmacyRestoringState && window.pharmacyRestoringState.activeSubCategoryId) {
            const targetPill = row.querySelector(`.pharmacy-subcategory-pill[data-sub-category-id="${window.pharmacyRestoringState.activeSubCategoryId}"]`);
            if (targetPill) {
                setTimeout(() => targetPill.click(), 10);
            } else {
                window.pharmacyRestoringState = null;
            }
        }
    }

    window.pharmacyUICategories = window.pharmacyUICategories || {};
    window.pharmacyUICategories.showPharmacySubCategories = showPharmacySubCategories;
})();
