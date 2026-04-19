/**
 * @file pages/merchant-portfolio/js/pharmacy-control-panel/pharmacy-merchant-products-ui.js
 * @description Merchant pharmacy products list UI.
 */

window.pharmacyMerchantProductsUI = (function () {
    const state = {
        products: [],
        userKey: null
    };

    function getFallbackImage() {
        return '/assets/images/placeholder.png';
    }

    function getImageUrl(imageName) {
        if (!imageName) return getFallbackImage();
        return (typeof window.getPublicR2FileUrl === 'function')
            ? window.getPublicR2FileUrl(imageName)
            : ('/' + imageName);
    }

    function renderProducts(products) {
        const container = document.getElementById('merchant-products-container');
        const emptyState = document.getElementById('products-empty-state');

        if (!container) return;
        container.innerHTML = '';

        if (!products?.length) {
            if (emptyState) emptyState.classList.remove('hidden');
            return;
        }

        if (emptyState) emptyState.classList.add('hidden');

        const fragment = document.createDocumentFragment();

        products.forEach(product => {
            const card = document.createElement('div');
            card.className = 'merchant-product-card';

            const statusClass = product.status == 1 ? 'status-active' : 'status-hidden';
            const statusLabel = product.status == 1 ? 'متوفر' : 'مخفي';

            card.innerHTML = `
                <div class="product-status-badge ${statusClass}">${statusLabel}</div>
                <div class="product-card-body">
                    <div class="product-card-thumb">
                        <img src="${getImageUrl(product.image_names)}" onerror="this.src='${getFallbackImage()}';">
                    </div>
                    <div class="product-card-main-info">
                        <h4 class="product-card-name" title="${product.name_ar || ''}">${product.name_ar || ''}</h4>
                        <p class="product-card-meta">السعر: <b>${product.price} ج.م</b></p>
                        <p class="product-card-meta">المخزون: <b>${product.stock_quantity || 0}</b></p>
                    </div>
                </div>
                <div class="product-card-actions">
                    <button class="btn-card-action btn-edit-product" data-product-id="${product.product_id}">
                        <i class="fas fa-edit"></i> تعديل
                    </button>
                    <button class="btn-card-action btn-delete-product" data-product-id="${product.product_id}">
                        <i class="fas fa-trash-alt"></i> حذف
                    </button>
                </div>
            `;

            fragment.appendChild(card);
        });

        container.appendChild(fragment);
    }

    async function loadProducts(userKey) {
        if (!userKey) return;

        state.userKey = userKey;

        const loader = document.getElementById('merchant-products-loader');
        const container = document.getElementById('merchant-products-container');
        const emptyState = document.getElementById('products-empty-state');

        if (loader) loader.classList.remove('hidden');
        if (container) container.innerHTML = '';
        if (emptyState) emptyState.classList.add('hidden');

        try {
            state.products = await window.PharmacyAPI.fetchMerchantProducts(userKey);
            renderProducts(state.products);
        } catch (error) {
            console.error("[PharmacyProducts] Load failed:", error);
            if (container) {
                container.innerHTML = '<p class="error-text">حدث خطأ أثناء تحميل المنتجات.</p>';
            }
        } finally {
            if (loader) loader.classList.add('hidden');
        }
    }

    async function deleteProduct(productId) {
        const product = state.products.find(item => item.product_id === productId);
        if (!product) return;

        const result = await Swal.fire({
            title: 'هل أنت متأكد؟',
            text: 'سيتم حذف المنتج وصورته نهائياً من النظام!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'نعم، احذف الكل!',
            cancelButtonText: 'إلغاء'
        });

        if (!result.isConfirmed) return;

        Swal.fire({
            title: 'جاري الحذف...',
            didOpen: () => { Swal.showLoading(); },
            allowOutsideClick: false
        });

        try {
            if (product.image_names && typeof window.deleteFile2cf === 'function') {
                await window.deleteFile2cf(product.image_names);
            }

            await window.PharmacyAPI.deleteProductMetadata(productId, state.userKey);
            window.PharmacyAPI.invalidateCatalogContext(state.userKey);
            await loadProducts(state.userKey);

            Swal.fire('تم الحذف!', 'تم حذف المنتج وصورته بنجاح.', 'success');
        } catch (error) {
            console.error("[PharmacyProducts] Delete failed:", error);
            Swal.fire('فشل الحذف', error.message || 'تعذر حذف المنتج.', 'error');
        }
    }

    function editProduct(productId) {
        const product = state.products.find(item => item.product_id === productId);
        if (!product) return;

        const addTabBtn = document.querySelector('.navbar-menu li[data-tab="add-product-tab"]');
        if (addTabBtn) addTabBtn.click();

        if (typeof window.pharmacyPreFillAddProductForm === 'function') {
            window.pharmacyPreFillAddProductForm(product);
        }
    }

    function bindEvents() {
        const container = document.getElementById('merchant-products-container');
        if (!container || container.dataset.bound === 'true') return;

        container.dataset.bound = 'true';
        container.addEventListener('click', event => {
            const editBtn = event.target.closest('.btn-edit-product');
            if (editBtn) {
                editProduct(editBtn.dataset.productId);
                return;
            }

            const deleteBtn = event.target.closest('.btn-delete-product');
            if (deleteBtn) {
                deleteProduct(deleteBtn.dataset.productId);
            }
        });
    }

    bindEvents();

    return {
        deleteProduct,
        editProduct,
        loadProducts
    };
})();
