/**
 * @file subcategory-products.js
 * @description Logic for the new dedicated subcategory products page.
 */

async function initSubProductsPage() {
    console.log("[SubProducts] Page initialization started.");

    const grid = document.getElementById('sub-products-grid');
    const header = document.getElementById('sub-products-header');
    const categoryNameEl = document.getElementById('sub-products-category-name');
    const iconBox = document.getElementById('sub-products-icon-box');
    const iconEl = document.getElementById('sub-products-icon');

    // 1. Get Params from LocalStorage
    const rawParams = localStorage.getItem('pendingCategorySearch');
    if (!rawParams) {
        grid.innerHTML = '<div class="empty-results"><i class="fas fa-search"></i> لا توجد معايير بحث معلقة</div>';
        return;
    }

    try {
        const { mainId, subId } = JSON.parse(rawParams);
        console.log(`[SubProducts] Fetching products for Sub: ${subId} under Main: ${mainId}`);

        // 2. Fetch Category Info for UI
        const categoriesData = window.appCategoriesList || await fetchAppCategories();
        const mainCat = categoriesData.categories.find(c => String(c.id) === String(mainId));
        const subCat = mainCat ? mainCat.subcategories.find(s => String(s.id) === String(subId)) : null;

        if (subCat) {
            const title = subCat.title[window.app_language] || subCat.title['ar'] || '...';
            categoryNameEl.textContent = title;

            // ✅ New: Show Subcategory Image instead of Icon Box
            if (subCat.image) {
                const imagePath = `/images/subCategories/${subCat.image}`;
                iconBox.innerHTML = `<img src="${imagePath}" alt="${title}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 10px;">`;
                iconBox.style.background = 'transparent';
                iconBox.style.boxShadow = 'none';
            } else if (subCat.icon) {
                iconEl.className = subCat.icon;
            }
            header.style.display = 'flex';
        }

        // 3. DO NOT FETCH PRODUCTS (Requested)
        grid.innerHTML = `
            <div class="empty-results">
                <i class="fas fa-info-circle"></i>
                <p>هذه الصفحة تعرض معلومات التصنيف فقط</p>
            </div>`;

    } catch (e) {
        console.error("[SubProducts] Error:", e);
        grid.innerHTML = '<div class="empty-results"><i class="fas fa-exclamation-triangle"></i> تعذر تحميل بيانات التصنيف</div>';
    }
}

// createModernProductCard removed as per "No Products" request

// Start
initSubProductsPage();
