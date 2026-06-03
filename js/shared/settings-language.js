/**
 * @description Handles the language toggle click from the settings modal.
 *   Triggers the global language toggle logic and updates the UI in-place.
 * @function handleLanguageToggleFromSettings
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

window.handleLanguageToggleFromSettings = async function () {
  if (typeof window.toggleAppLanguage !== "function") {
    return;
  }

  const isArabic = (LocalDBStorage.getItem("app_language") || "ar") !== "en";
  const actionLabel = window.langu
    ? window.langu("language_change_confirm.title")
    : (isArabic ? "Change to English?" : "Change to Arabic?");
  const statusLabel = window.langu
    ? window.langu("language_change_confirm.text")
    : "The app interface language will be changed.";
  const confirmLabel = window.langu
    ? window.langu("language_change_confirm.confirm_btn")
    : "Confirm";
  const cancelLabel = window.langu
    ? window.langu("language_change_confirm.cancel_btn")
    : "Cancel";

  const result = await Swal.fire({
    title: actionLabel,
    text: statusLabel,
    showCancelButton: true,
    confirmButtonText: confirmLabel,
    cancelButtonText: cancelLabel,
    reverseButtons: true,
    focusCancel: true,
    width: 320,
    padding: "1rem",
    customClass: {
      popup: "swal-modern-mini-popup",
      title: "swal-modern-mini-title",
      htmlContainer: "swal-modern-mini-text",
      actions: "swal-modern-mini-actions",
      confirmButton: "swal-modern-mini-confirm",
      cancelButton: "swal-modern-mini-cancel"
    },
    buttonsStyling: false
  });

  if (!result.isConfirmed) return;

  window.toggleAppLanguage();

  const el = document.getElementById("settings_list_language");
  if (el) {
    const isAr = (LocalDBStorage.getItem("app_language") || "ar") !== "en";
    const stateBg = isAr ? "var(--success-color)" : "var(--secondary-color)";
    const stateKnob = isAr
      ? "inset-inline-start: auto; inset-inline-end: 2px;"
      : "inset-inline-start: 2px; inset-inline-end: auto;";

    el.innerHTML = `
      <span id="settings_list_language_label">
        <i id="settings_list_language_icon" class="fas fa-language icon" style="background: rgba(52, 152, 219, 0.1); color: var(--info-color);"></i>
      </span>
      <div id="settings_list_language_toggle" class="toggle-switch" style="background: ${stateBg};">
        <div id="settings_list_language_toggle_knob" class="toggle-knob" style="${stateKnob}"></div>
      </div>
    `;
  }
};

window.getSettingsLanguageMarkup = function () {
  const isAr = (LocalDBStorage.getItem("app_language") || "ar") !== "en";
  const stateBg = isAr ? "var(--success-color)" : "var(--secondary-color)";
  const stateKnob = isAr
    ? "inset-inline-start: auto; inset-inline-end: 2px;"
    : "inset-inline-start: 2px; inset-inline-end: auto;";

  return `
    <div id="settings_list_language" onclick="handleLanguageToggleFromSettings();"
         class="settings-list-item">
       <span id="settings_list_language_label">
          <i id="settings_list_language_icon" class="fas fa-language icon" style="background: rgba(52, 152, 219, 0.1); color: var(--info-color);"></i>
       </span>
       <div id="settings_list_language_toggle" class="toggle-switch" style="background: ${stateBg};">
          <div id="settings_list_language_toggle_knob" class="toggle-knob" style="${stateKnob}"></div>
       </div>
    </div>
  `;
};
