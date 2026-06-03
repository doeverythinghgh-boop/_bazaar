/**
 * @file pages/profile-modal/js/profile-security-actions.js
 * @description Handles profile password unlock UX/actions.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

export const ProfileSecurityActions = {
    bindOnce: () => {
        const changePasswordBtn = document.getElementById("profile-change-password-btn");
        if (!changePasswordBtn || changePasswordBtn.dataset.profileBound === "true") return;

        changePasswordBtn.addEventListener("click", ProfileSecurityActions.handlePasswordUnlock);
        changePasswordBtn.dataset.profileBound = "true";
    },

    handlePasswordUnlock: async () => {
        const currentUser = window.UserService?.get?.();
        if (!currentUser) return;

        if (!window.Swal) {
            alert("يرجى إدخال كلمة المرور الحالية أولاً.");
            return;
        }

        const result = await window.Swal.fire({
            title: window.langu?.("profile_current_password_label") || "كلمة المرور الحالية",
            text: window.langu?.("profile_password_popup_text") || "أدخل كلمة المرور الحالية للمتابعة إلى تعديل كلمة المرور.",
            input: "password",
            inputPlaceholder: window.langu?.("profile_current_password_placeholder") || "كلمة المرور الحالية",
            inputValue: "",
            inputAttributes: {
                autocomplete: "new-password",
                autocapitalize: "off",
                spellcheck: "false"
            },
            didOpen: () => {
                const input = window.Swal.getInput();
                if (input) {
                    setTimeout(() => {
                        input.value = "";
                        input.setAttribute("autocomplete", "new-password");
                    }, 50);
                }
            },
            showCancelButton: true,
            confirmButtonText: window.langu?.("profile_confirm_account_btn") || "تأكيد",
            cancelButtonText: window.langu?.("gen_cancel") || "إلغاء",
            buttonsStyling: false,
            customClass: {
                popup: "swal-modern-mini-popup",
                title: "swal-modern-mini-title",
                htmlContainer: "swal-modern-mini-text",
                input: "swal-modern-mini-input",
                confirmButton: "swal-modern-mini-confirm",
                cancelButton: "swal-modern-mini-cancel"
            },
            preConfirm: async (password) => {
                const value = String(password || "").trim();
                if (!value) {
                    window.Swal.showValidationMessage(window.langu?.("profile_error_current_password_required") || "يرجى إدخال كلمة المرور الحالية.");
                    return false;
                }

                try {
                    if (typeof window.verifyUserPassword === 'function') {
                        const verifyResult = await window.verifyUserPassword(ProfileSecurityActions.resolveCurrentUserPhone(currentUser), value);
                        if (verifyResult?.error) {
                            window.Swal.showValidationMessage(window.langu?.("login_invalid_credentials") || "كلمة المرور الحالية غير صحيحة.");
                            return false;
                        }
                        return value;
                    }
                    throw new Error("verifyUserPassword not found");
                } catch (error) {
                    window.Swal.showValidationMessage(error.message || (window.langu?.("register_error_app") || "تعذر التحقق الآن."));
                    return false;
                }
            }
        });

        if (!result.isConfirmed || !result.value) return;
        ProfileSecurityActions.unlockPasswordFields(result.value);
    },

    unlockPasswordFields: (currentPassword) => {
        const currentPasswordInput = document.getElementById("profile_current_password");
        const passwordFields = document.getElementById("profile-password-fields");
        const passwordInput = document.getElementById("register_password");
        const wrapper = document.getElementById("profile-security-wrapper");
        const changePasswordBtn = document.getElementById("profile-change-password-btn");
        const verifiedNote = document.getElementById("profile-password-verified-note");

        if (currentPasswordInput) currentPasswordInput.value = currentPassword;
        if (passwordFields) passwordFields.hidden = false;
        if (wrapper) wrapper.classList.add("expanded");
        if (changePasswordBtn) {
            if (typeof changePasswordBtn.blur === "function") {
                changePasswordBtn.blur();
            }
            changePasswordBtn.disabled = true;
            changePasswordBtn.tabIndex = -1;
            changePasswordBtn.style.display = "none";
            changePasswordBtn.hidden = true;
        }
        if (verifiedNote) {
            verifiedNote.hidden = false;
            verifiedNote.textContent = window.langu?.("profile_password_verified_btn") || "تم التحقق، أدخل كلمة مرور جديدة";
        }

        if (window.RegisterState) {
            window.RegisterState.updateField("currentPassword", currentPassword, "valid", "");
            window.RegisterState.updateField("password", "", "idle", "");
            window.RegisterState.updateField("confirmPassword", "", "idle", "");
        }

        if (passwordInput && typeof passwordInput.focus === "function") {
            passwordInput.focus({ preventScroll: true });
        }
    },

    resolveCurrentUserPhone: (user) => {
        if (window.ProfileSubmitPipeline?.resolveCurrentUserPhone) {
            return window.ProfileSubmitPipeline.resolveCurrentUserPhone(user);
        }
        if (user?.phone) return user.phone;
        if (user?.primary_phone) return user.primary_phone;
        if (Array.isArray(user?.phones)) {
            return user.phones.find((entry) => entry?.is_primary)?.number || user.phones[0]?.number || "";
        }
        return "";
    }
};

// Hybrid bridge
window.ProfileSecurityActions = ProfileSecurityActions;

export default ProfileSecurityActions;

console.log("[ESM Load] profile-security-actions.js: Hybrid bridge established.");
