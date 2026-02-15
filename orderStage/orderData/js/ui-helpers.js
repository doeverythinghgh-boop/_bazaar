/**
 * @file orderStage/orderData/js/ui-helpers.js
 * @description Shared UI helper functions for formatting and interaction.
 */

window.OrderData_UI = {
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

    /**
     * Fetches product details and opens the product view page.
     * @param {string} productKey 
     */
    viewProductDetails: async function (productKey) {
        if (!productKey) return;
        try {
            console.log('[OrderData] Requesting product details for:', productKey);
            const base = (typeof baseURL !== 'undefined') ? baseURL : '';
            const url = `${base}/api/products?product_key=${productKey}`;

            const response = await fetch(url);
            if (!response.ok) throw new Error(`Fetch failed: ${response.status} `);
            const product = await response.json();

            if (typeof mapProductData === 'function' && typeof loadProductView === 'function') {
                const productData = mapProductData(product);
                loadProductView(productData, { showAddToCart: false });
            } else {
                alert('تعذر تحميل معالج البيانات أو صفحة العرض.');
            }
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