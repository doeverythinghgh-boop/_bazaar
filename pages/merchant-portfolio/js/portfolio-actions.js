/**
 * @file pages/merchant-portfolio/js/portfolio-actions.js
 * @description Handles user interactions (Share, Rate, Contact).
 */

/**
 * Sets up action buttons.
 * @param {Object} user 
 */
function portfolioSetupActions(user) {
    // 1. Share
    const shareBtn = document.getElementById('btn-share');
    if (shareBtn) {
        shareBtn.onclick = () => {
            const url = window.location.href;
            if (navigator.share) {
                navigator.share({
                    title: `ملف التاجر: ${user.business_name || user.username}`,
                    url: url
                }).catch(console.error);
            } else {
                navigator.clipboard.writeText(url).then(() => {
                    Swal.fire({
                        icon: 'success',
                        title: 'تم نسخ الرابط!',
                        toast: true,
                        position: 'top-end',
                        showConfirmButton: false,
                        timer: 2000
                    });
                });
            }
        };
    }

    // 2. Contact Buttons
    const whatsappBtn = document.getElementById('btn-whatsapp');
    const callBtn = document.getElementById('btn-call');
    
    // Logic: Use business_whatsapp or phone
    const contactPhone = user.business_whatsapp || user.phone;
    
    if (contactPhone) {
        // Whatsapp
        if (whatsappBtn) {
            whatsappBtn.href = `https://wa.me/${contactPhone.replace('+', '')}`;
            whatsappBtn.style.display = 'inline-flex';
        }
        // Call
        if (callBtn) {
            callBtn.href = `tel:${contactPhone}`;
            callBtn.style.display = 'inline-flex';
        }
    }

    // 3. Rate
    const rateBtn = document.getElementById('btn-rate');
    if (rateBtn) {
        rateBtn.onclick = () => portfolioHandleRate(user);
    }
}

/**
 * Handles rating flow.
 * @param {Object} targetUser 
 */
async function portfolioHandleRate(targetUser) {
    // Check if logged in
    if (typeof SessionManager !== 'undefined' && !SessionManager.getUser()) {
        Swal.fire('يجب تسجيل الدخول لتقييم التاجر', '', 'warning');
        return;
    }

    const { value: formValues } = await Swal.fire({
        title: 'تقييم التاجر',
        html: `
            <div class="rating-stars-input" style="font-size: 2rem; color: #ddd; cursor: pointer; margin-bottom: 10px;">
                <i class="far fa-star" data-value="1"></i>
                <i class="far fa-star" data-value="2"></i>
                <i class="far fa-star" data-value="3"></i>
                <i class="far fa-star" data-value="4"></i>
                <i class="far fa-star" data-value="5"></i>
            </div>
            <input id="swal-rating-value" type="hidden" value="0">
            <textarea id="swal-rating-note" class="swal2-textarea" placeholder="أكتب ملاحظاتك هنا..." style="margin-top: 5px;"></textarea>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'إرسال التقييم',
        cancelButtonText: 'إلغاء',
        didOpen: () => {
            const stars = document.querySelectorAll('.rating-stars-input i');
            const input = document.getElementById('swal-rating-value');
            
            stars.forEach(star => {
                star.addEventListener('click', () => {
                   const val = parseInt(star.getAttribute('data-value'));
                   input.value = val;
                   // Update visual
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
            const rating = document.getElementById('swal-rating-value').value;
            const note = document.getElementById('swal-rating-note').value;
            if (rating == 0) {
                Swal.showValidationMessage('الرجاء اختيار عدد النجوم');
                return false;
            }
            return { rating: parseInt(rating), note: note };
        }
    });

    if (formValues) {
        console.log("Submitting rating...", formValues);
        // Logic to update DB
        await portfolioSubmitRating(targetUser, formValues);
    }
}

/**
 * Submits rating to DB.
 * @param {Object} user 
 * @param {Object} ratingData 
 */
async function portfolioSubmitRating(user, ratingData) {
    try {
        Swal.showLoading();
        
        // 1. Get current ratings
        let currentRatings = [];
        try {
            if (user.ratings) currentRatings = JSON.parse(user.ratings);
        } catch (e) {}

        // 2. Add new rating
        const rater = SessionManager.getUser();
        const newRating = {
            rater_id: rater.user_key,
            rater_name: rater.username,
            rating: ratingData.rating,
            note: ratingData.note,
            date: new Date().toISOString()
        };

        // 3. Update DB via direct function
        const success = await window.portfolioSubmitRatingToDB(user.user_key, newRating);
        
        if (!success) throw new Error("Update failed");

        Swal.fire('شكراً لك!', 'تم إرسال تقييمك بنجاح', 'success').then(() => {
            window.location.reload();
        });

    } catch (e) {
        console.error(e);
        Swal.fire('خطأ', 'فشل في إرسال التقييم', 'error');
    }
}

// Make global
window.portfolioSetupActions = portfolioSetupActions;
