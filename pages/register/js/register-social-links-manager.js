/**
 * @file pages/register/js/register-social-links-manager.js
 * @description Enables up to 3 links per social type in register wizard.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


(function () {
  "use strict";

  const TYPES = ["facebook", "instagram", "tiktok", "telegram", "x", "website"];
  const MAX = (window.MultiLinksClient && window.MultiLinksClient.MAX_PER_TYPE) || 3;

  function bindAddButtonsOnce() {
    TYPES.forEach((type) => {
      const btn = document.querySelector(`[data-social-add="${type}"]`);
      if (!btn || btn.dataset.bound === "true") return;
      btn.addEventListener("click", () => {
        revealNextInput(type);
        if (window.RegisterDraftManager?.saveNow) {
          window.RegisterDraftManager.saveNow();
        } else if (window.RegisterDraftManager?.saveDraft) {
          window.RegisterDraftManager.saveDraft();
        }
      });
      btn.dataset.bound = "true";
    });
  }

  function getInputs(type) {
    const base = document.getElementById(`register_business_${type === "x" ? "x" : type}`);
    const i2 = document.getElementById(`register_business_${type}_2`);
    const i3 = document.getElementById(`register_business_${type}_3`);
    return [base, i2, i3].filter(Boolean).slice(0, MAX);
  }

  function getWrapper(input) {
    return input ? input.closest(".reg-input-wrapper") : null;
  }

  function revealNextInput(type) {
    const inputs = getInputs(type);
    for (let i = 0; i < inputs.length; i++) {
      const el = inputs[i];
      const wrapper = getWrapper(el);
      const isHidden = wrapper ? wrapper.style.display === "none" : el.style.display === "none";
      if (isHidden) {
        if (wrapper) wrapper.style.display = "block";
        el.style.display = "block";
        const addBtn = document.querySelector(`[data-social-add="${type}"]`);
        const hasMoreHidden = inputs.some((input) => {
          const candidateWrapper = getWrapper(input);
          return candidateWrapper ? candidateWrapper.style.display === "none" : input.style.display === "none";
        });
        if (addBtn && !hasMoreHidden) addBtn.style.display = "none";
        try { el.focus(); } catch { }
        break;
      }
    }
  }

  function renderVisibilityFromValues() {
    TYPES.forEach((type) => {
      const inputs = getInputs(type);
      // Always show first
      if (inputs[0]) {
        const firstWrapper = getWrapper(inputs[0]);
        if (firstWrapper) firstWrapper.style.display = "block";
        inputs[0].style.display = "block";
      }
      // Show extra inputs if they have values
      for (let i = 1; i < inputs.length; i++) {
        const v = String(inputs[i].value || "").trim();
        const wrapper = getWrapper(inputs[i]);
        if (wrapper) wrapper.style.display = v ? "block" : "none";
        inputs[i].style.display = "block";
      }
      const addBtn = document.querySelector(`[data-social-add="${type}"]`);
      if (addBtn) {
        const hasMoreHidden = inputs.slice(1).some((input) => {
          const wrapper = getWrapper(input);
          return wrapper ? wrapper.style.display === "none" : input.style.display === "none";
        });
        addBtn.style.display = hasMoreHidden ? "flex" : "none";
      }
    });
  }

  function collectLinksForStorage() {
    const out = {};
    TYPES.forEach((type) => {
      const inputs = getInputs(type);
      const values = inputs.map((el) => String(el.value || "").trim()).filter(Boolean).slice(0, MAX);
      if (!values.length) return;
      out[type] = values.length === 1 ? values[0] : values;
    });
    return out;
  }

  window.registerSocialLinksApi = {
    bindAddButtonsOnce,
    renderVisibilityFromValues,
    collectLinksForStorage,
  };
})();


