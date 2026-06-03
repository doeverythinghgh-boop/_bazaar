/**
 * @file pages/profile-modal/js/services/profile-account-service.js
 * @description Handles account-level critical actions like deletion for the Profile Wizard.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


window.ProfileAccountService = (function () {
    'use strict';

    /**
     * Triggers the account deletion flow.
     */
    async function deleteAccount() {
        console.log(" [ProfileAccountService] Account deletion request initiated.");
        const currentUser = window.UserService.get();
        if (!currentUser) {
            console.error(" [ProfileAccountService] No user session found for deletion.");
            return;
        }

        if (!window.SWAL_UTILITY) {
            console.error(" [ProfileAccountService] SWAL_UTILITY missing.");
            return;
        }

        const confirmed = await window.SWAL_UTILITY.confirm({
            titleKey: "profile_confirm_delete_title",
            textKey: "profile_confirm_delete_text",
            icon: "warning",
            confirmButtonTextKey: "profile_btn_delete_confirm"
        });

        if (confirmed) {
            console.warn(` [ProfileAccountService] User confirmed deletion for userKey: ${currentUser.user_key}`);

            // Show loading if AuthUI is available
            if (window.AuthUI) window.AuthUI.showLoading(window.langu ? window.langu("gen_please_wait") : "جاري المعالجة...");

            try {
                const result = await window.deleteUser(currentUser.user_key);
                if (result && !result.error) {
                    console.log(" [ProfileAccountService] Account destroyed successfully. Redirecting to home.");
                    window.UserService.clear();
                    window.location.href = "/";
                } else {
                    throw new Error(result?.error || "Action failed");
                }
            } catch (error) {
                console.error(" [ProfileAccountService] Deletion failed:", error.message);
                window.SWAL_UTILITY.alert({
                    titleKey: "gen_swal_error_title",
                    text: error.message,
                    icon: "error"
                });
            } finally {
                if (window.AuthUI) window.AuthUI.close();
            }
        } else {
            console.log("‍ [ProfileAccountService] Deletion cancelled by user.");
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
