/**
 * @file pages/ADMIN/adminPanel-search-helpers.js
 * @description Search helper utilities for admin panel user filters.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


function isSuperAdminFilterUser(user) {
    const capabilities = typeof window.resolveUserCapabilities === "function"
        ? window.resolveUserCapabilities(user)
        : null;
    return !!capabilities?.isSuperAdmin;
}

function isAdminFilterUser(user) {
    const capabilities = typeof window.resolveUserCapabilities === "function"
        ? window.resolveUserCapabilities(user)
        : null;
    return !!capabilities?.isAdmin;
}

function parseAdminFilterDate(dateString) {
    if (!dateString) return null;

    let normalized = String(dateString).trim();
    if (!normalized) return null;

    if (!normalized.includes("T") && normalized.includes(" ")) {
        normalized = normalized.replace(" ", "T");
    }
    if (!normalized.includes("Z") && !normalized.includes("+")) {
        normalized += "Z";
    }

    const date = new Date(normalized);
    return Number.isNaN(date.getTime()) ? null : date;
}

function getSearchComparableAccountType(user) {
    let comparableRoleBits = typeof window.getComparableRoleBits === "function"
        ? window.getComparableRoleBits(user)
        : ((parseInt(user?.account_type, 10) || 0) & (1 | 32));

    const capabilities = typeof window.resolveUserCapabilities === "function"
        ? window.resolveUserCapabilities(user)
        : null;
    if (capabilities?.canDeliver) {
        comparableRoleBits |= ADMIN_ROLE_FILTER_DELIVERY;
    }

    return comparableRoleBits;
}

function getAdminRoleFilterSummaryFromBits(bits) {
    const labels = ADMIN_ROLE_FILTER_OPTIONS
        .filter((option) => (bits & option.value) === option.value)
        .map((option) => adminSearchText(option.labelKey, option.fallback));

    if (bits === 1) return adminSearchText("admin_filter_buyers_only", "المشترين فقط");
    return labels.join(" + ");
}

function getAdminFilterSummaryFromState(state) {
    const isAllUsersMode = (
        !state.adminOnly &&
        state.roleBits === ADMIN_ROLE_FILTER_ALL_BITS &&
        !state.recentCreatedDays &&
        !state.recentLoginDays
    );
    const hasDateFilters = !!(state.recentCreatedDays || state.recentLoginDays);

    if (isAllUsersMode) {
        return adminSearchText("admin_filter_all_users_no_filters", "عرض جميع المستخدمين بدون أي فلاتر");
    }

    if (state.adminOnly) {
        return adminSearchText("admin_filter_admins_summary", "عرض الأدمن والسوبر أدمن فقط");
    }

    const parts = [];

    if (!hasDateFilters) {
        parts.push(getAdminRoleFilterSummaryFromBits(state.roleBits));
    }

    if (state.recentCreatedDays) {
        parts.push(adminSearchText("admin_filter_created_last_days", "إنشاء آخر {days} يوم").replace("{days}", state.recentCreatedDays));
    }

    if (state.recentLoginDays) {
        parts.push(adminSearchText("admin_filter_login_last_days", "دخول آخر {days} يوم").replace("{days}", state.recentLoginDays));
    }

    return parts.join(" | ");
}

function getAdminFilterButtonSummary() {
    const isAllUsersMode = (
        !adminFilterState.adminOnly &&
        adminFilterState.roleBits === ADMIN_ROLE_FILTER_ALL_BITS &&
        !adminFilterState.recentCreatedDays &&
        !adminFilterState.recentLoginDays
    );
    const hasDateFilters = !!(adminFilterState.recentCreatedDays || adminFilterState.recentLoginDays);

    if (isAllUsersMode) {
        return adminSearchText("admin_filter_show_all", "عرض الكل");
    }

    if (adminFilterState.adminOnly) {
        return adminSearchText("admin_filter_admins_short", "أدمن / سوبر أدمن");
    }

    const parts = [];

    if (!hasDateFilters) {
        parts.push(getAdminRoleFilterSummaryFromBits(adminFilterState.roleBits));
    }

    if (adminFilterState.recentCreatedDays) {
        parts.push(adminSearchText("admin_filter_created_last_days", "إنشاء آخر {days} يوم").replace("{days}", adminFilterState.recentCreatedDays));
    }

    if (adminFilterState.recentLoginDays) {
        parts.push(adminSearchText("admin_filter_login_last_days", "دخول آخر {days} يوم").replace("{days}", adminFilterState.recentLoginDays));
    }

    return parts.join(" | ");
}

function updateAdminRoleFilterButton() {
    const label = document.getElementById("user-role-filter-label");
    if (label) {
        label.innerText = getAdminFilterButtonSummary();
    }
}

function initializeAdminRoleFilter() {
    const filterButton = document.getElementById("user-role-filter-btn");
    if (!filterButton) return;

    updateAdminRoleFilterButton();
    filterButton.onclick = openAdminRoleFilterModal;
}
