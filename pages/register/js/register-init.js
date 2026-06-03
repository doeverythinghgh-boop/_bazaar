/**
 * @file pages/register/js/register-init.js
 * @description Page-level initialization logic for the registration module.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

export function registerInitialize() {
    const isProfilePage = window.location.pathname.includes('profile-modal');
    const pageName = isProfilePage ? "Profile Modal" : "Register Page";
    const mode = window.regWizard?.mode || "UNKNOWN";

    console.log(` [Execution Context] Executing in: ${pageName} | Mode: ${mode} `);
    console.log(`[Register] Starting logic binding sequence for ${pageName}...`);

    if (typeof window.registerDebugLog === "function") {
        const renderedSteps = document.querySelectorAll(".reg-step");
        window.registerDebugLog("Init", `Initialization cycle started on ${pageName}.`, {
            renderedSteps: renderedSteps.length,
            renderedStepIds: Array.from(renderedSteps).map((step) => step.dataset.stepId || step.id || "(missing-id)")
        });
    }

    registerGuardIdentityAutofill();

    // 1. Initialize State Manager
    if (window.RegisterState) {
        const stepDefinitions = typeof window.registerGetActiveStepDefinitions === "function"
            ? window.registerGetActiveStepDefinitions()
            : [];

        console.log(`[Register] Aligning state machine with active UI definitions. Active steps identified: ${stepDefinitions.length}`);
        window.RegisterState.init(stepDefinitions, window.regWizard?.mode);
        if (typeof window.registerDebugLog === "function") {
            window.registerDebugLog("Init", "RegisterState initialized with definitions.", {
                totalDefinitions: stepDefinitions.length,
                definitionIds: stepDefinitions.map((step) => step.id)
            });
        }
    }

    // 2. Initial Roles Sync
    if (typeof window.registerUpdateRoleDescription === 'function') {
        window.registerUpdateRoleDescription();
    }

    // 3. Step-specific behaviors should be ready before the first UI render
    if (typeof window.registerSetupStepBehaviors === 'function') {
        window.registerSetupStepBehaviors();
        if (typeof window.registerDebugLog === "function") {
            window.registerDebugLog("Init", "Step behaviors bound.");
        }
    }

    // 4. Initialize Wizard UI
    if (typeof window.registerInitWizard === 'function') {
        window.registerInitWizard();
        if (typeof window.registerDebugLog === "function") {
            window.registerDebugLog("Init", "Wizard initialized.", {
                currentStep: window.regWizard?.currentStep,
                totalSteps: window.regWizard?.totalSteps,
                activeStepIds: (window.regWizard?.activeSteps || []).map((step) => step.id)
            });
        }
    }
}

export function registerLooksLikePhoneAutofill(value) {
    const raw = String(value || "").trim();
    const digits = raw.replace(/\D/g, "");
    if (!digits) return false;

    const hasLetters = /[a-zA-Z\u0600-\u06FF]/.test(raw);
    return !hasLetters && digits.length >= 10 && digits.length <= 15;
}

export function registerGuardIdentityAutofill() {
    const form = document.getElementById("register_form");
    const usernameInput = document.getElementById("register_username");

    if (form) {
        form.setAttribute("autocomplete", "off");
    }

    if (!usernameInput) return;

    const isProfilePage = window.location.pathname.includes('profile-modal') || window.regWizard?.mode === 'PROFILE';
    if (isProfilePage) {
        usernameInput.removeAttribute("readonly");
        usernameInput.setAttribute("autocomplete", "off");
        usernameInput.setAttribute("name", "display_name");
        return;
    }

    usernameInput.setAttribute("autocomplete", "new-password");
    usernameInput.setAttribute("name", "display_name");
    usernameInput.setAttribute("data-lpignore", "true");
    usernameInput.setAttribute("data-form-type", "other");

    if (usernameInput.dataset.identityAutofillGuardBound === "true") {
        return;
    }

    usernameInput.setAttribute("readonly", "readonly");

    const clearPhoneAutofill = () => {
        if (registerLooksLikePhoneAutofill(usernameInput.value)) {
            usernameInput.value = "";
            if (window.RegisterState) {
                window.RegisterState.updateField("username", "", "idle", "");
                window.RegisterState.updateField("register_username", "", "idle", "");
            }
        }
    };

    const unlockForUserInput = () => {
        usernameInput.removeAttribute("readonly");
    };

    usernameInput.addEventListener("pointerdown", unlockForUserInput, { once: true });
    usernameInput.addEventListener("touchstart", unlockForUserInput, { once: true });
    usernameInput.addEventListener("keydown", unlockForUserInput, { once: true });
    usernameInput.addEventListener("focus", () => {
        clearPhoneAutofill();
        unlockForUserInput();
    });
    usernameInput.addEventListener("input", clearPhoneAutofill);
    usernameInput.dataset.identityAutofillGuardBound = "true";

    clearPhoneAutofill();
    window.requestAnimationFrame(clearPhoneAutofill);
    window.setTimeout(clearPhoneAutofill, 250);
    window.setTimeout(clearPhoneAutofill, 1000);
    window.setTimeout(clearPhoneAutofill, 2500);
}

export function registerRefreshDynamicStepBindings() {
    registerGuardIdentityAutofill();

    if (typeof window.registerSetupStepBehaviors === "function") {
        window.registerSetupStepBehaviors();
    }

    if (window.RegisterListenerServices && typeof window.RegisterListenerServices.bindDynamicStepDom === "function") {
        const els = window.registerGetElements ? window.registerGetElements() : null;
        if (els) window.RegisterListenerServices.bindDynamicStepDom(els);
    }

    if (window.RegisterUxEngine && typeof window.RegisterUxEngine.init === "function") {
        window.RegisterUxEngine.init();
    }
}

// Hybrid bridge
window.registerInitialize = registerInitialize;
window.registerLooksLikePhoneAutofill = registerLooksLikePhoneAutofill;
window.registerGuardIdentityAutofill = registerGuardIdentityAutofill;
window.registerRefreshDynamicStepBindings = registerRefreshDynamicStepBindings;

console.log("[ESM Load] register-init.js: Hybrid bridge established.");
