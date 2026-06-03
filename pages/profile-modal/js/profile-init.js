/**
 * @file pages/profile-modal/js/profile-init.js
 * @description Bootstraps the Profile Wizard by initializing shared modules in 'PROFILE' mode.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


window.ProfileInit = (function () {
    'use strict';

    function profileLog(message, payload) {
        if (window.RegisterDevLogger) {
            window.RegisterDevLogger.info("ProfileInit", message, payload);
            return;
        }
        if (payload === undefined) {
            console.log(`[ProfileInit] ${message}`);
            return;
        }
        console.log(`[ProfileInit] ${message}`, payload);
    }

    function runtime() {
        return window.ProfileRuntimeAdapter || {};
    }

    async function runSharedBootstrap() {
        if (window.RegisterBootstrap?.start) {
            await window.RegisterBootstrap.start({
                scope: "ProfilePage",
                mode: window.WIZARD_MODES?.PROFILE || "PROFILE",
                postInitialize: runPostBootstrap
            });
            return true;
        }
        return false;
    }

    async function runPostBootstrap() {
        const container = document.getElementById('reg-wizard-container');
        profileLog("Post-bootstrap synchronization started.");

        try {
            if (typeof window.WIZARD_MODES === 'undefined' || !window.WIZARD_MODES.PROFILE) {
                throw new Error("Core wizard configuration (WIZARD_MODES) missing. Ensure register-wizard-core.js is loaded.");
            }

            runtime().setModeProfile?.();

            if (runtime().primeStateFromUser) {
                profileLog("Priming wizard state from current user profile.");
                const success = await runtime().primeStateFromUser();
                if (!success) {
                    profileLog("Data bridge reported a non-fatal failure.");
                }
            }

            runtime().renderPhones?.();
            runtime().refreshRoleDescription?.();
            runtime().syncUx?.();
            runtime().renderLocations?.();

            setupSpecializedListeners();
            bindProfileLocationActions();
            bindProfileSecurityActions();

            await runtime().refreshStepVisibility?.({
                preserveReveal: false,
                preserveCurrentStep: false,
                skipScroll: true
            });

            if (!window.location.hash || !window.location.hash.includes('step-')) {
                runtime().refreshWizardUi?.(true);
            }

            profileLog("Profile wizard ready.");
        } catch (error) {
            if (window.RegisterErrorUtils?.logError) {
                window.RegisterErrorUtils.logError("ProfileInit", "Critical failure during post-bootstrap.", error);
            } else {
                console.error(" [ProfileInit] Critical Failure during post-bootstrap:", error);
            }
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
            throw error;
        }
    }

    async function start() {
        profileLog("Profile initialization requested.");
        const handledByBootstrap = await runSharedBootstrap();
        if (handledByBootstrap) return;

        // Legacy fallback path if bootstrap script is unavailable.
        if (typeof window.loadIndexTranslations === 'function' && !window.appTranslations) {
            await window.loadIndexTranslations();
        }
        if (typeof window.applyAppTranslations === 'function') {
            window.applyAppTranslations();
        }
        if (window.RegisterUxEngine?.init) {
            window.RegisterUxEngine.init();
        }
        if (typeof window.initializeRegisterModule === 'function') {
            await window.initializeRegisterModule();
        }
        if (window.RegisterDraftManager?.init) {
            window.RegisterDraftManager.init({ mode: window.regWizard?.mode || 'PROFILE' });
        }
        await runPostBootstrap();
    }

    function setupSpecializedListeners() {
        if (window.ProfileRoleService?.bindRoleListenersOnce) {
            window.ProfileRoleService.bindRoleListenersOnce();
        }
    }

    function bindProfileLocationActions() {
        if (window.ProfileLocationActions?.bindOnce) {
            window.ProfileLocationActions.bindOnce();
        }
    }

    function bindProfileSecurityActions() {
        if (window.ProfileSecurityActions?.bindOnce) {
            window.ProfileSecurityActions.bindOnce();
        }
    }

    return {
        start,
        runPostBootstrap
    };
})();
