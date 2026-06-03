/**
 * @file pages/products/shared/view/product-ratings-dialog.js
 * @description SweetAlert dialog for creating and editing ratings.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

(function initProductRatingsDialog() {
    async function promptRateDialog(currentRating, hideComments) {
        const core = window.ProductRatingsCore || {};
        const initialStars = parseInt(currentRating?.rating || 0, 10);
        const initialNote = hideComments ? "" : (currentRating?.note || "");
        const isEdit = !!currentRating;
        const { value } = await Swal.fire({
            title: isEdit ? core.L("gen_edit", "تعديل") : core.L("rating_label", "تقييم"),
            html: `
                <div style="display:flex; flex-direction:column; align-items:center; width:100%;">
                    <div class="rating-stars-input" style="font-size: clamp(2rem, 8vw, 2.5rem); color:#ddd; cursor:pointer; margin-bottom:20px; display:flex; gap:10px;">
                        ${[1, 2, 3, 4, 5].map((valueItem) => `<i class="${initialStars >= valueItem ? "fas" : "far"} fa-star" data-value="${valueItem}"></i>`).join("")}
                    </div>
                    <input id="swal-product-rating-value" type="hidden" value="${initialStars}">
                    <textarea id="swal-product-rating-note" class="swal-profile-input" style="height:100px !important; resize:none; width:100% !important;" placeholder="${core.L("port_rate_note_placeholder", "اكتب تعليقك هنا")}">${initialNote}</textarea>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: isEdit ? core.L("gen_save", "حفظ") : core.L("port_rate_submit_btn", "إرسال التقييم"),
            cancelButtonText: core.L("port_rate_cancel_btn", "إلغاء"),
            buttonsStyling: false,
            customClass: {
                popup: "swal-modern-mini-popup",
                title: "swal-modern-mini-title",
                htmlContainer: "swal-modern-mini-text",
                confirmButton: "swal-modern-mini-confirm",
                cancelButton: "swal-modern-mini-cancel"
            },
            didOpen: () => {
                const stars = document.querySelectorAll(".rating-stars-input i");
                const input = document.getElementById("swal-product-rating-value");
                const noteInput = document.getElementById("swal-product-rating-note");
                if (hideComments && noteInput) {
                    noteInput.value = "";
                    noteInput.style.display = "none";
                }
                stars.forEach((star) => {
                    star.addEventListener("click", () => {
                        const valueItem = parseInt(star.getAttribute("data-value"), 10);
                        input.value = String(valueItem);
                        stars.forEach((node, index) => {
                            if (index < valueItem) {
                                node.classList.remove("far");
                                node.classList.add("fas");
                                node.style.color = "#f59e0b";
                            } else {
                                node.classList.remove("fas");
                                node.classList.add("far");
                                node.style.color = "#ddd";
                            }
                        });
                    });
                });
            },
            preConfirm: () => {
                const rating = parseInt(document.getElementById("swal-product-rating-value").value, 10);
                const noteInput = document.getElementById("swal-product-rating-note");
                const note = hideComments ? "" : (noteInput ? noteInput.value : "");
                if (!rating || rating < 1 || rating > 5) {
                    Swal.showValidationMessage(core.L("port_rate_select_stars", "اختر عدد النجوم"));
                    return false;
                }
                return { rating, note };
            }
        });
        return value || null;
    }

    window.ProductRatingsDialog = {
        promptRateDialog
    };
})();
