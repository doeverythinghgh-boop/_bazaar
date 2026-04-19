/**
 * RULE: All comments and documentation must be in English only.
 * WARNING: Hover effects are strictly prohibited on this page to ensure touch-device compatibility.
 */
/**
 * @file pages/merchant-portfolio/js/portfolio-actions-mgmt.js
 * @description Handles product management (Edit, Delete).
 */

/**
 * Shared utility to synchronize product removal across multiple caches.
 * Note: Products are shared with the Search page and the project's global state.
 * @param {string} productId
 * @param {string} userKey
 */
function sharedProductCleanup(productId, userKey) {
    const PortfolioAPI = window.PortfolioAPI || {};
    const store = window.PortfolioStore || null;
    console.log(`[SharedCleanup] Synchronizing deletion for product ${productId}...`);
    const pid = String(productId);

    // 1. Clear Merchant Portfolio Cache for this user
    if (PortfolioAPI.loadCache) {
        const cache = PortfolioAPI.loadCache(userKey);
        if (cache && cache.products) {
            const initialCount = cache.products.length;
            const updated = cache.products.filter(p => String(p.id) !== pid && String(p.product_key) !== pid);

            if (updated.length !== initialCount) {
                // Determine new offset: it should be the new length to avoid skipping
                const newOffset = updated.length;
                PortfolioAPI.saveCache(userKey, {
                    ...cache,
                    products: updated,
                    offset: newOffset
                });

                if (store?.patch) store.patch({ productOffset: newOffset });
                else if (window.portfolioState) window.portfolioState.productOffset = newOffset;
                console.log(`   - Portfolio cache updated. New offset: ${newOffset}`);
            }
        }
    }

    // 2. Update Search Results Cache (sessionStorage)
    try {
        const searchStateRaw = sessionStorage.getItem('search_page_state');
        if (searchStateRaw) {
            const state = JSON.parse(searchStateRaw);
            if (state.results && state.results.length > 0) {
                const initialCount = state.results.length;
                state.results = state.results.filter(p => String(p.id) !== pid && String(p.product_key) !== pid);
                if (state.results.length !== initialCount) {
                    sessionStorage.setItem('search_page_state', JSON.stringify(state));
                    console.log("   - Search page cache synchronized.");
                }
            }
        }
    } catch (e) { console.error("[SharedCleanup] Search cache update failed", e); }

    // 3. Update Product Registry (localStorage)
    if (window.ProductStateManager) {
        const registry = window.ProductStateManager.getState().registry || {};
        const entries = Object.entries(registry);
        const match = entries.find(([key, val]) => key === pid || (val.id && String(val.id) === pid));
        if (match) {
            delete registry[match[0]];
            localStorage.setItem('suez_bazaar_product_registry', JSON.stringify(registry));
            console.log("   - Global product registry updated.");
        }
    }
}

/**
 * Handles product editing logic within the portfolio.
 * @param {number|string} productId
 */
async function portfolioEditProduct(productId) {
    const L = (key, fallback) => (typeof window.langu === 'function' ? window.langu(key) : null) || fallback;
    console.log(`%c[Portfolio] Editing Product ID: ${productId}`, "color: blue;");

    // 1. Find product in cache/state with robust ID matching
    const params = new URLSearchParams(window.location.search);
    const userKey = params.get('user_key');
    const PortfolioAPI = window.PortfolioAPI || {};
    const state = window.PortfolioStore?.getState ? window.PortfolioStore.getState() : window.portfolioState;
    const cache = PortfolioAPI.loadCache ? PortfolioAPI.loadCache(userKey) : null;

    // Support multiple ID formats and prevent type mismatch
    let product = cache?.products?.find(p => String(p.id) === String(productId) || String(p.product_key) === String(productId));

    // Fallback: Check global state if cache fails
    if (!product && state?.allProducts) {
        product = state.allProducts.find(p => String(p.id) === String(productId) || String(p.product_key) === String(productId));
    }

    if (!product) {
        console.error(`[Portfolio] Product ${productId} not found for editing in cache or state.`);
        Swal.fire(L('port_rate_error_title', 'خطأ'), L('port_product_not_found', 'لم يتم العثور على بيانات المنتج، يرجى تحديث الصفحة'), "error");
        return;
    }

    // 2. Clear cache so it reloads on return (Maintain global state shared nature)
    if (PortfolioAPI.clearCache) PortfolioAPI.clearCache(userKey);

    if (typeof ProductStateManager !== 'undefined') {
        ProductStateManager.setSelectedCategories(product.MainCategory, product.SubCategory);
        ProductStateManager.setFormScopeFilter(null);
    }

    if (typeof loadProductForm === 'function') {
        loadProductForm({ editMode: true, productData: product });
    }
}

