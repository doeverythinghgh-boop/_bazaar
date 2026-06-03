/**
 * @file pages/ADMIN/adminPanel-search-handler.js
 * @description Search execution for admin panel users list.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


function handleAdminSearch() {
    const searchInput = document.getElementById("user-search-input");
    if (!searchInput) return;

    const query = searchInput.value.toLowerCase().trim();
    const now = Date.now();
    const recentCreatedDays = parseInt(adminFilterState.recentCreatedDays, 10);
    const recentLoginDays = parseInt(adminFilterState.recentLoginDays, 10);
    const hasDateFilters =
        (!Number.isNaN(recentCreatedDays) && recentCreatedDays > 0) ||
        (!Number.isNaN(recentLoginDays) && recentLoginDays > 0);

    const filtered = allUsers_cache.filter((user) => {
        const comparableAccountType = getSearchComparableAccountType(user);

        if (adminFilterState.adminOnly) {
            if (!isAdminFilterUser(user)) return false;
        } else if (!hasDateFilters && adminFilterState.roleBits !== ADMIN_ROLE_FILTER_ALL_BITS && comparableAccountType !== adminFilterState.roleBits) {
            return false;
        }

        if (!Number.isNaN(recentCreatedDays) && recentCreatedDays > 0) {
            const createdDate = parseAdminFilterDate(user.created_at);
            if (!createdDate) return false;
            const createdDiffDays = (now - createdDate.getTime()) / 86400000;
            if (createdDiffDays < 0 || createdDiffDays > recentCreatedDays) return false;
        }

        if (!Number.isNaN(recentLoginDays) && recentLoginDays > 0) {
            const loginDate = parseAdminFilterDate(user.last_login_at);
            if (!loginDate) return false;
            const loginDiffDays = (now - loginDate.getTime()) / 86400000;
            if (loginDiffDays < 0 || loginDiffDays > recentLoginDays) return false;
        }

        if (!query) return true;

        return (
            (user.username && user.username.toLowerCase().includes(query)) ||
            (user.user_key && user.user_key.toLowerCase().includes(query)) ||
            (user.phone && user.phone.toLowerCase().includes(query)) ||
            (Array.isArray(user.phones) && user.phones.some((item) => String(item.number || "").toLowerCase().includes(query))) ||
            (user.phoneHealth && Array.isArray(user.phoneHealth.issues) && user.phoneHealth.issues.some((issue) => String(issue).toLowerCase().includes(query))) ||
            (user.Address && user.Address.toLowerCase().includes(query))
        );
    });

    renderUsersCards(filtered);
}
