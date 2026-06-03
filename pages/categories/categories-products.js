/**
 * @file pages/categories/categories-products.js
 * @description Functions for rendering products gallery, creating product items, and API fetching.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


/**
 * @description Displays product gallery inside internal wrapper.
 * @async
 * @function categories_showProductGalleryGrid
 */
async function categories_showProductGalleryGrid(detailsContainer, mainCatId, subCatId) {
    try {
        let galleryWrapper = detailsContainer.querySelector(".categories_gallery_internal_wrapper");
        if (!galleryWrapper) {
            galleryWrapper = document.createElement("div");
            galleryWrapper.className = "categories_gallery_internal_wrapper";
            detailsContainer.appendChild(galleryWrapper);
        }

        galleryWrapper.innerHTML = `<div class="loader" style="margin: 20px auto;"></div>`;

        const products = await getProductsByCategory(mainCatId, subCatId);

        const allCategories = await categories_fetchCategories();
        const mainCategory = allCategories.find(c => String(c.id) === String(mainCatId));
        const subcategory = mainCategory ? mainCategory.subcategories.find(s => String(s.id) === String(subCatId)) : null;

        if (products && products.length > 0) {
            await categories_renderProductGallery(galleryWrapper, products, subcategory, mainCatId);
        } else {
            galleryWrapper.innerHTML = `<p class="no-products-message" style="text-align:center; padding: 30px; color: var(--text-color-light); font-size: 0.9rem;">${window.langu('cat_no_products_message')}</p>`;
        }
    } catch (error) {
        console.error("[categories_showProductGalleryGrid] Error:", error);
    }
}

/**
 * @description Placeholder for cleanup.
 * @function categories_removeInternalGallery
 */
function categories_removeInternalGallery() { }

/**
 * @description Renders products in the gallery sequentially with lazy loading for images (SRP).
 * @async
 * @function categories_renderProductGallery
 */
async function categories_renderProductGallery(galleryWrapper, products, subcategory, mainCatId) {
    try {
        console.log(
            `[Products] Done ${products.length} product "${subcategory ? subcategory.title[window.app_language] || subcategory.title['ar'] : ''}". Processing ...`
        );

        // 1. Create Control Header
        const controlsHeader = document.createElement("div");
        controlsHeader.className = "categories_gallery_controls";

        // View All Button (Redirects to Search)
        const viewAllBtn = document.createElement("button");
        viewAllBtn.id = "categories_view_all_btn";
        viewAllBtn.className = "categories_view_all_btn";
        viewAllBtn.type = "button";
        viewAllBtn.innerHTML = `<i class="fas fa-external-link-alt" style="margin-left: 5px;"></i> ${window.langu('cat_view_all_btn') || 'عرض الكل'}`;

        // Toggle Button
        const toggleBtn = document.createElement("button");
        toggleBtn.id = "categories_view_toggle";
        toggleBtn.className = "categories_view_toggle";
        toggleBtn.type = "button";
        toggleBtn.title = window.langu('cat_view_toggle_title');
        toggleBtn.innerHTML = '<i class="fas fa-list"></i>';

        controlsHeader.appendChild(viewAllBtn);
        controlsHeader.appendChild(toggleBtn);

        // 2. Create Gallery Container
        const galleryContainer = document.createElement("div");
        galleryContainer.className = "categories_products_gallery_container grid-view";

        // 3. Assemble
        galleryWrapper.innerHTML = "";
        galleryWrapper.appendChild(controlsHeader);
        galleryWrapper.appendChild(galleryContainer);

        // 4. Toggle Logic
        toggleBtn.addEventListener('click', () => {
            galleryContainer.classList.toggle('grid-view');
            const isGrid = galleryContainer.classList.contains('grid-view');
            toggleBtn.innerHTML = isGrid ? '<i class="fas fa-list"></i>' : '<i class="fas fa-th"></i>';
        });

        // View All Logic
        viewAllBtn.addEventListener('click', () => {
            if (!subcategory || !mainCatId) return;

            console.log(`[Categories] Redirecting to search with Main:${mainCatId}, Sub:${subcategory.id}`);

            var searchData = {
                mainId: mainCatId,
                subId: subcategory.id,
                timestamp: Date.now()
            };
            LocalDBStorage.setItem('pendingCategorySearch', JSON.stringify(searchData));
            window.dispatchEvent(new Event('request-category-search'));

            const searchNavBtn = document.getElementById('index-search-btn');
            if (searchNavBtn) {
                searchNavBtn.click();
            } else {
                window.location.href = "/pages/search/search.html";
            }
        });

        for (const product of products) {
            await categories_loadProductItem(product, galleryContainer);
        }
    } catch (error) {
        console.error(
            "[categories_renderProductGallery] Error product:",
            error
        );
    }
}

/**
 * @description Creates a single product item and adds click handler (SRP).
 * @async
 * @function categories_loadProductItem
 */
