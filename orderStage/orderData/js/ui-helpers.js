/**
 * @file orderStage/orderData/js/ui-helpers.js
 * @description Shared UI helper functions for formatting and interaction.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


window.OrderData_UI = {
    currentOrderData: null,

    setCurrentOrderData: function (orderData) {
        window.OrderData_UI.currentOrderData = orderData || null;
    },

    /**
     * Dynamically injects a CSS file into the document head.
     * @param {string} href Path to the CSS file.
     * @param {string} id Unique ID for the link tag.
     */
    loadModuleStyle: function (href, id) {
        if (document.getElementById(id)) return;
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.id = id;
        document.head.appendChild(link);
    },

    /**
     * Formats location string. If it's a coordinate, returns a button.
     * @param {string} loc
     * @param {string} name
     */
    formatLocation: function (loc, name) {
        const coords = loc ? loc.split(',') : [];
        const isValid = coords.length === 2 && !isNaN(parseFloat(coords[0].trim())) && !isNaN(parseFloat(coords[1].trim()));

        if (isValid) {
            return `
                <button class="order_view_map_btn" 
                        data-lat="${coords[0].trim()}" 
                        data-lng="${coords[1].trim()}"
                        data-name="${name || ''}"
                        title="${loc}"
                        style="cursor: pointer; border: none; background: #e3f2fd; color: #2196F3; width: 32px; height: 32px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; transition: background 0.2s;">
                    <i class="fas fa-map-marker-alt"></i>
                </button>
            `;
        }

        return `
            <span class="order_no_location_icon" 
                  title="الموقع غير متوفر"
                  style="color: #9e9e9e; background: #eee; width: 32px; height: 32px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; cursor: help; font-size: 0.9em;">
                <i class="fas fa-map-marker-slash"></i>
            </span>
        `;
    },

    /**
     * Formats phone number as a clickable button.
     * @param {string} phone
     */
    formatPhone: function (phone) {
        if (!phone) return `<span class="order_no_phone">لا يوجد رقم هاتف</span>`;
        return `
            <a href="tel:${phone}" class="order_phone_btn">
                <i class="fas fa-phone-alt"></i> ${phone}
            </a>
        `;
    },

    getOrderItemType: function (item = {}, options = {}) {
        const payload = item.payload || {};
        const sourceType = String(
            options.sourceType
            || item.source_type
            || item.sourceType
            || payload.source_type
            || payload.sourceType
            || item.item_type
            || item.listing_type
            || ''
        ).trim().toLowerCase();

        const isCar = sourceType === 'car'
            || sourceType === 'cars'
            || item.is_car_listing === true
            || payload.is_car_listing === true
            || !!item.car_key
            || String(item.MainCategory || payload.main_category || '') === '7';
        const isRealEstate = sourceType === 'real_estate'
            || sourceType === 'real-estate'
            || sourceType === 'realestate'
            || item.is_real_estate_listing === true
            || payload.is_real_estate_listing === true
            || !!item.real_estate_key
            || String(item.MainCategory || payload.main_category || '') === '16';
        const isPharmacy = !isCar && !isRealEstate && !!(
            options.isPharmacyProduct
            || item.is_pharmacy_product
            || item.is_pharmacy
            || payload.is_pharmacy
            || item.pharmacy_metadata
            || item.pharmacyMetadata
            || sourceType.includes('pharmacy')
        );

        return {
            sourceType,
            listingType: isCar ? 'car' : (isRealEstate ? 'real_estate' : ''),
            isCar,
            isRealEstate,
            isPharmacy,
        };
    },

    /**
     * Fetches product details and opens the product view page.
     * @param {string} productKey
     */
    viewProductDetails: async function (productKey, options = {}) {
        if (!productKey) return;
        const orderKey = LocalDBStorage.getItem('current_viewing_order_key');
        let order = window.OrderData_UI.currentOrderData;
        if (!order && orderKey && typeof orderGetByKey === 'function') {
            order = await orderGetByKey(orderKey);
            window.OrderData_UI.setCurrentOrderData(order);
        }

        const items = Array.isArray(order?.order_items) ? order.order_items : [];
        const pharmacyProducts = Array.isArray(order?.pharmacy_products) ? order.pharmacy_products : [];
        const product = options.product
            || items.find((item) => String(item.product_key || item.product_id || '') === String(productKey))
            || pharmacyProducts.find((item) => String(item.product_id || item.product_key || '') === String(productKey))
            || null;
        const pharmacyProduct = pharmacyProducts.find((item) => String(item.product_id || item.product_key || '') === String(productKey)) || null;
        const source = pharmacyProduct || product || {};
        const sourceKind = window.OrderData_UI.getOrderItemType(source, options);
        const isPharmacyProduct = sourceKind.isPharmacy;

        const sellerKey = options.sellerKey || options.merchantKey || options.pharmacySellerKey ||
            source.pharmacy_seller_key || source.seller_key || source.merchantKey || source.merchant_key || source.user_key;

        const rawViewPath = source.view_path || options.viewPath || '';
        const isLegacyPharmacyViewPath = /\/pages\/products\/pharmacyView\/index\.html/i.test(rawViewPath);
        const resolvedViewPath = isLegacyPharmacyViewPath
            ? (window.ProductRoutes?.buildProductViewUrl
                ? window.ProductRoutes.buildProductViewUrl({
                    product_key: source.product_id || source.product_key || productKey,
                    user_key: sellerKey || '',
                    pharmacy_metadata: true
                }, { pharmacy: true })
                : `/pages/products/productView/productView.html?product_key=${encodeURIComponent(source.product_id || source.product_key || productKey)}&provider_key=${encodeURIComponent(sellerKey || '')}&pharmacy=1`)
            : rawViewPath;

        if (resolvedViewPath) {
            if (isPharmacyProduct && window.ProductStateManager?.setProductForView) {
                window.ProductStateManager.setProductForView({
                    product_key: source.product_id || source.product_key || productKey,
                    productName: source.product_name || source.name || '',
                    product_description: source.description || source.payload?.description || '',
                    description: source.description || source.payload?.description || '',
                    product_price: source.price || source.payload?.price || 0,
                    pricePerItem: source.price || source.payload?.price || 0,
                    product_quantity: source.quantity || 1,
                    availableQuantity: source.quantity || 1,
                    ImageName: source.product_image || source.image || source.image_url || '',
                    user_key: sellerKey,
                    MainCategory: source.main_category_id || '20',
                    SubCategory: source.sub_category_id || '',
                    serviceType: '0',
                    pharmacy_metadata: true,
                    pharmacyCatalogItem: source.payload || source
                }, { showAddToCart: false });
            }
            window.location.href = resolvedViewPath;
            return;
        }

        if (isPharmacyProduct) {
            if (!sellerKey) {
                console.error('[OrderData] Missing pharmacy seller key for product:', productKey);
                alert('تعذر تحديد الصيدلية الخاصة بالمنتج.');
                return;
            }
            window.location.href = window.ProductRoutes?.buildProductViewUrl
                ? window.ProductRoutes.buildProductViewUrl({ product_key: productKey, user_key: sellerKey, pharmacy_metadata: true }, { pharmacy: true })
                : `/pages/products/productView/productView.html?product_key=${encodeURIComponent(productKey)}&provider_key=${encodeURIComponent(sellerKey)}&pharmacy=1`;
            return;
        }

        try {
            console.log('[OrderData] Opening product details from embedded order item:', productKey);

            if (!product) {
                throw new Error('Product snapshot not found in the current order');
            }

            const productData = typeof mapProductData === 'function' ? mapProductData(product) : product;
            const productId = productData?.product_key || product.product_key || productKey;
            const providerKey = productData?.user_key || sellerKey || product.seller_key || '';
            const rawListingType = String(options.listingType || sourceKind.listingType || product.listing_type || product.item_type || '').toLowerCase();
            const listingType = rawListingType === 'car' || rawListingType === 'cars'
                ? 'car'
                : (rawListingType === 'real_estate' || rawListingType === 'real-estate' || rawListingType === 'realestate'
                    ? 'real_estate'
                    : ((product.is_car_listing || product.car_key || String(product.MainCategory || '') === '7')
                        ? 'car'
                        : ((product.is_real_estate_listing || product.real_estate_key || String(product.MainCategory || '') === '16') ? 'real_estate' : '')));

            if (window.ProductStateManager?.setProductForView && productData) {
                window.ProductStateManager.setProductForView(productData, { showAddToCart: false });
            }

            window.location.href = window.ProductRoutes?.buildProductViewUrl
                ? window.ProductRoutes.buildProductViewUrl(productData, { productKey: productId, providerKey, listingType })
                : `/pages/products/productView/productView.html?product_key=${encodeURIComponent(productId)}&provider_key=${encodeURIComponent(providerKey)}${listingType ? `&listing=${encodeURIComponent(listingType)}` : ''}`;
        } catch (e) {
            console.error('[OrderData] Error viewing product:', e);
            alert('حدث خطأ أثناء تحميل بيانات المنتج.');
        }
    },

    /**
     * Open the photo gallery for a specific item.
     */
    openPhotoGallery: function (u, s, p, o) {
        window.location.href = `/pages/orderPhoto.html?u=${u}&s=${s}&p=${p}&o=${o}`;
    },

    /**
     * Opens map popup
     */
    openMap: function (lat, lng, name) {
        if (typeof Swal === 'undefined') {
            console.error('[OrderData] SweetAlert2 not found');
            return;
        }
        Swal.fire({
            html: `<iframe src="/location/LOCATION.html?lat=${lat}&lng=${lng}&viewOnly=true" style="width: 100%; height: 70vh; border: none; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.2);"></iframe>`,
            showConfirmButton: false,
            width: '95%',
            padding: '0',
            background: 'transparent',
            customClass: {
                popup: 'swal-modern-mini-popup',
                htmlContainer: 'order_swal_no_padding'
            },
            didOpen: () => {
                const handleMapMsg = (event) => {
                    if (event.data && event.data.type === 'CLOSE_LOCATION_MODAL') {
                        Swal.close();
                        window.removeEventListener('message', handleMapMsg);
                    }
                };
                window.addEventListener('message', handleMapMsg);
            }
        });
    }
};

// Global Exposure (Backward Compatibility)
window.orderFormatLocation = window.OrderData_UI.formatLocation;
window.orderFormatPhone = window.OrderData_UI.formatPhone;
window.orderViewProductDetails = window.OrderData_UI.viewProductDetails;
window.orderOpenPhotoGallery = window.OrderData_UI.openPhotoGallery;
window.orderOpenMap = window.OrderData_UI.openMap;

// Map Button Delegate
document.body.addEventListener('click', (e) => {
    const btn = e.target.closest('.order_view_map_btn');
    if (btn) {
        e.preventDefault();
        const { lat, lng, name } = btn.dataset;
        window.orderOpenMap(lat, lng, name);
    }
});
