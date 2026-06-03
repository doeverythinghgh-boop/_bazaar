/**
 * @file pages/register/js/register-wizard-core.js
 * @description Core state management for the progressive wizard flow (Register & Profile).
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


window.WIZARD_MODES = {
    REGISTER: 'REGISTER',
    PROFILE: 'PROFILE'
};

window.regWizard = {
    mode: window.WIZARD_MODES.REGISTER, // Default to Register
    currentStep: 1,
    totalSteps: 1,
    completedSteps: 0,
    revealedStepCount: 1,
    canSubmit: false,
    isBusinessAccount: false,
    activeSteps: [],
    historyBound: false,
    suppressHistorySync: false
};

/**
 * Sets the wizard mode and adjusts behavior accordingly.
 */
function registerSetWizardMode(mode) {
    if (Object.values(window.WIZARD_MODES).includes(mode)) {
        window.regWizard.mode = mode;
        console.log(`[WizardCore] Mode set to: ${mode}`);
    }
}

function registerSyncWizardState() {
    if (!window.RegisterState || typeof window.RegisterState.syncWizardState !== "function") return;

    window.RegisterState.syncWizardState({
        currentStep: window.regWizard.currentStep,
        totalSteps: window.regWizard.totalSteps,
        isBusiness: window.regWizard.isBusinessAccount,
        mode: window.regWizard.mode
    });
}

function registerGetWizardHistoryState() {
    const currentStepDefinition = registerGetCurrentStepDefinition();
    return {
        registerWizard: true,
        mode: window.regWizard.mode,
        step: window.regWizard.currentStep,
        stepId: currentStepDefinition?.id || null,
        roles: registerGetSelectedAccountType()
    };
}

function registerBuildWizardHash() {
    const currentStepDefinition = registerGetCurrentStepDefinition();
    const prefix = window.regWizard.mode === window.WIZARD_MODES.PROFILE ? "profile" : "register";
    return currentStepDefinition?.id ? `#${prefix}-step-${currentStepDefinition.id}` : "";
}

function registerSyncWizardHistory(mode = "replace") {
    if (window.regWizard.suppressHistorySync) return;

    const nextHash = registerBuildWizardHash();
    const nextUrl = `${window.location.pathname}${window.location.search}${nextHash}`;
    const state = registerGetWizardHistoryState();
    const historyMethod = mode === "push" ? "pushState" : "replaceState";

    if (window.history && typeof window.history[historyMethod] === "function") {
        window.history[historyMethod](state, "", nextUrl);
    }
}

function registerResolveStepIndex(stepId) {
    if (!stepId) return null;
    const stepIndex = window.regWizard.activeSteps.findIndex((step) => step.id === stepId);
    return stepIndex >= 0 ? stepIndex + 1 : null;
}

function registerRestoreWizardFromNavigation(targetStepId = null) {
    const hashPrefix = window.regWizard.mode === window.WIZARD_MODES.PROFILE ? "#profile-step-" : "#register-step-";
    const resolvedStep = registerResolveStepIndex(targetStepId)
        || registerResolveStepIndex(window.location.hash.replace(new RegExp(`^${hashPrefix}`), ""))
        || 1;

    window.regWizard.currentStep = Math.min(Math.max(resolvedStep, 1), window.regWizard.revealedStepCount || 1);
    registerSyncWizardState();
    registerUpdateWizardUI(true);
}

function registerBindWizardHistory() {
    if (window.regWizard.historyBound) return;

    window.addEventListener("popstate", () => {
        const state = window.history?.state;
        const targetStepId = state?.registerWizard ? state.stepId : null;

        window.regWizard.suppressHistorySync = true;
        try {
            registerRestoreWizardFromNavigation(targetStepId);
        } finally {
            window.regWizard.suppressHistorySync = false;
        }
    });

    window.regWizard.historyBound = true;
}

function registerCaptureFormValuesBeforeStepReload() {
    const form = document.getElementById("register_form");
    if (!form) return {};

    const values = {};
    form.querySelectorAll("input[id], textarea[id], select[id]").forEach((field) => {
        if (!field.id || field.type === "file" || field.classList.contains("role-checkbox")) return;
        values[field.id] = (field.type === "checkbox" || field.type === "radio")
            ? !!field.checked
            : field.value;
    });
    return values;
}

function registerRestoreFormValuesAfterStepReload(values = {}) {
    Object.entries(values).forEach(([id, value]) => {
        const field = document.getElementById(id);
        if (!field) return;

        if (field.type === "checkbox" || field.type === "radio") {
            field.checked = !!value;
        } else if (field.type !== "file") {
            field.value = value ?? "";
        }
    });
}

function registerUpdateWizardTotalSteps() {
    const roles = registerGetSelectedAccountType();
    const isBusinessAccount = roles > (window.ACCOUNT_ROLES?.BUYER || 1);
    const nextSteps = typeof window.registerGetActiveStepDefinitions === "function"
        ? window.registerGetActiveStepDefinitions(roles)
        : [];

    const previousRoles = window.regWizard.roles;
    window.regWizard.roles = roles;
    window.regWizard.isBusinessAccount = isBusinessAccount;
    window.regWizard.activeSteps = nextSteps;
    window.regWizard.totalSteps = Math.max(1, nextSteps.length);

    // If roles changed and we are in REGISTER mode, re-load steps to ensure correct templates are in DOM
    if (previousRoles !== undefined && previousRoles !== roles && window.regWizard.mode === window.WIZARD_MODES.REGISTER) {
        console.log(`[WizardCore] Role changed from ${previousRoles} to ${roles}. Re-loading steps...`);
        if (window.RegisterLoader && typeof window.RegisterLoader.loadSteps === "function") {
            const formValues = registerCaptureFormValuesBeforeStepReload();
            const reloadPromise = window.RegisterLoader.loadSteps().then(() => {
                registerRestoreFormValuesAfterStepReload(formValues);

                if (typeof registerRefreshDynamicStepBindings === "function") {
                    registerRefreshDynamicStepBindings();
                } else if (typeof registerSetupStepBehaviors === "function") {
                    registerSetupStepBehaviors();
                }

                // Re-sync UI after loading new steps
                registerSyncWizardState();
                registerUpdateWizardUI(true);
            });
            window.regWizard.pendingStepReloadPromise = reloadPromise;
            return reloadPromise;
        }
    } else {
        registerSyncWizardState();
        registerSyncWizardHistory("replace");
        registerUpdateWizardUI(true);
    }

    return Promise.resolve();
}

function registerInitWizard(mode = null) {
    if (mode) registerSetWizardMode(mode);

    registerBindWizardHistory();
    registerUpdateWizardTotalSteps();
    registerSyncWizardState();
    registerUpdateWizardUI(true);

    if (window.RegisterAnalytics) {
        const startStepId = (window.regWizard.activeSteps || [])[window.regWizard.currentStep - 1]?.id;
        if (startStepId) window.RegisterAnalytics.trackStepStart(startStepId);
    }
}

async function registerWizardNext() {
    if (typeof registerCheckCurrentStepVisibility === "function") {
        await registerCheckCurrentStepVisibility({ preserveReveal: true, skipScroll: false });
    }
}

function registerWizardPrev() {
    const currentDef = registerGetCurrentStepDefinition();
    if (!currentDef) return;

    const activeStepElement = document.querySelector(`.reg-step[data-step-id="${currentDef.id}"]`);
    if (activeStepElement) {
        activeStepElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}
