/**
 * @file pages/register/js/register-wizard-helpers.js
 * @description Wizard state and navigation helpers for the registration page.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


function registerFocusCurrentStepField() {
    const els = registerGetElements();
    const activeStep = Array.from(els.steps || []).find((step) => step.classList.contains("active"));
    if (!activeStep) return;

    const focusTarget = activeStep.querySelector(
        'input:not([type="hidden"]):not([type="file"]):not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled])'
    );

    if (!focusTarget || typeof focusTarget.focus !== "function") return;

    requestAnimationFrame(() => {
        try {
            focusTarget.focus({ preventScroll: true });
        } catch (error) {
            try {
                focusTarget.focus();
            } catch (_) {
                // Ignore focus failures on browsers that reject focus options.
            }
        }
    });
}

function registerGetActiveWizardSteps() {
    if (Array.isArray(window.regWizard?.activeSteps) && window.regWizard.activeSteps.length) {
        return window.regWizard.activeSteps;
    }

    return typeof window.registerGetActiveStepDefinitions === "function"
        ? window.registerGetActiveStepDefinitions()
        : [];
}

function registerGetCurrentStepDefinition() {
    return registerGetActiveWizardSteps()[window.regWizard.currentStep - 1] || null;
}

function registerIsFinalWizardStep(stepIndex = window.regWizard.currentStep) {
    return stepIndex === registerGetActiveWizardSteps().length;
}

function registerGetStepDefinitionsBySetupKey(setupKey) {
    return (typeof window.registerGetAllStepDefinitions === "function"
        ? window.registerGetAllStepDefinitions()
        : []).filter((step) => step.setupKey === setupKey);
}

function registerGetLiveValidationElements() {
    const definitions = typeof window.registerGetAllStepDefinitions === "function"
        ? window.registerGetAllStepDefinitions()
        : [];
    const els = registerGetElements();
    const seen = new Set();
    const liveElements = [];

    definitions.forEach((step) => {
        (step.liveValidationFieldKeys || []).forEach((fieldKey) => {
            if (seen.has(fieldKey) || !els[fieldKey]) return;
            seen.add(fieldKey);
            liveElements.push(els[fieldKey]);
        });
    });

    return liveElements;
}

function registerGetActiveFinalValidationKeys() {
    const seen = new Set();
    const keys = [];

    registerGetActiveWizardSteps().forEach((step) => {
        (step.finalValidationKeys || []).forEach((key) => {
            if (seen.has(key)) return;
            seen.add(key);
            keys.push(key);
        });
    });

    return keys;
}

function registerGetActiveSubmitSectionKeys() {
    const seen = new Set();
    const keys = [];

    registerGetActiveWizardSteps().forEach((step) => {
        (step.submitSectionKeys || []).forEach((key) => {
            if (seen.has(key)) return;
            seen.add(key);
            keys.push(key);
        });
    });

    return keys;
}
