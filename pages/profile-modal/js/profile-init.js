/**
 * @file pages/profile-modal/js/profile-init.js
 * @description Bootstraps the Profile Wizard by initializing shared modules in 'PROFILE' mode.
 */

window.ProfileInit = (function () {
    'use strict';

    async function start() {
        console.log("🚀 [ProfileInit] Starting Profile Wizard initialization sequence...");
        const container = document.getElementById('reg-wizard-container');

        try {
            // 1. Check for basic requirements to avoid silent crashes
            if (typeof window.WIZARD_MODES === 'undefined' || !window.WIZARD_MODES.PROFILE) {
                throw new Error("Core wizard configuration (WIZARD_MODES) missing. Ensure register-wizard-core.js is loaded.");
            }

            // 2. Set the mode to PROFILE before any logic starts
            if (typeof window.registerSetWizardMode === 'function') {
                window.registerSetWizardMode(window.WIZARD_MODES.PROFILE);
                console.log("✅ [ProfileInit] Mode set to PROFILE.");
            }

            // 3. Ensure translations are loaded early
            if (typeof loadIndexTranslations === 'function' && !window.appTranslations) {
                console.log("[ProfileInit] Waiting for translations...");
                await window.loadIndexTranslations();
            }
            if (typeof applyAppTranslations === 'function') {
                window.applyAppTranslations();
            }

            // 4. Initialize Shared UX Engine
            if (window.RegisterUxEngine) {
                window.RegisterUxEngine.init();
            }

            // 5. Load User Data and Populate State
            if (window.ProfileDataBridge) {
                console.log("[ProfileInit] Priming wizard state with user data...");
                const success = await window.ProfileDataBridge.primeWizardState();
                if (!success) {
                    console.warn("⚠️ [ProfileInit] Data bridge priming reported failure, proceeding with precautions.");
                } else {
                    console.log("✅ [ProfileInit] Wizard state primed successfully.");
                }
            }

            // 6. Initialize the Wizard Module
            if (typeof initializeRegisterModule === 'function') {
                console.log("[ProfileInit] Bootstrapping Shared Wizard Module...");
                await initializeRegisterModule();
                console.log("✅ [ProfileInit] Shared Wizard Module initialized.");

                // 🚀 POST-LOAD UI SYNC:
                // Now that the steps (and id="register_phones_list") are in the DOM,
                // we trigger the render and role sync.
                if (typeof registerRenderPhones === 'function') {
                    registerRenderPhones();
                }
                if (typeof registerUpdateRoleDescription === 'function') {
                    registerUpdateRoleDescription();
                }
                if (window.RegisterUxEngine) {
                    window.RegisterUxEngine.syncFieldValues();
                    window.RegisterUxEngine.syncStepUI();
                }
            } else {
                throw new Error("initializeRegisterModule function missing. Ensure register.js is loaded.");
            }

            // 7. Initialize Draft Management
            if (window.RegisterDraftManager) {
                window.RegisterDraftManager.init({ mode: window.regWizard?.mode || 'PROFILE' });
            }

            // 8. Setup Profile-specific listeners
            setupSpecializedListeners();

            console.log("🎊 [ProfileInit] Profile Wizard is ready and fully initialized.");

        } catch (error) {
            console.error("❌ [ProfileInit] Critical Failure during initialization:", error);
            
            // Critical fallback: If we hang, show a clear error to the user instead of a permanent loader
            if (container) {
                const errorMsg = window.langu ? window.langu("reg_err_steps_load") : "حدث خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى.";
                container.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: var(--reg-error);">
                        <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 15px;"></i>
                        <p style="font-weight: 600;">${errorMsg}</p>
                        <p style="font-size: 0.8rem; margin-top: 10px; opacity: 0.7;">Error: ${error.message}</p>
                        <button onclick="location.reload()" class="reg-nav-btn" style="margin-top: 20px; background: var(--reg-primary); color: #fff; padding: 8px 20px; border-radius: 12px; border:none; cursor:pointer;">
                            إعادة المحاولة
                        </button>
                    </div>
                `;
            }
        }
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
