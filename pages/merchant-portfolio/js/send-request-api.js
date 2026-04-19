/**
 * @file pages/merchant-portfolio/js/send-request-api.js
 * @description API service and data fetching for the Pharmacy Request page.
 */

const RequestAPI = {
    /**
     * @function fetchMerchant
     * @description Fetches merchant data using the unified PortfolioAPI or fallback.
     */
    async fetchMerchant(merchantKey) {
        if (!merchantKey) throw new Error("Missing merchant key");

        let merchant = null;
        if (typeof PortfolioAPI !== 'undefined' && PortfolioAPI.fetchUser) {
            merchant = await PortfolioAPI.fetchUser(merchantKey);
        } else {
            const resp = await fetch(`/api/users?user_key=${merchantKey}`);
            merchant = await resp.json();
        }
        return merchant;
    },

    /**
     * @function submitRequest
     * @description Handles the full submission flow: validation, image upload, and order posting.
     */
    async submitRequest() {
        const textarea = document.getElementById('request-notes');
        const note = textarea.value.trim();
        const submitBtn = document.getElementById('btn-submit-request');

        // 1. Validation
        if (window.RequestState.attachedImages.length === 0 && !note) {
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
                text: window.langu('port_login_required_request') || 'يجب تسجيل الدخول لتتمكن من إرسال طلب للصيدلة.',
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
                ]
            };

            // 6. Post Data
            const res = await fetch(`${window.baseURL || ''}/api/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error?.message || "فشل إرسال الطلب للخادم.");
            }

            // 7. Success handling
            Swal.fire({
                icon: 'success',
                title: window.langu('port_req_submit_success_title') || 'تم الإرسال بنجاح',
                text: window.langu('port_req_submit_success_text') || 'سيصل طلبك للصيدلي وسيتواصل معك في أقرب وقت.',
                confirmButtonText: window.langu('port_req_submit_back_btn') || 'العودة للمتجر'
            }).then(() => {
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
