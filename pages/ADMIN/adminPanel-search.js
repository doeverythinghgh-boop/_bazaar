/**
 * @file pages/ADMIN/adminPanel-search.js
 * @description Search and filtering logic for the admin panel, including cache management.
 */

/** @type {Array<object>} Cache in memory for fast filtering */
var allUsers_cache = []; 

/**
 * @description Handles live search and filtering based on the search bar inputs.
 * @function handleAdminSearch
 * @returns {void}
 */
function handleAdminSearch() {
    const searchInput = document.getElementById('user-search-input');
    const roleFilter = document.getElementById('user-role-filter');
    
    if (!searchInput || !roleFilter) return;
    
    const query = searchInput.value.toLowerCase().trim();
    const roleType = roleFilter.value;


    const filtered = allUsers_cache.filter(user => {
        // Role filtering
        if (roleType !== 'all') {
            if (roleType === 'seller' && !user.isSeller) return false;
            if (roleType === 'delivery' && !user.isDelivery) return false;
            if (roleType === 'both' && !(user.isSeller && user.isDelivery)) return false;
            if (roleType === 'buyer' && (user.isSeller || user.isDelivery)) return false;
        }

        // Text search
        if (!query) return true;

        // Search in username, user_key, phone, address
        return (
            (user.username && user.username.toLowerCase().includes(query)) ||
            (user.user_key && user.user_key.toLowerCase().includes(query)) ||
            (user.phone && user.phone.toLowerCase().includes(query)) ||
            (user.Address && user.Address.toLowerCase().includes(query))
        );
    });

    renderUsersCards(filtered);
}
