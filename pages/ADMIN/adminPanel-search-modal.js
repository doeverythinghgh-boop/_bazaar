/**
 * @file pages/ADMIN/adminPanel-search-modal.js
 * @description Filter modal building and synchronization for admin search.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


function buildAdminRoleFilterModal(tempState) {
    return `
        <div class="admin-role-filter-modal" id="admin-filter-modal-container">
            <div class="admin-role-filter-hint" id="admin-filter-modal-hint">${adminSearchText("admin_filter_hint", "يمكنك اختيار نوع الحساب، أو عرض الأدمن فقط، أو استخدام فلاتر زمنية للحسابات الجديدة وآخر تسجيل دخول.")}</div>

            <div class="admin-filter-quick-actions" id="admin-filter-quick-actions-bar">
                <button type="button" class="admin-filter-quick-btn ${tempState.adminOnly ? "is-active" : ""}" id="admin-filter-admins-btn">
                    <i class="fas fa-user-shield" id="icon-filter-admins"></i>
                    <span id="label-filter-admins">${adminSearchText("admin_filter_admins_only", "أدمن / سوبر أدمن فقط")}</span>
                </button>
                <button type="button" class="admin-filter-quick-btn" id="admin-filter-reset-btn">
                    <i class="fas fa-layer-group" id="icon-filter-reset"></i>
                    <span id="label-filter-reset">${adminSearchText("admin_filter_show_all", "عرض الكل")}</span>
                </button>
            </div>

            <div class="admin-role-filter-section" id="admin-filter-section-roles">
                <div class="admin-role-filter-section-title" id="admin-filter-roles-title">${adminSearchText("admin_filter_account_types", "أنواع الحساب")}</div>
                <div class="admin-role-filter-chips" id="admin-filter-roles-chips">
                    ${ADMIN_ROLE_FILTER_OPTIONS.map((option) => `
                        <button
                            type="button"
                            id="admin-role-chip-${option.value}"
                            class="admin-role-chip ${(tempState.roleBits & option.value) === option.value ? "is-active" : ""} ${option.locked ? "is-locked" : ""}"
                            data-role-bit="${option.value}"
                            ${option.locked ? "disabled" : ""}
                        >
                            <span class="admin-role-chip-check" id="admin-role-check-container-${option.value}">
                                <i class="fas ${(tempState.roleBits & option.value) === option.value ? "fa-check-circle" : "fa-circle"}" id="admin-role-icon-${option.value}"></i>
                            </span>
                            <span class="admin-role-chip-label" id="admin-role-label-${option.value}">${adminSearchText(option.labelKey, option.fallback)}</span>
                        </button>
                    `).join("")}
                </div>
            </div>

            <div class="admin-role-filter-section" id="admin-filter-section-time">
                <div class="admin-role-filter-section-title" id="admin-filter-time-title">${adminSearchText("admin_filter_time_filters", "فلاتر زمنية")}</div>
                <label class="admin-filter-field" id="admin-filter-field-created">
                    <span class="admin-filter-field-label" id="admin-filter-label-created">${adminSearchText("admin_filter_latest_accounts_during", "أحدث الحسابات خلال")}</span>
                    <div class="admin-filter-input-wrap" id="admin-filter-wrap-created">
                        <input type="number" min="1" step="1" id="admin-filter-created-days" class="admin-filter-number-input" value="${tempState.recentCreatedDays}">
                        <span class="admin-filter-input-suffix" id="admin-filter-suffix-created">${adminSearchText("admin_filter_days_suffix", "يوم")}</span>
                    </div>
                </label>
                <label class="admin-filter-field" id="admin-filter-field-login">
                    <span class="admin-filter-field-label" id="admin-filter-label-login">${adminSearchText("admin_filter_last_login_during", "آخر تسجيل دخول خلال")}</span>
                    <div class="admin-filter-input-wrap" id="admin-filter-wrap-login">
                        <input type="number" min="1" step="1" id="admin-filter-login-days" class="admin-filter-number-input" value="${tempState.recentLoginDays}">
                        <span class="admin-filter-input-suffix" id="admin-filter-suffix-login">${adminSearchText("admin_filter_days_suffix", "يوم")}</span>
                    </div>
                </label>
            </div>

            <div class="admin-role-filter-preview" id="admin-filter-preview-box">
                <span class="admin-role-filter-preview-label" id="admin-filter-preview-label">${adminSearchText("admin_filter_current_state", "الحالة الحالية")}</span>
                <span id="admin-role-filter-preview-value" class="admin-role-filter-preview-value">${getAdminFilterSummaryFromState(tempState)}</span>
            </div>
        </div>
    `;
}

function syncAdminRoleFilterModalState(container, tempState) {
    if (!container) return;

    container.querySelectorAll(".admin-role-chip").forEach((chip) => {
        const bit = parseInt(chip.getAttribute("data-role-bit"), 10);
        const active = (tempState.roleBits & bit) === bit;
        chip.classList.toggle("is-active", active);

        const icon = chip.querySelector(".admin-role-chip-check i");
        if (icon) {
            icon.className = `fas ${active ? "fa-check-circle" : "fa-circle"}`;
        }
    });

    const adminsBtn = container.querySelector("#admin-filter-admins-btn");
    if (adminsBtn) {
        adminsBtn.classList.toggle("is-active", !!tempState.adminOnly);
    }

    const createdInput = container.querySelector("#admin-filter-created-days");
    if (createdInput && createdInput.value !== String(tempState.recentCreatedDays || "")) {
        createdInput.value = tempState.recentCreatedDays || "";
    }

    const loginInput = container.querySelector("#admin-filter-login-days");
    if (loginInput && loginInput.value !== String(tempState.recentLoginDays || "")) {
        loginInput.value = tempState.recentLoginDays || "";
    }

    const preview = container.querySelector("#admin-role-filter-preview-value");
    if (preview) {
        preview.innerText = getAdminFilterSummaryFromState(tempState);
    }
}

function openAdminRoleFilterModal() {
    let tempState = {
        roleBits: adminFilterState.roleBits,
        adminOnly: adminFilterState.adminOnly,
        recentCreatedDays: adminFilterState.recentCreatedDays,
        recentLoginDays: adminFilterState.recentLoginDays,
        showAll: false
    };

    Swal.fire({
        title: adminSearchText("admin_filter_users_title", "تصفية المستخدمين"),
        html: buildAdminRoleFilterModal(tempState),
        confirmButtonText: adminSearchText("admin_filter_apply", "تطبيق"),
        showCancelButton: true,
        cancelButtonText: adminSearchText("alert_cancel_btn", "إلغاء"),
        customClass: {
            popup: "swal-modern-mini-popup swal-roles-popup",
            title: "swal-modern-mini-title",
            htmlContainer: "swal-modern-mini-text",
            confirmButton: "swal-modern-mini-confirm",
            cancelButton: "swal-modern-mini-cancel"
        },
        preConfirm: () => {
            const popup = Swal.getPopup();
            if (!popup) return tempState;

            const createdInput = popup.querySelector("#admin-filter-created-days");
            const loginInput = popup.querySelector("#admin-filter-login-days");

            return {
                roleBits: tempState.roleBits || 1,
                adminOnly: !!tempState.adminOnly,
                recentCreatedDays: createdInput ? createdInput.value.trim() : "",
                recentLoginDays: loginInput ? loginInput.value.trim() : "",
                showAll: !!tempState.showAll
            };
        },
        didOpen: () => {
            const popup = Swal.getPopup();
            const container = popup ? popup.querySelector(".admin-role-filter-modal") : null;
            if (!container) return;

            container.querySelectorAll(".admin-role-chip:not(.is-locked)").forEach((chip) => {
                chip.addEventListener("click", () => {
                    const bit = parseInt(chip.getAttribute("data-role-bit"), 10);
                    if (!bit) return;

                    if ((tempState.roleBits & bit) === bit) {
                        tempState.roleBits &= ~bit;
                    } else {
                        tempState.roleBits |= bit;
                    }

                    tempState.roleBits |= 1;
                    tempState.adminOnly = false;
                    tempState.showAll = false;
                    syncAdminRoleFilterModalState(container, tempState);
                });
            });

            const adminsBtn = container.querySelector("#admin-filter-admins-btn");
            if (adminsBtn) {
                adminsBtn.addEventListener("click", () => {
                    tempState.adminOnly = !tempState.adminOnly;
                    tempState.showAll = false;
                    syncAdminRoleFilterModalState(container, tempState);
                });
            }

            const resetBtn = container.querySelector("#admin-filter-reset-btn");
            if (resetBtn) {
                resetBtn.addEventListener("click", () => {
                    tempState = {
                        roleBits: ADMIN_ROLE_FILTER_ALL_BITS,
                        adminOnly: false,
                        recentCreatedDays: "",
                        recentLoginDays: "",
                        showAll: true
                    };

                    syncAdminRoleFilterModalState(container, tempState);
                });
            }

            const createdInput = container.querySelector("#admin-filter-created-days");
            if (createdInput) {
                createdInput.addEventListener("input", () => {
                    tempState.recentCreatedDays = createdInput.value.trim();
                    tempState.showAll = false;
                    syncAdminRoleFilterModalState(container, tempState);
                });
            }

            const loginInput = container.querySelector("#admin-filter-login-days");
            if (loginInput) {
                loginInput.addEventListener("input", () => {
                    tempState.recentLoginDays = loginInput.value.trim();
                    tempState.showAll = false;
                    syncAdminRoleFilterModalState(container, tempState);
                });
            }
        }
    }).then((result) => {
        if (!result.isConfirmed || !result.value) return;

        adminFilterState = {
            roleBits: result.value.roleBits || 1,
            adminOnly: !!result.value.adminOnly,
            recentCreatedDays: result.value.recentCreatedDays,
            recentLoginDays: result.value.recentLoginDays
        };

        const searchInput = document.getElementById("user-search-input");
        if (result.value.showAll && searchInput) {
            searchInput.value = "";
        }

        updateAdminRoleFilterButton();
        handleAdminSearch();
    });
}
