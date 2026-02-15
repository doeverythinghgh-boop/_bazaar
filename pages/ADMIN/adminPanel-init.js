/**
 * @file pages/ADMIN/adminPanel-init.js
 * @description Initialization logic for the admin panel dashboard.
 */

/**
 * @description Main function executed on page load to initialize the admin panel.
 * Fetches user data, populates the table, and sets up search listeners.
 * @function initializeAdminPanel
 * @returns {Promise<void>}
 */
async function initializeAdminPanel() {
    const gridContainer = document.getElementById('admin-users-grid');
    const searchBar = document.querySelector('.admin-panel-search-bar');
    const errorContainer = document.createElement('div');
    errorContainer.className = 'admin-panel-error';
    errorContainer.style.textAlign = 'center'; 
    errorContainer.style.padding = '20px'; 
    errorContainer.style.color = 'var(--danger-color)';

    try {
        // Show loading state
        if (gridContainer) {
            gridContainer.innerHTML = '<p style="text-align: center; color: #999;">جاري تحميل بيانات المستخدمين...</p>';
        }
        if (searchBar) searchBar.style.display = 'none';

        const users = await getAllUsers_();
        allUsers_cache = users; 

        renderUsersCards(users);

        if (searchBar) searchBar.style.display = 'flex';

        const searchInput = document.getElementById('user-search-input');
        const roleFilter = document.getElementById('user-role-filter');

        if (searchInput) searchInput.oninput = handleAdminSearch;
        if (roleFilter) roleFilter.onchange = handleAdminSearch;

        const broadcastContainer = document.querySelector('.admin-panel-broadcast-container');
        if (broadcastContainer) broadcastContainer.style.display = 'block';

    } catch (error) {
        console.error('[initializeAdminPanel] فشل تهيئة لوحة التحكم:', error);
        errorContainer.innerHTML = `<p>حدث خطأ أثناء تحميل بيانات المستخدمين.</p><p><small>${error.message}</small></p>`;
        if (gridContainer) {
            gridContainer.innerHTML = '';
            gridContainer.appendChild(errorContainer);
        }
    }
}

// Global execution
initializeAdminPanel();
