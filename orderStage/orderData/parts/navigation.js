/**
 * @file orderStage/orderData/parts/navigation.js
 * @description Logic for back button and role badge.
 */

window.OrderData_Navigation = {
    /**
     * Initializes the navigation bar and user role badge.
     */
    orderInit: function () {
        this.orderRenderRoleBadge();
    },

    /**
     * Determines the user role and injects the badge.
     * LOGIC RULES (EN):
     * - Default: Buyer (مشتري)
     * - Super Admin: If user_key matches window.SUPER_ADMIN_KEY.
     * - Admin: If user_key exists in ADMIN_IDS list.
     * - Seller: If user.is_seller is 1.
     * - Delivery: If user.is_seller is 2.
     */
    orderRenderRoleBadge: function () {
        try {
            const userStr = localStorage.getItem('loggedInUser');
            if (userStr) {
                const user = JSON.parse(userStr);
                let roleName = 'مشتري';
                let roleIcon = 'fa-shopping-bag';
                let roleClass = 'order_role_badge_buyer';

                const isSuperAdmin = (window.SUPER_ADMIN_KEY && user.user_key === window.SUPER_ADMIN_KEY);
                const isAdmin = (typeof ADMIN_IDS !== 'undefined' && ADMIN_IDS.includes(user.user_key));

                if (isSuperAdmin) {
                    roleName = 'سوبر أدمن';
                    roleIcon = 'fa-user-shield';
                    roleClass = 'order_role_badge_super_admin';
                } else if (isAdmin) {
                    roleName = 'أدمن';
                    roleIcon = 'fa-user-cog';
                    roleClass = 'order_role_badge_admin';
                } else if (user.is_seller == 1) {
                    roleName = 'بائع';
                    roleIcon = 'fa-store';
                    roleClass = 'order_role_badge_seller';
                } else if (user.is_seller == 2) {
                    roleName = 'مندوب توصيل';
                    roleIcon = 'fa-truck';
                    roleClass = 'order_role_badge_delivery';
                }

                const existingBadge = document.getElementById('order_user_role_badge');
                if (existingBadge) existingBadge.remove();

                const badge = document.createElement('div');
                badge.className = `order_role_badge ${roleClass}`;
                badge.id = 'order_user_role_badge';
                badge.innerHTML = `<i id="order_user_role_icon" class="fas ${roleIcon}"></i> <span id="order_user_role_name">${roleName}</span>`;

                const navContainer = document.getElementById('order_nav_container');
                if (navContainer) {
                    navContainer.style.display = 'flex';
                    navContainer.style.alignItems = 'center';
                    navContainer.appendChild(badge);
                }
            }
        } catch (e) {
            console.warn('[OrderData] Navigation Badge Error:', e);
        }
    }
};
