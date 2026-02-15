/**
 * @file orderStage/orderData/order-data.js
 * @description Main Orchestrator for Order Data views (Refactored).
 */

(async function initOrderDataMain() {
    console.log('[OrderData] Orchestrating modules...');

    const orderKey = localStorage.getItem('current_viewing_order_key');
    const container = document.getElementById('order_admaindata');
    if (!orderKey || !container) return;

    // 1. Initialize Navigation (Back button & Badge)
    if (window.OrderData_Navigation) {
        window.OrderData_Navigation.orderInit();
    }

    // 2. Determine Visibility and Permissions
    const userStr = localStorage.getItem('loggedInUser');
    const user = userStr ? JSON.parse(userStr) : {};
    const isSuperAdmin = (window.SUPER_ADMIN_KEY && user.user_key === window.SUPER_ADMIN_KEY);
    const isAdmin = (typeof ADMIN_IDS !== 'undefined' && ADMIN_IDS.includes(user.user_key));

    const buyerDiv = document.getElementById('order_role_buyer');
    const sellerDiv = document.getElementById('order_role_seller');
    const deliveryDiv = document.getElementById('order_role_delivery');
    const prodDiv = document.getElementById('order_role_products');

    /**
     * @description ACCESS CONTROL MATRIX - ROLE VISIBILITY RULES
     */

    // Rule 1: order_admaindata is strictly for Super Admin ONLY.
    if (isSuperAdmin) {
        window.OrderData_UI.loadModuleStyle('/orderStage/orderData/parts/admin.css', 'order_css_admin');
        container.style.display = 'block';
    } else {
        container.style.display = 'none';
    }

    // Load common roles style
    window.OrderData_UI.loadModuleStyle('/orderStage/orderData/parts/roles.css', 'order_css_roles');

    // Rule 2: Buyer section
    if (isSuperAdmin || isAdmin || (user.is_seller != 1 && user.is_seller != 2)) {
        if (buyerDiv) buyerDiv.style.display = 'block';
    } else {
        if (buyerDiv) buyerDiv.style.display = 'none';
    }

    // Rule 3: Seller section
    if (isSuperAdmin || isAdmin || user.is_seller == 1) {
        if (sellerDiv) sellerDiv.style.display = 'block';
    } else {
        if (sellerDiv) sellerDiv.style.display = 'none';
    }

    // Rule 4: Delivery section
    if (isSuperAdmin || isAdmin || user.is_seller == 2) {
        if (deliveryDiv) deliveryDiv.style.display = 'block';
    } else {
        if (deliveryDiv) deliveryDiv.style.display = 'none';
    }

    // Rule 5: Products section
    if (prodDiv) prodDiv.style.display = 'block';

    // 3. Data Fetching and Rendering
    try {
        const orderData = await orderGetByKey(orderKey);
        if (!orderData) {
            console.error('[OrderData] No local data found for key:', orderKey);
            return;
        }

        // 3.1 Orchestrate Renderers
        const context = { isSuperAdmin, isAdmin };
        const statusObj = parseOrderStatus(orderData.order_status);

        // Render visual progression
        window.OrderData_Stepper.render(statusObj);

        if (isSuperAdmin && window.OrderData_Admin) {
            window.OrderData_Admin.orderRender(orderData, container);
        }

        if (window.OrderData_Buyer) window.OrderData_Buyer.orderRender(orderData, context);
        if (window.OrderData_Seller) window.OrderData_Seller.orderRender(orderData, context);
        if (window.OrderData_Delivery) window.OrderData_Delivery.orderRender(orderData, context);
        if (window.OrderData_Products) window.OrderData_Products.orderRender(orderData);

    } catch (error) {
        console.error('[OrderData] Orchestration Error:', error);
    }
})();
