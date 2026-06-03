/**
 * @file js/shared/settings-ui-core.js
 * @description Core UI logic and modal management for settings.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


/**
 * @description Initializes the settings button listener and modal logic.
 * @param {string} [buttonId="index-settings-btn"] - The ID of the settings button.
 */
window.dashboardSetupSettings = function (buttonId = "index-settings-btn") {
  const settingsBtn = document.getElementById(buttonId);
  if (!settingsBtn) return;

  settingsBtn.addEventListener("click", (e) => {
    if (e) e.preventDefault();
    console.log("️ [Settings] Opening settings modal via button ID:", buttonId);

    // 1. Inject Modern CSS if not exists
    if (!document.getElementById('custom-settings-style')) {
      const style = document.createElement('style');
      style.id = 'custom-settings-style';
      style.textContent = `
          .custom-settings-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.5); z-index: 2000;
            display: flex; align-items: center; justify-content: center;
            opacity: 0; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
          }
          .custom-settings-overlay.active { opacity: 1; }
          
          .custom-settings-modal {
            background: var(--bg-color-glass, rgba(255, 255, 255, 0.9));
            color: var(--text-color-dark);
            width: 340px; border-radius: 24px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.2);
            transform: translateY(20px) scale(0.95); transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            position: relative; overflow: hidden;
            max-width: 90%;
            border: 1px solid rgba(255, 255, 255, 0.3);
          }
          .custom-settings-overlay.active .custom-settings-modal { transform: translateY(0) scale(1); }

          .settings-header {
            padding: 20px 24px;
            background: rgba(var(--primary-rgb, 0, 123, 255), 0.05);
            border-bottom: 1px solid var(--border-color-soft);
            display: flex; align-items: center; justify-content: space-between;
          }
          .settings-title {
            font-size: 1.2rem; font-weight: 800; color: var(--dark-blue);
            margin: 0;
          }
          .settings-title-row {
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
          }
          .settings-account-badge {
            margin-top: 0;
            display: inline-flex;
            align-items: center;
            gap: 10px;
            padding: 8px 12px;
            border-radius: 12px;
            background: rgba(var(--primary-rgb, 0, 123, 255), 0.08);
            border: 1px solid var(--border-color-soft);
            max-width: 100%;
          }
          .settings-account-badge .acc-icon-wrap {
            width: 30px; height: 30px; border-radius: 10px;
            display: inline-flex; align-items: center; justify-content: center;
            background: rgba(var(--primary-rgb, 0, 123, 255), 0.12);
            color: var(--primary-color);
            flex: 0 0 auto;
          }
          .settings-account-badge .acc-name {
            font-size: 0.9rem;
            font-weight: 700;
            color: var(--dark-blue);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            max-width: 180px;
          }
          .custom-settings-close {
            width: 32px; height: 32px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            background: var(--bg-color-white); cursor: pointer;
            box-shadow: var(--shadow-soft); transition: all 0.2s;
            color: var(--text-color-medium);
          }
          .custom-settings-close:active { background: var(--border-color-soft); }

          .settings-body {
            padding: 12px;
            max-height: 70vh;
            overflow-y: auto;
          }

          .settings-list-item {
            display: flex; align-items: center; justify-content: space-between;
            padding: 14px 16px; margin-bottom: 8px;
            border-radius: 16px; background: var(--bg-color-white);
            border: 1px solid var(--border-color-soft);
            transition: all 0.2s; cursor: pointer;
          }
          .settings-list-item:active {
            transform: scale(0.98);
            background: var(--border-color-soft);
          }
          .settings-list-item span {
            display: flex; align-items: center; gap: 12px;
            font-weight: 600; font-size: 0.95rem;
          }
          .settings-list-item i.icon {
            width: 32px; height: 32px; border-radius: 10px;
            display: flex; align-items: center; justify-content: center;
            font-size: 1.1rem;
          }
          .settings-list-item .chevron {
            font-size: 0.8rem; opacity: 0.5;
            transition: transform 0.2s;
          }
          html[dir="rtl"] .settings-list-item .chevron { transform: rotate(0deg); }
          html[dir="ltr"] .settings-list-item .chevron { transform: rotate(180deg); }

          .toggle-switch {
            width: 40px; height: 22px; border-radius: 20px;
            position: relative; transition: background 0.3s ease;
          }
          .toggle-knob {
            width: 18px; height: 18px; background: white;
            border-radius: 50%; position: absolute; top: 2px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          }

          .settings-list-item[data-notifications-enabled="false"] #settings_list_notifications_icon {
            background: var(--border-color-soft, #e2e8f0);
            color: var(--text-color-light, #94a3b8);
          }
          .settings-list-item[data-notifications-enabled="true"] #settings_list_notifications_icon {
            background: rgba(var(--primary-rgb, 10, 100, 200), 0.1);
            color: var(--primary-color, #0a64c8);
          }
          .settings-list-item[data-notifications-enabled="false"] #settings_list_notifications_toggle {
            background: var(--secondary-color, #cbd5e1);
          }
          .settings-list-item[data-notifications-enabled="true"] #settings_list_notifications_toggle {
            background: var(--success-color, #10b981);
          }
          .settings-list-item[data-notifications-enabled="false"] #settings_list_notifications_toggle_knob {
            inset-inline-start: 2px;
            inset-inline-end: auto;
          }
          .settings-list-item[data-notifications-enabled="true"] #settings_list_notifications_toggle_knob {
            inset-inline-start: auto;
            inset-inline-end: 2px;
          }

          #settings_list_theme, #settings_list_language {
             flex: 1;
             margin: 0 !important;
             padding: 14px 10px !important;
             display: flex !important;
             flex-direction: row !important;
             align-items: center !important;
             justify-content: center !important;
             gap: 12px !important;
          }
          #settings_list_theme_label, #settings_list_language_label {
             display: flex !important;
             align-items: center !important;
             justify-content: center;
          }
          #settings_list_theme_icon, #settings_list_language_icon {
             margin: 0 !important;
          }
          #settings_list_theme_toggle, #settings_list_language_toggle {
             margin: 0 !important;
          }
          #settings_list_theme_toggle, #settings_list_language_toggle {
             margin: 0 !important;
          }
        `;
      document.head.appendChild(style);
    }

    // 2. Define Close Function Global
    window.closeSettingsModal = function () {
      const overlay = document.getElementById('custom-settings-modal-overlay');
      if (overlay) {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 400);
      }
    };

    // 3. Build HTML using modular components
    const headerHTML = (typeof getSettingsHeaderMarkup === 'function') ? getSettingsHeaderMarkup() : '';
    const profileHTML = (typeof getSettingsProfileMarkup === 'function') ? getSettingsProfileMarkup() : '';
    const fetchHTML = (typeof getSettingsFetchMarkup === 'function') ? getSettingsFetchMarkup() : '';
    const notificationsHTML = (typeof getSettingsNotificationsMarkup === 'function') ? getSettingsNotificationsMarkup() : '';
    const themeHTML = (typeof getSettingsThemeMarkup === 'function') ? getSettingsThemeMarkup() : '';
    const languageHTML = (typeof getSettingsLanguageMarkup === 'function') ? getSettingsLanguageMarkup() : '';
    const adminHTML = (typeof getSettingsAdminMarkup === 'function') ? getSettingsAdminMarkup() : '';
    const logoutHTML = (typeof getSettingsLogoutMarkup === 'function') ? getSettingsLogoutMarkup() : '';

    const contactHTML = `
      <div id="settings_list_contact" onclick="closeSettingsModal(); window.location.href = '/pages/contact/contact.html';"
           class="settings-list-item">
         <span>
            <i class="fas fa-headset icon" style="background: rgba(13, 110, 253, 0.12); color: var(--info-color);"></i>
            ${window.langu("contact_title") || "للتواصل"}
         </span>
         <i class="fas fa-chevron-left chevron" style="color: var(--info-color);"></i>
      </div>
    `;

    const modalHTML = `
        <div class="custom-settings-modal">
           ${headerHTML}
           <div class="settings-body">
             <div id="settings_list_options" style="display: flex; flex-direction: column;">
                ${profileHTML}
                ${fetchHTML}
                ${notificationsHTML}
                ${contactHTML}
                ${adminHTML}
                <div style="display: flex; gap: 12px; margin-top: 12px; margin-bottom: 8px;">
                    ${themeHTML}
                    ${languageHTML}
                </div>
                ${logoutHTML}
             </div>
           </div>
        </div>
      `;

    // 4. Create and Append Overlay
    const overlay = document.createElement('div');
    overlay.id = 'custom-settings-modal-overlay';
    overlay.className = 'custom-settings-overlay';
    overlay.innerHTML = modalHTML;

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) window.closeSettingsModal();
    });

    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
      overlay.classList.add('active');
    });

    if (typeof refreshSettingsNotificationState === 'function') refreshSettingsNotificationState();
  });
};
