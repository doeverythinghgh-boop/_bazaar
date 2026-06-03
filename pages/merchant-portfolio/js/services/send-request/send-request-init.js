/**
 * @file pages/merchant-portfolio/js/send-request-init.js
 * @description Main orchestration for the Merchant Direct Request page.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


/**
 * @function req_initPage
 * @description Coordinate page initialization across all specialized modules.
 */
async function req_initPage() {
    try {
        console.info('[RequestInit] req_initPage() started.');
        const params = new URLSearchParams(window.location.search);
        const merchantKey = params.get('user_key');

        if (!merchantKey) {
            Swal.fire({
                icon: 'error',
                title: window.langu('port_fetch_error_title') || 'خطأ',
                text: window.langu('port_req_missing_merchant') || 'لم يتم تحديد مقدم الخدمة المطلوب.'
            });
            return;
        }

        // 1. Fetch Data via API Component
        let merchant = null;
        try {
            merchant = await RequestAPI.fetchMerchant(merchantKey);
        } catch (fetchError) {
            console.error('[RequestInit] Failed to fetch merchant data:', fetchError);
        }

        if (!merchant) {
            const queuedProducts = window.PharmacyRequestCart?.getItems?.(merchantKey) || [];
            if (!queuedProducts.length) {
                Swal.fire({
                    icon: 'error',
                    title: window.langu('port_fetch_error_title') || 'خطأ',
                    text: window.langu('port_fetch_error_text') || 'لم يتم العثور على بيانات مقدم الخدمة.'
                });
                return;
            }

            merchant = {
                user_key: merchantKey,
                username: window.langu('seller') || 'البائع',
                name: window.langu('seller') || 'البائع'
            };
        }
        merchant.user_key = merchant.user_key || merchantKey;

        // 2. Sync Global State
        window.RequestState.merchant = merchant;
        console.info('[RequestInit] Merchant state synced.');

        // 3. Update UI
        RequestUI.updateMerchantHeader(merchant);
        RequestUI.renderQueuedProducts();
        window.addEventListener('pharmacy-request-cart-updated', () => RequestUI.renderQueuedProducts());

        // 4. Setup Service Components
        console.info('[RequestInit] Initializing service components...');
        if (typeof VoiceSTTManager !== 'undefined') {
            VoiceSTTManager.initGlobalScanner();
        }
        RequestMedia.setup();

        // Signal that page-specific initialization completed
        console.info('[RequestInit] Page initialization complete. Dispatching request-page-ready event.');
        try {
            window.dispatchEvent(new Event('request-page-ready'));
        } catch (e) {
            console.warn('[RequestInit] Could not dispatch request-page-ready event.', e);
        }

    } catch (error) {
        console.error("[RequestInit] Fatal error:", error);
    }
}

// Global hook for the HTML loader
window.req_initPage = req_initPage;
