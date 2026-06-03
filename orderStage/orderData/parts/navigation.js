/**
 * @file orderStage/orderData/parts/navigation.js
 * @description Logic for back button and user role badge.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


window.OrderData_Navigation = {
    /**
     * Initializes the navigation bar and user role badge.
     */
    orderInit: function () {
        this.orderRenderRoleBadge();
    },

    orderRenderRoleBadge: function () {
        try {
            const user = window.userSession || (typeof UserService !== 'undefined' ? UserService.get() : null);
            if (!user) return;

            const navContainer = document.getElementById("order_nav_container");
            if (!navContainer) return;

            const existingBadges = navContainer.querySelectorAll(".order_role_badge");
            existingBadges.forEach((badge) => badge.remove());

            // 1. Get detailed context from RoleManager
            const roleCtx = (window.OrderData_RoleManager && typeof window.OrderData_RoleManager.init === 'function')
                ? window.OrderData_RoleManager.init()
                : { activeOrderRole: (LocalDBStorage.getItem('current_viewing_order_role') || 'buyer') };

            const activeOrderRole = roleCtx.activeOrderRole;
            const isSuperAdmin = !!roleCtx.trueIsSuperAdmin;
            const isSimulating = !!roleCtx.isSimulating;

            const roleMap = {
                admin: {
                    name: isSuperAdmin ? "سوبر أدمن" : "أدمن",
                    icon: isSuperAdmin
                        ? (window.ROLE_ICONS?.SUPER_ADMIN || "fas fa-chess-king").replace("fas ", "")
                        : (window.ROLE_ICONS?.ADMIN || "fas fa-user-gear").replace("fas ", ""),
                    class: isSuperAdmin ? "order_role_badge_super_admin" : "order_role_badge_admin"
                },
                buyer: { name: "مشتري", icon: "fa-shopping-bag", class: "order_role_badge_buyer" },
                commercial: { name: 'merchant', icon: "fa-store", class: "order_role_badge_commercial" },
                delivery: { name: "مندوب توصيل", icon: "fa-truck", class: "order_role_badge_delivery" }
            };

            const role = roleMap[activeOrderRole] || roleMap.buyer;
            const badge = document.createElement("div");
            badge.id = "order_active_role_badge";
            badge.className = `order_role_badge ${role.class}`;
            badge.innerHTML = `<i class="fas ${role.icon}"></i> <span>${role.name}</span>`;
            navContainer.appendChild(badge);

            // 2. Add Simulation Controls for Super Admin
            if (isSuperAdmin) {
                const simBoxId = "order_simulation_controls";
                let simBox = document.getElementById(simBoxId);
                if (!simBox) {
                    simBox = document.createElement("div");
                    simBox.id = simBoxId;
                    simBox.className = "order_sim_box";
                    navContainer.appendChild(simBox);
                }

                const simRoles = [
                    { id: 'buyer', label: 'المشتري', icon: 'fa-shopping-bag' },
                    { id: 'commercial', label: 'مقدم الخدمة', icon: 'fa-store' },
                    { id: 'delivery', label: 'التوصيل', icon: 'fa-truck' },
                    { id: 'admin', label: 'الإدارة', icon: 'fa-user-shield' }
                ];

                // Attempt to get active selection name
                let activeSubLabel = '';
                if (isSimulating) {
                    const selKey = roleCtx.simulatedSellerKey || roleCtx.simulatedDeliveryKey;
                    if (selKey) {
                        try {
                            const activeOrder = LocalDBStorage.getItem('current_viewing_order_key');
                            // We use a simplified name search or wait for data refresh
                            activeSubLabel = `<span class="order_sim_active_name">(${activeOrderRole === 'commercial' ? 'merchant' : 'مندوب'}: جاري المحاكاة)</span>`;
                        } catch(e) {}
                    }
                }

                simBox.innerHTML = `
                    <span id="order_sim_label" class="order_sim_label">المحاكاة: ${activeSubLabel}</span>
                    <div id="order_sim_buttons" class="order_sim_buttons">
                        ${simRoles.map(r => `
                            <button id="btn_sim_${r.id}" 
                                    class="order_sim_btn ${activeOrderRole === r.id ? 'active' : ''}" 
                                    onclick="window.simulateOrderRole('${r.id}')"
                                    title="محاكاة دور ${r.label}">
                                <i class="fas ${r.icon}"></i>
                                <span>${r.label}</span>
                            </button>
                        `).join('')}
                    </div>
                `;
            }

            navContainer.style.display = "flex";
            navContainer.style.alignItems = "center";
            navContainer.style.gap = "15px";
            navContainer.style.flexWrap = "wrap";
        } catch (e) {
            console.warn("[OrderData] Navigation Badge Error:", e);
        }
    }
};

