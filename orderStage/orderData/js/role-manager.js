/**
 * @file orderStage/orderData/js/role-manager.js
 * @description Manages role-based visibility and access control for the order page.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


window.OrderData_RoleManager = {
    getStoredOrderRole: function (flags = {}) {
        const rawRole = LocalDBStorage.getItem('current_viewing_order_role') || '';
        const normalizedRole = rawRole === 'merchant' ? 'commercial' : rawRole;
        const allowedRoles = new Set(['buyer', 'commercial', 'delivery', 'admin']);
        if (!allowedRoles.has(normalizedRole)) return '';
        if (normalizedRole === 'admin' && !(flags.isSuperAdmin || flags.isAdmin)) return '';
        if (normalizedRole === 'commercial' && !flags.isCommercial) return '';
        if (normalizedRole === 'delivery' && !flags.isDelivery) return '';
        if (normalizedRole === 'buyer' && !flags.isBuyer) return '';
        return normalizedRole;
    },

    resolveActiveOrderRole: function (flags) {
        // 0. Manual Simulation Override (Highest Priority for Admins)
        const simulationRole = LocalDBStorage.getItem('order_simulation_role');
        if (simulationRole && (flags.isSuperAdmin || flags.isAdmin || flags.trueIsAdmin || flags.trueIsSuperAdmin)) {
            return simulationRole;
        }

        // 1. Priority: Explicit preference from Sales Movement tabs
        const preferredRole = (LocalDBStorage.getItem('sales_movement_user_type') || '').replace('merchant', 'commercial');
        if (preferredRole === 'admin' && (flags.isSuperAdmin || flags.isAdmin)) return 'admin';
        if (preferredRole === 'commercial' && flags.isCommercial) return 'commercial';
        if (preferredRole === 'delivery' && flags.isDelivery) return 'delivery';
        if (preferredRole === 'buyer' && flags.isBuyer) return 'buyer';

        // 2. Priority: If user is an Admin, they should see the Admin view by default
        if (flags.isSuperAdmin || flags.isAdmin) return 'admin';

        // 3. Fallback: Last stored role for this specific order view (if still valid)
        const storedRole = this.getStoredOrderRole(flags);
        if (storedRole) return storedRole;

        // 4. Default by capability
        if (flags.isCommercial) return 'commercial';
        if (flags.isDelivery) return 'delivery';
        return 'buyer';
    },

    /**
     * @description Determines visibility and permissions.
     * @returns {Object} context { isSuperAdmin, isAdmin, isCommercial, isDelivery, isBuyer, user }
     */
    init: function () {
        const user = window.userSession || (typeof UserService !== 'undefined' ? UserService.get() : null) || {};
        const capabilities = typeof window.resolveUserCapabilities === 'function'
            ? window.resolveUserCapabilities(user)
            : null;

        const trueIsSuperAdmin = !!capabilities?.isSuperAdmin;
        const trueIsAdmin = !!capabilities?.isAdmin;
        const isCommercial = !!capabilities?.isCommercial;
        const isDelivery = !!capabilities?.canDeliver;
        const isBuyer = capabilities ? !!capabilities.isBuyer : true;

        // Simulation Detection
        const simulationRole = LocalDBStorage.getItem('order_simulation_role');
        const simulatedSellerKey = LocalDBStorage.getItem('order_simulation_seller_key');
        const simulatedDeliveryKey = LocalDBStorage.getItem('order_simulation_delivery_key');

        const isSimulating = !!(simulationRole && simulationRole !== 'admin' && (trueIsSuperAdmin || trueIsAdmin));

        // Determine Active Role
        const activeOrderRole = this.resolveActiveOrderRole({
            isSuperAdmin: trueIsSuperAdmin,
            isAdmin: trueIsAdmin,
            isCommercial,
            isDelivery,
            isBuyer
        });

        LocalDBStorage.setItem('current_viewing_order_role', activeOrderRole);

        return {
            // Simulated flags for UI rendering (Deep simulation: hide admin tools if simulating buyer)
            isSuperAdmin: isSimulating ? false : trueIsSuperAdmin,
            isAdmin: isSimulating ? false : trueIsAdmin,
            isCommercial,
            isDelivery,
            isBuyer,
            activeOrderRole,
            user,
            // True flags for persistent controls (Simulation buttons)
            trueIsSuperAdmin,
            trueIsAdmin,
            isSimulating,
            simulatedSellerKey,
            simulatedDeliveryKey
        };
    },

    /**
     * @description Applies visibility rules to the DOM based on user role.
     * @param {Object} context
     */
    applyVisibility: function (context) {
        const { activeOrderRole } = context;
        const container = document.getElementById('order_admaindata');
        const buyerDiv = document.getElementById('order_role_buyer');
        const commercialDiv = document.getElementById('order_role_commercial');
        const deliveryDiv = document.getElementById('order_role_delivery');
        const prodDiv = document.getElementById('order_role_products');

        // Rule 1: Admin data strictly for Admin role
        if (activeOrderRole === 'admin') {
            if (typeof window.OrderData_UI !== 'undefined') {
                window.OrderData_UI.loadModuleStyle('/orderStage/orderData/parts/admin.css', 'order_css_admin');
            }
            if (container) container.style.display = 'block';
        } else {
            if (container) container.style.display = 'none';
        }

        // Load common roles style
        if (typeof window.OrderData_UI !== 'undefined') {
            window.OrderData_UI.loadModuleStyle('/orderStage/orderData/parts/roles.css', 'order_css_roles');
        }

        // Rule 2: Buyer section
        if (activeOrderRole === 'buyer') {
            if (buyerDiv) buyerDiv.style.display = 'block';
        } else {
            if (buyerDiv) buyerDiv.style.display = 'none';
        }

        // Rule 3: Commercial section
        if (activeOrderRole === 'commercial') {
            if (commercialDiv) commercialDiv.style.display = 'block';
        } else {
            if (commercialDiv) commercialDiv.style.display = 'none';
        }

        // Rule 4: Delivery section
        if (activeOrderRole === 'delivery') {
            if (deliveryDiv) deliveryDiv.style.display = 'block';
        } else {
            if (deliveryDiv) deliveryDiv.style.display = 'none';
        }

        // Rule 5: Products section (Visible to all)
        if (prodDiv) prodDiv.style.display = 'block';
    }
};
