/**
 * @file js/shared/settings-auth.js
 * @description Authentication and user-related UI logic for the settings modal.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


/**
 * @description Resolves the icon class based on the user's account type and roles.
 * @param {number} accountType
 * @returns {string} FontAwesome icon class
 */
window.resolveSettingsAccountIcon = function (accountType) {
  const currentUser = SessionManager.getUser();
  const capabilities = typeof window.resolveUserCapabilities === 'function'
    ? window.resolveUserCapabilities(currentUser)
    : null;
  const R = window.ACCOUNT_ROLES || {};
  const hasRole = (roleBit) => (typeof window.checkRole === 'function') && window.checkRole(accountType, roleBit);
  const normalizedAccountType = typeof window.normalizeAccountType === 'function'
    ? window.normalizeAccountType(accountType)
    : accountType;
  const comboIcon = window.ROLE_ICONS?.COMBINATIONS?.[normalizedAccountType];

  if (capabilities?.isSuperAdmin) return (window.ROLE_ICONS?.SUPER_ADMIN || 'fas fa-chess-king');
  if (capabilities?.isAdmin) return (window.ROLE_ICONS?.ADMIN || 'fas fa-user-gear');
  if (comboIcon) return comboIcon;
  if (hasRole(R.SELLER)) return (window.ROLE_ICONS?.SELLER || 'fas fa-store');
  if (hasRole(R.SERVICE_PROVIDER)) return (window.ROLE_ICONS?.SERVICE_PROVIDER || 'fas fa-user-tie');
  return (window.ROLE_ICONS?.BUYER || 'fas fa-shopping-cart');
};

/**
 * @description Builds the Profile item markup based on guest status.
 */
window.getSettingsProfileMarkup = function () {
  const isGuest = SessionManager.isGuest();
  if (isGuest) {
    return `
      <div class="settings-list-item" style="opacity: 0.5; cursor: not-allowed; background: rgba(0,0,0,0.03);">
         <span>
            <i class="fas fa-user-lock icon" style="background: var(--border-color-soft); color: var(--text-color-light);"></i>
            ${window.langu("dash_profile_tab")} <small style="margin-inline-start: 4px; opacity: 0.7;">(${window.langu("guest_mode_label") || "زائر"})</small>
         </span>
      </div>
    `;
  } else {
    const currentUser = SessionManager.getUser();
    const accountIconClass = window.resolveSettingsAccountIcon(parseInt(currentUser?.account_type || 1, 10));
    return `
      <div id="settings_action_profile" onclick="window.location.href = '/pages/profile-modal/profile-modal.html'; closeSettingsModal();"  
           class="settings-list-item">
         <span>
            <i class="${accountIconClass} icon" style="background: rgba(var(--primary-rgb), 0.15); color: var(--primary-color);"></i>
            ${window.langu("dash_profile_tab")}
         </span>
         <i class="fas fa-chevron-left chevron" style="color: var(--primary-color);"></i>
      </div>
    `;
  }
};

/**
 * @description Builds the Admin Panel item markup if the user is authorized.
 */
window.getSettingsAdminMarkup = function () {
  const user = SessionManager.getUser();
  if (!user) return '';
  const capabilities = typeof window.resolveUserCapabilities === 'function'
    ? window.resolveUserCapabilities(user)
    : null;
  const isImpersonating = LocalDBStorage.getItem("originalAdminSession");

  if (capabilities?.isAdmin || isImpersonating) {
    return `
      <div id="settings_list_admin" onclick="closeSettingsModal(); if(typeof handleAdminPanelClick === 'function') handleAdminPanelClick();"
           class="settings-list-item" style="margin-top: 12px; border-top: 2px dashed var(--border-color-soft); padding-top: 20px;">
        <span>
           <i class="${window.ROLE_ICONS?.ADMIN || 'fas fa-user-gear'} icon" style="background: rgba(3, 71, 143, 0.1); color: var(--dark-blue);"></i> 
           <span style="color: var(--dark-blue);">${window.langu("dash_admin_panel")}</span>
        </span>
        <i class="fas fa-chevron-left chevron" style="color: var(--dark-blue);"></i>
      </div>
    `;
  }
  return '';
};

/**
 * @description Builds the Logout item markup.
 */
window.getSettingsLogoutMarkup = function () {
  return `
    <div id="settings_list_logout" onclick="closeSettingsModal(); if(typeof logout === 'function') logout();"
         class="settings-list-item" style="margin-top: 4px;">
       <span>
          <i class="fas fa-power-off icon" style="background: rgba(220, 53, 69, 0.1); color: var(--danger-color);"></i> 
          <span style="color: var(--danger-color);">${window.langu("dash_logout")}</span>
       </span>
       <i class="fas fa-chevron-left chevron" style="color: var(--danger-color);"></i>
    </div>
  `;
};

/**
 * @description Builds the Header section markup (Title + User Badge).
 */
window.getSettingsHeaderMarkup = function () {
  const currentUser = SessionManager.getUser();
  const accountTypeForBadge = typeof window.normalizeAccountType === 'function'
    ? window.normalizeAccountType(currentUser?.account_type || 1)
    : (parseInt(currentUser?.account_type || 1, 10) || 1);
  const accountIconClass = window.resolveSettingsAccountIcon(accountTypeForBadge);
  const accountDisplayName = (currentUser && currentUser.username)
    ? currentUser.username
    : (window.langu("guest_mode_label") || "زائر");

  return `
    <div class="settings-header">
       <div class="settings-title-row">
         <h3 class="settings-title">${window.langu("dash_settings_title")}</h3>
         <div class="settings-account-badge">
           <span class="acc-icon-wrap"><i class="${accountIconClass}"></i></span>
           <span class="acc-name">${accountDisplayName}</span>
         </div>
       </div>
       <div class="custom-settings-close" onclick="closeSettingsModal()">
         <i class="fas fa-times"></i>
       </div>
    </div>
  `;
};
