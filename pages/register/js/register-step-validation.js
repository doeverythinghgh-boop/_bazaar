/**
 * @file pages/register/js/register-step-validation.js
 * @description Real-time and per-step validation logic for the registration wizard.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


async function registerValidateCurrentStep(silent = false) {
    const stepDefinition = registerGetCurrentStepDefinition();
    if (!stepDefinition) {
        console.warn("[Reg-Step] Validation: No step definition found for current step.");
        return false;
    }

    const validator = registerGetStepValidator(stepDefinition);
    console.log(`[Reg-Step] Validation: Starting for step [${stepDefinition.id}] (Silent: ${silent})`);

    if (typeof validator !== "function") {
        console.log(`[Reg-Step] Validation: No specific validator for [${stepDefinition.id}], assuming valid.`);
        return true;
    }

    const result = !!(await validator({ silent, stepDefinition, els: registerGetElements() }));
    console.log(`[Reg-Step] Validation: Result for [${stepDefinition.id}] -> ${result}`);
    return result;
}

async function registerValidateStepByDefinition(stepDefinition, silent = true) {
    if (!stepDefinition) return false;
    const validator = registerGetStepValidator(stepDefinition);
    if (typeof validator !== "function") return true;
    return !!(await validator({ silent, stepDefinition, els: registerGetElements() }));
}

async function registerComputeSequentialProgress(options = {}) {
    const preserveReveal = options.preserveReveal !== false;
    const activeSteps = registerGetActiveWizardSteps();
    const total = activeSteps.length;
    const previousReveal = Math.max(1, Math.min(window.regWizard?.revealedStepCount || 1, total || 1));

    let completedCount = 0;
    let currentStep = total || 1;
    let revealCount = total ? 1 : 0;
    let blocked = false;

    for (let index = 0; index < total; index += 1) {
        const stepDefinition = activeSteps[index];
        const isValid = await registerValidateStepByDefinition(stepDefinition, true);

        if (window.REGISTER_DEBUG) {
            console.log(` [Reg-Step] Sequential Check: Step #${index + 1} (${stepDefinition.id}) => Valid: ${isValid}`, isValid ? 'color: #2ecc71;' : 'color: #e67e22;');
        }

        if (isValid) {
            completedCount += 1;
            revealCount = Math.min(total, index + 2);
            continue;
        }

        currentStep = index + 1;
        revealCount = Math.max(revealCount, index + 1);
        blocked = true;
        break;
    }

    if (!blocked && total) {
        currentStep = total;
        revealCount = total;
    }

    if (preserveReveal && total) {
        revealCount = Math.max(revealCount, previousReveal);
    }

    return {
        total,
        completedCount,
        currentStep: Math.max(1, Math.min(currentStep, total || 1)),
        revealCount: Math.max(1, Math.min(revealCount, total || 1)),
        canSubmit: total > 0 && completedCount === total
    };
}

window.registerComputeSequentialProgress = registerComputeSequentialProgress;

function registerGetStepValidator(stepDefinition) {
    if (!stepDefinition) return null;

    const validators = window.registerStepValidators || {};
    if (typeof stepDefinition.validate === "function") return stepDefinition.validate;
    if (stepDefinition.validatorKey && typeof validators[stepDefinition.validatorKey] === "function") {
        return validators[stepDefinition.validatorKey];
    }
    if (stepDefinition.id && typeof validators[stepDefinition.id] === "function") {
        return validators[stepDefinition.id];
    }
    return null;
}

// Validators were moved to /pages/register/js/validation/register-step-validators.js
// This file keeps orchestration + visibility logic only.

async function registerCheckCurrentStepVisibility(options = {}) {
    const els = registerGetElements();
    const preserveReveal = options.preserveReveal !== false;
    const skipScroll = !!options.skipScroll;
    const preserveCurrentStep = !!options.preserveCurrentStep;
    const preserveFocusedInput = !!options.preserveFocusedInput;
    const previousCurrentStep = window.regWizard.currentStep || 1;
    const progress = await registerComputeSequentialProgress({ preserveReveal });

    // 🛡️ Mode unification: Progressive reveal now controls Profile mode natively.
    // The wizard will validate data and halt exactly on the first incomplete mandatory step.
    const isProfile = (window.regWizard.mode === "PROFILE");

    const shouldPreserveCurrentStep =
        (preserveCurrentStep || preserveFocusedInput) &&
        previousCurrentStep <= progress.revealCount &&
        (progress.currentStep <= previousCurrentStep || (
            preserveFocusedInput
            && document.activeElement
            && ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)
        ));

    const nextCurrentStep = shouldPreserveCurrentStep
        ? previousCurrentStep
        : progress.currentStep;

    const activeStepsDefs = typeof registerGetActiveWizardSteps === "function" ? registerGetActiveWizardSteps() : [];
    const haltedDefinition = activeStepsDefs[nextCurrentStep - 1] || { id: "unknown" };

    if (typeof window.registerDebugLog === "function") {
        if (progress.completedCount === progress.total && progress.total > 0) {
            window.registerDebugLog("Reveal_Engine", "🛑 توقف الكشف الآلي! جميع الخطوات مكتملة بنجاح، يمكنك الحفظ الآن.", { currentStep: nextCurrentStep, totalSteps: progress.total });
        } else {
            window.registerDebugLog("Reveal_Engine", `🛑 توقف الكشف الآلي! واجهة التسلسل توقفت عند الخطوة ${nextCurrentStep} (${haltedDefinition.id}). السبب: حالتها غير مكتملة أو فقدت شرطاً إلزامياً.`, { currentStep: nextCurrentStep, totalSteps: progress.total });
        }
    }

    if (typeof window.registerDebugLog === "function") {
        window.registerDebugLog("StepValidation", "registerCheckCurrentStepVisibility resolved navigation state.", {
            preserveReveal,
            skipScroll,
            preserveCurrentStep,
            previousCurrentStep,
            computedCurrentStep: progress.currentStep,
            revealCount: progress.revealCount,
            completedCount: progress.completedCount,
            shouldPreserveCurrentStep,
            nextCurrentStep
        });
    }

    window.regWizard.totalSteps = Math.max(1, progress.total || 1);
    window.regWizard.completedSteps = progress.completedCount;
    window.regWizard.revealedStepCount = progress.revealCount;
    window.regWizard.currentStep = nextCurrentStep;
    window.regWizard.canSubmit = progress.canSubmit;

    if (els.submitBtn) {
        els.submitBtn.style.display = "inline-flex";
        els.submitBtn.classList.add("visible");
        if (progress.canSubmit) {
            els.submitBtn.classList.remove("not-ready");
            els.submitBtn.disabled = false;
            els.submitBtn.setAttribute("aria-disabled", "false");
        } else {
            els.submitBtn.classList.add("not-ready");
            els.submitBtn.disabled = false;
            els.submitBtn.setAttribute("aria-disabled", "true");
        }
    }

    registerSyncWizardState();
    registerSyncWizardHistory("replace");
    registerUpdateWizardUI(skipScroll, { preserveFocus: shouldPreserveCurrentStep });

    const didOpenNewStep = nextCurrentStep > previousCurrentStep || progress.revealCount > (window.regWizard.lastRevealedStepCount || 1);
    window.regWizard.lastRevealedStepCount = progress.revealCount;

    if (!skipScroll && didOpenNewStep) {
        const activeStepElement = document.querySelector(`.reg-step[data-step-id="${registerGetCurrentStepDefinition()?.id || ""}"]`);
        if (activeStepElement) {
            requestAnimationFrame(() => {
                if (typeof registerCenterActiveStepInContainer === "function") {
                    registerCenterActiveStepInContainer(activeStepElement);
                } else {
                    activeStepElement.scrollIntoView({ behavior: "smooth", block: "center" });
                }
            });
        }
    }
}