function categories_loadProductItem(product, galleryContainer) {
    return new Promise((resolve) => {
        try {
            const firstImage = product.ImageName ? product.ImageName.split(",")[0] : null;

            if (!firstImage) {
                const productItem = categories_createProductElement(product, null);
                galleryContainer.appendChild(productItem);
                categories_animateProductIn(productItem, resolve);
                return;
            }

            const imageUrl = getPublicR2FileUrl(firstImage);
            const img = document.createElement("img");
            img.className = "categories_product_item__image";
            img.alt = product.product_description;
            img.title = product.product_description;

            const productItem = categories_createProductElement(product, img);

            img.onload = () => {
                galleryContainer.appendChild(productItem);
                categories_animateProductIn(productItem, resolve);
                productItem.addEventListener("click", () =>
                    categories_handleProductClick(product, firstImage)
                );
            };

            img.onerror = () => {
                console.warn(`[Products] Failed loading : ${imageUrl}`);
                productItem.classList.add("no-image");
                if (productItem.querySelector("img")) productItem.querySelector("img").remove();
                galleryContainer.appendChild(productItem);
                categories_animateProductIn(productItem, resolve);
                productItem.addEventListener("click", () =>
                    categories_handleProductClick(product, firstImage)
                );
            };

            img.src = imageUrl;
        } catch (error) {
            console.error(
                "[categories_loadProductItem] Error product:",
                error
            );
            resolve();
        }
    });
}

/**
 * @description Creates basic product element (SRP).
 * @function categories_createProductElement
 */
function categories_createProductElement(product, imgElement) {
    try {
        const productItem = document.createElement("div");
        productItem.className = "categories_product_item";

        const productName = document.createElement("p");
        productName.className = "categories_product_item__name";
        productName.id = `product-name-${product.product_key}`;
        productName.textContent = product.productName || (window.langu('product_mapper_unnamed_product') || 'Unnamed product');

        if (imgElement) {
            productItem.appendChild(imgElement);
        } else {
            productItem.classList.add("no-image");
        }

        productItem.appendChild(productName);

        const priceContainer = document.createElement("div");
        priceContainer.className = "categories_product_item__prices";
        const currency = window.app_language === 'ar' ? 'ج.م' : 'EGP';

        if (product.product_price) {
            const priceSpan = document.createElement("span");
            priceSpan.className = "categories_product_item__price";
            priceSpan.textContent = `${product.product_price} ${currency}`;
            priceContainer.appendChild(priceSpan);
        }

        if (product.original_price && Number(product.original_price) > Number(product.product_price)) {
            const originalPriceSpan = document.createElement("span");
            originalPriceSpan.className = "categories_product_item__original-price";
            originalPriceSpan.textContent = `${product.original_price} ${currency}`;
            priceContainer.appendChild(originalPriceSpan);
        }

        productItem.appendChild(priceContainer);
        return productItem;
    } catch (error) {
        console.error(
            "[categories_createProductElement] Error product:",
            error
        );
        const productItem = document.createElement("div");
        productItem.className = "categories_product_item";
        productItem.textContent = window.langu('cat_product_load_failed') || 'Failed to load';
        return productItem;
    }
}

/**
 * @description Applies introductory animation to product item (SRP).
 * @function categories_animateProductIn
 */
function categories_animateProductIn(productItem, resolve) {
    try {
        setTimeout(() => {
            resolve();
        }, 80);
    } catch (error) {
        console.error(
            "[categories_animateProductIn] Error :",
            error
        );
        resolve();
    }
}

/**
 * @description Product click handler (SRP).
 * @function categories_handleProductClick
 */
function categories_handleProductClick(product, firstImageName) {
    try {
        console.log(`[Products] Done product: ${product.productName}`);
        console.log("[Debug RAW Product] API:", product);

        const productDataForModal = mapProductData(product);
        loadProductView(productDataForModal, true);
    } catch (error) {
        console.error(
            "[categories_handleProductClick] Error product:",
            error
        );
    }
}

/**
 * @description Fetches product list based on main and sub category from API.
 * @async
 * @function getProductsByCategory
 */
async function getProductsByCategory(mainCatId, subCatId) {
    try {
        if (typeof baseURL === "undefined" || !baseURL) {
            throw new Error("baseURL is not defined");
        }

        if (typeof apiFetch === "undefined") {
            throw new Error("apiFetch is not defined");
        }

        const targets = (mainCatId && typeof window.getCompatibleCategorySelections === 'function')
            ? window.getCompatibleCategorySelections(mainCatId, subCatId || "")
            : [{ mainId: mainCatId || "", subId: subCatId || "" }];

        const responses = await Promise.all(targets.map(async (target) => {
            const params = new URLSearchParams();
            if (target.mainId) {
                params.append("MainCategory", target.mainId);
            }
            if (target.subId) {
                params.append("SubCategory", target.subId);
            }

            const data = await apiFetch(`/api/products?${params.toString()}`);
            if (data && data.error) throw new Error(data.error);

            return Array.isArray(data)
                ? data
                : data && Array.isArray(data.products)
                    ? data.products
                    : [];
        }));

        const mergedProducts = [];
        const seen = new Set();
        responses.flat().forEach((product) => {
            const productKey = String(product?.product_key || product?.id || '');
            if (!productKey || seen.has(productKey)) return;
            seen.add(productKey);
            mergedProducts.push(product);
        });

        return mergedProducts;
    } catch (error) {
        console.error(
            "[getProductsByCategory] Failed product:",
            error
        );
        return [];
    }
}
