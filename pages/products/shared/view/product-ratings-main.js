/**
 * @file pages/products/shared/view/product-ratings-main.js
 * @description Public ratings setup entrypoint for product pages.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

(function initProductRatingsMain() {
    async function bindRateButton(productData, settings, ids) {
        const core = window.ProductRatingsCore || {};
        const dialog = window.ProductRatingsDialog || {};
        const rateBtn = document.getElementById(ids.rateBtnId);
        if (!rateBtn) return;

        const currentUser = (typeof SessionManager !== "undefined") ? SessionManager.getUser() : null;
        const sellerKey = productData.user_key;

        if (!settings.enabled || !sellerKey) {
            rateBtn.style.display = "none";
            return;
        }

        if (currentUser && String(currentUser.user_key) === String(sellerKey)) {
            rateBtn.style.display = "none";
            return;
        }

        rateBtn.style.display = "inline-flex";
        rateBtn.onclick = async () => {
            if (!currentUser) {
                Swal.fire({
                    title: core.L("port_rate_login_required_title", "تنبيه"),
                    text: core.L("port_rate_login_required_text", "يجب تسجيل الدخول للتقييم"),
                    icon: "warning",
                    buttonsStyling: false,
                    customClass: {
                        popup: "swal-modern-mini-popup",
                        title: "swal-modern-mini-title",
                        htmlContainer: "swal-modern-mini-text",
                        confirmButton: "swal-modern-mini-confirm"
                    }
                });
                return;
            }

            const ratings = core.parseRatings(productData.ratings);
            const mine = ratings.find((rating) => String(rating.rater_id) === String(currentUser.user_key)) || null;
            const payload = await dialog.promptRateDialog(mine, settings.mode === "stars_only");
            if (!payload) return;

            const request = mine
                ? editProductRating(productData.product_key, currentUser.user_key, { rating_id: mine.rating_id || null, date: mine.date || null }, payload)
                : rateProduct(productData.product_key, currentUser.user_key, { ...payload, rater_name: currentUser.username || "" });

            const response = await request;
            if (response && !response.error) window.location.reload();
            else Swal.fire(core.L("gen_swal_error_title", "خطأ"), response?.error || core.L("port_rate_error_text", "فشل إرسال التقييم"), "error");
        };
    }

    function renderSummary(productData, settings, ids) {
        const core = window.ProductRatingsCore || {};
        const reviews = window.ProductRatingsReviews || {};
        const summary = document.getElementById(ids.summaryId);
        const starsEl = document.getElementById(ids.starsId);
        const countEl = document.getElementById(ids.countId);
        if (!summary || !starsEl || !countEl) return;

        if (!settings.enabled) {
            summary.style.display = "none";
            return;
        }

        const ratings = core.parseRatings(productData.ratings);
        let avg = 0;
        if (ratings.length) {
            const sum = ratings.reduce((acc, rating) => acc + (parseFloat(rating.rating) || 0), 0);
            avg = sum / ratings.length;
        }

        starsEl.innerHTML = core.generateStars(avg);
        countEl.textContent = core.L("ratings_count", "({count} تقييم)").replace("{count}", ratings.length);
        summary.style.display = "flex";

        if (ratings.length > 0) {
            starsEl.style.cursor = "pointer";
            countEl.style.cursor = "pointer";
            countEl.style.textDecoration = "underline";
            const openModal = () => reviews.openReviewsModal(productData, settings.mode, ids.modal);
            starsEl.onclick = openModal;
            countEl.onclick = openModal;
        } else {
            starsEl.style.cursor = "default";
            countEl.style.cursor = "default";
            countEl.style.textDecoration = "none";
            starsEl.onclick = null;
            countEl.onclick = null;
        }
    }

    window.ProductRatings = {
        setup(productData, ids) {
            const core = window.ProductRatingsCore || {};
            const settings = core.parseProductRatingSettings(productData?.seller_settings || null);
            renderSummary(productData, settings, ids);
            bindRateButton(productData, settings, ids);
        }
    };
})();
