/**
 * @file pages/categories/categories-loader.js
 * @description Functions for loading categories and building the initial grid.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


/**
 * @description Fetches categories from list.json and dynamically builds the categories table.
 * @async
 * @function categories_loadCategoriesAsTable
 */
async function categories_loadCategoriesAsTable() {
    try {
        const gridContainer = document.getElementById("categories_grid");
        if (!gridContainer) return;

        // ✅ NEW: Show Skeleton Screen during loading
        categories_showSkeletons(gridContainer);

        // 1. Fetch data
        const categories = await categories_fetchCategories(
            "/shared/list.json"
        );

        // 2. Build grid
        gridContainer.innerHTML = ""; // Clear skeletons
        categories_buildCategoryGrid(gridContainer, categories);
    } catch (error) {
        console.error(
            "[Categories] Error :",
            error
        );
        const gridContainer = document.getElementById("categories_grid");
        if (gridContainer) {
            gridContainer.innerHTML = `<div class="error-message">${window.langu('cat_empty_list_error')}</div>`;
        }
    }
}

/**
 * @description Shows skeleton items while loading.
 * @function categories_showSkeletons
 */
function categories_showSkeletons(container) {
    container.innerHTML = "";
    for (let i = 0; i < 10; i++) {
        const skeleton = document.createElement("div");
        skeleton.className = "category-skeleton";
        skeleton.innerHTML = `
            <div class="skeleton-media"></div>
            <div class="skeleton-text"></div>
        `;
        container.appendChild(skeleton);
    }
}

/**
 * @description Helper function to fetch and parse category file (SRP).
 * @async
 * @function categories_fetchCategories
 */
async function categories_fetchCategories(url) {
    try {
        // Use global categories list if available, otherwise fetch
        const data = window.appCategoriesList || await fetchAppCategories();

        if (!data || !data.categories || !Array.isArray(data.categories)) {
            throw new Error("تنسيق ملف الفئات غير صحيح أو تعذر التحميل.");
        }

        return data.categories;
    } catch (error) {
        console.error("[Categories] Error :", error);
        throw error;
    }
}

function categories_isHomeContext() {
    return document.getElementById("categories00") !== null;
}

function categories_getHomeVirtualCategory(categories) {
    if (!Array.isArray(categories) || !categories.length) return null;

    const featuredBrandIds = ["44", "45", "23"];
    const featuredBrands = featuredBrandIds
        .map((id) => categories.find((item) => String(item.id) === id))
        .filter(Boolean);

    if (featuredBrands.length !== featuredBrandIds.length) {
        return null;
    }

    const beautyStoreAr = categories_translateOrFallback("cat_beauty_store_title", "Beauty Store");
    const beautyStoreEn = categories_translateOrFallback("cat_beauty_store_title_en", "Beauty Store");

    return {
        id: "beauty-store-home",
        title: {
            ar: beautyStoreAr,
            en: beautyStoreEn
        },
        icon: "fas fa-store",
        image: "Beauty Store.webp",
        subcategories: featuredBrands.map((brand) => ({
            id: `beauty-store-brand-${brand.id}`,
            title: brand.title,
            icon: brand.icon || "fas fa-store",
            image: brand.image,
            imageBasePath: "mainCategories",
            targetMainCategoryId: String(brand.id)
        })),
        isVirtualHomeCategory: true
    };
}

function categories_translateOrFallback(key, fallback) {
    if (typeof window.langu !== "function") return fallback;

    const translated = window.langu(key);
    if (!translated || translated === key) return fallback;

    return translated;
}

function categories_getDisplayCategories(categories) {
    if (!Array.isArray(categories)) return [];
    if (!categories_isHomeContext()) return categories;

    const hiddenIds = new Set(["44", "45", "23"]);
    const filtered = categories.filter((category) => !hiddenIds.has(String(category.id)));
    const virtualCategory = categories_getHomeVirtualCategory(categories);

    if (virtualCategory) {
        filtered.splice(Math.min(4, filtered.length), 0, virtualCategory);
    }

    return filtered;
}

/**
 * @description Builds category grid and adds event listeners (SRP).
 * @function categories_buildCategoryGrid
 */
function categories_buildCategoryGrid(gridContainer, categories) {
    try {
        const displayCategories = categories_getDisplayCategories(categories);

        displayCategories.forEach((category, index) => {
            const item = categories_createCategoryItemGrid(
                category,
                gridContainer,
                displayCategories,
                index
            );
            gridContainer.appendChild(item);
        });
    } catch (error) {
        console.error(
            "[categories_buildCategoryGrid] Error :",
            error
        );
    }
}

/**
 * @description Creates main category grid item and adds click handler (SRP).
 * @function categories_createCategoryItemGrid
 */
function categories_createCategoryItemGrid(category, gridContainer, allCategories, index = 0) {
    try {
        const item = document.createElement("div");
        item.className = "categories_grid_item";
        item.dataset.categoryId = category.id;
        item.__categoryData = category;

        // ✅ NEW: Staggered Delay
        item.style.animationDelay = `${index * 0.05}s`;

        // Determine if image is available
        const isHomePage = categories_isHomeContext();
        const categoryImage = category.image;

        let iconHtml;
        const titleObj = category.title;
        const displayTitle = typeof titleObj === 'object' ?
            (titleObj[window.app_language] || titleObj['ar']) : titleObj;

        if (isHomePage && categoryImage) {
            const imagePath = window.location.origin + `/images/mainCategories/${categoryImage}`;
            iconHtml = `<div class="categories_cell_media"><img src="${imagePath}" class="categories_cell_content__image" alt="${displayTitle}"></div>`;
        } else {
            const iconClass = category.icon || "fas fa-store";
            iconHtml = `<div class="categories_cell_media"><i class="categories_cell_content__icon ${iconClass}"></i></div>`;
        }

        item.innerHTML = `
            <div class="categories_cell_content">
                ${iconHtml}
                <span class="categories_cell_content__text">${displayTitle}</span>
            </div>
        `;

        // Click Logic
        item.addEventListener("click", categories_onMainCategoryClick);

        return item;
    } catch (error) {
        console.error(
            "[categories_createCategoryItemGrid] Error :",
            error
        );
        const item = document.createElement("div");
        item.className = "categories_grid_item";
        item.innerHTML = `<span class="error-message">Error</span>`;
        return item;
    }
}