/**
 * Handles product deletion within the portfolio.
 * @param {number|string} productId
 */
async function portfolioDeleteProduct(productId) {
    const L = (key, fallback) => (typeof window.langu === 'function' ? window.langu(key) : null) || fallback;
    console.log(`%c[Portfolio] Deleting Product ID: ${productId}`, "color: red;");

    // 1. Find product in cache/state with robust ID matching
    const params = new URLSearchParams(window.location.search);
    const userKey = params.get('user_key');
    const PortfolioAPI = window.PortfolioAPI || {};
    const controller = window.portfolioPageController || {};
    const state = window.PortfolioStore?.getState ? window.PortfolioStore.getState() : window.portfolioState;
    const cache = PortfolioAPI.loadCache ? PortfolioAPI.loadCache(userKey) : null;

    // Support multiple ID formats and prevent type mismatch
    let product = cache?.products?.find(p => String(p.id) === String(productId) || String(p.product_key) === String(productId));

    // Fallback: Check global state if cache fails
    if (!product && state?.allProducts) {
        product = state.allProducts.find(p => String(p.id) === String(productId) || String(p.product_key) === String(productId));
    }

    if (!product) {
        console.error(`[Portfolio] Product ${productId} not found for deletion in cache or state.`);
        Swal.fire(L('port_rate_error_title', 'خطأ'), L('port_product_not_found', 'لم يتم العثور على بيانات المنتج، يرجى تحديث الصفحة'), "error");
        return;
    }

    // 2. Confirm Deletion
    const result = await Swal.fire({
        title: window.langu('gen_swal_title_confirm') || 'هل أنت متأكد؟',
        text: (window.langu('gen_swal_remove_text') || 'سيتم حذف {name} نهائياً').replace('{name}', product.productName),
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: window.langu('gen_swal_btn_yes_delete') || 'نعم، احذف',
        cancelButtonText: window.langu('gen_swal_btn_cancel') || 'إلغاء',
        buttonsStyling: false,
        customClass: {
            popup: 'swal-modern-mini-popup',
            confirmButton: 'swal-modern-mini-confirm',
            cancelButton: 'swal-modern-mini-cancel'
        },
        showLoaderOnConfirm: true,
        preConfirm: async () => {
            try {
                // A. Delete Images from Cloudflare R2
                if (product.ImageName) {
                    const images = product.ImageName.split(',').filter(i => i.trim());
                    if (images.length > 0 && typeof window.deleteFile2cf === 'function') {
                        await Promise.all(images.map(img => window.deleteFile2cf(img.trim())));
                    }
                }

                // B. Delete Record from Database
                if (typeof deleteProduct_ === 'function') {
                    const dbRes = await deleteProduct_(product.product_key);
                    if (dbRes && dbRes.error) throw new Error(dbRes.error);
                } else {
                    throw new Error("deleteProduct_ function not found");
                }

                return true;
            } catch (e) {
                const errTemplate = L('port_delete_error', 'خطأ أثناء الحذف: {msg}');
                Swal.showValidationMessage(errTemplate.replace('{msg}', e.message));
                return false;
            }
        }
    });

    if (result.isConfirmed) {
        Swal.fire({
            title: L('port_delete_success_title', 'تم الحذف!'),
            text: L('port_delete_success_text', 'تم حذف المنتج بنجاح.'),
            icon: 'success',
            timer: 2000,
            showConfirmButton: false,
            customClass: { popup: 'swal-modern-mini-popup' }
        });

        // 3. Shared Cache Cleanup (Portfolio, Search, and Registry)
        sharedProductCleanup(productId, userKey);

        // 4. Update UI state and Grid
        if (state?.allProducts) {
            const nextProducts = state.allProducts.filter(p => String(p.id) !== String(productId) && String(p.product_key) !== String(productId));
            if (controller.setAllProducts) {
                controller.setAllProducts(nextProducts, {
                    userKey: userKey,
                    productOffset: nextProducts.length,
                    hasMoreProducts: nextProducts.length >= (state.productLimit || 5)
                });
            } else {
                state.allProducts = nextProducts;
            }
            window.portfolioRenderProducts(nextProducts, false);
        }
    }
}

// Global exposure
window.portfolioEditProduct = portfolioEditProduct;
window.portfolioDeleteProduct = portfolioDeleteProduct;
