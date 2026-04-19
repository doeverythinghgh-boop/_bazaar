/**
 * @file pages/register/js/register-ux-engine.js
 * @description Orchestrates input feedback, retry UI, optional section behavior, and progressive reveal polish.
 */

window.RegisterUxEngine = (function () {
    "use strict";

    function updateFieldFeedback(fieldId, state, message = "") {
        const group = document.querySelector(`[data-field-group="${fieldId}"]`);
        if (!group) {
            return;
        }

        group.setAttribute("data-state", state);
        const feedback = group.querySelector(".reg-feedback");
        const localizedMessage = (message && typeof window.langu === "function")
            ? (window.langu(message) || message)
            : message;

        if (feedback) {
            if (state === "error") {
                feedback.textContent = localizedMessage || window.langu("register_error_unexpected");
                feedback.style.color = "var(--reg-error)";
                group.classList.add("shake-error");
                setTimeout(() => group.classList.remove("shake-error"), 400);
            } else if (state === "valid") {
                feedback.textContent = localizedMessage || "✓";
                feedback.style.color = "var(--reg-success)";
            } else if (state === "checking") {
                feedback.innerHTML = `<i class="fas fa-circle-notch fa-spin" style="margin-inline-end: 6px;"></i> ${localizedMessage}`;
                feedback.style.color = "var(--reg-pending)";
            } else {
                feedback.textContent = localizedMessage;
                feedback.style.color = "";
            }
        }

        let retryBtn = group.querySelector(".reg-retry-btn");
        if (state === "error") {
            if (!retryBtn) {
                retryBtn = document.createElement("button");
                retryBtn.type = "button";
                retryBtn.className = "reg-retry-btn";
                retryBtn.innerHTML = `<i class="fas fa-redo"></i> ${window.langu("reg_btn_retry")}`;
                retryBtn.onclick = () => {
                    if (fieldId === "phone" && typeof window.registerRetryPhoneCheck === "function") {
                        window.registerRetryPhoneCheck();
                    }
                };
                group.appendChild(retryBtn);
            }
            retryBtn.style.display = "inline-flex";
        } else if (retryBtn) {
            retryBtn.style.display = "none";
        }
    }

    function applyProgressiveReveal(step = null) {
        const activeStep = step || document.querySelector(".reg-step.active");
        if (!activeStep) return;

        const mediaBlocks = activeStep.querySelectorAll(".reg-media-block:not(.no-reveal)");
        mediaBlocks.forEach((block, index) => {
            if (index === 0) {
                block.classList.add("visible");
                return;
            }

            const prevBlock = mediaBlocks[index - 1];
            const prevGroups = prevBlock.querySelectorAll(".reg-form-group:not(.social-input-group):not(.no-reveal)");
            const lastGroupInPrev = prevGroups[prevGroups.length - 1];

            if (lastGroupInPrev && lastGroupInPrev.getAttribute("data-state") === "valid") {
                block.classList.add("visible");
            } else if (prevGroups.length === 0) {
                block.classList.add("visible");
            } else {
                block.classList.remove("visible");
            }
        });

        const groups = activeStep.querySelectorAll(".reg-form-group:not(.social-input-group):not(.no-reveal)");
        groups.forEach((group, index) => {
            if (index === 0) {
                group.classList.add("visible");
                return;
            }

            const prevGroup = groups[index - 1];
            if (prevGroup && prevGroup.getAttribute("data-state") === "valid") {
                group.classList.add("visible");
            } else {
                group.classList.remove("visible");
            }
        });

        const rolesGroup = document.getElementById("reg-roles-group");
        if (rolesGroup) rolesGroup.classList.add("visible");

        const premiumHeader = document.getElementById("reg-premium-header");
        if (premiumHeader) premiumHeader.classList.add("visible");

        if (typeof window.registerDebugLog === "function") {
            const groups = Array.from(activeStep.querySelectorAll(".reg-form-group:not(.social-input-group):not(.no-reveal)"));
            const media = Array.from(activeStep.querySelectorAll(".reg-media-block:not(.no-reveal)"));
            window.registerDebugLog("UX", "applyProgressiveReveal evaluated active step.", {
                activeStepId: activeStep.dataset.stepId || activeStep.id || "(missing-id)",
                groups: groups.map((group, index) => ({
                    index: index + 1,
                    fieldGroup: group.dataset.fieldGroup || null,
                    state: group.getAttribute("data-state") || "(none)",
                    visible: group.classList.contains("visible")
                })),
                mediaBlocks: media.map((block, index) => ({
                    index: index + 1,
                    id: block.id || "(no-id)",
                    visible: block.classList.contains("visible")
                }))
            });
        }
    }

    function triggerFieldError(fieldId) {
        if (fieldId === "async-wait") {
            const checkingField = document.querySelector(".reg-step.active .reg-form-group[data-state='checking']");
            if (checkingField) {
                checkingField.classList.remove("shake");
                void checkingField.offsetWidth;
                checkingField.classList.add("shake");
                setTimeout(() => checkingField.classList.remove("shake"), 500);
            }
            return;
        }

        const group = document.querySelector(`[data-field-group="${fieldId}"]`);
        if (!group) return;

        group.scrollIntoView({ behavior: "smooth", block: "center" });

        setTimeout(() => {
            const focal = group.querySelector("input:not([type='hidden']), select, textarea, button.reg-action-btn");
            if (focal) {
                try {
                    focal.focus({ preventScroll: true });
                } catch (error) {
                    focal.focus();
                }
            }

            group.classList.remove("shake");
            void group.offsetWidth;
            group.classList.add("shake");

            if ("vibrate" in navigator) navigator.vibrate([10, 30, 10, 30]);
            setTimeout(() => group.classList.remove("shake"), 500);
        }, 450);
    }

    function handleMandatoryAutoExpand(step) {
        const isBusiness = typeof window.registerHasBusinessRole === "function" && window.registerHasBusinessRole();
        const optionalWrappers = step.querySelectorAll(".reg-optional-wrapper");

        optionalWrappers.forEach((wrapper) => {
            const requiredMode = wrapper.dataset.requiredMode || "never";
            const isRequired = requiredMode === "always" || (requiredMode === "business" && isBusiness);
            wrapper.dataset.required = isRequired ? "true" : "false";

            const badge = wrapper.querySelector(".reg-optional-badge");
            if (badge) {
                const badgeKey = isRequired ? "gen_mandatory" : "gen_optional";
                badge.textContent = typeof window.langu === "function" ? (window.langu(badgeKey) || badgeKey) : badgeKey;
            }

            if (isRequired) {
                wrapper.classList.add("expanded");
            } else if (!wrapper.classList.contains("user-expanded")) {
                wrapper.classList.remove("expanded");
            }
        });
    }

    function syncStepUI() {
        const revealedSteps = document.querySelectorAll(".reg-step.revealed");
        if (!revealedSteps.length) return;

        if (typeof window.registerDebugLog === "function") {
            window.registerDebugLog("UX", "syncStepUI started.", {
                revealedSteps: Array.from(revealedSteps).map((step) => step.dataset.stepId || step.id || "(missing-id)")
            });
        }

        revealedSteps.forEach((step) => {
            const groups = step.querySelectorAll("[data-field-group]");
            groups.forEach((group) => {
                const fieldId = group.getAttribute("data-field-group");
                const fieldData = window.RegisterState?.getField?.(fieldId);
                if (fieldData && fieldData.state !== "idle") {
                    updateFieldFeedback(fieldId, fieldData.state, fieldData.error);
                }
            });

            handleMandatoryAutoExpand(step);
        });

        const activeStep = document.querySelector(".reg-step.active");
        if (activeStep) {
            applyProgressiveReveal(activeStep);
        }
    }

    /**
     * Flushes field values from RegisterState back to the DOM inputs.
     * Useful after dynamic step loading or bridge priming.
     */
    function syncFieldValues() {
        if (!window.RegisterState || typeof window.registerGetElements !== "function") return;
        
        const state = window.RegisterState.getFullState();
        const fields = state.fields;
        const els = window.registerGetElements();

        Object.keys(fields).forEach(fieldId => {
            // Priority 1: Elements mapping from register-elements.js (e.g. 'username' -> 'register_username')
            // Priority 2: Direct ID lookup fallback
            // Priority 3: 'register_' prefix lookup fallback
            const input = els[fieldId] || document.getElementById(fieldId) || document.getElementById(`register_${fieldId}`);
            
            if (input && (input.tagName === "INPUT" || input.tagName === "TEXTAREA" || input.tagName === "SELECT")) {
                if (input.type === "checkbox" || input.type === "radio") {
                    input.checked = !!fields[fieldId].value;
                } else if (input.type !== "file") {
                    input.value = fields[fieldId].value || "";
                }
            }
        });
    }

    let isInitialized = false;

    function bindEventListeners() {
        if (isInitialized) return;
        isInitialized = true;

        document.addEventListener("register:field-updated", (e) => {
            const { fieldId, state, error } = e.detail;
            const message = error ? (window.langu(error) || window.RegisterErrorManager?.getMessage(error) || error) : "";
            updateFieldFeedback(fieldId, state, message);
            const activeStep = document.querySelector(".reg-step.active");
            if (activeStep) applyProgressiveReveal(activeStep);
        });

        document.addEventListener("register:nav-blocked", () => {
            triggerFieldError("async-wait");
        });

        document.addEventListener("click", (event) => {
            const toggle = event.target.closest(".reg-optional-toggle");
            if (!toggle) return;

            const wrapper = toggle.closest(".reg-optional-wrapper");
            if (!wrapper || wrapper.dataset.required === "true") return;

            wrapper.classList.toggle("expanded");
            wrapper.classList.toggle("user-expanded", wrapper.classList.contains("expanded"));
        });

        syncStepUI();
    }

    return {
        init: bindEventListeners,
        triggerFieldError,
        updateFieldFeedback,
        applyProgressiveReveal,
        syncStepUI,
        syncFieldValues
    };
})();
