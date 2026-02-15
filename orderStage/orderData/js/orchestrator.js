/**
 * @file orderStage/orderData/order-data.js
 * @description Main Orchestrator for Order Data views.
 */

(async function initOrderDataMain() {
    console.log('[OrderData] Orchestrating modules...');

    const orderKey = localStorage.getItem('current_viewing_order_key');
    const container = document.getElementById('order_admaindata');
    if (!orderKey || !container) return;

    /**
     * Dynamically injects a CSS file into the document head.
     * @param {string} href Path to the CSS file.
     * @param {string} id Unique ID for the link tag.
     */
    function loadModuleStyle(href, id) {
        if (document.getElementById(id)) return;
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.id = id;
        document.head.appendChild(link);
    }

    /**
     * Formats location string. If it's a coordinate, returns a button.
     * @param {string} loc 
     * @param {string} name 
     */
    window.orderFormatLocation = function (loc, name) {
        const coords = loc ? loc.split(',') : [];
        const isValid = coords.length === 2 && !isNaN(parseFloat(coords[0].trim())) && !isNaN(parseFloat(coords[1].trim()));

        if (isValid) {
            return `
                <button class="order_view_map_btn" 
                        data-lat="${coords[0].trim()}" 
                        data-lng="${coords[1].trim()}"
                        data-name="${name || ''}"
                        title="${loc}"
                        style="cursor: pointer; border: none; background: #e3f2fd; color: #2196F3; width: 32px; height: 32px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; transition: background 0.2s;">
                    <i class="fas fa-map-marker-alt"></i>
                </button>
            `;
        }

        // Return a grey icon for missing or invalid coordinates
        return `
            <span class="order_no_location_icon" 
                  title="الموقع غير متوفر"
                  style="color: #9e9e9e; background: #eee; width: 32px; height: 32px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; cursor: help; font-size: 0.9em;">
                <i class="fas fa-map-marker-slash"></i>
            </span>
        `;
    };

    /**
     * Formats phone number as a clickable button.
     * @param {string} phone 
     */
    window.orderFormatPhone = function (phone) {
        if (!phone) return `<span class="order_no_phone">لا يوجد رقم هاتف</span>`;
        return `
            <a href="tel:${phone}" class="order_phone_btn">
                <i class="fas fa-phone-alt"></i> ${phone}
            </a>
        `;
    };

    /**
     * Fetches product details and opens the product view page.
     * @param {string} productKey 
     */
    window.orderViewProductDetails = async function (productKey) {
        if (!productKey) return;
        try {
            console.log('[OrderData] Requesting product details for:', productKey);
            const base = (typeof baseURL !== 'undefined') ? baseURL : '';
            const url = `${base}/api/products?product_key=${productKey}`;

            const response = await fetch(url);
            if (!response.ok) throw new Error(`Fetch failed: ${response.status} `);
            const product = await response.json();

            if (typeof mapProductData === 'function' && typeof loadProductView === 'function') {
                const productData = mapProductData(product);
                loadProductView(productData, { showAddToCart: false });
            } else {
                if (typeof Swal !== 'undefined') Swal.fire('خطأ', 'تعذر تحميل معالج البيانات أو صفحة العرض.', 'error');
                else alert('تعذر تحميل معالج البيانات أو صفحة العرض.');
            }
        } catch (e) {
            console.error('[OrderData] Error viewing product:', e);
            if (typeof Swal !== 'undefined') Swal.fire('خطأ', 'حدث خطأ أثناء تحميل بيانات المنتج.', 'error');
            else alert('حدث خطأ أثناء تحميل بيانات المنتج.');
        }
    };

    /**
     * Open the photo gallery for a specific item.
     * @param {string} u User Key
     * @param {string} s Seller Key
     * @param {string} p Product Key
     * @param {string} o Order Key
     */
    window.orderOpenPhotoGallery = function (u, s, p, o) {
        window.location.href = `/pages/orderPhoto.html?u=${u}&s=${s}&p=${p}&o=${o}`;
    };

    /**
     * Updates the availability of a specific product in the order.
     * @param {string} productKey 
     * @param {boolean} isAvailable 
     */
    window.orderUpdateItemAvailability = async function (productKey, isAvailable) {
        if (!productKey) return;

        // 0. Confirm Action (Modern Mini Dialog)
        if (typeof Swal !== 'undefined') {
            const result = await Swal.fire({
                title: isAvailable ? 'إتاحة المنتج؟' : 'إخفاء المنتج؟',
                html: isAvailable ? '<span class="swal-modern-mini-text" style="display:block;">سيظهر هذا المنتج كـ "متوفر" للعميل.</span>' : '<span class="swal-modern-mini-text" style="display:block;">سيظهر هذا المنتج كـ "غير متوفر".</span>',
                showCancelButton: true,
                confirmButtonText: 'موافق',
                cancelButtonText: 'تراجع',
                confirmButtonColor: isAvailable ? '#27ae60' : '#e74c3c',
                cancelButtonColor: '#95a5a6',
                reverseButtons: true, // Better for RTL
                focusCancel: true,
                customClass: {
                    popup: 'swal-modern-mini-popup',
                    title: 'swal-modern-mini-title',
                    confirmButton: 'swal-modern-mini-confirm',
                    cancelButton: 'swal-modern-mini-cancel'
                }
            });

            if (!result.isConfirmed) {
                // Revert UI Change by re-rendering original state
                const orderKey = localStorage.getItem('current_viewing_order_key');
                if (orderKey) {
                    try {
                        const order = await orderGetByKey(orderKey);
                        if (order && window.OrderData_Products) {
                            window.OrderData_Products.orderRender(order);
                        }
                    } catch (e) { console.error("Revert failed", e); }
                }
                return;
            }
        }

        try {
            const orderKey = localStorage.getItem('current_viewing_order_key');
            if (!orderKey) return;

            // 1. Get current order data from IndexedDB
            let order = await orderGetByKey(orderKey);
            if (!order) {
                console.error('[OrderData] Order not found in local DB:', orderKey);
                return;
            }

            // 2. Parse and Update Status using the unified tool
            const statusObj = parseOrderStatus(order.order_status);
            if (!statusObj.unavailable_product_keys) statusObj.unavailable_product_keys = [];

            if (isAvailable) {
                statusObj.unavailable_product_keys = statusObj.unavailable_product_keys.filter(k => k !== productKey);
            } else {
                if (!statusObj.unavailable_product_keys.includes(productKey)) {
                    statusObj.unavailable_product_keys.push(productKey);
                }
            }

            // Log for audit
            statusObj.last_updated = new Date().toISOString();
            order.order_status = JSON.stringify(statusObj);

            // 3. Save back to Local IndexedDB
            await orderSaveToLocalDB(order, order.role_context || 'admin');

            // 4. (Optional) Sync with Server
            if (typeof baseURL !== 'undefined' && baseURL !== "") {
                try {
                    const response = await fetch(`${baseURL}/api/orders`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            order_key: orderKey,
                            order_status: order.order_status
                        })
                    });

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.error || `HTTP ${response.status}`);
                    }

                    console.log('[OrderData] Server sync successful.');
                } catch (syncErr) {
                    console.error('[OrderData] Server sync failed:', syncErr);

                    // Only show alert to user if NOT on localhost (Production issue)
                    const isLocal = ['127.0.0.1', 'localhost'].includes(location.hostname);
                    if (!isLocal && typeof Swal !== 'undefined') {
                        Swal.fire({
                            icon: 'warning',
                            title: 'فشل مزامنة البيانات',
                            text: 'تم حفظ التغييرات محلياً، لكن تعذر إرسالها للسيرفر (قد تكون مشكلة في الاتصال).',
                            toast: true,
                            position: 'bottom-end',
                            timer: 5000,
                            showConfirmButton: false
                        });
                    }
                }
            }

            console.log(`[OrderData] Item ${productKey} now available: ${isAvailable}`);

            // 5. Trigger UI Refresh
            if (window.OrderData_Products) window.OrderData_Products.orderRender(order);
            if (isSuperAdmin && window.OrderData_Admin) {
                window.OrderData_Admin.orderRender(order, container);
            }

        } catch (e) {
            console.error('[OrderData] Update Item Availability Error:', e);
        }
    };

    /**
     * Opens map popup
     * @param {string} lat 
     * @param {string} lng 
     * @param {string} name 
     */
    window.orderOpenMap = function (lat, lng, name) {
        if (typeof Swal === 'undefined') {
            console.error('[OrderData] SweetAlert2 not found');
            return;
        }
        Swal.fire({
            html: `<iframe src="/location/LOCATION.html?lat=${lat}&lng=${lng}&viewOnly=true" style="width: 100%; height: 70vh; border: none; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.2);"></iframe>`,
            showConfirmButton: false,
            width: '95%',
            padding: '0',
            background: 'transparent',
            customClass: {
                popup: 'swal-modern-mini-popup',
                htmlContainer: 'order_swal_no_padding'
            },
            didOpen: () => {
                const handleMapMsg = (event) => {
                    if (event.data && event.data.type === 'CLOSE_LOCATION_MODAL') {
                        Swal.close();
                        window.removeEventListener('message', handleMapMsg);
                    }
                };
                window.addEventListener('message', handleMapMsg);
            }
        });
    };

    // Add delegated listener for map buttons
    document.body.addEventListener('click', (e) => {
        const btn = e.target.closest('.order_view_map_btn');
        if (btn) {
            e.preventDefault();
            const { lat, lng, name } = btn.dataset;
            window.orderOpenMap(lat, lng, name);
        }
    });

    /**
     * @description STEPPER AND WORKFLOW LOGIC (EN):
     * The stepper represents the 3 core phases of an order.
     * Logic:
     * - Step 1: Default state. Seller must review and confirm.
     * - Step 2: Triggered when Beller confirms prep. Courier starts pickup.
     * - Step 3: Triggered when Courier reaches destination.
     * - Step 4: Final archival.
     */
    window.orderRenderStepper = function (statusObj) {
        // [Logic] Workflow Stepper Visibility Rule:
        // The stepper is only applicable for standard products/services (N/A, 0, or 1).
        // If the order contains a "Special Service" (serviceType: 2), the stepper is hidden
        // as these services follow a custom/manual negotiation flow.
        const orderKey = localStorage.getItem('current_viewing_order_key');

        // We need to check the items in the local DB for this order
        orderGetByKey(orderKey).then(orderData => {
            if (!orderData) return;

            const hasSpecialService = (orderData.order_items || []).some(item => item.serviceType == 2);

            if (hasSpecialService) {
                console.log('[OrderData] Special Service (type 2) detected. Hiding Stepper.');
                const existing = document.getElementById('order_stepper_main');
                if (existing) existing.remove();
                return;
            }

            // [Logic] Default Activation Rule:
            // We parse step_id or default to 0. 
            // If step_id is 0 (Pending), no stage is active (no pulse animation).
            // Stages (1, 2, 3) only pulse when the order explicitly moves into them.
            const stepId = parseInt(statusObj.step_id || 0);
            const isRTL = document.dir === 'rtl' || document.documentElement.dir === 'rtl';
            const arrowIcon = isRTL ? 'fa-chevron-left' : 'fa-chevron-right';

            // 0. Inject Modern Stepper Styles & Animations (Reduced scales)
            const styleId = 'order_stepper_dynamic_css';
            if (!document.getElementById(styleId)) {
                const style = document.createElement('style');
                style.id = styleId;
                style.innerHTML = `
                    @keyframes stepper-pulse {
                        0% { box-shadow: 0 0 0 0 rgba(33, 150, 243, 0.4); transform: scale(1); }
                        70% { box-shadow: 0 0 0 6px rgba(33, 150, 243, 0); transform: scale(1.05); }
                        100% { box-shadow: 0 0 0 0 rgba(33, 150, 243, 0); transform: scale(1); }
                    }
                    .stepper-active-circle {
                        animation: stepper-pulse 2s infinite;
                        border: 1px solid #fff;
                    }
                `;
                document.head.appendChild(style);
            }

            const steps = [
                { id: 1, name: 'المراجعة', icon: 'fa-clipboard-check' },
                { id: 2, name: 'الشحن', icon: 'fa-truck-loading' },
                { id: 3, name: 'التسليم', icon: 'fa-hand-holding-heart' }
            ];

            let stepperHTML = `<div id="order_stepper_main" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding: 10px; background: #fff; border-radius: 12px; box-shadow: 0 5px 15px rgba(0,0,0,0.05); border: 1px solid #f0f0f0;">`;

            steps.forEach((s, idx) => {
                const isCompleted = s.id < stepId;
                const isCurrent = s.id === stepId;
                const isPending = s.id > stepId;

                let bgColor = '#edf2f7';
                let iconColor = '#a0aec0';
                if (isCompleted) { bgColor = '#2ecc71'; iconColor = '#fff'; }
                if (isCurrent) { bgColor = '#2196F3'; iconColor = '#fff'; }

                stepperHTML += `
                    <div style="flex: 1; display: flex; flex-direction: column; align-items: center; position: relative;">
                        <!-- Small Circle -->
                        <div class="${isCurrent ? 'stepper-active-circle' : ''}" 
                             style="width: 28px; height: 28px; background: ${bgColor}; color: ${iconColor}; border-radius: 50%; display: flex; align-items: center; justify-content: center; z-index: 2; margin-bottom: 4px; transition: all 0.3s ease;">
                            <i class="fas ${s.icon}" style="font-size: 0.75rem;"></i>
                        </div>
                        
                        <!-- Small Label -->
                        <span style="font-size: 0.65rem; color: ${isPending ? '#a0aec0' : '#2d3748'}; font-weight: ${isCurrent ? 'bold' : '500'};">
                            ${s.name}
                        </span>

                        <!-- Balanced Connector Arrow -->
                        ${idx < steps.length - 1 ? `
                            <div style="position: absolute; top: 14px; ${isRTL ? 'right' : 'left'}: 50%; width: 100%; z-index: 1; display: flex; align-items: center; justify-content: center;">
                                <i class="fas ${arrowIcon}" style="font-size: 10px; color: ${isCompleted ? '#2ecc71' : '#e2e8f0'};"></i>
                            </div>
                        ` : ''}
                    </div>
                `;
            });
            stepperHTML += `</div>`;

            const nav = document.getElementById('order_nav_container');
            if (nav) {
                const existing = document.getElementById('order_stepper_main');
                if (existing) existing.remove();
                nav.insertAdjacentHTML('afterend', stepperHTML);
            }
        });
    };

    /**
     * @description CORE STATE TRANSITION ENGINE (EN):
     * Updates the global step_id and saves to both local and remote DB.
     * @param {number} nextStep 
     */
    window.orderUpdateStep = async function (nextStep) {
        const orderKey = localStorage.getItem('current_viewing_order_key');
        if (!orderKey) return;

        try {
            let order = await orderGetByKey(orderKey);
            const statusObj = parseOrderStatus(order.order_status);
            statusObj.step_id = nextStep;
            statusObj.last_updated = new Date().toISOString();
            order.order_status = JSON.stringify(statusObj);

            await orderSaveToLocalDB(order, order.role_context || 'admin');

            // Sync with server if URL is valid
            if (typeof baseURL !== 'undefined' && baseURL !== "") {
                await fetch(`${baseURL}/api/orders`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ order_key: orderKey, order_status: order.order_status })
                });
            }

            // Global UI Refresh (In-Place Re-render)
            console.log('[OrderData] Refreshing UI in-place...');

            // Re-render Stepper
            window.orderRenderStepper(statusObj);

            // Re-render Modules
            const userStr = localStorage.getItem('loggedInUser');
            const user = userStr ? JSON.parse(userStr) : {};
            const isSuperAdmin = (window.SUPER_ADMIN_KEY && user.user_key === window.SUPER_ADMIN_KEY);
            const isAdmin = (typeof ADMIN_IDS !== 'undefined' && ADMIN_IDS.includes(user.user_key));
            const context = { isSuperAdmin, isAdmin };

            if (isSuperAdmin && window.OrderData_Admin) {
                const container = document.getElementById('order_admaindata');
                window.OrderData_Admin.orderRender(order, container);
            }

            if (window.OrderData_Buyer) window.OrderData_Buyer.orderRender(order, context);
            if (window.OrderData_Seller) window.OrderData_Seller.orderRender(order, context);
            if (window.OrderData_Delivery) window.OrderData_Delivery.orderRender(order, context);
            if (window.OrderData_Products) window.OrderData_Products.orderRender(order);

        } catch (e) {
            console.error('[OrderData] Step Update Failed:', e);
            // Fallback to reload if something breaks
            window.location.reload();
        }
    };

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
     * 1. order_role_products: Publicly visible to all authorized roles (Admin, Seller, Buyer, Delivery).
     * 2. order_role_buyer: Restricted to Super Admin, Admin, and the Buyer only.
     * 3. order_role_seller: Restricted to Super Admin, Admin, and the Seller only.
     * 4. order_role_delivery: Restricted to Super Admin, Admin, and the Delivery personnel only.
     * 5. order_admaindata: Strictly exclusive to Super Admin (God Mode) ONLY.
     */

    // Rule 1: order_admaindata is strictly for Super Admin ONLY.
    if (isSuperAdmin) {
        loadModuleStyle('/orderStage/orderData/parts/admin.css', 'order_css_admin');
        container.style.display = 'block';
    } else {
        container.style.display = 'none';
    }

    // Load common roles style if any role section is likely to show
    loadModuleStyle('/orderStage/orderData/parts/roles.css', 'order_css_roles');

    // Rule 2: Buyer section (Buyer, Admin, or Super Admin)
    // Non-sellers/non-delivery users are treated as buyers.
    if (isSuperAdmin || isAdmin || (user.is_seller != 1 && user.is_seller != 2)) {
        if (buyerDiv) buyerDiv.style.display = 'block';
    } else {
        if (buyerDiv) buyerDiv.style.display = 'none';
    }

    // Rule 3: Seller section (Seller, Admin, or Super Admin)
    if (isSuperAdmin || isAdmin || user.is_seller == 1) {
        if (sellerDiv) sellerDiv.style.display = 'block';
    } else {
        if (sellerDiv) sellerDiv.style.display = 'none';
    }

    // Rule 4: Delivery section (Delivery, Admin, or Super Admin)
    if (isSuperAdmin || isAdmin || user.is_seller == 2) {
        if (deliveryDiv) deliveryDiv.style.display = 'block';
    } else {
        if (deliveryDiv) deliveryDiv.style.display = 'none';
    }

    // Rule 5: Products section (Visible to all authorized users matching the criteria above)
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

        // Render visual progression for all
        window.orderRenderStepper(statusObj);

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

