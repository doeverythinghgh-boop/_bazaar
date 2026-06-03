/**
 * @file pages/ADMIN/pendingProducts-actions.js
 * @description Logical actions module for products (Update, Delete, Preview).
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


async function updateStatus(key, name, newStatus) {
    const actionName = newStatus === 1
        ? adminPendingText("admin_pending_approve_publish", "موافقة ونشر")
        : adminPendingText("admin_pending_unpublish", "إلغاء نشر");

    const confirm = await Swal.fire({
        title: adminPendingText("admin_pending_confirm_action", "تأكيد {action}").replace("{action}", actionName),
        text: adminPendingText("admin_pending_confirm_action_text", "هل أنت متأكد من {action} المنتج \"{name}\"؟")
            .replace("{action}", actionName)
            .replace("{name}", name),
        showCancelButton: true,
        buttonsStyling: false,
        customClass: {
            popup: "swal-modern-mini-popup",
            title: "swal-modern-mini-title",
            htmlContainer: "swal-modern-mini-text",
            confirmButton: "swal-modern-mini-confirm",
            cancelButton: "swal-modern-mini-cancel"
        },
        confirmButtonText: adminPendingText("alert_confirm_yes", "نعم"),
        cancelButtonText: adminPendingText("alert_confirm_no", "لا")
    });

    if (!confirm.isConfirmed) return;

    try {
        Swal.showLoading();
        const res = await updateProductStatusAPI(key, newStatus);
        if (res && res.error) throw new Error(res.error || adminPendingText("admin_pending_update_failed", "فشل التحديث"));

        if (newStatus === 1 && typeof notifyOnItemAccepted === "function") {
            try {
                const pData = await fetchProductDetailsAPI(key);
                if (pData) {
                    notifyOnItemAccepted({
                        productName: name,
                        user_key: pData.user_key,
                        isService: pData.serviceType === 2 || pData.serviceType === "2" || pData.isService
                    });
                }
            } catch (e) {
                console.error("[Admin-Actions] Failed to fetch notification data:", e);
            }
        }

        Swal.fire({
            title: adminPendingText("admin_pending_success_title", "تم بنجاح"),
            text: adminPendingText("admin_pending_success_text", "تمت عملية {action} بنجاح").replace("{action}", actionName),
            timer: 1500,
            showConfirmButton: false,
            buttonsStyling: false,
            customClass: {
                popup: "swal-modern-mini-popup",
                title: "swal-modern-mini-title",
                htmlContainer: "swal-modern-mini-text"
            }
        });

        if (typeof fetchAllData === "function") fetchAllData();
    } catch (e) {
        Swal.fire({
            title: adminPendingText("gen_swal_error_title", "خطأ"),
            text: e.message,
            confirmButtonText: adminPendingText("alert_confirm_btn", "موافق"),
            buttonsStyling: false,
            customClass: {
                popup: "swal-modern-mini-popup",
                title: "swal-modern-mini-title",
                htmlContainer: "swal-modern-mini-text",
                confirmButton: "swal-modern-mini-confirm"
            }
        });
    }
}

async function deleteProduct(key, name, imageNamesStr, userKey = "", isService = false) {
    const confirm = await Swal.fire({
        title: adminPendingText("admin_pending_delete_product", "حذف المنتج"),
        text: adminPendingText("admin_pending_delete_text", "هل أنت متأكد من حذف \"{name}\" نهائيًا؟ سيتم حذف جميع الصور المرتبطة أيضًا من السحابة.").replace("{name}", name),
        showCancelButton: true,
        buttonsStyling: false,
        customClass: {
            popup: "swal-modern-mini-popup",
            title: "swal-modern-mini-title",
            htmlContainer: "swal-modern-mini-text",
            confirmButton: "swal-modern-mini-confirm",
            cancelButton: "swal-modern-mini-cancel"
        },
        confirmButtonText: adminPendingText("admin_pending_delete_forever", "نعم، احذف نهائياً"),
        cancelButtonText: adminPendingText("alert_cancel_btn", "إلغاء"),
        showLoaderOnConfirm: true,
        preConfirm: async () => {
            try {
                if (imageNamesStr) {
                    const imageNames = imageNamesStr.split(",").map((s) => s.trim()).filter((s) => s);
                    if (imageNames.length > 0) {
                        await Promise.all(imageNames.map((img) =>
                            deleteFile2cf(img).catch((err) => console.error(`[Delete] Failed to delete image ${img}:`, err))
                        ));
                    }
                }
                const res = await deleteProductFromAPI(key);
                if (res && res.error) throw new Error("Failed to delete product from database");

                if (userKey && typeof notifyOnItemRejected === "function") {
                    notifyOnItemRejected({
                        productName: name,
                        user_key: userKey,
                        isService
                    });
                }

                return true;
            } catch (e) {
                Swal.showValidationMessage(`${adminPendingText("gen_swal_error_title", "خطأ")}: ${e.message}`);
                return false;
            }
        },
        allowOutsideClick: () => !Swal.isLoading()
    });

    if (confirm.isConfirmed) {
        Swal.fire({
            title: adminPendingText("admin_pending_deleted_rejected_title", "تم الحذف والرفض"),
            text: adminPendingText("admin_pending_deleted_rejected_text", "تم حذف المنتج بنجاح وإرسال إشعار لمقدم الخدمة بالرفض."),
            timer: 2000,
            showConfirmButton: false,
            buttonsStyling: false,
            customClass: {
                popup: "swal-modern-mini-popup",
                title: "swal-modern-mini-title",
                htmlContainer: "swal-modern-mini-text"
            }
        });
        if (typeof fetchAllData === "function") fetchAllData();
    }
}

async function previewProduct(key, status = 0) {
    try {
        const data = await apiFetch(`/api/products?product_key=${key}&status=${status}`);
        const product = Array.isArray(data) ? data[0] : data;

        if (!product) {
            console.error("Product not found");
            return;
        }

        const productDataForModal = mapProductData(product);
        if (typeof loadProductView === "function") {
            loadProductView(productDataForModal, { showAddToCart: false });
        }
    } catch (e) {
        console.error("Preview error:", e);
    }
}

window.updateStatus = updateStatus;
window.adminUpdateStatus = updateStatus;
window.deleteProduct = deleteProduct;
window.adminDeleteProduct = deleteProduct;
window.previewProduct = previewProduct;
window.adminPreviewProduct = previewProduct;
