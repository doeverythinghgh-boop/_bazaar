/**
 * @file pages/profile-modal/js/profile-role-service.js
 * @description Handles profile role-specific listeners and step synchronization.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


window.ProfileRoleService = (function () {
    "use strict";

    function log(message, payload) {
        if (window.RegisterDevLogger) {
            window.RegisterDevLogger.info("ProfileRoles", message, payload);
            return;
        }
        if (payload === undefined) {
            console.log(`[ProfileRoles] ${message}`);
            return;
        }
        console.log(`[ProfileRoles] ${message}`, payload);
    }

    function bindRoleListenersOnce() {
        const roleCheckboxes = document.querySelectorAll(".role-checkbox");
        roleCheckboxes.forEach((checkbox) => {
            if (checkbox.dataset.profileRoleBound === "true") return;
            checkbox.addEventListener("change", async (event) => {
                const newRole = event.target.value;
                const isChecked = event.target.checked;
                log("Role changed, syncing wizard steps.", { role: newRole, checked: isChecked });
                await syncRoleSteps();

                if (isChecked && newRole !== "1") {
                    showRoleChangeWarning();
                }
            });
            checkbox.dataset.profileRoleBound = "true";
        });
    }

    function showRoleChangeWarning() {
        if (window.SWAL_UTILITY) {
            window.SWAL_UTILITY.alert({
                titleKey: "profile_role_change_warning_title",
                textKey: "profile_role_change_warning_text",
                icon: "warning",
                fallbackTitle: "تغيير نوع الحساب",
                fallbackText: "تنبيه: تحويل الحساب سيتطلب منك إكمال بيانات النشاط مقدمي الخدمةي والمواقع."
            });
            return;
        }
        if (window.Swal) {
            window.Swal.fire({
                title: "تغيير نوع الحساب",
                text: "تنبيه: تحويل الحساب سيتطلب منك إكمال بيانات النشاط مقدمي الخدمةي والمواقع.",
                icon: "warning",
                confirmButtonText: "حسنًا",
                buttonsStyling: false,
                customClass: {
                    popup: "swal-modern-mini-popup",
                    title: "swal-modern-mini-title",
                    htmlContainer: "swal-modern-mini-text",
                    confirmButton: "swal-modern-mini-confirm"
                }
            });
            return;
        }
        alert("تنبيه: تحويل الحساب سيتطلب منك إكمال بيانات النشاط مقدمي الخدمةي والمواقع.");
    }

    async function syncRoleSteps() {
        if (typeof window.registerUpdateRoleDescription === "function") {
            window.registerUpdateRoleDescription();
        } else if (typeof window.registerUpdateWizardTotalSteps === "function") {
            window.registerUpdateWizardTotalSteps();
        }

        if (window.regWizard?.mode === window.WIZARD_MODES?.PROFILE) {
            if (window.registerLocationsApi?.render) {
                window.registerLocationsApi.render();
            }
            if (typeof window.registerCheckCurrentStepVisibility === "function") {
                await window.registerCheckCurrentStepVisibility({
                    preserveReveal: false,
                    preserveCurrentStep: false,
                    skipScroll: true
                });
                return;
            }
        }

        if (typeof window.registerUpdateWizardUI === "function") {
            window.registerUpdateWizardUI(true, { preserveFocus: true });
        }
    }

    return {
        bindRoleListenersOnce,
        syncRoleSteps
    };
})();
