/**
 * @file pages/profile-modal/js/profile-submit-handler.js
 * @description Processes the Profile Wizard submission and synchronizes changes with UserService.
 */

window.ProfileSubmitHandler = (function () {
    'use strict';

    async function handleSave() {
        console.log("[ProfileSubmitHandler] Starting real profile update submission...");

        if (window.regWizard.isSubmitting) return;
        window.regWizard.isSubmitting = true;

        if (window.AuthUI) window.AuthUI.showLoading(window.langu("profile_saving_loader") || "جاري حفظ التعديلات...");

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
                    throw new Error(window.langu("profile_error_current_password_required") || "يرجى إدخال كلمة المرور الحالية لتتمكن من تغييرها.");
                }
                
                // Real API verification
                console.log("[ProfileSubmitHandler] Verifying current password via API...");
                const verifyResult = await window.verifyUserPassword(currentUser.phone, currentPassword);
                if (verifyResult.error) {
                    throw new Error(window.langu("login_invalid_credentials") || "كلمة المرور الحالية غير صحيحة.");
                }
            }

            // 2. Handle Media Uploads (if any)
            let avatarFile = null;
            if (window.registerPendingAvatar && typeof window.registerPendingAvatar !== 'string') {
                console.log("[ProfileSubmitHandler] Uploading new avatar...");
                avatarFile = `avatar_${userKey}_${Date.now()}.webp`;
                await window.uploadFile2cf(window.registerPendingAvatar, avatarFile);
            }

            const uploadedCovers = [];
            if (Array.isArray(window.registerPendingCovers)) {
                for (let i = 0; i < window.registerPendingCovers.length; i++) {
                    const blob = window.registerPendingCovers[i];
                    if (blob && typeof blob !== 'string') {
                        console.log(`[ProfileSubmitHandler] Uploading new cover [index:${i}]...`);
                        const fileName = `cover_${userKey}_${i}_${Date.now()}.webp`;
                        await window.uploadFile2cf(blob, fileName);
                        uploadedCovers.push(fileName);
                    } else if (typeof blob === 'string') {
                        // Keep existing
                        uploadedCovers.push(blob);
                    }
                }
            }

            // 3. Prepare the Update Payload
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

            // Handle image JSON reconstruction
            const existingImages = typeof currentUser.user_image === 'string' ? JSON.parse(currentUser.user_image) : currentUser.user_image || {};
            updates.user_image = JSON.stringify({
                avatar: avatarFile || existingImages.avatar,
                covers: uploadedCovers,
                cover: uploadedCovers[0] || null
            });

            if (newPassword) {
                updates.password = newPassword;
            }

            // 4. API Call
            console.log("[ProfileSubmitHandler] Calling updateUser API...", updates);
            const result = await window.updateUser(updates);

            if (result && !result.error) {
                // Success: Sync local state
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
                throw new Error(result?.error || "خطأ غير معروف في الـ API");
            }

        } catch (error) {
            console.error("[ProfileSubmitHandler] Profile update failed:", error);
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

/**
 * Global function for account deletion (called from step-security.html)
 */
window.profileDeleteAccount = async function() {
    const currentUser = window.UserService.get();
    if (!currentUser) return;

    if (window.SWAL_UTILITY) {
        const confirmed = await window.SWAL_UTILITY.confirm({
            titleKey: "profile_confirm_delete_title",
            textKey: "profile_confirm_delete_text",
            icon: "warning",
            confirmButtonTextKey: "profile_btn_delete_confirm"
        });

        if (confirmed) {
            console.log("[Profile] Deleting account via API...");
            const result = await window.deleteUser(currentUser.user_key);
            if (result && !result.error) {
                window.UserService.clear();
                window.location.href = "/";
            } else {
                window.SWAL_UTILITY.alert({
                    titleKey: "gen_swal_error_title",
                    text: result?.error || "Action failed",
                    icon: "error"
                });
            }
        }
    }
};

// Bind the form submission to our handler
document.addEventListener('submit', (e) => {
    if (e.target.id === 'register_form' && window.regWizard?.mode === 'PROFILE') {
        e.preventDefault();
        window.ProfileSubmitHandler.handleSave();
    }
});
