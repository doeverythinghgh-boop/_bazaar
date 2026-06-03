/**
 * @file pages/register/js/register-wizard-ui.js
 * @description UI orchestration, sequential reveal rendering, and step meta updates.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


function registerCenterActiveStepInContainer(activeStepElement, behavior = "smooth") {
    const wizardContainer = document.getElementById("reg-wizard-container");
    if (!activeStepElement || !wizardContainer) return;

    const prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const resolvedBehavior = prefersReducedMotion ? "auto" : behavior;
    const containerRect = wizardContainer.getBoundingClientRect();
    const stepRect = activeStepElement.getBoundingClientRect();
    const isTallStep = stepRect.height >= containerRect.height - 48;
    const isCompactViewport = window.innerWidth <= 768;
    const shouldTopAlign = isTallStep || isCompactViewport;
    const topOffset = 16;
    const targetScrollTop = shouldTopAlign
        ? Math.max(0, activeStepElement.offsetTop - topOffset)
        : Math.max(0, activeStepElement.offsetTop - ((containerRect.height - stepRect.height) / 2));

    wizardContainer.scrollTo({
        top: targetScrollTop,
        behavior: resolvedBehavior
    });

    if (typeof window.registerDebugLog === "function") {
        window.registerDebugLog("WizardUI", "Centered active step inside wizard container.", {
            activeStepId: activeStepElement.dataset.stepId || activeStepElement.id || null,
            containerHeight: Math.round(containerRect.height),
            stepHeight: Math.round(stepRect.height),
            isTallStep,
            isCompactViewport,
            shouldTopAlign,
            targetScrollTop: Math.round(targetScrollTop),
            behavior: resolvedBehavior
        });
    }
}

function registerUpdateWizardUI(skipScroll = false, options = {}) {
    const els = registerGetElements();
    if (!els.steps || !els.steps.length) return;
    const preserveFocus = !!options.preserveFocus;

    const currentStepDefinition = registerGetCurrentStepDefinition();
    const revealedCount = Math.max(1, window.regWizard.revealedStepCount || 1);
    const completedCount = Math.max(0, window.regWizard.completedSteps || 0);
    const totalSteps = Math.max(1, window.regWizard.totalSteps || 1);

    if (els.form) {
        els.form.setAttribute("data-current-step", String(window.regWizard.currentStep));
        els.form.setAttribute("data-revealed-step-count", String(revealedCount));
        if (currentStepDefinition?.id) {
            els.form.setAttribute("data-current-step-id", currentStepDefinition.id);
        }
        els.form.setAttribute("data-final-step", window.regWizard.canSubmit ? "true" : "false");
    }

    if (els.wizardContainer) {
        els.wizardContainer.setAttribute("data-current-step", String(window.regWizard.currentStep));
        els.wizardContainer.setAttribute("data-revealed-step-count", String(revealedCount));
    }

    const activeSteps = window.regWizard.activeSteps || [];
    els.steps.forEach((stepElement) => {
        const stepId = stepElement.dataset.stepId;
        const seqIndex = activeSteps.findIndex((s) => s.id === stepId);

        // 1. Handle Visibility based on Active Sequence
        if (seqIndex === -1) {
            stepElement.classList.remove("revealed", "active", "completed-step", "locked-step");
            stepElement.style.display = "none";
            stepElement.setAttribute("aria-hidden", "true");
            return;
        }

        // 2. Step is part of the current sequence
        stepElement.style.display = ""; // Reset to default (usually block/flex)
        const stepSeqNum = seqIndex + 1;
        const isRevealed = stepSeqNum <= revealedCount;
        const isActive = currentStepDefinition && stepId === currentStepDefinition.id;
        const isCompleted = stepSeqNum < window.regWizard.currentStep || (window.regWizard.canSubmit && stepSeqNum <= completedCount);

        stepElement.classList.remove("revealed", "active", "completed-step", "locked-step");

        if (isRevealed) {
            stepElement.classList.add("revealed");
            stepElement.setAttribute("aria-hidden", "false");
        } else {
            stepElement.classList.add("locked-step");
            stepElement.setAttribute("aria-hidden", "true");
        }

        if (isCompleted) {
            stepElement.classList.add("completed-step");
        }

        if (isActive) {
            stepElement.classList.add("active");
        }
    });

    if (typeof window.registerDebugLog === "function") {
        const activeStepElement = document.querySelector(".reg-step.active");
        const revealedSteps = Array.from(document.querySelectorAll(".reg-step.revealed"));
        const activeGroups = activeStepElement ? Array.from(activeStepElement.querySelectorAll(".reg-form-group")) : [];
        window.registerDebugLog("WizardUI", "registerUpdateWizardUI completed.", {
            currentStep: window.regWizard.currentStep,
            revealedCount,
            completedCount,
            totalSteps,
            canSubmit: window.regWizard.canSubmit,
            activeStepId: currentStepDefinition?.id || null,
            activeTemplate: activeStepElement?.dataset?.stepTemplate || null,
            revealedStepIds: revealedSteps.map((step) => step.dataset.stepId || step.id || "(missing-id)"),
            activeGroupCount: activeGroups.length,
            activeGroups: activeGroups.map((group, index) => ({
                index: index + 1,
                fieldGroup: group.dataset.fieldGroup || null,
                classes: group.className,
                dataState: group.getAttribute("data-state") || "(none)",
                visibleClass: group.classList.contains("visible")
            }))
        });
    }

    if (typeof registerUpdateStepsSequence === "function") {
        registerUpdateStepsSequence();
    }

    if (els.currentStepNum) els.currentStepNum.textContent = String(revealedCount);
    if (els.totalStepsNum) els.totalStepsNum.textContent = String(totalSteps);
    if (els.stepStatusLabel) {
        const statusKey = window.regWizard.canSubmit ? "reg_progress_ready_label" : "reg_progress_unlocked_label";
        const fallback = window.regWizard.canSubmit ? "جاهز للتسجيل" : "تم فتح";
        els.stepStatusLabel.textContent = window.langu(statusKey);
    }

    if (els.submitBtn) {
        if (window.regWizard.canSubmit) {
            els.submitBtn.classList.remove("not-ready");
            els.submitBtn.setAttribute("aria-disabled", "false");
        } else {
            els.submitBtn.classList.add("not-ready");
            els.submitBtn.setAttribute("aria-disabled", "true");
        }
    }

    const progressFill = document.getElementById("reg-progress-fill");
    if (progressFill) {
        const base = 20;
        const progress = base + (completedCount / totalSteps) * 80;
        progressFill.style.width = `${Math.min(100, Math.max(base, progress))}%`;
    }

    registerUpdateStepHint();

    if (els.stepsSequence) {
        const targetElement = document.getElementById(`reg-node-${window.regWizard.currentStep}`);
        if (targetElement) {
            setTimeout(() => {
                const container = els.stepsSequence;
                const containerRect = container.getBoundingClientRect();
                const targetRect = targetElement.getBoundingClientRect();
                const containerCenter = containerRect.left + containerRect.width / 2;
                const targetCenter = targetRect.left + targetRect.width / 2;
                const scrollDiff = targetCenter - containerCenter;

                container.scrollBy({
                    left: scrollDiff,
                    behavior: "smooth"
                });
            }, 120);
        }
    }

    if (!skipScroll && currentStepDefinition?.id) {
        const activeStepElement = document.querySelector(`.reg-step[data-step-id="${currentStepDefinition.id}"]`);
        if (activeStepElement) {
            requestAnimationFrame(() => {
                registerCenterActiveStepInContainer(activeStepElement);
            });
        }
    }

    const msgEl = document.getElementById("reg-encouraging-msg");
    if (msgEl) {
        const progressPercent = (completedCount / totalSteps) * 100;
        let msgKey = "reg_msg_starting";
        if (progressPercent >= 100) msgKey = "reg_msg_final_lap";
        else if (progressPercent > 50) msgKey = "reg_msg_halfway";
        else if (progressPercent > 20) msgKey = "reg_msg_keep_going";

        const translated = window.langu(msgKey);
        if (translated && translated !== msgKey) msgEl.textContent = translated;
    }

    if (window.RegisterUxEngine) window.RegisterUxEngine.syncStepUI();

    if (!skipScroll && !preserveFocus && typeof registerFocusCurrentStepField === "function") {
        registerFocusCurrentStepField();
    }
}

function registerUpdateStepHint() {
    const els = registerGetElements();
    if (!els.stepHint) return;

    const totalSteps = Math.max(1, window.regWizard.totalSteps || 1);
    const completedCount = Math.max(0, window.regWizard.completedSteps || 0);

    if (window.regWizard.canSubmit) {
        els.stepHint.innerHTML = `<span class="reg-hint-success">${window.langu("reg_hint_ready_to_submit")}</span>`;
        return;
    }

    const currentStepDefinition = registerGetCurrentStepDefinition();
    const currentTitle = currentStepDefinition
        ? registerGetStepDisplayName(currentStepDefinition, window.regWizard.currentStep)
        : window.langu("reg_progress_continue_down");

    const progressText = window.langu("reg_progress_step_meta_hint", {
        done: String(completedCount),
        total: String(totalSteps),
        step: currentTitle
    });

    els.stepHint.textContent = progressText;
}
