/**
 * @file pages/main-category/main-category.js
 * @description Handles main category view, subcategory rendering, and product previews.
 */

/**
 * @constant
 * @type {string}
 * @description Storage key for the selected main category.
 */
var MAIN_CATEGORY_STORAGE_KEY = 'selectedMainCategory';

/**
 * @description Current page state for the selected main and sub category.
 * @type {{mainId: string|null, subId: string|null}}
 */
var mainCategoryState = {
  mainId: null,
  subId: null
};

/**
 * @description Initialize the main category page.
 * @async
 * @function mainCategory_init
 * @returns {Promise<void>}
 */
async function mainCategory_init() {
  try {
    mainCategory_bindGalleryControls();

    var selection = mainCategory_getSelection();
    if (!selection || !selection.id) {
      mainCategory_renderEmptyState('تعذر تحديد الفئة الرئيسية.');
      return;
    }

    var category = await mainCategory_getMainCategoryById(selection.id);
    if (!category) {
      mainCategory_renderEmptyState('تعذر تحميل بيانات الفئة.');
      return;
    }

    mainCategoryState.mainId = String(category.id);
    mainCategory_renderHeader(category);
    mainCategory_renderSubcategories(category);
  } catch (error) {
    console.error('[MainCategory] Unexpected init error:', error);
    mainCategory_renderEmptyState('حدث خطأ غير متوقع أثناء التحميل.');
  }
}



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
 * @description Read the selected main category from storage.
 * @function mainCategory_getSelection
 * @returns {{id: string}|null}
 */
function mainCategory_getSelection() {
  try {
    var raw = localStorage.getItem(MAIN_CATEGORY_STORAGE_KEY);
    if (!raw) return null;
    var parsed = JSON.parse(raw);
    if (!parsed || !parsed.id) return null;
    return { id: String(parsed.id) };
  } catch (error) {
    console.error('[MainCategory] Failed to read selection:', error);
    return null;
  }
}

/**
 * @description Fetch categories list and return main category by ID.
 * @async
 * @function mainCategory_getMainCategoryById
 * @param {string|number} mainId - Main category ID.
 * @returns {Promise<Object|null>}
 */
async function mainCategory_getMainCategoryById(mainId) {
  try {
    var data = window.appCategoriesList || await fetchAppCategories();
    if (!data || !Array.isArray(data.categories)) return null;

    var categories = data.categories;
    for (var i = 0; i < categories.length; i++) {
      if (String(categories[i].id) === String(mainId)) {
        return categories[i];
      }
    }

    return null;
  } catch (error) {
    console.error('[MainCategory] Failed to fetch category by id:', error);
    return null;
  }
}

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
 * @description Render header title for the selected main category.
 * @function mainCategory_renderHeader
 * @param {Object} category - Main category object.
 * @returns {void}
 */
function mainCategory_renderHeader(category) {
  try {
    var titleEl = document.getElementById('main-category-title');
    if (!titleEl) return;
    titleEl.textContent = mainCategory_getDisplayTitle(category.title);
  } catch (error) {
    console.error('[MainCategory] Failed to render header:', error);
  }
}

/**
 * @description Render subcategory cards for the selected main category.
 * @function mainCategory_renderSubcategories
 * @param {Object} category - Main category object.
 * @returns {void}
 */
function mainCategory_renderSubcategories(category) {
  try {
    var container = document.getElementById('main-category-subcategories');
    if (!container) return;
    container.innerHTML = '';

    if (!category.subcategories || !category.subcategories.length) {
      mainCategory_renderEmptyState('لا توجد فئات فرعية متاحة.');
      return;
    }

    for (var i = 0; i < category.subcategories.length; i++) {
      var sub = category.subcategories[i];
      var card = mainCategory_createSubcategoryCard(sub, category.id, i);
      container.appendChild(card);
    }
  } catch (error) {
    console.error('[MainCategory] Failed to render subcategories:', error);
  }
}

