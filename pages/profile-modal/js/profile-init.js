/**
 * @file pages/profile-modal/js/profile-init.js
 * @description Bootstraps the Profile Wizard by initializing shared modules in 'PROFILE' mode.
 */

window.ProfileInit = (function () {
    'use strict';

    async function start() {
        console.log("[ProfileInit] Starting Profile Wizard initialization...");

        // 1. Set the mode to PROFILE before any logic starts
        if (typeof window.registerSetWizardMode === 'function') {
            window.registerSetWizardMode(window.WIZARD_MODES.PROFILE);
        }

        // 2. Ensure translations are loaded
        if (typeof applyAppTranslations === 'function') {
            window.applyAppTranslations();
        }

        // 3. Initialize Shared UX Engine
        if (window.RegisterUxEngine) {
            window.RegisterUxEngine.init();
        }

        // 4. Load User Data and Populate State
        if (window.ProfileDataBridge) {
            const success = await window.ProfileDataBridge.primeWizardState();
            if (!success) {
                console.error("[ProfileInit] Failed to prime wizard state with user data.");
                // We might want to show a critical error UI here
            }
        }

        // 5. Initialize the Wizard Module
        // This is the core shared entry point that triggers step loading
        if (typeof initializeRegisterModule === 'function') {
            await initializeRegisterModule();
        }

        // 6. Initialize Draft Management (specifically for Profile mode)
        if (window.RegisterDraftManager) {
            window.RegisterDraftManager.init({ mode: 'PROFILE' });
        }

        // 7. Setup Profile-specific listeners (e.g., Role Change Alert)
        setupSpecializedListeners();

        console.log("[ProfileInit] Profile Wizard ready.");
    }

    function setupSpecializedListeners() {
        // Listen for role changes to show the warning requested by the user
        const roleCheckboxes = document.querySelectorAll('.role-checkbox');
        roleCheckboxes.forEach(chk => {
            chk.addEventListener('change', (e) => {
                const newRole = e.target.value;
                const isChecked = e.target.checked;
                
                // Show alert if switching to business/provider role
                if (isChecked && newRole != "1") {
                    if (window.SWAL_UTILITY) {
                        window.SWAL_UTILITY.alert({
                            titleKey: "profile_role_change_warning_title",
                            textKey: "profile_role_change_warning_text",
                            icon: "warning",
                            fallbackTitle: "تغيير نوع الحساب",
                            fallbackText: "لقد اخترت تحويل حسابك إلى حساب تجاري. هذا سيتطلب منك إكمال بيانات إضافية في الخطوات التالية."
                        });
                    } else {
                        alert("تنبيه: تحويل الحساب سيتطلب منك إكمال بيانات النشاط التجاري والمواقع.");
                    }
                }
            });
        });
    }

    return {
        start
    };
})();
