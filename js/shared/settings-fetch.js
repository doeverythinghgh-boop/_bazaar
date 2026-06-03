/**
 * @description Handles changes to the "Fetch Orders" setting in the modal.
 * @param {string} newValue - 'buyer', 'commercial', or 'delivery'
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

window.handleFetchSettingsChange = function (newValue) {
  let alertKey = "";
  if (newValue === "commercial") alertKey = "dash_alert_seller_switch";
  else if (newValue === "delivery") alertKey = "dash_alert_delivery_switch";
  else alertKey = "dash_alert_buyer_switch";

  const getTrans = (key, sub, fallback) => {
    try {
      if (window.appTranslations && window.appTranslations[key]) {
        const lang = LocalDBStorage.getItem("app_language") || "ar";
        return window.appTranslations[key][sub][lang];
      }
      return fallback;
    } catch (e) { return fallback; }
  };

  const title = getTrans(
    alertKey,
    "title",
    newValue === "commercial"
      ? (window.langu("settings_fetch_mode_provider") || "وضع مقدم الخدمة")
      : (window.langu("settings_fetch_mode_change") || "تغيير الوضع")
  );
  const text = getTrans(alertKey, "text", window.langu("settings_fetch_mode_changed") || "تم تغيير وضع جلب الطلبات.");

  Swal.fire({
    title,
    text,
    icon: "info",
    confirmButtonText: window.langu("alert_confirm_btn") || "حسنًا",
    customClass: {
      popup: "swal-modern-mini-popup",
      title: "swal-modern-mini-title",
      htmlContainer: "swal-modern-mini-text",
      confirmButton: "swal-modern-mini-confirm"
    }
  }).then(() => {
    LocalDBStorage.setItem("sales_movement_user_type", newValue);
    console.log(`[Settings] Sales Movement User Type set to: ${newValue}`);
  });
};

window.getSettingsFetchMarkup = function () {
  const user = SessionManager.getUser();
  const isGuest = SessionManager.isGuest();

  if (isGuest) {
    return `
      <div class="settings-list-item" style="opacity: 0.5; cursor: not-allowed; background: rgba(0,0,0,0.03);">
         <span>
            <i class="fas fa-boxes icon" style="background: var(--border-color-soft); color: var(--text-color-light);"></i> 
            ${window.langu("dash_fetch_orders_title")}
         </span>
         <small style="opacity: 0.7;">(${window.langu("guest_mode_label") || "زائر"})</small>
      </div>
    `;
  }

  const capabilities = typeof window.resolveUserCapabilities === "function"
    ? window.resolveUserCapabilities(user)
    : null;
  const getFetchLabel = function (type) {
    if (type === "commercial") {
      return window.langu("role_service_provider") || 'merchant';
    }
    const translated = window.langu(`dash_opt_${type}`);
    return translated && translated !== `dash_opt_${type}` ? translated : type;
  };
  const isAdmin = !!capabilities?.isAdmin;
  const isImpersonating = LocalDBStorage.getItem("originalAdminSession");
  const availableTypes = ["buyer"];

  if (capabilities?.isCommercial) {
    availableTypes.push("commercial");
  }

  if (capabilities?.canDeliver) {
    availableTypes.push("delivery");
  }

  const storedType = (LocalDBStorage.getItem("sales_movement_user_type") || "").replace('merchant', "commercial");
  const savedType = availableTypes.includes(storedType)
    ? storedType
    : "buyer";

  if (isAdmin || isImpersonating) {
    return "";
  }

  return `
      <div class="settings-list-item" style="cursor: default;">
         <span>
            <i class="fas fa-truck-loading icon" style="background: rgba(40, 167, 69, 0.1); color: var(--success-color);"></i> 
            ${window.langu("dash_fetch_orders_title")}
         </span>
         <select id="settings_fetch_type_select" onchange="handleFetchSettingsChange(this.value)"
                 style="padding: 4px 8px; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-color-white); color: var(--text-color-dark); font-size: 0.85rem; font-weight: 600; outline: none;">
             ${availableTypes.map((type) => `
                 <option value="${type}" ${savedType === type ? "selected" : ""}>
                     ${getFetchLabel(type)}
                 </option>
             `).join("")}
         </select>
      </div>
    `;
};
