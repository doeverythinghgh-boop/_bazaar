/**
 * @file pages/products/shared/view/product-ratings-reviews.js
 * @description Ratings reviews modal rendering and review actions.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

(function initProductRatingsReviews() {
    async function openReviewsModal(productData, ratingMode, modalIds) {
        const core = window.ProductRatingsCore || {};
        const dialog = window.ProductRatingsDialog || {};
        const modal = document.getElementById(modalIds.modalId);
        const list = document.getElementById(modalIds.listId);
        const closeBtn = document.getElementById(modalIds.closeBtnId);
        if (!modal || !list || !closeBtn) return;

        const ratings = core.parseRatings(productData.ratings);
        const hideComments = ratingMode === "stars_only";
        const currentUser = (typeof SessionManager !== "undefined") ? SessionManager.getUser() : null;
        const raterKeys = [...new Set(ratings.map((rating) => rating.rater_id || rating.rater_key))].filter(Boolean);
        const ratersMap = await core.fetchRatersMap(raterKeys);

        modal.style.display = "flex";
        list.innerHTML = "";

        if (!ratings.length) {
            list.innerHTML = `<div class="empty-state">${core.L("no_reviews_yet", "لا توجد مراجعات بعد")}</div>`;
        } else {
            [...ratings].reverse().forEach((rating) => {
                const raterId = rating.rater_id || rating.rater_key;
                const rater = ratersMap[raterId] || { username: core.L("sender_user", "مستخدم"), user_image: null };
                const raterImages = (typeof parseProfileImages === "function")
                    ? parseProfileImages(rater.user_image)
                    : { avatar: rater.user_image };
                const imgUrl = raterImages.avatar && typeof getPublicR2FileUrl === "function"
                    ? getPublicR2FileUrl(raterImages.avatar)
                    : "/assets/images/user-placeholder.png";
                const isOwner = currentUser && String(currentUser.user_key) === String(raterId);
                const dateStr = rating.date ? new Date(rating.date).toLocaleDateString("ar-EG") : "";
                const item = document.createElement("div");
                item.className = "review-item";
                item.innerHTML = `
                    <div class="review-header">
                        <img src="${imgUrl}" class="reviewer-img" alt="${rater.username}" onerror="this.src='/assets/images/user-placeholder.png'">
                        <div class="reviewer-info">
                            <span class="reviewer-name">${rater.username}</span>
                            <div class="review-stars" style="font-size: 0.8rem;">${core.generateStars(rating.rating || 0)}</div>
                        </div>
                        <span class="review-date">${dateStr}</span>
                    </div>
                    ${hideComments ? "" : `<div class="review-text">${rating.note || ""}</div>`}
                    ${isOwner ? `
                        <div class="review-owner-actions">
                            <button class="review-owner-btn product-review-edit">${core.L("gen_edit", "تعديل")}</button>
                            <button class="review-owner-btn product-review-delete">${core.L("gen_delete", "حذف")}</button>
                        </div>` : ""}
                `;
                list.appendChild(item);

                if (isOwner) {
                    const editBtn = item.querySelector(".product-review-edit");
                    const deleteBtn = item.querySelector(".product-review-delete");
                    if (editBtn) {
                        editBtn.addEventListener("click", async () => {
                            modal.style.display = "none";
                            const updated = await dialog.promptRateDialog(rating, hideComments);
                            if (!updated) return;
                            const response = await editProductRating(
                                productData.product_key,
                                currentUser.user_key,
                                { rating_id: rating.rating_id || null, date: rating.date || null },
                                updated
                            );
                            if (response && !response.error) window.location.reload();
                            else Swal.fire(core.L("gen_swal_error_title", "خطأ"), response?.error || core.L("port_rate_error_text", "فشل تحديث التقييم"), "error");
                        });
                    }
                    if (deleteBtn) {
                        deleteBtn.addEventListener("click", async () => {
                            const confirm = await Swal.fire({
                                title: core.L("gen_swal_title_confirm", "تأكيد"),
                                text: core.L("port_delete_review_confirm", "هل تريد حذف تقييمك؟"),
                                icon: "warning",
                                showCancelButton: true,
                                confirmButtonText: core.L("alert_confirm_yes", "نعم"),
                                cancelButtonText: core.L("alert_cancel_btn", "إلغاء"),
                                buttonsStyling: false,
                                customClass: {
                                    popup: "swal-modern-mini-popup",
                                    confirmButton: "swal-modern-mini-confirm",
                                    cancelButton: "swal-modern-mini-cancel"
                                }
                            });
                            if (!confirm.isConfirmed) return;

                            const response = await deleteProductRating(
                                productData.product_key,
                                currentUser.user_key,
                                { rating_id: rating.rating_id || null, date: rating.date || null }
                            );
                            if (response && !response.error) window.location.reload();
                            else Swal.fire(core.L("gen_swal_error_title", "خطأ"), response?.error || core.L("port_rate_error_text", "فشل حذف التقييم"), "error");
                        });
                    }
                }
            });
        }

        closeBtn.onclick = () => { modal.style.display = "none"; };
        modal.onclick = (event) => { if (event.target === modal) modal.style.display = "none"; };
    }

    window.ProductRatingsReviews = {
        openReviewsModal
    };
})();
