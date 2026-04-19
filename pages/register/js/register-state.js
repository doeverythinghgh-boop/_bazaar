/**
 * @file pages/register/js/register-state.js
 * @description Central source of truth for the registration wizard.
 * Manages form data, step completion status, and async loading states.
 */

window.RegisterState = (function () {
    'use strict';

    // Production-Grade State Machine Constants
    const ALLOWED_STATES = ['idle', 'checking', 'valid', 'invalid', 'error'];
    const ALLOWED_TRANSITIONS = {
        'idle': ['checking', 'valid', 'invalid'],
        'checking': ['valid', 'invalid', 'error'],
        'valid': ['checking', 'idle', 'invalid'],
        'invalid': ['checking', 'idle', 'valid'],
        'error': ['checking', 'idle']
    };

    // Private state
    let state = {
        mode: window.WIZARD_MODES?.REGISTER || 'REGISTER',
        currentStep: 1,
        totalSteps: 5,
        isBusiness: false,
        steps: {}, // id: { valid: bool, completed: bool, data: {} }
        fields: {}, // id: { value: val, state: 'idle'|'checking'|'valid'|'invalid', error: '' }
        metadata: {
            isRecovered: false,
            startTime: Date.now(),
            lastInteraction: Date.now(),
            version: '1.2.0' // Schema version for stabilization
        }
    };

    /**
     * Initializes the state for all defined steps.
     * @param {Array} stepDefinitions
     */
    function init(stepDefinitions) {
        state.totalSteps = stepDefinitions.length;
        stepDefinitions.forEach((step, index) => {
            // Only initialize if not already restored from draft
            if (!state.steps[step.id]) {
                state.steps[step.id] = {
                    order: index + 1,
                    valid: false,
                    completed: false,
                    data: {}
                };
            } else {
                // Ensure order is correct even if restored
                state.steps[step.id].order = index + 1;
            }
        });
        console.log(`[RegisterState] Initialized/Synced with ${state.totalSteps} steps in ${state.mode} mode.`);
    }

    /**
     * Safe Update Layer for fields. Enforces State Machine rules.
     */
    function updateField(fieldId, value, fieldState = 'idle', error = '') {
        // console.log(`[Reg-Step] State: Field Update [${fieldId}] -> Val: ${value}, State: ${fieldState}, Error: ${error}`);
        
        // NOISE CLEANUP: Canonicalize fieldId (strip 'register_' if it's a DOM ID being used as a state key)
        if (fieldId.startsWith('register_') && !['register_is-delivered', 'register_limit-package', 'register_rating_enabled', 'register_product_rating_enabled'].includes(fieldId)) {
            fieldId = fieldId.replace('register_', '');
        }

        // 1. Validate State
        if (!ALLOWED_STATES.includes(fieldState)) {
            console.error(`[RegisterState] Invalid state ignored: ${fieldState} for field ${fieldId}`);
            fieldState = 'idle';
        }

        // 2. Validate Transition
        const currentState = state.fields[fieldId]?.state || 'idle';
        if (currentState !== fieldState && !ALLOWED_TRANSITIONS[currentState]?.includes(fieldState)) {
            // console.warn(`[RegisterState] Non-standard transition: ${currentState} -> ${fieldState} for ${fieldId}`);
        }

        // 3. Perform Immutable-like Update
        const oldValue = state.fields[fieldId]?.value;
        const oldState = state.fields[fieldId]?.state;
        const oldError = state.fields[fieldId]?.error;
        const newValue = typeof value === 'string' ? value.trim() : value;

        if (oldValue === newValue && oldState === fieldState && oldError === error) {
            return;
        }

        state.fields[fieldId] = {
            value: newValue,
            state: fieldState,
            error
        };
        state.metadata.lastInteraction = Date.now();

        // Notify listeners
        document.dispatchEvent(new CustomEvent('register:field-updated', {
            detail: { fieldId, value: newValue, state: fieldState, error, mode: state.mode }
        }));
    }

    function setStepStatus(stepId, valid, completed) {
        // console.log(`[Reg-Step] State: Step Status Update [${stepId}] -> Valid: ${valid}, Completed: ${completed}`);
        if (state.steps[stepId]) {
            state.steps[stepId].valid = valid;
            state.steps[stepId].completed = completed;

            document.dispatchEvent(new CustomEvent('register:step-status-updated', {
                detail: { stepId, valid, completed, mode: state.mode }
            }));
        }
    }

    function getFullState() {
        return JSON.parse(JSON.stringify(state));
    }

    function restoreFromData(savedData) {
        if (!savedData) return;
        state = { ...state, ...savedData };
        state.metadata.isRecovered = true;
        console.log(`[RegisterState] State restored from draft for mode: ${state.mode}`);
    }

    function syncWizardState(nextState = {}) {
        state.currentStep = Number(nextState.currentStep || state.currentStep || 1);
        state.totalSteps = Number(nextState.totalSteps || state.totalSteps || 1);
        state.isBusiness = !!nextState.isBusiness;
        if (nextState.mode) state.mode = nextState.mode;
        state.metadata.lastInteraction = Date.now();
    }

    function getField(fieldId) {
        return state.fields[fieldId] || { value: '', state: 'idle', error: '' };
    }

    return {
        init,
        updateField,
        getField,
        setStepStatus,
        getFullState,
        restoreFromData,
        syncWizardState,
        get currentStep() { return state.currentStep; },
        set currentStep(val) { state.currentStep = val; },
        get mode() { return state.mode; },
        set mode(val) { state.mode = val; }
    };
})();
