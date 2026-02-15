/**
 * @file pages/ADMIN/pendingProducts-actions.js
 * @description Logical actions module for products (Update, Delete, Preview).
 */

/**
 * @function updateStatus
 * @description Updates the approval status of a product (Approve/Unpublish).
 * @param {string} key - Product key.
 * @param {string} name - Product name.
 * @param {number} newStatus - New status.
 */
async function updateStatus(key, name, newStatus) {
    const actionName = newStatus === 1 ? 'موافقة ونشر' : 'إلغاء نشر';

    const confirm = await Swal.fire({
        title: `تأكيد ${actionName}`,
        text: `هل أنت متأكد من ${actionName} المنتج "${name}"؟`,
        showCancelButton: true,
        buttonsStyling: false,
        customClass: {
            popup: 'swal-modern-mini-popup',
            title: 'swal-modern-mini-title',
            htmlContainer: 'swal-modern-mini-text',
            confirmButton: 'swal-modern-mini-confirm',
            cancelButton: 'swal-modern-mini-cancel'
        },
        confirmButtonText: 'نعم',
        cancelButtonText: 'لا'
    });

    if (!confirm.isConfirmed) return;

    try {
        Swal.showLoading();
        const res = await updateProductStatusAPI(key, newStatus);
        if (!res.ok) throw new Error('فشل التحديث');

        // Notification logic
        if (newStatus === 1 && typeof notifyOnItemAccepted === 'function') {
            try {
                const pData = await fetchProductDetailsAPI(key);
                if (pData) {
                    notifyOnItemAccepted({
                        productName: name,
                        user_key: pData.user_key,
                        isService: pData.serviceType === 2 || pData.serviceType === '2' || pData.isService
                    });
                }
            } catch (e) {
                console.error("[Admin-Actions] فشل جلب بيانات الإشعار:", e);
            }
        }

        Swal.fire({
            title: 'تم بنجاح',
            text: `تمت عملية ${actionName} بنجاح`,
            timer: 1500,
            showConfirmButton: false,
            buttonsStyling: false,
            customClass: {
                popup: 'swal-modern-mini-popup',
                title: 'swal-modern-mini-title',
                htmlContainer: 'swal-modern-mini-text'
            }
        });

        if (typeof fetchAllData === 'function') fetchAllData();

    } catch (e) {
        Swal.fire({
            title: 'Error',
            text: e.message,
            confirmButtonText: 'OK',
            buttonsStyling: false,
            customClass: {
                popup: 'swal-modern-mini-popup',
                title: 'swal-modern-mini-title',
                htmlContainer: 'swal-modern-mini-text',
                confirmButton: 'swal-modern-mini-confirm'
            }
        });
    }
}

/**
 * @function deleteProduct
 * @description Permanently deletes a product and its images.
 * @param {string} key - Product key.
 * @param {string} name - Product name.
 * @param {string} imageNamesStr - Image filenames.
 */
async function deleteProduct(key, name, imageNamesStr) {
    const confirm = await Swal.fire({
        title: 'حذف المنتج',
        text: `هل أنت متأكد من حذف "${name}" نهائياً؟ سيتم حذف جميع الصور المرتبطة أيضاً من السحابة.`,
        showCancelButton: true,
        buttonsStyling: false,
        customClass: {
            popup: 'swal-modern-mini-popup',
            title: 'swal-modern-mini-title',
            htmlContainer: 'swal-modern-mini-text',
            confirmButton: 'swal-modern-mini-confirm',
            cancelButton: 'swal-modern-mini-cancel'
        },
        confirmButtonText: 'نعم، احذف نهائياً',
        cancelButtonText: 'إلغاء',
        showLoaderOnConfirm: true,
        preConfirm: async () => {
            try {
                if (imageNamesStr) {
                    const imageNames = imageNamesStr.split(',').map(s => s.trim()).filter(s => s);
                    if (imageNames.length > 0) {
                        await Promise.all(imageNames.map(img =>
                            deleteFile2cf(img).catch(err => console.error(`[Delete] Failed to delete image ${img}:`, err))
                        ));
                    }
                }
                const res = await deleteProductFromAPI(key);
                if (!res.ok) throw new Error('Failed to delete product from database');
                return true;
            } catch (e) {
                Swal.showValidationMessage(`خطأ: ${e.message}`);
                return false;
            }
        },
        allowOutsideClick: () => !Swal.isLoading()
    });

    if (confirm.isConfirmed) {
        Swal.fire({
            title: 'تم الحذف',
            text: 'تم حذف المنتج والصور بنجاح',
            timer: 1500,
            showConfirmButton: false,
            buttonsStyling: false,
            customClass: {
                popup: 'swal-modern-mini-popup',
                title: 'swal-modern-mini-title',
                htmlContainer: 'swal-modern-mini-text'
            }
        });
        if (typeof fetchAllData === 'function') fetchAllData();
    }
}

/**
 * @function previewProduct
 * @description Opens the product viewer modal.
 * @param {string} key - Product key.
 * @param {number} status - Status.
 */
async function previewProduct(key, status = 0) {
    try {
        const p = await fetchProductsFromAPI(status, 1, 0); // Note: Simple hack if offset is used for search
        // Wait, the original preview used a different fetch that didn't rely on status as a filter but as a direct param
        // Let's use the dedicated API function instead
        const response = await fetch(`${baseURL}/api/products?product_key=${key}&status=${status}`);
        const data = await response.json();

        if (!data) {
            console.error("المنتج غير موجود");
            return;
        }

        const productDataForModal = mapProductData(data);
        if (typeof loadProductView === 'function') {
            loadProductView(productDataForModal, { showAddToCart: false });
        }
    } catch (e) {
        console.error("خطأ أثناء معاينة المنتج:", e);
    }
}

// Global exposure
window.updateStatus = updateStatus;
window.adminUpdateStatus = updateStatus;
window.deleteProduct = deleteProduct;
window.adminDeleteProduct = deleteProduct;
window.previewProduct = previewProduct;
window.adminPreviewProduct = previewProduct;