/**
 * @description Create a subcategory card element.
 * @function mainCategory_createSubcategoryCard
 * @param {Object} subcategory - Subcategory object.
 * @param {string|number} mainId - Main category ID.
 * @returns {HTMLButtonElement}
 */
function mainCategory_createSubcategoryCard(subcategory, mainId, index) {
  var item = document.createElement('div');
  item.className = 'categories_grid_item';
  item.style.animationDelay = (index * 0.05) + 's';
  item.setAttribute('data-main-id', String(mainId));
  item.setAttribute('data-sub-id', String(subcategory.id));

  var displayTitle = mainCategory_getDisplayTitle(subcategory.title);

  var iconHtml;
  if (subcategory.image) {
    var imagePath = `/images/subCategories/${subcategory.image}`;
    iconHtml = `<div class="categories_cell_media"><img src="${imagePath}" class="categories_cell_content__image" alt="${displayTitle}"></div>`;
  } else {
    var iconClass = subcategory.icon || "fas fa-tag";
    iconHtml = `<div class="categories_cell_media"><i class="categories_cell_content__icon ${iconClass}"></i></div>`;
  }

  item.innerHTML = `
    <div class="categories_cell_content">
      ${iconHtml}
      <span class="categories_cell_content__text">${displayTitle}</span>
    </div>
  `;

  item.addEventListener('click', mainCategory_onSubcategoryClick);

  return item;
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
    if (!mainId || !subId) return;

    // ✅ New: Navigate directly to search page with these filters
    var searchData = {
      mainId: String(mainId),
      subId: String(subId),
      timestamp: Date.now()
    };
    localStorage.setItem('pendingCategorySearch', JSON.stringify(searchData));

    // Clear search session state to force fresh results
    sessionStorage.removeItem('search_page_state');

    // Smooth transition to NEW Subcategory Products page
    if (typeof navigateTo === 'function') {
      navigateTo("/pages/subcategory-products/subcategory-products.html", "Category Products");
    } else {
      window.location.href = '/pages/subcategory-products/subcategory-products.html';
    }
  } catch (error) {
    console.error('[MainCategory] Failed to handle subcategory click:', error);
  }
}

/**
 * @description Highlight the active subcategory card.
 * @function mainCategory_markActiveSubcategory
 * @param {HTMLElement} activeElement - Selected card.
 * @returns {void}
 */
function mainCategory_markActiveSubcategory(activeElement) {
  try {
    var container = document.getElementById('main-category-subcategories');
    if (!container) return;

    var items = container.querySelectorAll('.main-category-subcategory-card');
    for (var i = 0; i < items.length; i++) {
      items[i].classList.remove('main-category-subcategory-card--active');
    }
    activeElement.classList.add('main-category-subcategory-card--active');
  } catch (error) {
    console.error('[MainCategory] Failed to mark active subcategory:', error);
  }
}

/**
 * @description Render a localized empty state message.
 * @function mainCategory_renderEmptyState
 * @param {string} message - Message to show.
 * @returns {void}
 */
function mainCategory_renderEmptyState(message) {
  try {
    var subContainer = document.getElementById('main-category-subcategories');
    var galleryContent = document.getElementById('main-category-gallery-content');
    if (subContainer) {
      subContainer.innerHTML = '<div class="main-category-empty">' + message + '</div>';
    }
    if (galleryContent) {
      galleryContent.innerHTML = '';
    }
  } catch (error) {
    console.error('[MainCategory] Failed to render empty state:', error);
  }
}

/**
 * @description Show product gallery for the selected subcategory.
 * @async
 * @function mainCategory_showProductGallery
 * @param {string|number} mainId - Main category ID.
 * @param {string|number} subId - Subcategory ID.
 * @returns {Promise<void>}
 */