/**
 * Global Simulation Toggle Logic
 */
window.simulateOrderRole = async function (role) {
    // 0. Cleanup old simulation keys
    LocalDBStorage.removeItem('order_simulation_seller_key');
    LocalDBStorage.removeItem('order_simulation_delivery_key');

    if (role === 'admin') {
        LocalDBStorage.removeItem('order_simulation_role');
        window.location.reload();
        return;
    }

    // 1. Check if we need to select a specific participant
    if (role === 'commercial' || role === 'delivery') {
        try {
            const orderKey = LocalDBStorage.getItem('current_viewing_order_key');
            if (!orderKey) throw new Error('Order key not found');

            const orderData = typeof orderGetByKey === 'function' ? await orderGetByKey(orderKey) : null;
            if (!orderData) throw new Error('Order data not found');

            const participants = [];

            if (role === 'commercial') {
                const merchants = new Map();
                (orderData.order_items || []).forEach(it => {
                    if (it.seller_key && !merchants.has(it.seller_key)) {
                        merchants.set(it.seller_key, it.seller_name || it.seller_key);
                    }
                });
                merchants.forEach((v, k) => participants.push({ id: k, name: v }));
            } else {
                const couriers = new Map();
                (orderData.order_items || []).forEach(it => {
                    (it.supplier_delivery || []).forEach(del => {
                        if (del.delivery_key && !couriers.has(del.delivery_key)) {
                            couriers.set(del.delivery_key, del.delivery_name || del.delivery_key);
                        }
                    });
                });
                couriers.forEach((v, k) => participants.push({ id: k, name: v }));
            }

            if (participants.length > 1) {
                // Show Selection UI (Modern Swal)
                const options = {};
                participants.forEach(p => { options[p.id] = p.name; });

                const { value: selectedId } = await Swal.fire({
                    title: role === 'commercial' ? 'اختيار مقدم الخدمة' : 'اختيار المندوب',
                    input: 'select',
                    inputOptions: options,
                    inputPlaceholder: 'اختر الحساب لمحاكاته',
                    showCancelButton: true,
                    confirmButtonText: 'محاكاة',
                    cancelButtonText: 'إلغاء',
                    confirmButtonColor: '#2196F3',
                    buttonsStyling: false,
                    customClass: {
                        popup: 'swal-modern-mini-popup',
                        title: 'swal-modern-mini-title',
                        input: 'swal-modern-mini-input',
                        confirmButton: 'swal-modern-mini-confirm',
                        cancelButton: 'swal-modern-mini-cancel'
                    }
                });

                if (selectedId) {
                    LocalDBStorage.setItem('order_simulation_role', role);
                    LocalDBStorage.setItem(role === 'commercial' ? 'order_simulation_seller_key' : 'order_simulation_delivery_key', selectedId);
                } else {
                    return; // User cancelled
                }
            } else if (participants.length === 1) {
                // Auto-simulate the only one
                LocalDBStorage.setItem('order_simulation_role', role);
                LocalDBStorage.setItem(role === 'commercial' ? 'order_simulation_seller_key' : 'order_simulation_delivery_key', participants[0].id);
            } else {
                // Fallback for empty (unlikely)
                LocalDBStorage.setItem('order_simulation_role', role);
            }
        } catch (e) {
            console.error('[OrderSimulation] Selection error:', e);
            LocalDBStorage.setItem('order_simulation_role', role);
        }
    } else {
        LocalDBStorage.setItem('order_simulation_role', role);
    }

    // Smooth transition: indicate loading
    const container = document.getElementById('order_nav_container');
    if (container) container.style.opacity = '0.5';

    // Reload to apply all flags deeply
    window.location.reload();
};
