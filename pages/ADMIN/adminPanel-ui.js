/**
 * @file pages/ADMIN/adminPanel-ui.js
 * @description UI functions for the admin panel, including card rendering and selection management.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


function renderUsersCards(users) {
    const grid = document.getElementById("admin-users-grid");
    const displayedCount = document.getElementById("displayed-users-count");

    if (!grid) return;
    grid.innerHTML = "";

    if (displayedCount) displayedCount.innerText = users.length;

    if (!users || users.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #888;">${adminUiText("admin_ui_no_users_match", "لا يوجد مستخدمون يطابقون بحثك.")}</div>`;
        return;
    }

    const sortedUsers = Array.isArray(users)
        ? users.slice().sort((a, b) => {
            const aIssueScore = a?.phoneHealth?.isHealthy === false ? 1 : 0;
            const bIssueScore = b?.phoneHealth?.isHealthy === false ? 1 : 0;
            if (aIssueScore !== bIssueScore) return bIssueScore - aIssueScore;
            const sortLocale = document?.documentElement?.lang || window?.currentLang || undefined;
            const leftUsername = String(a?.username ?? String());
            const rightUsername = String(b?.username ?? String());
            return leftUsername.localeCompare(rightUsername, sortLocale);
        })
        : [];

    const fragment = document.createDocumentFragment();
    sortedUsers.forEach((user) => {
        const card = document.createElement("div");
        card.className = "user-card is-collapsed";
        card.id = `user-card-${user.user_key}`;
        card.setAttribute("aria-expanded", "false");
        card.innerHTML = generateCardHTML(user);
        bindUserCardInteractions(card, user);
        fragment.appendChild(card);
    });
    grid.appendChild(fragment);
}

function bindUserCardInteractions(card, user) {
    if (!card || !user) return;

    const header = card.querySelector(".card-header");
    if (!header) return;

    header.addEventListener("click", (e) => {
        if (
            e.target.tagName === "BUTTON" ||
            e.target.closest("button") ||
            e.target.tagName === "INPUT" ||
            e.target.closest(".copy-able")
        ) return;

        toggleUserCard(card, user.user_key, user.username);
    });
}

function isSuperAdminUser(user) {
    const capabilities = typeof window.resolveUserCapabilities === "function"
        ? window.resolveUserCapabilities(user)
        : null;
    return !!capabilities?.isSuperAdmin;
}

function isAdminUser(user) {
    const capabilities = typeof window.resolveUserCapabilities === "function"
        ? window.resolveUserCapabilities(user)
        : null;
    return !!capabilities?.isAdmin;
}

function formatAdminDate(dateString) {
    if (!dateString) return adminUiText("admin_ui_not_available", "غير متوفر");

    try {
        let normalized = String(dateString).trim();
        if (!normalized) return adminUiText("admin_ui_not_available", "غير متوفر");

        if (!normalized.includes("T") && normalized.includes(" ")) {
            normalized = normalized.replace(" ", "T");
        }
        if (!normalized.includes("Z") && !normalized.includes("+")) {
            normalized += "Z";
        }

        const date = new Date(normalized);
        if (Number.isNaN(date.getTime())) {
            return adminUiText("admin_ui_not_available", "غير متوفر");
        }

        return date.toLocaleString("ar-EG", {
            timeZone: "Africa/Cairo",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true
        });
    } catch (error) {
        console.error("[AdminPanel] Failed to format date:", error);
        return adminUiText("admin_ui_not_available", "غير متوفر");
    }
}

function generateCardHTML(user) {
    const userKey = user.user_key;
    const tokenStatusIcon = user.hasFCMToken
        ? `<i class="fas fa-check-circle" id="user-token-icon-yes-${userKey}" style="color: var(--success-color);" title="${adminUiText("admin_ui_has_token", "لديه توكن")}"></i>`
        : `<i class="fas fa-times-circle" id="user-token-icon-no-${userKey}" style="color: var(--danger-color);" title="${adminUiText("admin_ui_no_token", "لا يوجد توكن")}"></i>`;

    const createdAtText = formatAdminDate(user.created_at);
    const lastLoginText = formatAdminDate(user.last_login_at);
    const capabilities = typeof window.resolveUserCapabilities === "function"
        ? window.resolveUserCapabilities(user)
        : null;
    const roles = [];

    if (capabilities?.isBuyer) roles.push(`<span class="role-badge buyer" id="user-role-buyer-${userKey}" style="background:#e2e8f0; color:#475569; padding:2px 6px; border-radius:4px; font-size:10px;">${adminUiText("admin_filter_role_buyer", "مشتري")}</span>`);
    if (capabilities?.isCommercial || user.isCommercial || capabilities?.isServiceProvider) roles.push(`<span class="role-badge service" id="user-role-provider-${userKey}" style="background:#dcfce7; color:#166534; padding:2px 6px; border-radius:4px; font-size:10px;">${adminUiText("admin_filter_role_provider", 'merchant')}</span>`);
    if (capabilities?.canDeliver || user.isDelivery) roles.push(`<span class="role-badge delivery" id="user-role-distributor-${userKey}" style="background:#dbeafe; color:#1e40af; padding:2px 6px; border-radius:4px; font-size:10px;">${adminUiText("admin_ui_role_distributor", "موزع")}</span>`);

    if (isSuperAdminUser(user)) {
        roles.push(`<span class="role-badge super-admin" id="user-role-superadmin-${userKey}" style="background:#ede9fe; color:#5b21b6; padding:2px 6px; border-radius:4px; font-size:10px;">${adminUiText("admin_ui_role_super_admin", "سوبر أدمن")}</span>`);
    } else if (isAdminUser(user)) {
        roles.push(`<span class="role-badge admin" id="user-role-admin-${userKey}" style="background:#fee2e2; color:#991b1b; padding:2px 6px; border-radius:4px; font-size:10px;">${adminUiText("admin_ui_role_admin", "أدمن")}</span>`);
    }

    const rolesHtml = `<div class="user-roles-list" id="user-roles-container-${userKey}">${roles.join("")}</div>`;
    const username = user.username || adminUiText("admin_relations_default_username", "بدون اسم");
    const phoneList = Array.isArray(user.phones) ? user.phones : [];
    const phoneHealth = user.phoneHealth || { isHealthy: true, issues: [], primaryPhone: user.phone || "", phonesCount: phoneList.length };
    const primaryPhone = user.primary_phone || phoneHealth.primaryPhone || user.phone || "—";
    const phonePrimarySuffix = adminUiText("admin_ui_phone_primary_suffix", "Primary");
    const phoneWhatsappSuffix = adminUiText("admin_ui_phone_whatsapp_suffix", "WA");
    const phoneDisplay = phoneList.length
        ? phoneList.map((item) => `${item.number}${item.is_primary ? ` (${phonePrimarySuffix})` : ""}${item.has_whatsapp ? ` (${phoneWhatsappSuffix})` : ""}`).join(" | ")
        : (user.phone || "—");
    const phoneHealthBadge = phoneHealth.isHealthy
        ? `<span class="admin-phone-health-badge is-healthy" id="user-phone-health-ok-${userKey}">${adminUiText("admin_ui_phone_health_ok", "Healthy")}</span>`
        : `<span class="admin-phone-health-badge has-issues" id="user-phone-health-review-${userKey}">${adminUiText("admin_ui_phone_health_review", "Review")}: ${phoneHealth.issues.join(", ")}</span>`;

    return `
        <div class="card-header" id="user-card-header-${userKey}">
            <div class="user-info-main user-info-main-compact" id="user-info-main-${userKey}">
                <h3 class="copy-able" id="user-name-title-${userKey}" onclick="copyToClipboard('${user.username}')" style="margin:0;">${username}</h3>
            </div>
            <div class="card-header-side" id="user-header-side-${userKey}">
                <span class="card-toggle-indicator" id="user-toggle-indicator-${userKey}" aria-hidden="true">
                    <i class="fas fa-chevron-down" id="user-toggle-icon-${userKey}"></i>
                </span>
            </div>
        </div>

        <div class="card-meta-strip" id="user-meta-strip-${userKey}">
            <button class="btn-refresh-user" id="btn-user-refresh-${userKey}" onclick="event.stopPropagation(); refreshSingleUser('${userKey}')" title="${adminUiText("admin_ui_refresh_user", "تحديث البيانات")}">
                <i class="fas fa-sync-alt" id="icon-user-refresh-${userKey}"></i>
            </button>
            ${rolesHtml}
            <span class="user-key-badge copy-able" id="user-key-badge-${userKey}" onclick="copyToClipboard('${userKey}')">${userKey}</span>
            <span class="token-status-inline" id="user-token-container-${userKey}">${tokenStatusIcon}</span>
        </div>

        <div class="card-body-details" id="user-body-details-${userKey}">
            <div class="detail-item" id="detail-phone-${userKey}">
                <span class="detail-label" id="label-phone-${userKey}">${adminUiText("admin_ui_phone", "الهاتف")}</span>
                <div class="detail-value-group" id="value-group-phone-${userKey}">
                    <span class="detail-value copy-able" id="value-phone-primary-${userKey}" onclick="copyToClipboard('${primaryPhone}')">${primaryPhone}</span>
                    ${phoneHealthBadge}
                </div>
            </div>
            <div class="detail-item" id="detail-all-phones-${userKey}">
                <span class="detail-label" id="label-all-phones-${userKey}">${adminUiText("admin_ui_all_phones", "All Phones")}</span>
                <span class="detail-value copy-able" id="value-all-phones-${userKey}" onclick="copyToClipboard('${phoneDisplay}')">${phoneDisplay}</span>
            </div>
            <div class="detail-item" id="detail-password-${userKey}">
                <span class="detail-label" id="label-password-${userKey}">${adminUiText("admin_ui_password", "كلمة المرور")}</span>
                <span class="detail-value copy-able" id="value-password-${userKey}" onclick="copyToClipboard('${user.Password}')">${user.Password || "—"}</span>
            </div>
            <div class="detail-item" id="detail-address-${userKey}">
                <span class="detail-label" id="label-address-${userKey}">${adminUiText("admin_ui_address", "العنوان")}</span>
                <span class="detail-value copy-able" id="value-address-${userKey}" onclick="copyToClipboard('${user.Address}')">${user.Address || "—"}</span>
            </div>
            <div class="detail-item" id="detail-platform-${userKey}">
                <span class="detail-label" id="label-platform-${userKey}">${adminUiText("admin_ui_platform", "المنصة")}</span>
                <span class="detail-value" id="value-platform-${userKey}">${user.tokenPlatform || adminUiText("admin_ui_none", "لا يوجد")}</span>
            </div>
            <div class="detail-item" id="detail-created-${userKey}">
                <span class="detail-label" id="label-created-${userKey}">${adminUiText("admin_ui_created_at", "تاريخ إنشاء الحساب")}</span>
                <span class="detail-value" id="value-created-${userKey}">${createdAtText}</span>
            </div>
            <div class="detail-item" id="detail-last-visit-${userKey}">
                <span class="detail-label" id="label-last-visit-${userKey}">${adminUiText("admin_ui_last_visit", "آخر زيارة")}</span>
                <span class="detail-value" id="value-last-visit-${userKey}">${lastLoginText}</span>
            </div>
        </div>

        <div class="card-actions-row" id="user-actions-row-${userKey}">
            <div class="card-action-group" id="action-group-roles-${userKey}">
                <span class="group-title" id="title-roles-manage-${userKey}">${adminUiText("admin_ui_roles_relations", "الأدوار والعلاقات")}</span>
                <button class="btn-delivery-status btn-role-manage" id="btn-role-manage-${userKey}" style="width: 100%" onclick="showRelationsModal('${userKey}', '${user.username}')">
                    ${adminUiText("admin_ui_manage_account", "إدارة الحساب")}
                </button>
            </div>

            <div class="card-action-group" id="action-group-delivery-${userKey}">
                <span class="group-title" id="title-delivery-settings-${userKey}">${adminUiText("admin_ui_delivery_settings", "إعدادات التسليم")}</span>
                <div style="display: flex; flex-direction: column; gap: 8px;" id="delivery-settings-flex-${userKey}">
                    <div class="flex-actions" id="limit-actions-flex-${userKey}">
                        <input type="number" id="limit-input-${userKey}" value="${user.limitPackage}" class="input-small" placeholder="${adminUiText("admin_ui_package_limit", "حد الباقة")}">
                        <button class="btn-delivery-status" id="btn-limit-save-${userKey}" style="background-color: var(--success-color);" onclick="updateUserField('${userKey}', 'limitPackage')">
                            <i class="fas fa-save" id="icon-limit-save-${userKey}"></i>
                        </button>
                    </div>
                    <div class="status-radio-group" id="delivery-status-radios-${userKey}">
                        <label class="radio-option" id="label-delivered-yes-${userKey}">
                            <input type="radio" id="radio-delivered-yes-${userKey}" name="isDelivered-${userKey}" value="1" ${user.isDelivered == 1 ? "checked" : ""} onchange="updateUserField('${userKey}', 'isDelivered', this.value)"> ${adminUiText("alert_confirm_yes", "نعم")}
                        </label>
                        <label class="radio-option" id="label-delivered-no-${userKey}">
                            <input type="radio" id="radio-delivered-no-${userKey}" name="isDelivered-${userKey}" value="0" ${user.isDelivered == 0 ? "checked" : ""} onchange="updateUserField('${userKey}', 'isDelivered', this.value)"> ${adminUiText("alert_confirm_no", "لا")}
                        </label>
                    </div>
                </div>
            </div>

            <div class="card-action-group" id="action-group-notify-${userKey}">
                <span class="group-title" id="title-smart-messages-${userKey}">${adminUiText("admin_ui_smart_messages", "رسائل ذكية")}</span>
                <div class="flex-actions" id="notify-actions-flex-${userKey}">
                    <input type="text" id="notify-input-${userKey}" placeholder="${adminUiText("admin_ui_notification_text", "نص الإشعار...")}" class="input-small">
                    <button id="notify-btn-${userKey}" class="btn-delivery-status" style="background-color: #ffc107; color: #000;" onclick="sendAdminNotification('${userKey}')">
                        <i class="fas fa-paper-plane" id="icon-notify-send-${userKey}"></i>
                    </button>
                </div>
            </div>

            <button class="btn-delivery-status" id="btn-login-as-${userKey}" style="background-color: #17a2b8; width: 100%; font-weight: bold;" onclick="loginAsUser('${userKey}')">
                <i class="fas fa-sign-in-alt" id="icon-login-as-${userKey}"></i> ${adminUiText("admin_ui_login_as_user", "دخول بالحساب")}
            </button>
        </div>
    `;
}

function selectUserCard(userKey, username) {
    const allCards = document.querySelectorAll(".user-card");
    allCards.forEach((c) => c.classList.remove("selected-card"));

    const activeCard = document.getElementById(`user-card-${userKey}`);
    if (activeCard) {
        activeCard.classList.add("selected-card");
    }

    const selectedUserDisplay = document.getElementById("selected-user-display");
    if (selectedUserDisplay) {
        selectedUserDisplay.innerText = `(${username})`;
    }
}

function toggleUserCard(card, userKey, username) {
    if (!card) return;

    const isCollapsed = card.classList.toggle("is-collapsed");
    card.classList.toggle("is-expanded", !isCollapsed);
    card.setAttribute("aria-expanded", String(!isCollapsed));

    if (!isCollapsed) {
        selectUserCard(userKey, username);
    }
}

window.copyToClipboard = (text) => {
    if (!text || [
        adminUiText("admin_ui_not_available", "غير متوفر"),
        adminUiText("admin_ui_none", "لا يوجد"),
        "-",
        "N/A",
        "—"
    ].includes(text)) return;

    navigator.clipboard.writeText(text).then(() => {
        const Toast = Swal.mixin({
            toast: true,
            position: "top-end",
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true
        });
        Toast.fire({ icon: "success", title: `${adminUiText("admin_ui_copied", "تم النسخ:")} ${text}` });
    }).catch((err) => console.error("Copy failed", err));
};
