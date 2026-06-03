
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
        galleryContent.classList.remove('merchants-view');

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
        var mapperAvailable = (typeof mapProductData === 'function');
        var mapped = mapperAvailable ? mapProductData(product) : product;

        var item = document.createElement('div');
        item.className = 'main-category-product-item';
        item.id = 'product-item-' + (mapped.id || Math.random().toString(36).substr(2, 9));

        var imageElement = null;
        var imageSrc = mapped.image || (mapped.imageSrc && mapped.imageSrc.length > 0 ? mapped.imageSrc[0] : null);

        if (imageSrc) {
            var img = document.createElement('img');
            img.className = 'main-category-product-image';
            img.src = imageSrc;
            img.alt = mapped.description || '';
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
        name.textContent = mapped.productName || (window.langu('product_mapper_unnamed_product') || 'Unnamed product');

        var prices = document.createElement('div');
        prices.className = 'main-category-product-prices';
        var currency = window.app_language === 'ar' ? 'ج.م' : 'EGP';

        if (mapped.pricePerItem) {
            var priceSpan = document.createElement('span');
            priceSpan.className = 'main-category-product-price';
            priceSpan.textContent = mapped.pricePerItem + ' ' + currency;
            prices.appendChild(priceSpan);
        }

        item.appendChild(name);
        item.appendChild(prices);

        item.setAttribute('data-product', JSON.stringify(product));
        item.addEventListener('click', mainCategory_onProductClick);

        return item;
    } catch (error) {
        console.error('[MainCategory] Failed to build product item:', error);
        return document.createElement('div');
    }
}
