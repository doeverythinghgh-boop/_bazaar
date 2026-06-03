/**
 * @file pages/register/js/register-wizard-sequence.js
 * @description Logic for building and updating the progressive register progress sequence.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


function registerUpdateStepsSequence() {
    const els = registerGetElements();
    if (!els.stepsSequence) return;

    const activeSteps = registerGetActiveWizardSteps();
    const total = activeSteps.length;
    const current = window.regWizard.currentStep || 1;
    const revealed = window.regWizard.revealedStepCount || 1;

    const existingNodes = Array.from(els.stepsSequence.querySelectorAll(".reg-progress-node"));
    if (existingNodes.length !== total) {
        const track = els.stepsSequence.querySelector(".reg-progress-track");
        els.stepsSequence.innerHTML = "";
        if (track) els.stepsSequence.appendChild(track);

        activeSteps.forEach((step, index) => {
            const stepNum = index + 1;
            const node = document.createElement("div");
            node.className = "reg-progress-node";
            node.id = `reg-node-${stepNum}`;

            const iconBox = document.createElement("div");
            iconBox.className = "reg-node-icon";
            const icon = document.createElement("i");
            icon.className = step.icon || "fas fa-circle";
            iconBox.appendChild(icon);

            const lock = document.createElement("div");
            lock.className = "reg-node-lock";
            lock.innerHTML = '<i class="fas fa-lock"></i>';
            iconBox.appendChild(lock);

            const label = document.createElement("span");
            label.className = "reg-node-label";
            label.textContent = registerGetStepDisplayName(step, stepNum);

            node.appendChild(iconBox);
            node.appendChild(label);
            node.addEventListener("click", () => {
                if (stepNum > revealed) {
                    if (window.RegisterUxEngine) {
                        window.RegisterUxEngine.triggerFieldError("async-wait");
                    }
                    return;
                }

                const targetStep = document.querySelector(`.reg-step[data-step-id="${step.id}"]`);
                if (targetStep) {
                    window.regWizard.currentStep = stepNum;
                    registerSyncWizardState();
                    registerSyncWizardHistory("replace");
                    registerUpdateWizardUI(true);
                    targetStep.scrollIntoView({ behavior: "smooth", block: "start" });
                }
            });

            els.stepsSequence.appendChild(node);
        });
    }

    activeSteps.forEach((step, index) => {
        const stepNum = index + 1;
        const node = document.getElementById(`reg-node-${stepNum}`);
        if (!node) return;

        node.classList.remove("active", "completed", "revealed");

        if (stepNum < current || (window.regWizard.canSubmit && stepNum <= (window.regWizard.completedSteps || 0))) {
            node.classList.add("completed");
        } else if (stepNum === current) {
            node.classList.add("active");
        } else if (stepNum <= revealed) {
            node.classList.add("revealed");
        }

        const icon = node.querySelector(".reg-node-icon i");
        if (icon) {
            icon.className = node.classList.contains("completed")
                ? "fas fa-check"
                : (step.icon || "fas fa-circle");
        }

        const label = node.querySelector(".reg-node-label");
        if (label) {
            label.textContent = registerGetStepDisplayName(step, stepNum);
        }
    });
}

function registerGetStepDisplayName(stepDefinition, fallbackIndex) {
    const stepLabel = window.langu("reg_wizard_step_label") || "Step";
    if (!stepDefinition) return `${stepLabel} ${fallbackIndex}`;
    const name = window.langu(stepDefinition.titleKey);
    return (name && name !== stepDefinition.titleKey)
        ? name
        : (stepDefinition.fallbackTitle || `${stepLabel} ${fallbackIndex}`);
}