async function mainCategory_showProductGallery(mainId, subId) {
  try {
    var galleryContent = document.getElementById('main-category-gallery-content');
    if (!galleryContent) return;

    galleryContent.classList.remove('list-view');
    galleryContent.innerHTML = '<div class="loader" style="margin: 20px auto;"></div>';
    mainCategory_resetToggleIcon();

    var products = await mainCategory_getProductsByCategory(mainId, subId);
    var subcategory = await mainCategory_getSubcategoryById(mainId, subId);

    if (products && products.length) {
      mainCategory_renderProductGallery(products);
      mainCategory_updateGalleryControls(true, subcategory);
    } else {
      galleryContent.innerHTML = '<div class="main-category-empty">' + (window.langu ? window.langu('cat_no_products_message') : 'لا توجد منتجات') + '</div>';
      mainCategory_updateGalleryControls(false, subcategory);
    }
  } catch (error) {
    console.error('[MainCategory] Failed to show product gallery:', error);
  }
}

/**
 * @description Reset the gallery toggle icon to the default (list icon).
 * @function mainCategory_resetToggleIcon
 * @returns {void}
 */
function mainCategory_resetToggleIcon() {
  try {
    var toggleBtn = document.getElementById('main-category-view-toggle');
    if (!toggleBtn) return;
    toggleBtn.innerHTML = '<i class="fas fa-list"></i>';
  } catch (error) {
    console.error('[MainCategory] Failed to reset toggle icon:', error);
  }
}

/**
 * @description Fetch subcategory object by IDs.
 * @async
 * @function mainCategory_getSubcategoryById
 * @param {string|number} mainId - Main category ID.
 * @param {string|number} subId - Subcategory ID.
 * @returns {Promise<Object|null>}
 */
async function mainCategory_getSubcategoryById(mainId, subId) {
  try {
    var category = await mainCategory_getMainCategoryById(mainId);
    if (!category || !Array.isArray(category.subcategories)) return null;

    for (var i = 0; i < category.subcategories.length; i++) {
      if (String(category.subcategories[i].id) === String(subId)) {
        return category.subcategories[i];
      }
    }

    return null;
  } catch (error) {
    console.error('[MainCategory] Failed to get subcategory by id:', error);
    return null;
  }
}

/**
 * @description Render product gallery items.
 * @function mainCategory_renderProductGallery
 * @param {Array<Object>} products - Product list.
 * @returns {void}
 */
function mainCategory_renderProductGallery(products) {
  try {
    var galleryContent = document.getElementById('main-category-gallery-content');
    if (!galleryContent) return;

    galleryContent.innerHTML = '';
    galleryContent.classList.remove('list-view');

    for (var i = 0; i < products.length; i++) {
      var productEl = mainCategory_createProductItem(products[i]);
      galleryContent.appendChild(productEl);
    }
  } catch (error) {
    console.error('[MainCategory] Failed to render product gallery:', error);
  }
}

/**
 * @description Create a product card element.
 * @function mainCategory_createProductItem
 * @param {Object} product - Product data.
 * @returns {HTMLDivElement}
 */
