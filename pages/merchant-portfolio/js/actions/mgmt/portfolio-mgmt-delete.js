/**
 * @file portfolio-mgmt-delete.js
 * @description Product deletion logic for the merchant portfolio.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

window.portfolioDeleteProduct = async function (productId) {
    const L = (key, fallback) => (typeof window.langu === 'function' ? window.langu(key) : null) || fallback;
    console.log(`[Portfolio] Deleting Product ID: ${productId}`);

    const params = new URLSearchParams(window.location.search);
    const userKey = params.get('user_key');
    const controller = window.portfolioPageController || {};

    if (typeof window.resolvePortfolioProductById !== 'function') return;

    const resolved = window.resolvePortfolioProductById(productId, userKey);
    const product = resolved.product;
    const state = resolved.state;
    const PortfolioAPI = window.PortfolioAPI || {};

    if (!product) {
        console.error(`[Portfolio] Product ${productId} not found for deletion in cache or state.`);
        if (typeof Swal !== 'undefined') {
            Swal.fire(L('port_rate_error_title', 'خطأ'), L('port_product_not_found', 'لم يتم العثور على بيانات المنتج، يرجى تحديث الصفحة'), "error");
        }
        return;
    }

    if (typeof Swal === 'undefined') return;

    const result = await Swal.fire({
        title: window.langu('gen_swal_title_confirm') || 'هل أنت متأكد؟',
        text: (window.langu('port_delete_confirm_text') || 'سيتم حذف {name} نهائياً').replace('{name}', product.productName),
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
                if (product?.item_type === 'car' || product?.is_car_listing) {
                    if (product.ImageName) {
                        const images = product.ImageName.split(',').filter(i => i.trim());
                        if (images.length > 0 && typeof window.deleteFile2cf === 'function') {
                            await Promise.all(images.map(img => window.deleteFile2cf(img.trim())));
                        }
                    }
                    if (!PortfolioAPI.deleteCar) throw new Error("deleteCar function not found");
                    const dbRes = await PortfolioAPI.deleteCar(product.car_key || product.product_key || productId);
                    if (dbRes && dbRes.error) throw new Error(dbRes.error);
                    return true;
                }

                if (product.ImageName) {
                    const images = product.ImageName.split(',').filter(i => i.trim());
                    if (images.length > 0 && typeof window.deleteFile2cf === 'function') {
                        await Promise.all(images.map(img => window.deleteFile2cf(img.trim())));
                    }
                }

                if (typeof deleteProduct_ === 'function') {
                    const dbRes = await deleteProduct_(product.product_key);
                    if (dbRes && dbRes.error) throw new Error(dbRes.error);
                } else {
                    throw new Error("deleteProduct_ function not found");
                }

                return true;
            } catch (error) {
                if (window.PortfolioErrorUtils?.log) {
                    window.PortfolioErrorUtils.log("PortfolioActionsMgmt", "Product deletion pre-confirm step failed.", error);
                } else {
                    console.error("[PortfolioActionsMgmt] Product deletion pre-confirm step failed.", error);
                }
                const errTemplate = L('port_delete_error', 'خطأ أثناء الحذف: {msg}');
                Swal.showValidationMessage(errTemplate.replace('{msg}', error.message));
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

        if (typeof window.sharedProductCleanup === 'function') {
            if (!(product?.item_type === 'car' || product?.is_car_listing)) {
                window.sharedProductCleanup(product.product_key || productId, userKey);
            }
        }

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
            if (typeof window.portfolioRenderProducts === 'function') {
                window.portfolioRenderProducts(nextProducts, false);
            }
        }
    }
};
