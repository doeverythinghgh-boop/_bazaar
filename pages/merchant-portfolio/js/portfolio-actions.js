/**
 * RULE: All comments and documentation must be in English only.
 * WARNING: Hover effects are strictly prohibited on this page to ensure touch-device compatibility.
 */
/**
 * @file pages/merchant-portfolio/js/portfolio-actions.js
 * @description Handles user interactions (Share, Rate, Contact).
 */

// Pagination State - Made global but kept reference for internal use
const portfolioState = {
    productOffset: 0,
    productLimit: 5,
    isFirstLoad: true
};
window.portfolioState = portfolioState;

/**
 * Sets up action buttons.
 * @param {Object} user 
 */
function portfolioSetupActions(user) {
    // 1. Share is now handled by mini-button in portfolio-render.js

    // 2. Contact Buttons (Profile & FAB)
    const whatsappBtn = document.getElementById('btn-whatsapp');
    const callBtn = document.getElementById('btn-call');
    const fabWhatsapp = document.getElementById('fab-whatsapp');
    const fabCall = document.getElementById('fab-call');
    const fabContainer = document.getElementById('portfolio-fab-contact');

    // Logic: Use business_whatsapp or phone
    const contactPhone = user.business_whatsapp || user.phone;

    if (contactPhone) {
        // Whatsapp Link Calculation
        let waClean = contactPhone.replace(/\D/g, "");
        if (waClean.startsWith('01') && waClean.length === 11) waClean = '2' + waClean;
        const waLink = `https://wa.me/${waClean}`;

        // Call Link Calculation
        let telClean = contactPhone.replace(/[^\d+]/g, "");
        const telLink = `tel:${telClean}`;

        // Apply to Profile Buttons
        if (whatsappBtn) {
            whatsappBtn.href = waLink;
            whatsappBtn.style.display = 'inline-flex';
        }
        if (callBtn) {
            callBtn.href = telLink;
            callBtn.style.display = 'inline-flex';
        }

        // Apply to FAB
        if (fabWhatsapp) fabWhatsapp.href = waLink;
        if (fabCall) fabCall.href = telLink;

        // SCROLL OBSERVER FOR FAB
        if (fabContainer) {
            window.addEventListener('scroll', () => {
                if (window.scrollY > 400) {
                    fabContainer.classList.add('visible');
                } else {
                    fabContainer.classList.remove('visible');
                }
            }, { passive: true });
        }
    }

    // 3. Rate
    const rateBtn = document.getElementById('btn-rate-merchant');
    if (rateBtn) {
        rateBtn.onclick = () => portfolioHandleRate(user);
    }

    // 4. Products Header & Actions
    const productsGrid = document.getElementById('portfolio-products-grid');
    const loadMoreBtn = document.getElementById('btn-load-more-products');
    const addProductBtn = document.getElementById('btn-portfolio-add-product');

    // Access Control: Show "Add Product" button only for Owner, Admin, or Super Admin
    const currentUser = typeof SessionManager !== 'undefined' ? SessionManager.getUser() : null;

    // Check if user is Admin or Super Admin using global config
    const isSpecialUser = currentUser && (
        (typeof ADMIN_IDS !== 'undefined' && ADMIN_IDS.includes(currentUser.user_key)) ||
        (typeof SUPER_ADMIN_KEY !== 'undefined' && currentUser.user_key === SUPER_ADMIN_KEY)
    );

    // Check if user is the Page Owner
    const isOwner = currentUser && (currentUser.user_key === user.user_key || currentUser.id === user.id);

    // Permission Logic: Logged in AND (Owner OR Special User)
    const hasPermission = currentUser && (isOwner || isSpecialUser);

    if (hasPermission && addProductBtn) {
        // Show the wrapper and container if permission granted
        const headerWrapper = document.getElementById('portfolio-products-header-wrapper');
        const headerContainer = document.getElementById('portfolio-products-header');
        if (headerWrapper) headerWrapper.style.display = 'block';
        if (headerContainer) headerContainer.style.display = 'flex';

        addProductBtn.style.display = 'inline-flex';
        addProductBtn.onclick = () => {
            if (typeof showAddProductModal === 'function') {
                // Clear cache so it reloads on return
                if (window.portfolioCache) window.portfolioCache.clear(user.user_key);

                // Parse business_category if it's a string
                let filter = null;
                try {
                    if (user.business_category) {
                        filter = typeof user.business_category === 'string'
                            ? JSON.parse(user.business_category)
                            : user.business_category;
                    }
                } catch (e) {
                    console.error("[Portfolio] Failed to parse business_category:", e);
                }

                showAddProductModal({
                    filter: filter,
                    title: "تخصصات النشاط"
                });
            } else {
                console.warn("[Portfolio] showAddProductModal not found.");
            }
        };
    }

    if (loadMoreBtn) {
        loadMoreBtn.onclick = async () => {
            await window.portfolioFetchProducts(user.user_key, portfolioState.productOffset, portfolioState.productLimit);
            // offset update is handled within portfolioFetchProducts
        };
    }

    const searchSellerBtn = document.getElementById('btn-portfolio-search-seller');
    if (searchSellerBtn) {
        searchSellerBtn.onclick = () => {
            const name = user.business_name || user.username || "";

            // 1. Set Search Mode
            localStorage.setItem('pendingSearchMode', 'products');

            // 2. IMPORTANT: Do NOT set pendingSearchQuery to the merchant's name 
            // when we have categories, because product names don't usually contain the seller's name.
            // This prevents the "No Results" issue for sellers like "MERO".
            localStorage.removeItem('pendingSearchQuery');

            // 2. Save Category Search if available
            if (user.business_category) {
                try {
                    const catData = typeof user.business_category === 'string'
                        ? JSON.parse(user.business_category)
                        : user.business_category;

                    // Extract first MainId and first SubId for UI auto-selection
                    const mainIds = Object.keys(catData);
                    const mainId = mainIds[0];
                    const subId = (mainId && catData[mainId] && catData[mainId].length > 0) ? catData[mainId][0] : "";

                    if (mainId) {
                        localStorage.setItem('pendingCategorySearch', JSON.stringify({
                            mainId: mainId,
                            subId: subId,
                            merchantName: name,
                            merchantKey: user.user_key,
                            fullSpecialty: catData
                        }));
                    }
                } catch (e) {
                    console.error("[Portfolio] Failed to parse business_category for search:", e);
                }
            }

            // 3. Redirect
            window.location.href = '/pages/search/search.html';
        };
    }
}