function mainCategory_createProductItem(product) {
  try {
    // ✅ Use mapper to unify data (handles different API field names)
    var mapperAvailable = (typeof mapProductData === 'function');
    var mapped = mapperAvailable ? mapProductData(product) : product;

    if (!mapperAvailable) {
      console.warn('[MainCategory] mapProductData not found, using raw product data.');
    }

    var item = document.createElement('div');
    item.className = 'main-category-product-item';

    var imageElement = null;
    // image field from mapper is already a full URL or null
    var imageSrc = mapped.image || (mapped.imageSrc && mapped.imageSrc.length > 0 ? mapped.imageSrc[0] : null);

    if (!imageSrc) {
      console.log('[MainCategory] No image found for product:', mapped.productName || mapped.product_key);
    }

    if (imageSrc) {
      var img = document.createElement('img');
      img.className = 'main-category-product-image';
      img.src = imageSrc;
      img.alt = mapped.description || '';
      img.title = mapped.description || '';
      imageElement = img;
    } else {
      var placeholder = document.createElement('div');
      placeholder.className = 'main-category-product-image placeholder';
      placeholder.innerHTML = '<i class="fas fa-image"></i>';
      imageElement = placeholder;
    }

    item.appendChild(imageElement);

    var name = document.createElement('p');
    name.className = 'main-category-product-name';
    name.textContent = mapped.productName || 'منتج غير مسمى';

    var prices = document.createElement('div');
    prices.className = 'main-category-product-prices';
    var currency = window.app_language === 'ar' ? 'ج.م' : 'EGP';

    if (mapped.pricePerItem) {
      var priceSpan = document.createElement('span');
      priceSpan.className = 'main-category-product-price';
      priceSpan.textContent = mapped.pricePerItem + ' ' + currency;
      prices.appendChild(priceSpan);
    }

    if (mapped.original_price && Number(mapped.original_price) > Number(mapped.pricePerItem)) {
      var oldPrice = document.createElement('span');
      oldPrice.className = 'main-category-product-original-price';
      oldPrice.textContent = mapped.original_price + ' ' + currency;
      prices.appendChild(oldPrice);
    }

    item.appendChild(name);
    item.appendChild(prices);

    item.setAttribute('data-product', JSON.stringify(product));
    item.addEventListener('click', mainCategory_onProductClick);

    return item;
  } catch (error) {
    console.error('[MainCategory] Failed to build product item:', error);
    var fallback = document.createElement('div');
    fallback.className = 'main-category-product-item';
    fallback.textContent = 'تعذر تحميل المنتج';
    return fallback;
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
 * @description Update gallery controls visibility and metadata.
 * @function mainCategory_updateGalleryControls
 * @param {boolean} visible - Whether to show controls.
 * @param {Object|null} subcategory - Selected subcategory.
 * @returns {void}
 */
function mainCategory_updateGalleryControls(visible, subcategory) {
  try {
    var viewAllBtn = document.getElementById('main-category-view-all-btn');
    var toggleBtn = document.getElementById('main-category-view-toggle');
    if (!viewAllBtn || !toggleBtn) return;

    if (visible) {
      viewAllBtn.style.display = 'inline-flex';
      toggleBtn.style.display = 'inline-flex';
      if (subcategory && subcategory.id) {
        viewAllBtn.setAttribute('data-sub-id', String(subcategory.id));
      }
    } else {
      viewAllBtn.style.display = 'none';
      toggleBtn.style.display = 'none';
    }
  } catch (error) {
    console.error('[MainCategory] Failed to update gallery controls:', error);
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
    localStorage.setItem('pendingCategorySearch', JSON.stringify(searchData));

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
      if (isList) {
        items[i].classList.add('list-mode');
      } else {
        items[i].classList.remove('list-mode');
      }
    }
  } catch (error) {
    console.error('[MainCategory] Failed to toggle view:', error);
  }
}

/**
 * @description Fetch products for selected category and subcategory.
 * @async
 * @function mainCategory_getProductsByCategory
 * @param {string|number} mainId - Main category ID.
 * @param {string|number} subId - Subcategory ID.
 * @returns {Promise<Array<Object>>}
 */
async function mainCategory_getProductsByCategory(mainId, subId) {
  try {
    if (typeof baseURL === 'undefined' || !baseURL) {
      throw new Error('baseURL is not defined');
    }

    if (typeof apiFetch === 'undefined') {
      throw new Error('apiFetch is not defined');
    }

    var params = new URLSearchParams();
    params.append('MainCategory', mainId);
    params.append('SubCategory', subId);

    var data = await apiFetch('/api/products?' + params.toString());
    if (data && data.error) throw new Error(data.error);

    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.products)) return data.products;
    return [];
  } catch (error) {
    console.error('[MainCategory] Failed to fetch products:', error);
    return [];
  }
}

// Initialize page immediately after load
mainCategory_init();
