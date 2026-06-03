/**
 * @file pages/ADMIN/adminPanel-init.js
 * @description Initialization logic for the admin panel dashboard.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


/**
 * @description Main function executed on page load to initialize the admin panel.
 * Fetches user data, populates the table, and sets up search listeners.
 * @function initializeAdminPanel
 * @returns {Promise<void>}
 */
async function initializeAdminPanel() {
    const gridContainer = document.getElementById("admin-users-grid");
    const searchBar = document.querySelector(".admin-panel-search-bar");
    const errorContainer = document.createElement("div");
    errorContainer.className = "admin-panel-error";
    errorContainer.style.textAlign = "center";
    errorContainer.style.padding = "20px";
    errorContainer.style.color = "var(--danger-color)";

    try {
        if (gridContainer) {
            gridContainer.innerHTML = `<p style="text-align: center; color: #999;">${adminInitText("admin_users_loading", "جاري تحميل بيانات المستخدمين...")}</p>`;
        }
        if (searchBar) searchBar.style.display = "none";

        const users = await getAllUsers_();
        allUsers_cache = users;

        if (typeof handleAdminSearch === "function") {
            handleAdminSearch();
        } else {
            renderUsersCards(users);
        }

        if (typeof fetchAdminPhoneIntegrityReport === "function" && typeof renderAdminPhoneIntegritySummary === "function") {
            try {
                const report = await fetchAdminPhoneIntegrityReport();
                renderAdminPhoneIntegritySummary(report);
            } catch (integrityError) {
                console.error("[initializeAdminPanel] Failed to load phone integrity report:", integrityError);
            }
        }

        if (searchBar) searchBar.style.display = "flex";

        const searchInput = document.getElementById("user-search-input");

        if (searchInput) searchInput.oninput = handleAdminSearch;
        if (typeof initializeAdminRoleFilter === "function") initializeAdminRoleFilter();

        const broadcastContainer = document.querySelector(".admin-panel-broadcast-container");
        if (broadcastContainer) {
            broadcastContainer.style.display = "block";
            const broadcastBtn = document.getElementById("btn-broadcast-send");
            if (broadcastBtn) {
                broadcastBtn.onclick = () => {
                    if (typeof window.sendBroadcastNotification === "function") {
                        window.sendBroadcastNotification();
                    } else {
                        console.error("[AdminPanel] sendBroadcastNotification function not found");
                    }
                };
            }
        }
    } catch (error) {
        console.error("[initializeAdminPanel] Failed to initialize admin panel:", error);
        errorContainer.innerHTML = `<p>${adminInitText("admin_users_load_error", "حدث خطأ أثناء تحميل بيانات المستخدمين.")}</p><p><small>${error.message}</small></p>`;
        if (gridContainer) {
            gridContainer.innerHTML = "";
            gridContainer.appendChild(errorContainer);
        }
    }
}

initializeAdminPanel();
