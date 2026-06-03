/**
 * @file pages/merchant-portfolio/js/portfolio-reviews-modal.js
 * @description Reviews modal rendering for merchant portfolio.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


async function portfolioShowReviews(ratings) {
    const modal = document.getElementById('reviews-modal');
    const list = document.getElementById('reviews-list');
    const closeBtn = document.getElementById('btn-close-reviews');
    const currentUser = (typeof SessionManager !== 'undefined') ? SessionManager.getUser() : null;
    const targetUserKey = new URLSearchParams(window.location.search).get('user_key');

    if (!modal || !list) return;
    const L = (key, fallback) => {
        const val = (typeof window.langu === 'function') ? window.langu(key) : null;
        return (!val || val === key) ? fallback : val;
    };

    modal.style.display = 'flex';
    const loadingText = typeof window.langu === 'function' ? window.langu('loading_reviews') || 'جاري تحميل التقييمات...' : 'جاري تحميل التقييمات...';
    list.innerHTML = `<div class="loading-reviews" style="text-align: center; padding: 20px;"><i class="fas fa-spinner fa-spin"></i> ${loadingText}</div>`;

    const raterKeys = [...new Set(ratings.map((r) => r.rater_id || r.rater_key))].filter((k) => k);
    const ratersMap = (typeof portfolioFetchRaters === 'function')
        ? await portfolioFetchRaters(raterKeys)
        : {};

    list.innerHTML = '';

    if (ratings.length === 0) {
        const noReviewsText = typeof window.langu === 'function' ? window.langu('no_reviews_yet') || 'لا توجد مراجعات بعد.' : 'لا توجد مراجعات بعد.';
        list.innerHTML = `<div class="empty-state">${noReviewsText}</div>`;
    } else {
        const ratingMode = window.portfolioRatingConfig?.ratingMode || 'stars_comments';
        const hideComments = ratingMode === 'stars_only';
        const sortedRatings = [...ratings].reverse();

        sortedRatings.forEach((rating) => {
            const raterId = rating.rater_id || rating.rater_key;
            const rater = ratersMap[raterId] || { username: 'مستخدم', user_image: null };
            const item = document.createElement('div');
            item.className = 'review-item';

            const raterImages = (typeof parseProfileImages === 'function')
                ? parseProfileImages(rater.user_image)
                : { avatar: rater.user_image };

            const imgUrl = raterImages.avatar && typeof getPublicR2FileUrl === 'function'
                ? getPublicR2FileUrl(raterImages.avatar)
                : '/assets/images/user-placeholder.png';

            const starsHtml = (typeof portfolioGenerateStars === 'function')
                ? portfolioGenerateStars(rating.rating || 0)
                : '';

            const dateStr = rating.date ? new Date(rating.date).toLocaleDateString('ar-EG') : '';
            const isOwner = currentUser && (currentUser.user_key === raterId);
            const ownerActionsHtml = isOwner ? `
                <div class="review-owner-actions">
                    <button class="review-owner-btn review-edit-btn" data-rating-id="${rating.rating_id || ''}" data-rating-date="${rating.date || ''}">
                        <i class="fas fa-pen"></i> ${L('gen_edit', 'تعديل')}
                    </button>
                    <button class="review-owner-btn review-delete-btn" data-rating-id="${rating.rating_id || ''}" data-rating-date="${rating.date || ''}">
                        <i class="fas fa-trash"></i> ${L('gen_delete', 'حذف')}
                    </button>
                </div>
            ` : '';

            item.innerHTML = `
                <div class="review-header">
                    <img src="${imgUrl}" class="reviewer-img" alt="${rater.username}" onerror="this.src='/assets/images/user-placeholder.png'">
                    <div class="reviewer-info">
                        <span class="reviewer-name">${rater.username}</span>
                        <div class="review-stars" style="font-size: 0.8rem;">${starsHtml}</div>
                    </div>
                    <span class="review-date">${dateStr}</span>
                </div>
                ${hideComments ? '' : `<div class="review-text">${rating.note || rating.comment || ''}</div>`}
                ${ownerActionsHtml}
            `;
            list.appendChild(item);

            if (isOwner) {
                const editBtn = item.querySelector('.review-edit-btn');
                const deleteBtn = item.querySelector('.review-delete-btn');

                if (editBtn) {
                    editBtn.addEventListener('click', async (e) => {
                        e.stopPropagation();
                        modal.style.display = 'none';
                        modal.style.opacity = '1';
                        const ref = {
                            rating_id: editBtn.getAttribute('data-rating-id') || null,
                            date: editBtn.getAttribute('data-rating-date') || rating.date
                        };
                        const updated = await portfolioPromptEditRating(rating, hideComments);
                        if (!updated) return;

                        const ok = await window.portfolioUpdateRatingInDB(targetUserKey, currentUser.user_key, ref, updated);
                        if (ok) {
                            if (window.portfolioPageController?.applyRatingsUpdate) {
                                window.portfolioPageController.applyRatingsUpdate(targetUserKey, ok.ratings || []);
                            }
                            portfolioShowReviews(ok.ratings || []);
                        } else {
                            Swal.fire(L('port_rate_error_title', 'خطأ'), L('port_edit_review_failed', 'تعذر تعديل التقييم'), 'error');
                        }
                    });
                }

                if (deleteBtn) {
                    deleteBtn.addEventListener('click', async (e) => {
                        e.stopPropagation();
                        const confirm = await Swal.fire({
                            title: L('gen_swal_title_confirm', 'تأكيد'),
                            text: L('port_delete_review_confirm', 'هل تريد حذف تقييمك؟'),
                            icon: 'warning',
                            showCancelButton: true,
                            confirmButtonText: L('alert_confirm_yes', 'نعم'),
                            cancelButtonText: L('alert_cancel_btn', 'إلغاء'),
                            buttonsStyling: false,
                            customClass: {
                                popup: 'swal-modern-mini-popup',
                                confirmButton: 'swal-modern-mini-confirm',
                                cancelButton: 'swal-modern-mini-cancel'
                            }
                        });
                        if (!confirm.isConfirmed) return;

                        const ref = {
                            rating_id: deleteBtn.getAttribute('data-rating-id') || null,
                            date: deleteBtn.getAttribute('data-rating-date') || rating.date
                        };
                        const ok = await window.portfolioDeleteRatingInDB(targetUserKey, currentUser.user_key, ref);
                        if (ok) {
                            if (window.portfolioPageController?.applyRatingsUpdate) {
                                window.portfolioPageController.applyRatingsUpdate(targetUserKey, ok.ratings || []);
                            }
                            portfolioShowReviews(ok.ratings || []);
                        } else {
                            Swal.fire(L('port_rate_error_title', 'خطأ'), L('port_delete_review_failed', 'تعذر حذف التقييم'), 'error');
                        }
                    });
                }
            }
        });
    }

    closeBtn.onclick = () => {
        modal.style.opacity = '0';
        setTimeout(() => { modal.style.display = 'none'; }, 300);
        setTimeout(() => { modal.style.opacity = '1'; }, 300);
    };

    modal.onclick = (e) => {
        if (e.target === modal) closeBtn.click();
    };
}

window.portfolioShowReviews = portfolioShowReviews;
