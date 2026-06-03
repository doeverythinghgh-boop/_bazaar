/**
 * @file pages/merchant-portfolio/js/send-request-api.js
 * @description API service and data fetching for the Merchant Direct Request page.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


const RequestAPI = {
    /**
     * @function fetchMerchant
     * @description Fetches merchant data using the unified PortfolioAPI or fallback.
     */
    async fetchMerchant(merchantKey) {
        if (!merchantKey) throw new Error("Missing merchant key");

        const payload = typeof window.apiFetch === 'function'
            ? await window.apiFetch(`/api/users?user_key=${encodeURIComponent(merchantKey)}`)
            : await fetch(`/api/users?user_key=${encodeURIComponent(merchantKey)}`).then((response) => response.json());
        const merchant = payload?.data || payload;
        if (!merchant || merchant.error) throw new Error("Merchant data is unavailable from Turso");
        return merchant;
    },

    async fetchDeliveryRelations(db, sellerKey) {
        const snapshot = await db.collection('supplier_deliveries')
            .where('seller_key', '==', sellerKey)
            .get();
        const relations = [];
        snapshot.forEach((doc) => {
            const relation = doc.data() || {};
            const deliveryKey = relation.delivery_key || relation.deliveryKey || relation.user_key;
            if (!deliveryKey || relation.is_active === false || relation.isActive === false) return;
            relations.push({
                delivery_key: deliveryKey,
                delivery_name: relation.delivery_name || relation.username || relation.business_name || deliveryKey,
                delivery_phone: relation.delivery_phone || relation.phone || relation.primary_phone || "",
                delivery_location: relation.delivery_location || relation.location || relation.user_location || "",
                fcmToken: relation.fcmToken || relation.fcm_token || ""
            });
        });
        return relations;
    },

    /**
     * @function submitRequest
     * @description Handles the full submission flow: validation, image upload, and order posting.
     */
    async submitRequest() {
        const textarea = document.getElementById('request-notes');
        const note = textarea.value.trim();
        const submitBtn = document.getElementById('btn-submit-request');
        const currentMerchantKey = window.RequestState?.merchant?.user_key;
        const pharmacyProducts = (window.PharmacyRequestCart && currentMerchantKey)
            ? window.PharmacyRequestCart.toOrderPayload(currentMerchantKey)
            : [];

        // 1. Validation
        if (window.RequestState.attachedImages.length === 0 && !note && pharmacyProducts.length === 0) {
            Swal.fire({
                icon: 'info',
                title: window.langu('alert_title_info') || 'تنبيه',
                text: window.langu('port_req_validation_msg') || 'يرجى كتابة ملاحظات أو إرفاق صورة واحدة على الأقل لوصف طلبك.',
                confirmButtonText: window.langu('gen_swal_confirm_btn') || 'حسناً'
            });
            return;
        }

        // 2. Auth Check
        if (typeof userSession === 'undefined' || userSession.user_key === 'guest_user') {
            Swal.fire({
                icon: 'warning',
                title: window.langu('alert_title_info') || 'تسجيل الدخول مطلوب',
                text: window.langu('port_login_required_request') || 'يجب تسجيل الدخول لتتمكن من إرسال طلب مباشر.',
                confirmButtonText: window.langu('login_text') || 'تسجيل الدخول',
                showCancelButton: true,
                cancelButtonText: window.langu('alert_cancel_btn') || 'إلغاء',
                buttonsStyling: false,
                customClass: {
                    popup: 'swal-modern-mini-popup',
                    confirmButton: 'swal-modern-mini-confirm',
                    cancelButton: 'swal-modern-mini-cancel'
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = '/pages/identity/login.html';
                }
            });
            return;
        }

        const user_key = userSession.user_key;
        const seller_key = window.RequestState.merchant.user_key;

        // 3. Show Loading
        Swal.fire({
            title: window.langu('port_req_submit_loading_title') || 'جاري إرسال طلبك...',
            html: window.langu('port_req_submit_loading_text') || 'يرجى الانتظار بينما يتم رفع الصور وتجهيز الطلب.',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        submitBtn.disabled = true;

        try {
            const order_key = typeof generateSerial === 'function' ? generateSerial() : `ORD-${Date.now()}`;
            const uploadedFileNames = [];

            // 4. Upload images
            for (let i = 0; i < window.RequestState.attachedImages.length; i++) {
                const file = window.RequestState.attachedImages[i];
                const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
                // Match orderPhoto.html naming: ${u}_${s}_${p}_${o}_${index}
                const finalName = `${user_key}_${seller_key}_PH_DIRECT_REQUEST_${order_key}_${i+1}.${ext}`;

                if (typeof uploadFile2cf === 'function') {
                    const uploadResult = await uploadFile2cf(file, finalName);
                    uploadedFileNames.push(uploadResult.file || finalName);
                } else {
                    throw new Error("حدث خطأ في نظام رفع الصور.");
                }
            }

            // 5. Prepare Order Data
            const orderData = {
                order_key: order_key,
                user_key: user_key,
                total_amount: 0,
                orderType: 3, // specialized
                items: [
                    {
                        product_key: "PH_DIRECT_REQUEST",
                        quantity: 1,
                        seller_key: seller_key,
                        note: note,
                        images: uploadedFileNames.join(',')
                    }
                ],
                pharmacy_products: pharmacyProducts
            };

            // 6. Post Data directly to Firestore
            console.log("[RequestAPI] Starting Firestore order creation process...");
            if (typeof window.ensureFirestoreDb !== 'function') {
                throw new Error("ensureFirestoreDb function is not loaded/available");
            }
            console.log("[RequestAPI] Ensuring Firestore database connection...");
            const db = await window.ensureFirestoreDb();
            console.log("[RequestAPI] Firestore connection established.");

            const sellerIsDelivered = window.RequestState.merchant.isDelivered || window.RequestState.merchant.is_delivered || 0;
            const deliveryRelations = Number(sellerIsDelivered) === 1
                ? []
                : await RequestAPI.fetchDeliveryRelations(db, seller_key);
            const deliveryKeys = deliveryRelations.map((relation) => relation.delivery_key).filter(Boolean);
            console.log("[RequestAPI] Active delivery keys assigned to order:", deliveryKeys);

            const timestamp = new Date().toISOString();
            const itemSnapshot = {
                product_key: "PH_DIRECT_REQUEST",
                product_name: window.langu('port_direct_request_title') || "طلب مباشر",
                quantity: 1,
                seller_key: seller_key,
                seller_name: window.RequestState.merchant.username || window.RequestState.merchant.business_name || seller_key,
                seller_phone: window.RequestState.merchant.phone || "",
                seller_location: window.RequestState.merchant.location || window.RequestState.merchant.user_location || "",
                seller_is_delivered: sellerIsDelivered,
                serviceType: 2,
                total_amount: 0,
                note: note,
                images: uploadedFileNames.join(','),
                supplier_delivery: deliveryRelations
            };

            // Construct the NoSQL order document matching the specified structure
            const firestoreOrderData = {
                order_key: order_key,
                user_key: user_key,
                user_name: userSession.username || userSession.name || userSession.full_name || "",
                user_phone: userSession.phone || userSession.phoneNumber || "",
                user_address: userSession.address || userSession.user_address || "",
                user_location: userSession.location || userSession.user_location || "",
                user_platform: userSession.platform || "web",
                user_fcm_token: userSession.fcm_token || userSession.fcmToken || "",
                total_amount: 0,
                orderType: 3, // specialized direct request
                status_version: "2.1",
                current_step_id: "0",
                created_at: timestamp,
                status_last_updated: timestamp,
                seller_keys: [seller_key],
                delivery_keys: deliveryKeys,
                order_items: [itemSnapshot],
                pharmacy_products: pharmacyProducts,
                order_status: {
                    step_id: "0",
                    last_updated: timestamp,
                    unavailable_product_keys: [],
                    item_statuses: {}
                }
            };

            console.log("[RequestAPI] Document payload to save in Firestore:", firestoreOrderData);

            // Write document directly to Firestore under orders collection
            await db.collection('orders').doc(order_key).set(firestoreOrderData);
            console.log(`[RequestAPI] Order ${order_key} written to Firestore successfully.`);

            if (typeof window.handlePurchaseNotifications === 'function') {
                window.handlePurchaseNotifications({ ...firestoreOrderData, id: order_key })
                    .catch((notifyError) => console.error('[RequestAPI] Error notification:', notifyError));
            }

            // 7. Success handling
            Swal.fire({
                icon: 'success',
                title: window.langu('port_req_submit_success_title') || 'تم الإرسال بنجاح',
                text: window.langu('port_req_submit_success_text') || 'سيصل طلبك للتاجر وسيتواصل معك في أقرب وقت.',
                confirmButtonText: window.langu('port_req_submit_back_btn') || 'العودة للمتجر'
            }).then(() => {
                if (window.PharmacyRequestCart) {
                    window.PharmacyRequestCart.clearMerchant(seller_key);
                }
                window.location.href = `/pages/merchant-portfolio/merchant-portfolio.html?user_key=${seller_key}`;
            });

        } catch (error) {
            console.error("[RequestAPI] Error:", error);
            Swal.fire({
                icon: 'error',
                title: window.langu('port_fetch_error_title') || 'حذث خطأ',
                text: error.message || 'فشل إرسال الطلب، يرجى المحاولة لاحقاً.'
            });
            submitBtn.disabled = false;
        }
    }
};

window.RequestAPI = RequestAPI;
function req_submitRequest() {
    RequestAPI.submitRequest();
}
window.req_submitRequest = req_submitRequest;
