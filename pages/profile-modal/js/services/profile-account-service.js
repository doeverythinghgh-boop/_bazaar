/**
 * @file pages/profile-modal/js/services/profile-account-service.js
 * @description Handles account-level critical actions like deletion for the Profile Wizard.
 */

window.ProfileAccountService = (function () {
    'use strict';

    /**
     * Triggers the account deletion flow.
     */
    async function deleteAccount() {
        const currentUser = window.UserService.get();
        if (!currentUser) return;

        if (!window.SWAL_UTILITY) {
            console.error("[ProfileAccountService] SWAL_UTILITY missing.");
            return;
        }

        const confirmed = await window.SWAL_UTILITY.confirm({
            titleKey: "profile_confirm_delete_title",
            textKey: "profile_confirm_delete_text",
            icon: "warning",
            confirmButtonTextKey: "profile_btn_delete_confirm"
        });

        if (confirmed) {
            console.log("[ProfileAccountService] Deleting account via API...");
            
            // Show loading if AuthUI is available
            if (window.AuthUI) window.AuthUI.showLoading(window.langu ? window.langu("gen_please_wait") : "جاري المعالجة...");

            try {
                const result = await window.deleteUser(currentUser.user_key);
                if (result && !result.error) {
                    window.UserService.clear();
                    window.location.href = "/";
                } else {
                    throw new Error(result?.error || "Action failed");
                }
            } catch (error) {
                window.SWAL_UTILITY.alert({
                    titleKey: "gen_swal_error_title",
                    text: error.message,
                    icon: "error"
                });
            } finally {
                if (window.AuthUI) window.AuthUI.close();
            }
        }
    }

    return {
        deleteAccount
    };
})();

/**
 * Legacy global wrapper for backward compatibility with step templates.
 */
window.profileDeleteAccount = function() {
    return window.ProfileAccountService.deleteAccount();
};
