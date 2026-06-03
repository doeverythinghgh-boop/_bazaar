/**
 * @file search-render-mgmt.js
 * @description Logic for product management actions (Edit/Delete) in search results.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


/**
 * Handles product editing logic within the search results.
 */
/**
 * Handles product editing logic within the search results.
 */
window.searchEditProduct = async function (productKey) {
    const L = (key, fallback) => (typeof window.langu === 'function' ? window.langu(key) : null) || fallback;
    console.log(` [Search Module - Mgmt] searchEditProduct() Started for productKey: ${productKey}`);

    const product = currentResults.find(p => p.product_key === productKey);
    if (!product) {
        console.warn(" [Search Module - Mgmt] Product not found in current results");
        Swal.fire(L('port_rate_error_title', 'خطأ'), L('port_product_not_found', 'لم يتم العثور على المنتج في النتائج الحالية'), "error");
        console.log(" [Search Module - Mgmt] searchEditProduct() Finished with Error");
        return;
    }

    if (typeof ProductStateManager !== 'undefined') {
        console.info(` [Search Module - Mgmt] Setting ProductStateManager categories: Main=${product.MainCategory}, Sub=${product.SubCategory}`);
        ProductStateManager.setSelectedCategories(product.MainCategory, product.SubCategory);
        ProductStateManager.setFormScopeFilter(null);
    }

    if (typeof loadProductForm === 'function') {
        console.info(" [Search Module - Mgmt] Calling loadProductForm");
        loadProductForm({ editMode: true, productData: product });
    }
    console.log(" [Search Module - Mgmt] searchEditProduct() Finished");
};

/**
 * Handles product deletion within the search results.
 */
window.searchDeleteProduct = async function (productKey) {
    console.log(` [Search Module - Mgmt] searchDeleteProduct() Started for productKey: ${productKey}`);
    const L = (key, fallback) => (typeof window.langu === 'function' ? window.langu(key) : null) || fallback;
    const product = currentResults.find(p => p.product_key === productKey);
    if (!product) {
        console.warn(" [Search Module - Mgmt] Product not found in current results");
        console.log(" [Search Module - Mgmt] searchDeleteProduct() Finished");
        return;
    }

    console.info(` [Search Module - Mgmt] Prompting for delete confirmation: ${product.productName}`);
    const result = await Swal.fire({
        title: L('gen_swal_title_confirm', 'هل أنت متأكد؟'),
        text: (L('gen_swal_remove_text', 'سيتم حذف {name} نهائياً')).replace('{name}', product.productName),
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: L('gen_swal_btn_yes_delete', 'نعم، احذف'),
        cancelButtonText: L('gen_swal_btn_cancel', 'إلغاء'),
        buttonsStyling: false,
        customClass: {
            popup: 'swal-modern-mini-popup',
            confirmButton: 'swal-modern-mini-confirm',
            cancelButton: 'swal-modern-mini-cancel'
        },
        showLoaderOnConfirm: true,
        preConfirm: async () => {
            console.log(" [Search Module - Mgmt] Deletion confirmed, starting process");
            try {
                if (product.ImageName) {
                    const images = product.ImageName.split(',').filter(i => i.trim());
                    console.info(` [Search Module - Mgmt] Deleting ${images.length} associated images`);
                    if (images.length > 0 && typeof window.deleteFile2cf === 'function') {
                        await Promise.all(images.map(img => window.deleteFile2cf(img.trim())));
                    }
                }
                if (typeof deleteProduct_ === 'function') {
                    console.info(" [Search Module - Mgmt] Calling deleteProduct_");
                    await deleteProduct_(product.product_key);
                } else {
                    throw new Error("وظيفة الحذف غير متوفرة حالياً");
                }
                console.info(" [Search Module - Mgmt] Deletion successful");
                return true;
            } catch (e) {
                console.error(" [Search Module - Mgmt] Deletion failed", e);
                Swal.showValidationMessage(L('port_delete_error', 'حدث خطأ: {msg}').replace('{msg}', e.message));
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

        console.info(" [Search Module - Mgmt] Updating current results list and display");
        currentResults = currentResults.filter(p => p.product_key !== productKey);
        if (typeof displaySearchResults === 'function') {
            displaySearchResults(currentResults, "products", false);
        }
        if (typeof SearchState !== 'undefined') SearchState.save();
    }
    console.log(" [Search Module - Mgmt] searchDeleteProduct() Finished");
};
