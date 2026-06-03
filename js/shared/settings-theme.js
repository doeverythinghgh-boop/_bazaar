/**
 * @description Handles the theme toggle click from the settings modal.
 *   Triggers the global theme toggle logic and updates the UI in-place.
 * @function handleThemeToggleFromSettings
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

window.handleThemeToggleFromSettings = function () {
  if (typeof window.toggleAppTheme === 'function') {
    window.toggleAppTheme();

    const el = document.getElementById('settings_list_theme');
    if (el) {
      const isDark = document.body.classList.contains('dark-theme');
      const themeIcon = 'fa-moon';
      const themeText = window.langu("dash_theme_night") || 'الوضع الليلي';

      el.innerHTML = `
                <span id="settings_list_theme_label">
                    <i id="settings_list_theme_icon" class="fas ${themeIcon} icon" style="background: rgba(245, 158, 11, 0.1); color: var(--warning-color);"></i> 
                </span>
                <div id="settings_list_theme_toggle" class="toggle-switch" style="background: ${isDark ? 'var(--success-color)' : 'var(--secondary-color)'};">
                    <div id="settings_list_theme_toggle_knob" class="toggle-knob" style="${isDark ? 'inset-inline-start: auto; inset-inline-end: 2px;' : 'inset-inline-start: 2px; inset-inline-end: auto;'}"></div>
                </div>
            `;
    }
  }
};

/**
 * @description Builds the Theme section markup.
 */
window.getSettingsThemeMarkup = function () {
  const isDark = document.body.classList.contains('dark-theme');
  const themeIcon = 'fa-moon';
  return `
    <div id="settings_list_theme" onclick="handleThemeToggleFromSettings();"
         class="settings-list-item">
       <span id="settings_list_theme_label">
          <i id="settings_list_theme_icon" class="fas ${themeIcon} icon" style="background: rgba(245, 158, 11, 0.1); color: var(--warning-color);"></i> 
       </span>
       <div id="settings_list_theme_toggle" class="toggle-switch" style="background: ${isDark ? 'var(--success-color)' : 'var(--secondary-color)'};">
          <div id="settings_list_theme_toggle_knob" class="toggle-knob" style="${isDark ? 'inset-inline-start: auto; inset-inline-end: 2px;' : 'inset-inline-start: 2px; inset-inline-end: auto;'}"></div>
       </div>
    </div>
  `;
};

