/**
 * @file js/shared/user-phone-ui.js
 * @description Shared phone list state and rendering helpers for register/profile.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


(() => {
  function createEntry(entry = {}) {
    return {
      number: String(entry.number || "").trim(),
      is_primary: !!entry.is_primary,
      has_whatsapp: entry.has_whatsapp !== false,
    };
  }

  function ensureEntries(entries) {
    const source = Array.isArray(entries) ? entries.map(createEntry) : [];
    if (!source.length) return [createEntry({ is_primary: true, has_whatsapp: true })];

    let primaryFound = false;
    let anyPrimaryInSource = source.some(e => e.is_primary);

    return source.map((entry, index) => {
      const next = { ...entry };
      if (next.is_primary && !primaryFound) {
        primaryFound = true;
      } else if (next.is_primary && primaryFound) {
        next.is_primary = false;
      }

      if (index === 0 && !anyPrimaryInSource && !primaryFound) {
        next.is_primary = true;
        primaryFound = true;
      }

      if (next.is_primary) next.has_whatsapp = true;
      return next;
    });
  }

  function setPrimary(entries, index) {
    const list = Array.isArray(entries) ? entries : [];
    return list.map((entry, i) => ({
      ...entry,
      is_primary: i === index,
      has_whatsapp: i === index ? true : !!entry.has_whatsapp
    }));
  }

  function collect(entries) {
    const normalizedEntries = ensureEntries(entries).map((entry) => ({
      number: typeof AuthValidators?.normalizePhone === "function"
        ? AuthValidators.normalizePhone(entry.number || "")
        : String(entry.number || "").trim(),
      is_primary: !!entry.is_primary,
      has_whatsapp: !!entry.has_whatsapp,
    }));

    return typeof AuthValidators?.validatePhonesList === "function"
      ? AuthValidators.validatePhonesList(normalizedEntries)
      : { isValid: true, message: "", phones: normalizedEntries };
  }

  function render(container, entries, options = {}) {
    if (!container) return;

    const {
      rowClass = "user-phone-row",
      numberInputClass = "user-phone-number-input",
      primaryInputClass = "user-phone-primary-input",
      whatsappInputClass = "user-phone-whatsapp-input",
      removeBtnClass = "user-phone-remove-btn",
      inputClass = "profile-form-control",
      primaryLabel = typeof window.langu === "function" ? (window.langu("phone_label_primary") || "أساسي") : "أساسي",
      whatsappLabel = typeof window.langu === "function" ? (window.langu("phone_label_whatsapp") || "واتساب") : "واتساب",
      numberPlaceholder = "+201001234567",
      errorNode = null,
    } = options;

    const resolvedEntries = ensureEntries(entries);
    container.innerHTML = "";

    resolvedEntries.forEach((entry, index) => {
      const row = document.createElement("div");
      row.id = `reg-phone-row-${index}`;
      row.className = rowClass;
      // Removed inline styles to use CSS classes from register-ux.css
      row.innerHTML = `
        <div id="reg-phone-number-wrapper-${index}" class="reg-phone-number-wrapper">
          <input id="reg-phone-number-input-${index}" type="tel" class="${numberInputClass} ${inputClass}" data-phone-index="${index}" value="${entry.number || ""}" placeholder="${numberPlaceholder}" />
        </div>
        <div id="reg-phone-controls-${index}" class="reg-phone-controls">
          <label id="reg-phone-primary-label-${index}" class="reg-phone-toggle ${entry.is_primary ? 'active' : ''}" title="${primaryLabel}">
            <input id="reg-phone-primary-radio-${index}" type="radio" name="reg_phone_primary" class="${primaryInputClass}" data-phone-index="${index}" ${entry.is_primary ? "checked" : ""}>
            <i id="reg-phone-primary-icon-${index}" class="fas fa-star"></i>
            <span id="reg-phone-primary-text-${index}">${primaryLabel}</span>
          </label>
          <label id="reg-phone-whatsapp-label-${index}" class="reg-phone-toggle ${entry.has_whatsapp ? 'active' : ''}" title="${whatsappLabel}">
            <input id="reg-phone-whatsapp-chk-${index}" type="checkbox" class="${whatsappInputClass}" data-phone-index="${index}" ${entry.has_whatsapp ? "checked" : ""}>
            <i id="reg-phone-whatsapp-icon-${index}" class="fab fa-whatsapp"></i>
            <span id="reg-phone-whatsapp-text-${index}">${whatsappLabel}</span>
          </label>
          <button id="reg-phone-remove-btn-${index}" type="button" class="${removeBtnClass}" data-phone-index="${index}" ${resolvedEntries.length === 1 ? "disabled" : ""} aria-label="حذف">
            <i id="reg-phone-remove-icon-${index}" class="fas fa-trash-can"></i>
          </button>
        </div>
      `;
      container.appendChild(row);

      // Feedback for the primary phone
      if (entry.is_primary && errorNode) {
        // Ensure errorNode behaves well inside grid if needed
        errorNode.id = errorNode.id || "reg-phone-primary-error";
        row.appendChild(errorNode);
      }
    });
  }

  window.UserPhoneUi = {
    createEntry,
    ensureEntries,
    setPrimary,
    collect,
    render,
  };
})();