/**
 * Handles rating flow.
 * @param {Object} targetUser 
 */
async function portfolioHandleRate(targetUser) {
    // Check if logged in
    if (typeof SessionManager !== 'undefined' && !SessionManager.getUser()) {
        Swal.fire({
            title: 'تنبيه',
            text: 'يجب تسجيل الدخول لتقييم التاجر',
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
        title: 'تقييم التاجر',
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
                <textarea id="swal-rating-note" class="swal-profile-input" placeholder="أكتب ملاحظاتك هنا..." 
                    style="height: 100px !important; resize: none; padding: 12px !important; border-radius: 12px !important; font-size: 0.95rem !important; text-align: center; width: 100% !important; box-sizing: border-box;"></textarea>
            </div>
        `,
        width: '90%',
        maxWidth: '400px',
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
        } catch (e) { }

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

        Swal.fire({
            title: 'شكراً لك!',
            text: 'تم إرسال تقييمك بنجاح',
            icon: 'success',
            buttonsStyling: false,
            customClass: {
                popup: 'swal-modern-mini-popup',
                title: 'swal-modern-mini-title',
                htmlContainer: 'swal-modern-mini-text',
                confirmButton: 'swal-modern-mini-confirm'
            }
        }).then(() => {
            window.location.reload();
        });

    } catch (e) {
        console.error(e);
        Swal.fire({
            title: 'خطأ',
            text: 'فشل في إرسال التقييم',
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

/**
 * Handles sharing the portfolio link.
 * @param {Object} user 
 */
function portfolioHandleShare(user) {
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
                text: 'تم نسخ رابط الملف الشخصي للحافظة',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 2000,
                customClass: {
                    popup: 'swal-modern-mini-popup'
                }
            });
        });
    }
}

/**
 * Handles product editing logic within the portfolio.
 * @param {number|string} productId 
 */
async function portfolioEditProduct(productId) {
    console.log(`%c[Portfolio] Editing Product ID: ${productId}`, "color: blue;");

    // 1. Find product in cache
    const params = new URLSearchParams(window.location.search);
    const userKey = params.get('user_key');
    const cache = window.portfolioCache.load(userKey);
    const product = cache?.products?.find(p => p.id == productId);

    if (!product) {
        console.error("[Portfolio] Product not found in cache.");
        Swal.fire("خطأ", "لم يتم العثور على بيانات المنتج"، "error");
        return;
    }

    // 2. Clear cache so it reloads on return
    if (window.portfolioCache) window.portfolioCache.clear(userKey);

    // 3. Show Category Selection (Pre-filled)
    if (typeof CategoryModal !== 'undefined') {
        const result = await CategoryModal.show({
            mainId: product.MainCategory,
            subId: product.SubCategory,
            title: "السوق الحالي للمنتج"
        });

        if (result.status === 'success') {
            // Update categories and navigate
            product.MainCategory = result.mainId;
            product.SubCategory = result.subId;

            if (typeof ProductStateManager !== 'undefined') {
                ProductStateManager.setSelectedCategories(result.mainId, result.subId);
            }

            if (typeof loadProductForm === 'function') {
                loadProductForm({ editMode: true, productData: product });
            }
        }
    } else {
        console.warn("[Portfolio] CategoryModal not found.");
    }
}

/**
 * Handles product deletion within the portfolio.
 * @param {number|string} productId 
 */
async function portfolioDeleteProduct(productId) {
    console.log(`%c[Portfolio] Deleting Product ID: ${productId}`, "color: red;");

    // 1. Find product in cache
    const params = new URLSearchParams(window.location.search);
    const userKey = params.get('user_key');
    const cache = window.portfolioCache.load(userKey);
    const product = cache?.products?.find(p => p.id == productId);

    if (!product) {
        console.error("[Portfolio] Product not found in cache.");
        return;
    }

    // 2. Confirm Deletion
    const result = await Swal.fire({
        title: window.langu('gen_swal_title_confirm') || 'هل أنت متأكد؟',
        text: (window.langu('gen_swal_remove_text') || 'سيتم حذف {name} نهائياً').replace('{name}', product.productName),
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: window.langu('gen_swal_btn_yes_delete') || 'نعم، احذف',
        cancelButtonText: window.langu('gen_swal_btn_cancel') || 'إلغاء',
        buttonsStyling: false,
        customClass: {
            popup: 'swal-modern-mini-popup',
            confirmButton: 'swal-modern-mini-confirm',
            cancelButton: 'swal-modern-mini-cancel'
        },
        showLoaderOnConfirm: true,
        preConfirm: async () => {
            try {
                // A. Delete Images from Cloudflare R2
                if (product.ImageName) {
                    const images = product.ImageName.split(',').filter(i => i.trim());
                    if (images.length > 0 && typeof window.deleteFile2cf === 'function') {
                        await Promise.all(images.map(img => window.deleteFile2cf(img.trim())));
                    }
                }

                // B. Delete Record from Database
                if (typeof deleteProduct_ === 'function') {
                    const dbRes = await deleteProduct_(product.product_key);
                    if (dbRes && dbRes.error) throw new Error(dbRes.error);
                } else {
                    throw new Error("deleteProduct_ function not found");
                }

                return true;
            } catch (e) {
                Swal.showValidationMessage(`خطأ أثناء الحذف: ${e.message}`);
                return false;
            }
        }
    });

    if (result.isConfirmed) {
        Swal.fire({
            title: 'تم الحذف!',
            text: 'تم حذف المنتج بنجاح.',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false,
            customClass: { popup: 'swal-modern-mini-popup' }
        });

        // 3. Update Cache & Reload List
        if (cache && cache.products) {
            const updatedProducts = cache.products.filter(p => p.id != productId);
            window.portfolioCache.save(userKey, {
                ...cache,
                products: updatedProducts
            });

            // Re-render
            window.portfolioRenderProducts(updatedProducts, false);
        }
    }
}

// Global exposure
window.portfolioSetupActions = portfolioSetupActions;
window.portfolioHandleShare = portfolioHandleShare;
window.portfolioEditProduct = portfolioEditProduct;
window.portfolioDeleteProduct = portfolioDeleteProduct;

