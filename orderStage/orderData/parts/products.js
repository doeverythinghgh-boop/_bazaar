/**
 * @file orderStage/orderData/parts/products.js
 * @description Renders logic for the product details panel.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


window.OrderData_Products = {
    /**
     * Populates the products section with detailed item information.
     * @param {object} orderData
     */
    orderRender: function (orderData, context = {}) {
        if (window.OrderData_UI?.setCurrentOrderData) {
            window.OrderData_UI.setCurrentOrderData(orderData);
        }
        const el = document.getElementById('order_role_products');
        if (el && el.style.display !== 'none') {
            const contentEl = el.querySelector('.order_role_content');
            if (contentEl) {
                contentEl.innerHTML = '';
                contentEl.id = 'order_products_role_content_inner';
                let grandTotal = 0;
                const items = orderData.order_items || [];

                // 1. Availability Logic (Uses structured JSON object from tools.js)
                const statusObj = parseOrderStatus(orderData.order_status);
                const unavailableKeys = statusObj.unavailable_product_keys || [];

                // 2. Permission and Role Checks (Consolidated via context)
                const user = context.user || window.userSession || {};
                const activeOrderRole = (context.activeOrderRole || LocalDBStorage.getItem('current_viewing_order_role') || 'buyer').trim();
                const simulatedSellerKey = context.simulatedSellerKey || null;

                const isSuperAdminAccount = !!context.isSuperAdmin;
                const isAdminAccount = !!context.isAdmin;
                const isCommercialAccount = !!context.isCommercial;

                const isAdminView = activeOrderRole === 'admin' && (isSuperAdminAccount || isAdminAccount);
                const isCommercialView = activeOrderRole === 'commercial' && isCommercialAccount;

                const hasSpecialService = items.some(item => item.serviceType == 2);
                const orderPharmacyProducts = Array.isArray(orderData.pharmacy_products) ? orderData.pharmacy_products : [];
                const hasPharmacyProducts = orderPharmacyProducts.length > 0;
                const hasExtraCatalogProducts = hasPharmacyProducts;

                const itemsHTML = items.map((item, idx) => {
                    const isSpecialService = (item.serviceType == 2);
                    const itemType = window.OrderData_UI?.getOrderItemType?.(item) || {};
                    const isPharmacyProduct = !!itemType.isPharmacy;
                    const isPharmacyDirectRequest = String(item.product_key || '') === 'PH_DIRECT_REQUEST' && hasExtraCatalogProducts;
                    const isAvailable = !unavailableKeys.includes(item.product_key);

                    // ITEM-LEVEL EDIT PERMISSION:
                    // Use simulated key if in simulation mode, otherwise use actual user key
                    const effectiveSellerKey = (activeOrderRole === 'commercial' && simulatedSellerKey) ? simulatedSellerKey : user.user_key;
                    const canEditThisItem = isAdminView || (isCommercialView && item.seller_key === effectiveSellerKey);

                    const photos = item.service_photos || [];
                    const hasPhotos = photos.length > 0;

                    const qty = parseFloat(item.quantity) || 1;
                    const price = isSpecialService
                        ? parseFloat(item.total_amount || item.realPrice || 0)
                        : parseFloat(item.catalog_product_price || item.product_price || 0);

                    const itemTotal = isSpecialService ? price : (qty * price);
                    // Only add to grand total if item is available
                    if (isAvailable) grandTotal += itemTotal;

                    // Condition: Service type 0, 1, or N/A
                    const showToggle = !isPharmacyProduct && (isSpecialService === false || !item.serviceType || item.serviceType == 0 || item.serviceType == 1);
                    const detailAction = isPharmacyProduct
                        ? `window.orderViewProductDetails('${item.product_key}', { isPharmacyProduct: true, sellerKey: '${item.pharmacy_seller_key || item.seller_key}' })`
                        : `window.orderViewProductDetails('${item.product_key}')`;
                    const detailsButtonHTML = isPharmacyDirectRequest
                        ? `<span id="order_prod_direct_req_hint_${idx}" style="background-color: #e0f2fe; color: #0369a1; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 700;">عناصر الطلب بالأسفل</span>`
                        : `<button id="order_prod_details_btn_${idx}" onclick="${detailAction}" style="background-color: #2196F3; color: white; border: none; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; display: inline-flex; align-items: center; gap: 4px;">
                                    <i id="order_prod_details_icon_${idx}" class="fas fa-external-link-alt"></i> <span id="order_prod_details_text_${idx}">التفاصيل</span>
                                </button>`;

                    return `
                    <div id="order_prod_card_${idx}" class="order_product_item" style="margin-bottom: 15px; padding: 10px; border: 1px solid #eee; border-radius: 8px; border-right: 5px solid ${isAvailable ? '#27ae60' : '#e74c3c'}; opacity: ${isAvailable ? '1' : '0.8'};">
                        <div id="order_prod_header_${idx}" style="display: flex; justify-content: space-between; align-items: center;">
                            <strong id="order_prod_title_${idx}" style="font-size: 1.1em; color: var(--accent-color);">${item.product_name}</strong>
                            <div id="order_prod_actions_${idx}" style="display: flex; align-items: center; gap: 8px;">
                                
                                ${showToggle ? `
                                    <div id="order_prod_avail_control_${idx}" style="display: flex; align-items: center; gap: 5px;">
                                        ${canEditThisItem ? `
                                            <label id="order_prod_avail_label_${idx}" style="cursor: pointer; display: flex; align-items: center; gap: 4px; background: #f8f9fa; padding: 2px 8px; border-radius: 12px; border: 1px solid #ddd; font-size: 0.8em;">
                                                <input id="order_prod_avail_chk_${idx}" type="checkbox" ${isAvailable ? 'checked' : ''} onchange="window.orderUpdateItemAvailability('${item.product_key}', this.checked)">
                                                <span id="order_prod_avail_text_${idx}" style="color: ${isAvailable ? '#27ae60' : '#e74c3c'}; font-weight: bold;">
                                                    ${isAvailable ? 'متوافر' : 'غير متوافر'}
                                                </span>
                                            </label>
                                        ` : `
                                            <span id="order_prod_avail_status_${idx}" style="font-size: 0.85em; color: ${isAvailable ? '#27ae60' : '#e74c3c'}; font-weight: bold;">
                                                <i class="fas ${isAvailable ? 'fa-check-circle' : 'fa-times-circle'}"></i> ${isAvailable ? 'متوافر' : 'غير متوافر'}
                                            </span>
                                        `}
                                    </div>
                                ` : ''}

                                ${(isSpecialService && hasPhotos) ? `
                                    <button id="order_prod_gal_btn_${idx}" onclick="window.orderOpenPhotoGallery('${orderData.user_key}', '${item.seller_key}', '${item.product_key}', '${orderData.order_key}')" style="background-color: #8e44ad; color: white; border: none; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; display: inline-flex; align-items: center; gap: 4px;">
                                        <i id="order_prod_gal_icon_${idx}" class="fas fa-images"></i> <span id="order_prod_gal_text_${idx}">الصور</span>
                                    </button>
                                ` : ''}
                                ${detailsButtonHTML}
                            </div>
                        </div>
                        
                        ${(isPharmacyProduct && isAvailable) ? `
                        <div id="order_prod_meta_${idx}" style="margin-top: 8px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.9em;">
                            <div id="order_prod_qty_box_${idx}"><strong id="order_prod_qty_label_${idx}">الكمية:</strong> <span id="order_prod_qty_val_${idx}">${item.quantity}</span></div>
                            <div id="order_prod_seller_box_${idx}"><strong id="order_prod_seller_label_${idx}">مقدم الخدمة:</strong> <span id="order_prod_seller_val_${idx}">${item.seller_name || item.seller_key}</span></div>
                        </div>
                        ` : ''}

                        ${(isSpecialService && !isPharmacyProduct && isAvailable) ? `
                        <div id="order_prod_meta_${idx}" style="margin-top: 8px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.9em;">
                            <div id="order_prod_total_box_${idx}"><strong id="order_prod_total_label_${idx}">قيمة الخدمة:</strong> <span id="order_prod_total_val_${idx}" style="color: #27ae60; font-weight: bold;">${price.toFixed(2)} ج.م</span></div>
                            <div id="order_prod_seller_box_${idx}"><strong id="order_prod_seller_label_${idx}">مقدم الخدمة:</strong> <span id="order_prod_seller_val_${idx}">${item.seller_name || item.seller_key}</span></div>
                        </div>
                        ` : ''}

                        ${(!isSpecialService && !isPharmacyProduct && isAvailable) ? `
                        <div id="order_prod_meta_${idx}" style="margin-top: 8px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.9em;">
                            <div id="order_prod_qty_box_${idx}"><strong id="order_prod_qty_label_${idx}">الكمية:</strong> <span id="order_prod_qty_val_${idx}">${item.quantity}</span></div>
                            <div id="order_prod_price_box_${idx}"><strong id="order_prod_price_label_${idx}">سعر القطعة:</strong> <span id="order_prod_price_val_${idx}">${price.toFixed(2)} ج.م</span></div>
                            <div id="order_prod_total_box_${idx}"><strong id="order_prod_total_label_${idx}">إجمالي الصنف:</strong> <span id="order_prod_total_val_${idx}" style="color: #27ae60; font-weight: bold;">${itemTotal.toFixed(2)} ج.م</span></div>
                            <div id="order_prod_seller_box_${idx}"><strong id="order_prod_seller_label_${idx}">مقدم الخدمة:</strong> <span id="order_prod_seller_val_${idx}">${item.seller_name || item.seller_key}</span></div>
                        </div>
                        ` : ''}

                        ${(!isAvailable && !isSpecialService && !isPharmacyProduct) ? `
                            <div id="order_prod_unavailable_alert_${idx}" style="margin-top: 10px; background: #fff5f5; color: #e74c3c; padding: 8px; border-radius: 4px; font-size: 0.85em; display: flex; align-items: center; gap: 8px; border: 1px solid #ffdada;">
                                <i class="fas fa-exclamation-triangle"></i> نعتذر، هذا المنتج غير متوفر في المخزون حالياً.
                            </div>
                        ` : ''}

                        ${item.note ? `<div id="order_prod_note_${idx}" style="margin-top: 5px; color: #666; font-style: italic;"><strong id="order_prod_note_label_${idx}">ملاحظة:</strong> <span id="order_prod_note_val_${idx}">${item.note}</span></div>` : ''}
                    </div>
                `;
                }).join('');
                const renderedItemKeys = new Set(items.map((item) => String(item.product_key || item.product_id || '')));
                const pharmacyItemsHTML = orderPharmacyProducts
                    .filter((item) => !renderedItemKeys.has(String(item.product_id || item.product_key || '')))
                    .map((item, idx) => {
                        const productId = item.product_id || item.product_key || '';
                        const sellerKey = item.seller_key || item.merchantKey || item.merchant_key || '';
                        const itemType = window.OrderData_UI?.getOrderItemType?.(item) || {};
                        const sourceLabel = itemType.isCar
                            ? 'منتج سيارات'
                            : (itemType.isRealEstate ? 'منتج عقارات' : 'منتج صيدلية');
                        const sellerLabel = itemType.isPharmacy ? 'الصيدلية:' : 'مقدم الخدمة:';
                        const actionOptions = {
                            isPharmacyProduct: itemType.isPharmacy === true,
                            sellerKey,
                            listingType: itemType.listingType || '',
                            viewPath: item.view_path || ''
                        };
                        return `
                            <div id="order_pharmacy_prod_card_${idx}" class="order_product_item" style="margin-bottom: 15px; padding: 10px; border: 1px solid #d8edf8; border-radius: 8px; border-right: 5px solid #0ea5e9;">
                                <div id="order_pharmacy_prod_header_${idx}" style="display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                                    <strong id="order_pharmacy_prod_title_${idx}" style="font-size: 1.1em; color: var(--accent-color);">${item.product_name || item.name || productId}</strong>
                                    <span id="order_pharmacy_prod_source_${idx}" style="background:#f1f5f9;color:#334155;padding:3px 8px;border-radius:999px;font-size:11px;font-weight:700;">${sourceLabel}</span>
                                    <button id="order_pharmacy_prod_details_btn_${idx}" onclick='window.orderViewProductDetails(${JSON.stringify(productId)}, ${JSON.stringify(actionOptions)})' style="background-color: #2196F3; color: white; border: none; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; display: inline-flex; align-items: center; gap: 4px;">
                                        <i id="order_pharmacy_prod_details_icon_${idx}" class="fas fa-external-link-alt"></i> <span id="order_pharmacy_prod_details_text_${idx}">التفاصيل</span>
                                    </button>
                                </div>
                                <div id="order_pharmacy_prod_meta_${idx}" style="margin-top: 8px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.9em;">
                                    <div id="order_pharmacy_prod_qty_box_${idx}"><strong id="order_pharmacy_prod_qty_label_${idx}">الكمية:</strong> <span id="order_pharmacy_prod_qty_val_${idx}">${item.quantity || 1}</span></div>
                                    <div id="order_pharmacy_prod_seller_box_${idx}"><strong id="order_pharmacy_prod_seller_label_${idx}">${sellerLabel}</strong> <span id="order_pharmacy_prod_seller_val_${idx}">${sellerKey || 'غير متوفر'}</span></div>
                                </div>
                            </div>
                        `;
                    }).join('');

                const containerHTML = `
                    <div id="order_products_list_container" style="padding: 10px;">
                        ${itemsHTML}
                        ${pharmacyItemsHTML}
                        ${(!itemsHTML && !pharmacyItemsHTML) ? '<div id="order_no_products_msg" class="order_no_data">لا توجد بيانات للخدمات.</div>' : ''}
                        ${(itemsHTML && !hasSpecialService) ? `
                            <div id="order_products_grand_total_box" style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-top: 2px solid #2196F3; border-radius: 0 0 8px 8px; text-align: center;">
                                <strong id="order_products_grand_total_label" style="font-size: 1.2em;">إجمالي قائمة الخدمات المتوفرة: <span id="order_products_grand_total_val" style="color: #2196F3;">${grandTotal.toFixed(2)} ج.م</span></strong>
                            </div>
                        ` : ''}
                    </div>
                `;
                contentEl.innerHTML = containerHTML;
            }
        }
    }
};
