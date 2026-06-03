/**
 * @file pages/register/js/register-navigation-guard.js
 * @description Centralized gatekeeper for step transitions.
 * Allows "Previous" always, but restricts "Next" based on RegisterState.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


window.RegisterNavigationGuard = (function () {
    'use strict';

    /**
     * Checks if the user can move to the next step.
     * @param {number} currentStep
     * @returns {boolean}
     */
    async function canGoNext(currentStep) {
        if (!window.RegisterState) return true;

        const stateData = window.RegisterState.getFullState();
        const activeSteps = window.regWizard?.activeSteps || [];
        const currentStepId = activeSteps[currentStep - 1]?.id;

        if (!currentStepId) return true;

        // 🛡️ [Refined Blocker] Check if any field in the CURRENT step is still "checking"
        const activeStep = document.querySelector('.reg-step.active');
        const activeFieldGroups = activeStep ? Array.from(activeStep.querySelectorAll('[data-field-group]')) : [];
        const activeFieldIds = activeFieldGroups.map(g => g.dataset.fieldGroup);

        console.log(`[Reg-Step] NavGuard: Active step fields to check: [${activeFieldIds.join(', ')}]`);

        const isChecking = Object.keys(stateData.fields).some(fieldId => {
            if (activeFieldIds.includes(fieldId) && stateData.fields[fieldId].state === 'checking') {
                console.warn(`[Reg-Step] NavGuard: Blocked by field [${fieldId}] in 'checking' state.`);
                return true;
            }
            return false;
        });

        if (isChecking) {
            console.warn("[Reg-Step] NavGuard: Blocked: Async check in progress for active step.");
            if (window.RegisterUxEngine) window.RegisterUxEngine.triggerFieldError('async-wait');
            return false;
        }

        const stepState = stateData.steps[currentStepId];

        // Final verification before allowing next
        if (typeof window.registerValidateCurrentStep === 'function') {
            console.log(`[Reg-Step] NavGuard: Running final validation for step [${currentStepId}]...`);
            const isValid = await window.registerValidateCurrentStep(false);
            console.log(`[Reg-Step] NavGuard: Final validation result: ${isValid}`);
            if (isValid) {
                window.RegisterState.setStepStatus(currentStepId, true, true);
                if (window.RegisterAnalytics) window.RegisterAnalytics.trackStepComplete(currentStepId);
                return true;
            }
        }

        console.warn(`[Reg-Step] NavGuard: Final block on step [${currentStepId}]. Validation failed.`);
        if (window.RegisterAnalytics) window.RegisterAnalytics.trackStepError(currentStepId, 'navigation', 'STEP_INCOMPLETE');

        // Trigger micro-interaction for error
        document.dispatchEvent(new CustomEvent('register:nav-blocked', { detail: { stepId: currentStepId } }));

        return false;
    }

    /**
     * Always allows going back for better UX.
     * @returns {boolean}
     */
    function canGoPrev() {
        return true;
    }

    return {
        canGoNext,
        canGoPrev
    };
})();
