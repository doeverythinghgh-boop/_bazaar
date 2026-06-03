/**
 * @file pages/categories/categories-ui.js
 * @description UI functions for subcategories and detail containers in the grid.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


/**
 * @description Toggles display of subcategories grid and product gallery.
 * @function categories_toggleSubcategoriesGrid
 */
function categories_toggleSubcategoriesGrid(gridContainer, mainCategory, clickedItem) {
    try {
        console.log(`[Grid] Toggling category (ID: ${mainCategory.id})`);

        const currentlyActiveItem = gridContainer.querySelector(".categories_grid_item--active");
        const existingDetails = gridContainer.querySelector(".categories_details_container");
        const isClickingSameItem = currentlyActiveItem === clickedItem;

        // Cleanup existing
        if (existingDetails) {
            existingDetails.remove();
        }
        if (currentlyActiveItem) {
            currentlyActiveItem.classList.remove("categories_grid_item--active");
        }

        if (!isClickingSameItem) {
            clickedItem.classList.add("categories_grid_item--active");

            // Build details container (subcategories + products)
            const detailsContainer = categories_createDetailsContainer(
                mainCategory.subcategories,
                mainCategory.id
            );

            // Correct Positioning in Grid
            const items = Array.from(gridContainer.querySelectorAll(".categories_grid_item"));
            const clickedIndex = items.indexOf(clickedItem);

            // Detect column count
            const gridStyle = window.getComputedStyle(gridContainer);
            const gridTemplateColumns = gridStyle.getPropertyValue('grid-template-columns');
            const columns = gridTemplateColumns.split(' ').filter(v => v.trim() !== '').length || 1;

            console.log(`[Grid] Detected columns: ${columns} | Clicked index: ${clickedIndex}`);

            const rowIndex = Math.floor(clickedIndex / columns);
            const lastItemIndexInRow = Math.min(items.length - 1, (rowIndex * columns) + (columns - 1));

            const insertionTarget = items[lastItemIndexInRow];

            if (insertionTarget) {
                insertionTarget.after(detailsContainer);
            } else {
                gridContainer.appendChild(detailsContainer);
            }

            // ✅ NEW: Smart Scroll to Active Category
            setTimeout(() => {
                clickedItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
    } catch (error) {
        console.error("[categories_toggleSubcategoriesGrid] Error:", error);
    }
}

/**
 * @description Creates details container for subcategories and products.
 * @function categories_createDetailsContainer
 */
function categories_createDetailsContainer(subcategories, mainCatId) {
    try {
        const container = document.createElement("div");
        container.className = "categories_details_container";
        container.style.animation = "categories_slide_fade_in 0.8s ease-out forwards";

        const subcategoriesContainer = document.createElement("div");
        const subCount = subcategories.length;

        if (subCount <= 5) {
            subcategoriesContainer.className = "categories_subcategories_container categories_sub_one_row";
        } else {
            subcategoriesContainer.className = "categories_subcategories_container categories_sub_two_row";
        }

        subcategories.forEach((sub, index) => {
            const subItem = categories_createSubcategoryItemDiv(
                sub,
                container,
                mainCatId,
                index
            );
            subcategoriesContainer.appendChild(subItem);
        });

        container.appendChild(subcategoriesContainer);
        return container;
    } catch (error) {
        console.error("[categories_createDetailsContainer] Error:", error);
        const container = document.createElement("div");
        container.className = "categories_details_container";
        container.innerHTML = `<p class="error-message">Error loading subcategories.</p>`;
        return container;
    }
}

/**
 * @description Creates subcategory element for grid structure.
 * @function categories_createSubcategoryItemDiv
 */
function categories_createSubcategoryItemDiv(sub, detailsContainer, mainCatId, index = 0) {
    try {
        const subItem = document.createElement("a");
        subItem.href = `#`;
        subItem.className = "categories_subcategory_item";
        subItem.dataset.subcategoryId = sub.id;

        subItem.style.animationDelay = `${index * 0.05}s`;

        let mediaHtml;
        if (sub.image) {
            const imagePath = window.location.origin + `/images/subCategories/${sub.image}`;
            mediaHtml = `<img src="${imagePath}" class="categories_subcategory_item__image" alt="${sub.title[window.app_language] || sub.title['ar']}" />`;
        } else {
            const iconClass = sub.icon || 'fas fa-tag';
            mediaHtml = `<i class="categories_subcategory_item__icon ${iconClass}"></i>`;
        }

        const subTitleObj = sub.title;
        const subDisplayTitle = typeof subTitleObj === 'object' ?
            (subTitleObj[window.app_language] || subTitleObj['ar']) : subTitleObj;

        subItem.innerHTML = `${mediaHtml} <span class="categories_subcategory_title">${subDisplayTitle}</span>`.trim();

        subItem.addEventListener("click", (e) => {
            try {
                e.preventDefault();
                detailsContainer.querySelectorAll(".categories_subcategory_item--active")
                    .forEach((item) => item.classList.remove("categories_subcategory_item--active"));

                subItem.classList.add("categories_subcategory_item--active");
                categories_showProductGalleryGrid(detailsContainer, mainCatId, sub.id);
            } catch (error) {
                console.error("[categories_createSubcategoryItemDiv.click] Error:", error);
            }
        });

        return subItem;
    } catch (error) {
        console.error("[categories_createSubcategoryItemDiv] Error:", error);
        return document.createElement("a");
    }
}
