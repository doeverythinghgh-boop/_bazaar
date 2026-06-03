/**
 * @file js/shared/settings-notifications.js
 * @description Logic for the notification toggle in the settings modal.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


function settingsNotificationsText(key, fallback) {
  const value = typeof window.langu === "function" ? window.langu(key) : null;
  return (!value || value === key) ? fallback : value;
}

function buildSettingsNotificationMarkup() {
  return `
                <span id="settings_list_notifications_label">
                    <i id="settings_list_notifications_icon" class="fas fa-bell icon"></i> 
                    ${settingsNotificationsText("dash_notifications_tab", "الإشعارات")}
                </span>
                <div id="settings_list_notifications_toggle" class="toggle-switch">
                    <div id="settings_list_notifications_toggle_knob" class="toggle-knob"></div>
                </div>
            `;
}

window.getSettingsNotificationsMarkup = function () {
  const isGuest = SessionManager.isGuest();
  if (isGuest) {
    return `
      <div class="settings-list-item" style="opacity: 0.5; cursor: not-allowed; background: rgba(0,0,0,0.03);">
         <span>
            <i class="fas fa-bell-slash icon" style="background: var(--border-color-soft); color: var(--text-color-light);"></i> 
            ${settingsNotificationsText("dash_notifications_tab", "الإشعارات")}
         </span>
         <small style="opacity: 0.7;">(${settingsNotificationsText("guest_mode_label", "زائر")})</small>
      </div>
    `;
  }

  const isEnabled = window.resolveSettingsNotificationEnabled();
  return `
      <div id="settings_list_notifications" onclick="handleNotificationToggleFromSettings();"
           class="settings-list-item" data-notifications-enabled="${isEnabled ? "true" : "false"}">
           ${buildSettingsNotificationMarkup()}
      </div>
    `;
};

function resolveSettingsNotificationEnabled() {
  const rawStoredEnabled = LocalDBStorage.getItem("notifications_enabled");
  const hasToken = !!(LocalDBStorage.getItem("fcm_token") || LocalDBStorage.getItem("android_fcm_key"));
  const isAndroidRuntime = !!window.Android ||
    (window.BridgeManager && typeof window.BridgeManager.isAndroid === "function" && window.BridgeManager.isAndroid()) ||
    window.location.hostname === "appassets.androidplatform.net";
  const hasPermission = isAndroidRuntime || (typeof Notification !== "undefined" && Notification.permission === "granted");

  console.log(`[Notification UI State] resolve check -> local_storage='${rawStoredEnabled}', hasToken=${hasToken}, hasPermission=${hasPermission}`);

  if (rawStoredEnabled === "false") {
      console.log("[Notification UI State] Explicitly disabled by user (local_storage is false). Returning false.");
      return false;
  }

  if (rawStoredEnabled === "true") {
     if (hasPermission) {
         console.log("[Notification UI State] Returning true (granted permission & stored=true)");
         return true;
     }
     console.log("[Notification UI State] Returning false (stored=true BUT browser permission is missing/denied)");
     return false;
  }

  console.log("[Notification UI State] Value is null/unset. Defaulting to false.");
  return false;
}

function refreshSettingsNotificationState() {
  console.log("[Notification UI Refresher] Refresh cycle initiated.");
  const el = document.getElementById("settings_list_notifications");
  if (!el) {
     console.warn("[Notification UI Refresher] Target UI element (settings_list_notifications) was not found in DOM.");
     return;
  }

  const isEnabled = resolveSettingsNotificationEnabled();
  el.dataset.notificationsEnabled = isEnabled ? "true" : "false";
  console.log(`[Notification UI Refresher] DOM UI Dataset updated -> 'data-notifications-enabled' = '${isEnabled}' (${isEnabled ? "GREEN" : "GRAY"})`);
}

window.handleNotificationToggleFromSettings = async function () {
  console.log("\n\n[Notification Action] --- toggle click initiated ---");
  if (typeof NotificationPage !== "undefined" && NotificationPage.toggleNotificationsStatus) {
    const el = document.getElementById("settings_list_notifications");

    let isEnabled = false;
    if (el && el.dataset.notificationsEnabled) {
      isEnabled = el.dataset.notificationsEnabled === "true";
      console.log(`[Notification Action] Read current UI visual state from DOM -> ${isEnabled ? "Appears ON" : "Appears OFF"}`);
    } else {
      isEnabled = resolveSettingsNotificationEnabled();
      console.warn(`[Notification Action] Could not read DOM dataset... relied on resolver -> ${isEnabled}`);
    }

    const nextState = !isEnabled;
    console.log(`[Notification Action] Calculated next intended state: ${nextState ? "True (Will TURN ON)" : "False (Will TURN OFF)"}`);

    const actionLabel = nextState
      ? settingsNotificationsText("settings_notifications_enable", "تفعيل")
      : settingsNotificationsText("settings_notifications_disable", "إيقاف");
    const statusLabel = nextState
      ? settingsNotificationsText("settings_notifications_enabled_state", "مفعلة")
      : settingsNotificationsText("settings_notifications_disabled_state", "متوقفة");

    const result = await Swal.fire({
      title: settingsNotificationsText("settings_notifications_confirm_title", "{action} الإشعارات؟").replace("{action}", actionLabel),
      text: settingsNotificationsText("settings_notifications_confirm_text", "سيتم تغيير حالة تلقي الإشعارات إلى {status}.").replace("{status}", statusLabel),
      showCancelButton: true,
      confirmButtonText: settingsNotificationsText("language_change_confirm.confirm_btn", "موافق"),
      cancelButtonText: settingsNotificationsText("language_change_confirm.cancel_btn", "غير موافق"),
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

    if (!result.isConfirmed) {
      console.log("[Notification Action] User cancelled action via confirmation dialog.");
      return;
    }

    console.log("[Notification Action] Dialog confirmed. Enforcing visual color change to match next state instantly.");
    if (el) el.dataset.notificationsEnabled = nextState ? "true" : "false";

    console.log(`[Notification Action] Triggering NotificationPage.toggleNotificationsStatus(${nextState})...`);
    await NotificationPage.toggleNotificationsStatus(nextState, { skipConfirm: true });

    console.log("[Notification Action] Async API call finished. Triggering UI sync refresh.");
    refreshSettingsNotificationState();
    console.log("[Notification Action] Toggle process complete.");
  } else {
    console.error("NotificationPage logic is not loaded.");
    Swal.fire({
      icon: "error",
      title: settingsNotificationsText("error", "خطأ"),
      text: settingsNotificationsText("settings_notifications_not_ready", "نظام الإشعارات غير جاهز بعد. الرجاء الانتظار قليلاً.")
    });
  }
};
