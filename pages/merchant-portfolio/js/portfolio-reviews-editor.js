/**
 * @file pages/merchant-portfolio/js/portfolio-reviews-editor.js
 * @description Review editing helpers for merchant portfolio.
 */

async function portfolioPromptEditRating(rating, hideComments) {
    const L = (key, fallback) => {
        const val = (typeof window.langu === 'function') ? window.langu(key) : null;
        return (!val || val === key) ? fallback : val;
    };

    const { value: formValues } = await Swal.fire({
        title: L('port_edit_review_title', 'تعديل تقييمك'),
        html: `
            <div style="display:flex; flex-direction:column; align-items:center; width:100%;">
                <div class="rating-stars-input" style="font-size: clamp(2rem, 8vw, 2.5rem); color: #ddd; cursor: pointer; margin-bottom: 20px; display: flex; justify-content: center; gap: 10px; width: 100%;">
                    <i class="${(rating.rating || 0) >= 1 ? 'fas' : 'far'} fa-star" data-value="1"></i>
                    <i class="${(rating.rating || 0) >= 2 ? 'fas' : 'far'} fa-star" data-value="2"></i>
                    <i class="${(rating.rating || 0) >= 3 ? 'fas' : 'far'} fa-star" data-value="3"></i>
                    <i class="${(rating.rating || 0) >= 4 ? 'fas' : 'far'} fa-star" data-value="4"></i>
                    <i class="${(rating.rating || 0) >= 5 ? 'fas' : 'far'} fa-star" data-value="5"></i>
                </div>
                <input id="swal-edit-rating-value" type="hidden" value="${parseInt(rating.rating || 0, 10)}">
                <textarea id="swal-edit-rating-note" class="swal-profile-input" style="height: 100px !important; resize: none; padding: 12px !important; border-radius: 12px !important; font-size: 0.95rem !important; text-align: center; width: 100% !important; box-sizing: border-box;">${rating.note || ''}</textarea>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: L('gen_btn_save', 'حفظ'),
        cancelButtonText: L('alert_cancel_btn', 'إلغاء'),
        buttonsStyling: false,
        customClass: {
            popup: 'swal-modern-mini-popup',
            title: 'swal-modern-mini-title',
            htmlContainer: 'swal-modern-mini-text',
            confirmButton: 'swal-modern-mini-confirm',
            cancelButton: 'swal-modern-mini-cancel'
        },
        didOpen: () => {
            const stars = document.querySelectorAll('.rating-stars-input i');
            const input = document.getElementById('swal-edit-rating-value');
            const noteInput = document.getElementById('swal-edit-rating-note');

            if (noteInput && hideComments) {
                noteInput.value = '';
                noteInput.style.display = 'none';
            }

            stars.forEach((star) => {
                star.addEventListener('click', () => {
                    const val = parseInt(star.getAttribute('data-value'), 10);
                    input.value = val;
                    stars.forEach((s, index) => {
                        if (index < val) {
                            s.classList.remove('far');
                            s.classList.add('fas');
                            s.style.color = '#f59e0b';
                        } else {
                            s.classList.remove('fas');
                            s.classList.add('far');
                            s.style.color = '#ddd';
                        }
                    });
                });
            });
        },
        preConfirm: () => {
            const ratingValue = parseInt(document.getElementById('swal-edit-rating-value').value, 10);
            const noteInput = document.getElementById('swal-edit-rating-note');
            const note = hideComments ? '' : (noteInput ? noteInput.value : '');
            if (!ratingValue || ratingValue < 1 || ratingValue > 5) {
                Swal.showValidationMessage(L('port_review_select_stars', 'اختر عدد النجوم'));
                return false;
            }
            return { rating: ratingValue, note };
        }
    });

    return formValues || null;
}
