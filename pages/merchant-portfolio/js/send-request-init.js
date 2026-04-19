/**
 * @file pages/merchant-portfolio/js/send-request-init.js
 * @description Main orchestration for the Pharmacy Request page.
 */

/**
 * @function req_initPage
 * @description Coordinate page initialization across all specialized modules.
 */
async function req_initPage() {
    try {
        const params = new URLSearchParams(window.location.search);
        const merchantKey = params.get('user_key');

        if (!merchantKey) {
            Swal.fire({
                icon: 'error',
                title: 'خطأ',
                text: 'لم يتم تحديد الصيدلية المطلوبة.'
            });
            return;
        }

        // 1. Fetch Data via API Component
        const merchant = await RequestAPI.fetchMerchant(merchantKey);
        
        if (!merchant) {
            Swal.fire({
                icon: 'error',
                title: window.langu('port_fetch_error_title') || 'خطأ',
                text: window.langu('port_fetch_error_text') || 'لم يتم العثور على بيانات الصيدلية.'
            });
            return;
        }

        // 2. Sync Global State
        window.RequestState.merchant = merchant;

        // 3. Update UI
        RequestUI.updateMerchantHeader(merchant);

        // 4. Setup Service Components
        RequestVoice.setup();
        RequestMedia.setup();

    } catch (error) {
        console.error("[RequestInit] Fatal error:", error);
    }
}

// Global hook for the HTML loader
window.req_initPage = req_initPage;
