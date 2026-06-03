/**
 * RULE: All comments and documentation must be in English only.
 * WARNING: Hover effects are strictly prohibited on this page to ensure touch-device compatibility.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

/**
 * @file pages/merchant-portfolio/js/portfolio-actions-rate.js
 * @description Handles rating flow and submission.
 */

/**
 * Handles rating flow.
 * @param {Object} targetUser
 */
async function portfolioHandleRate(targetUser) {
    const L = (key, fallback) => (typeof window.langu === 'function' ? window.langu(key) : null) || fallback;

    const settings = typeof window.portfolioResolveProfileSettings === 'function'
        ? window.portfolioResolveProfileSettings(targetUser || {})
        : {};
    const ratingEnabled = settings.ratingEnabled !== false;
    const ratingMode = settings.ratingMode || "stars_comments";

    if (!ratingEnabled) {
        Swal.fire({
            title: L('port_rate_disabled_title', 'غير متاح'),
            text: L('port_rate_disabled_text', 'التقييم غير متاح لهذا النشاط'),
            icon: 'info',
            buttonsStyling: false,
            customClass: {
                popup: 'swal-modern-mini-popup',
                title: 'swal-modern-mini-title',
                htmlContainer: 'swal-modern-mini-text',
                confirmButton: 'swal-modern-mini-confirm'
            }
        });
        return;
    }

    // Check if logged in
    if (typeof SessionManager !== 'undefined' && !SessionManager.getUser()) {
        Swal.fire({
            title: L('port_rate_login_required_title', 'تنبيه'),
            text: L('port_rate_login_required_text', 'يجب تسجيل الدخول لتقييم مقدم الخدمة'),
            icon: 'warning',
            buttonsStyling: false,
            customClass: {
                popup: 'swal-modern-mini-popup',
                title: 'swal-modern-mini-title',
                htmlContainer: 'swal-modern-mini-text',
                confirmButton: 'swal-modern-mini-confirm'
            }
        });
        return;
    }

    const { value: formValues } = await Swal.fire({
        title: L('port_rate_dialog_title', 'تقييم مقدم الخدمة'),
        html: `
            <div style="display: flex; flex-direction: column; align-items: center; width: 100%; box-sizing: border-box;">
                <div class="rating-stars-input" style="font-size: clamp(2rem, 8vw, 2.5rem); color: #ddd; cursor: pointer; margin-bottom: 20px; display: flex; justify-content: center; gap: 10px; width: 100%;">
                    <i class="far fa-star" data-value="1" style="transition: all 0.2s ease;"></i>
                    <i class="far fa-star" data-value="2" style="transition: all 0.2s ease;"></i>
                    <i class="far fa-star" data-value="3" style="transition: all 0.2s ease;"></i>
                    <i class="far fa-star" data-value="4" style="transition: all 0.2s ease;"></i>
                    <i class="far fa-star" data-value="5" style="transition: all 0.2s ease;"></i>
                </div>
                <input id="swal-rating-value" type="hidden" value="0">
                <textarea id="swal-rating-note" class="swal-profile-input" placeholder="${L('port_rate_note_placeholder', 'أكتب ملاحظاتك هنا...')}"
                    style="height: 100px !important; resize: none; padding: 12px !important; border-radius: 12px !important; font-size: 0.95rem !important; text-align: center; width: 100% !important; box-sizing: border-box;"></textarea>
            </div>
        `,
        width: 'min(90vw, 400px)',
        buttonsStyling: false,
        customClass: {
            popup: 'swal-modern-mini-popup',
            title: 'swal-modern-mini-title',
            htmlContainer: 'swal-modern-mini-text',
            confirmButton: 'swal-modern-mini-confirm',
            cancelButton: 'swal-modern-mini-cancel'
        },
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: L('port_rate_submit_btn', 'إرسال التقييم'),
        cancelButtonText: L('port_rate_cancel_btn', 'إلغاء'),
        didOpen: () => {
            const stars = document.querySelectorAll('.rating-stars-input i');
            const input = document.getElementById('swal-rating-value');
            const noteInput = document.getElementById('swal-rating-note');

            if (noteInput && ratingMode === 'stars_only') {
                noteInput.value = '';
                noteInput.style.display = 'none';
            }

            stars.forEach(star => {
                star.addEventListener('click', () => {
                    const val = parseInt(star.getAttribute('data-value'));
                    input.value = val;
                    stars.forEach((s, index) => {
                        if (index < val) {
                            s.classList.remove('far');
                            s.classList.add('fas');
                            s.style.color = '#f59e0b';
                            s.style.transform = 'scale(1.2)';
                        } else {
                            s.classList.remove('fas');
                            s.classList.add('far');
                            s.style.color = '#ddd';
                            s.style.transform = 'scale(1)';
                        }
                    });
                });
            });
        },
        preConfirm: () => {
            const rating = document.getElementById('swal-rating-value').value;
            const noteInput = document.getElementById('swal-rating-note');
            const note = (ratingMode === 'stars_only') ? '' : (noteInput ? noteInput.value : '');
            if (rating == 0) {
                Swal.showValidationMessage(L('port_rate_select_stars', 'الرجاء اختيار عدد النجوم'));
                return false;
            }
            return { rating: parseInt(rating), note: note };
        }
    });

    if (formValues) {
        await portfolioSubmitRating(targetUser, formValues);
    }
}

/**
 * Submits rating to DB.
 * @param {Object} user
 * @param {Object} ratingData
 */
async function portfolioSubmitRating(user, ratingData) {
    const L = (key, fallback) => (typeof window.langu === 'function' ? window.langu(key) : null) || fallback;

    try {
        Swal.showLoading();

        const rater = SessionManager.getUser();
        const newRating = {
            rating_id: `rt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            rater_id: rater.user_key,
            rater_name: rater.username,
            rating: ratingData.rating,
            note: ratingData.note || '',
            date: new Date().toISOString()
        };

        const success = await window.portfolioSubmitRatingToDB(user.user_key, newRating);
        if (!success) throw new Error("Update failed");

        Swal.fire({
            title: L('port_rate_success_title', 'شكراً لك!'),
            text: L('port_rate_success_text', 'تم إرسال تقييمك بنجاح'),
            icon: 'success',
            buttonsStyling: false,
            customClass: {
                popup: 'swal-modern-mini-popup',
                title: 'swal-modern-mini-title',
                htmlContainer: 'swal-modern-mini-text',
                confirmButton: 'swal-modern-mini-confirm'
            }
        });

        if (window.portfolioPageController?.applyRatingsUpdate) {
            window.portfolioPageController.applyRatingsUpdate(user.user_key, success.ratings || []);
        }

    } catch (error) {
        if (window.PortfolioErrorUtils?.log) {
            window.PortfolioErrorUtils.log("PortfolioActionsRate", "Rating submission failed.", error);
        } else {
            console.error("[PortfolioActionsRate] Rating submission failed.", error);
        }
        Swal.fire({
            title: L('port_rate_error_title', 'خطأ'),
            text: L('port_rate_error_text', 'فشل في إرسال التقييم'),
            icon: 'error',
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

// Global exposure
window.portfolioHandleRate = portfolioHandleRate;
window.portfolioSubmitRating = portfolioSubmitRating;
