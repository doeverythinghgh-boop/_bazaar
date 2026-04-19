/**
 * @file pages/profile-modal/js/profile-submit-handler.js
 * @description Processes the Profile Wizard submission and synchronizes changes with UserService.
 * Refactored to use specialized services (Media, Account).
 */

window.ProfileSubmitHandler = (function () {
    'use strict';

    async function handleSave() {
        console.log("[ProfileSubmitHandler] Starting profile update submission...");

        if (window.regWizard.isSubmitting) return;
        window.regWizard.isSubmitting = true;

        if (window.AuthUI) {
            window.AuthUI.showLoading(window.langu ? window.langu("profile_saving_loader") : "جاري حفظ التعديلات...");
        }

        try {
            const wizData = window.RegisterState.getFullState();
            const fields = wizData.fields;
            const currentUser = window.UserService.get();
            const userKey = currentUser.user_key;

            // 1. Password Verification Logic
            const newPassword = fields.password?.value;
            const currentPassword = fields.currentPassword?.value;

            if (newPassword) {
                if (!currentPassword) {
                    throw new Error(window.langu ? window.langu("profile_error_current_password_required") : "يرجى إدخال كلمة المرور الحالية.");
                }
                
                console.log("[ProfileSubmitHandler] Verifying current password...");
                const verifyResult = await window.verifyUserPassword(currentUser.phone, currentPassword);
                if (verifyResult.error) {
                    throw new Error(window.langu ? window.langu("login_invalid_credentials") : "كلمة المرور الحالية غير صحيحة.");
                }
            }

            // 2. Handle Media Uploads (Via Service)
            let finalAvatar = null;
            let finalCovers = [];
            
            if (window.ProfileMediaService) {
                const media = await window.ProfileMediaService.uploadPendingMedia(userKey);
                finalAvatar = media.avatar;
                finalCovers = media.covers;
            }

            // 3. Prepare Payload
            const updates = {
                user_key: userKey,
                username: fields.username?.value,
                account_type: window.regWizard.isBusinessAccount ? 32 : 1,
                address: fields.address?.value,
                location: fields.location?.value,
                business_name: fields.businessName?.value,
                business_bio: fields.businessTagline?.value,
                links: JSON.stringify(fields.links?.value || {}),
                business_category: JSON.stringify(fields.categories?.value || {}),
                settings: JSON.stringify({
                    isDelivered: !!fields['register_is-delivered']?.value,
                    limitPackage: parseFloat(fields['register_limit-package']?.value || 0),
                    ratingEnabled: !!document.getElementById('register_rating_enabled')?.checked,
                    ratingMode: document.querySelector('input[name="register_rating_mode"]:checked')?.value || 'stars_comments',
                    productRatingEnabled: !!document.getElementById('register_product_rating_enabled')?.checked,
                    productRatingMode: document.querySelector('input[name="register_product_rating_mode"]:checked')?.value || 'stars_comments'
                })
            };

            // Reconstruct User Image JSON
            const existingImages = typeof currentUser.user_image === 'string' ? JSON.parse(currentUser.user_image) : currentUser.user_image || {};
            updates.user_image = JSON.stringify({
                avatar: finalAvatar || existingImages.avatar,
                covers: (finalCovers && finalCovers.length) ? finalCovers : (existingImages.covers || []),
                cover: (finalCovers && finalCovers[0]) || existingImages.cover || null
            });

            if (newPassword) updates.password = newPassword;

            // 4. API Call
            console.log("[ProfileSubmitHandler] Calling updateUser API...");
            const result = await window.updateUser(updates);

            if (result && !result.error) {
                const confirmedUser = window.UserService.mergeUser(currentUser, result);
                window.UserService.save(confirmedUser);

                if (window.SWAL_UTILITY) {
                    await window.SWAL_UTILITY.alert({
                        titleKey: "profile_save_success_title",
                        textKey: "profile_save_success_text",
                        icon: "success"
                    });
                }
                
                if (window.RegisterDraftManager) window.RegisterDraftManager.clearDraft();
            } else {
                throw new Error(result?.error || "API Update failed");
            }

        } catch (error) {
            console.error("[ProfileSubmitHandler] Error:", error);
            if (window.SWAL_UTILITY) {
                window.SWAL_UTILITY.alert({
                    titleKey: "gen_swal_error_title",
                    text: error.message,
                    icon: "error"
                });
            }
        } finally {
            if (window.AuthUI) window.AuthUI.close();
            window.regWizard.isSubmitting = false;
        }
    }

    return {
        handleSave
    };
})();

// Bind form submission
document.addEventListener('submit', (e) => {
    if (e.target.id === 'register_form' && window.regWizard?.mode === 'PROFILE') {
        e.preventDefault();
        window.ProfileSubmitHandler.handleSave();
    }
});
