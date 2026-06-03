/**
 * @file orderStage/orderData/parts/admin-partials/items-list.js
 * @description Generates the full items list view for Super Admin.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

window.OrderData_Admin_ItemsList = {
    render: function (order, itemsHTML) {
        return `
            <div id="order_sec_items" class="order_section">
                <div id="order_title_items" class="order_section_title"><i class="fas fa-box-open"></i> تفاصيل الخدمات والموردين</div>
                <div id="order_cont_items" class="order_section_content">
                    ${itemsHTML || '<div id="order_no_items" class="order_no_data">لا توجد بيانات للخدمات في هذا الطلب.</div>'}
                </div>
            </div>
        `;
    },

    renderPharmacyRow: function (item, idx) {
        const productId = item.product_id || item.product_key || '';
        const sellerKey = item.seller_key || item.merchantKey || item.merchant_key || '';
        const itemType = window.OrderData_UI?.getOrderItemType?.(item) || {};
        const sourceLabel = itemType.isCar
            ? 'منتج سيارات'
            : (itemType.isRealEstate ? 'منتج عقارات' : 'منتج صيدلية');
        const sellerLabel = itemType.isPharmacy ? 'الصيدلية:' : 'مقدم الخدمة:';
        const detailsLabel = itemType.isPharmacy ? 'عرض تفاصيل منتج الصيدلية' : 'عرض تفاصيل المنتج';
        const actionOptions = {
            isPharmacyProduct: itemType.isPharmacy === true,
            sellerKey,
            listingType: itemType.listingType || '',
            viewPath: item.view_path || ''
        };

        return `
            <div id="order_pharmacy_item_row_${idx}" class="order_item_row">
                <div id="order_pharmacy_item_info_${idx}" class="order_item_main_info">
                    <span id="order_pharmacy_prod_name_${idx}" class="order_product_name">${item.product_name || item.name || productId}</span>
                    <span id="order_pharmacy_prod_price_${idx}" class="order_product_price">${sourceLabel}</span>
                </div>
                <div id="order_pharmacy_meta_grid_${idx}" class="order_item_meta_grid">
                    <div id="order_pharmacy_meta_qty_${idx}" class="order_meta_box"><strong>الكمية:</strong> ${item.quantity || 1}</div>
                    <div id="order_pharmacy_meta_pkey_${idx}" class="order_meta_box"><strong>رقم المنتج (Key):</strong> ${productId}</div>
                    <div id="order_pharmacy_meta_skey_${idx}" class="order_meta_box"><strong>${sellerLabel}</strong> ${sellerKey || 'N/A'}</div>
                </div>
                <div id="order_pharmacy_actions_${idx}" class="order_item_actions" style="margin-top: 10px; border-top: 1px solid #eee; padding-top: 10px;">
                    <button id="order_pharmacy_view_btn_${idx}" onclick='window.orderViewProductDetails(${JSON.stringify(productId)}, ${JSON.stringify(actionOptions)})' style="background-color: #2196F3; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 14px; display: inline-flex; align-items: center; gap: 8px;">
                        <i class="fas fa-external-link-alt"></i> ${detailsLabel}
                    </button>
                </div>
            </div>
        `;
    },

    renderRow: function (item, idx, order) {
        const itemType = window.OrderData_UI?.getOrderItemType?.(item) || {};
        const isPharmacyProduct = !!itemType.isPharmacy;
        const hasPharmacyProducts = Array.isArray(order?.pharmacy_products) && order.pharmacy_products.length > 0;
        const isPharmacyDirectRequest = String(item.product_key || '') === 'PH_DIRECT_REQUEST' && hasPharmacyProducts;
        const detailAction = isPharmacyProduct
            ? `window.orderViewProductDetails('${item.product_key}', { isPharmacyProduct: true, sellerKey: '${item.pharmacy_seller_key || item.seller_key}' })`
            : `window.orderViewProductDetails('${item.product_key}')`;
        const detailsButtonHTML = isPharmacyDirectRequest
            ? `<span id="order_view_direct_req_hint_${idx}" style="background-color: #e0f2fe; color: #0369a1; padding: 8px 16px; border-radius: 4px; font-size: 14px; font-weight: 700;">عناصر الطلب معروضة بالأسفل</span>`
            : `<button id="order_view_btn_${idx}" onclick="${detailAction}" style="background-color: #2196F3; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 14px; display: inline-flex; align-items: center; gap: 8px;">
                        <i class="fas fa-external-link-alt"></i> عرض تفاصيل المنتج
                    </button>`;
        const deliveriesHTML = (item.supplier_delivery || []).map((del, dIdx) => `
            <div id="order_delivery_${idx}_${dIdx}" class="order_delivery_person">
                <i id="order_delivery_icon_${idx}_${dIdx}" class="fas fa-truck"></i> 
                <strong id="order_delivery_label_${idx}_${dIdx}">المندوب:</strong> <span id="order_delivery_name_${idx}_${dIdx}">${del.delivery_name}</span> 
                <br id="order_delivery_br1_${idx}_${dIdx}">&nbsp;&nbsp;&nbsp;• <span id="order_delivery_id_label_${idx}_${dIdx}">المعرف:</span> <span id="order_delivery_id_val_${idx}_${dIdx}">${del.delivery_key}</span>
                <br id="order_delivery_br2_${idx}_${dIdx}">&nbsp;&nbsp;&nbsp;• <span id="order_delivery_phone_label_${idx}_${dIdx}">الهاتف:</span> ${window.orderFormatPhone(del.delivery_phone)}
                <div id="order_delivery_token_mini_${idx}_${dIdx}" style="margin: 4px 0 0 20px; font-size: 0.7em; color: #7f8c8d;">
                    <i class="fas ${del.platform === 'android' ? 'fa-android' : 'fa-globe'}" style="font-size: 0.9em; color: ${del.platform === 'android' ? '#3DDC84' : '#2196F3'};"></i>
                    <strong>التوكن:</strong> <code>${(del.fcm_token ? del.fcm_token.substring(0, 15) + '...' : 'غير متوفر')}</code>
                </div>
            </div>
        `).join('');

        return `
            <div id="order_item_row_${idx}" class="order_item_row">
                <div id="order_item_info_${idx}" class="order_item_main_info">
                    <span id="order_prod_name_${idx}" class="order_product_name">${item.product_name}</span>
                    <span id="order_prod_price_${idx}" class="order_product_price">
                        ${item.catalog_product_price || 0} ج.م
                        ${(item.original_price && item.original_price > item.catalog_product_price) ? `
                            <span id="order_orig_price_${idx}" class="order_original_price_strike">${item.original_price} ج.م</span>
                            <span id="order_discount_${idx}" class="order_discount_tag">وفر ${(item.original_price - item.catalog_product_price).toFixed(2)} ج.م</span>
                        ` : ''}
                    </span>
                    ${item.heavyLoad == 1 ? `
                        <span id="order_heavy_${idx}" class="order_heavy_load_badge" title="منتج ثقيل يحتاج رافعة أو مساعدة">
                            <i class="fas fa-truck-loading"></i> حمولة ثقيلة
                        </span>
                    ` : ''}
                </div>
                
                <div id="order_seller_card_${idx}" class="order_seller_card_mini">
                    <div id="order_seller_header_${idx}" class="order_seller_info_header">
                        <i class="fas fa-store"></i> <strong>بيانات مقدم الخدمة:</strong>
                    </div>
                    <div id="order_seller_details_${idx}" class="order_seller_details">
                        <span id="order_seller_name_${idx}" class="order_seller_name_text">${item.seller_name || 'مقدم خدمة غير معروف'}</span>
                        <div id="order_seller_loc_${idx}" class="order_seller_location_info" style="margin: 4px 0; font-size: 0.9em; color: #555;">
                                <i class="fas fa-map-marker-alt" style="color: #E91E63;"></i> ${window.orderFormatLocation(item.seller_location, item.seller_name)}
                        </div>
                        ${window.orderFormatPhone(item.seller_phone)}
                        <span id="order_seller_key_${idx}" class="order_seller_key_tag">#${item.seller_key}</span>
                        <div id="order_seller_token_mini_${idx}" style="margin-top: 8px; font-size: 0.7em; background: rgba(255,255,255,0.5); padding: 4px; border-radius: 4px; border: 1px dashed #ccc;">
                            <i class="fas ${item.seller_platform === 'android' ? 'fa-android' : 'fa-globe'}" style="color: ${item.seller_platform === 'android' ? '#3DDC84' : '#2196F3'};"></i>
                            <strong>توكن مقدم الخدمة:</strong> <code style="word-break: break-all; color: #666;">${(item.seller_fcm_token ? item.seller_fcm_token.substring(0, 20) + '...' : 'غير متوفر')}</code>
                        </div>
                    </div>
                </div>

                <div id="order_meta_grid_${idx}" class="order_item_meta_grid">
                    <div id="order_meta_qty_${idx}" class="order_meta_box"><strong>الكمية:</strong> ${item.quantity}</div>
                    <div id="order_meta_pkey_${idx}" class="order_meta_box"><strong>رقم المنتج (Key):</strong> ${item.product_key}</div>
                    
                    <div id="order_meta_orig_price_${idx}" class="order_meta_box"><strong>السعر قبل الخصم:</strong> ${item.original_price || 'N/A'} ج.م</div>
                    <div id="order_meta_item_price_${idx}" class="order_meta_box"><strong>سعر القطعة:</strong> ${item.catalog_product_price || 'N/A'} ج.م</div>
                    <div id="order_meta_app_price_${idx}" class="order_meta_box"><strong>سعر التطبيق:</strong> ${item.realPrice || 'N/A'} ج.م</div>
                    
                    <div id="order_meta_stype_${idx}" class="order_meta_box"><strong>نوع الخدمة:</strong> ${item.serviceType || 'N/A'} 
                        ${(item.serviceType == 2) ? `<span id="order_serv_badge_${idx}" class="order_service_badge">خدمة خاصة</span>` : ''}
                    </div>
                    <div id="order_meta_skey_${idx}" class="order_meta_box"><strong>معرف مقدم الخدمة:</strong> ${item.seller_key}</div>
                    <div id="order_meta_status_${idx}" class="order_meta_box"><strong>حالة العنصر:</strong> ${item.item_status || 'N/A'}</div>
                </div>

                ${(item.serviceType == 2) ? (function () {
                const photos = item.service_photos || [];
                const hasPhotos = photos.length > 0;
                return `
                        <div id="order_serv_data_${idx}" class="order_service_special_data">
                            <div id="order_serv_val_${idx}" class="order_service_value_display">
                                <i class="fas fa-tag"></i> <strong>قيمة الطلب المحددة:</strong> 
                                <span id="order_serv_amt_${idx}" class="order_value_amount">${item.total_amount || order.total_amount || 0} ج.م</span>
                            </div>
                            ${hasPhotos ? `
                            <div id="order_gal_cont_${idx}" class="order_service_gallery_container">
                                <strong><i class="fas fa-images"></i> صور الطلب المرفقة:</strong>
                                <div id="order_mini_gal_${idx}" class="order_service_mini_gallery">
                                    ${photos.map((url, pIdx) => `
                                        <div id="order_photo_wrap_${idx}_${pIdx}" class="order_mini_photo_wrapper">
                                            <img id="order_photo_img_${idx}_${pIdx}" src="${url}" onerror="if(this.src && this.src.endsWith('.webp')){ this.src=this.src.replace('.webp','.jpg') } else { this.parentElement.style.display='none' }" onclick="window.open(this.src, '_blank')">
                                        </div>
                                    `).join('')}
                                </div>
                                <button id="order_full_gal_btn_${idx}" class="order_full_gallery_btn" onclick="window.orderOpenPhotoGallery('${order.user_key}', '${item.seller_key}', '${item.product_key}', '${order.order_key}')">
                                    <i class="fas fa-expand-arrows-alt"></i> فتح معرض الصور الكامل
                                </button>
                            </div>
                            ` : ''}
                        </div>`;
            })() : ''}

                ${item.note ? `<div id="order_note_${idx}" class="order_item_note"><strong>ملاحظة العميل:</strong> ${item.note}</div>` : ''}
                
                <div id="order_unified_logistics_${idx}" class="order_unified_logistics_card" style="margin-top: 15px; padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;">
                    <div id="order_logistics_header_${idx}" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: ${deliveriesHTML ? '10px' : '0'};">
                        <span id="order_logistics_title_${idx}" style="font-weight: bold; color: #475569; font-size: 0.9em;"><i id="order_logistics_icon_${idx}" class="fas fa-truck-loading"></i> الحالة اللوجستية للسلعة</span>
                        <span id="order_seller_delivery_${idx}" class="order_logistics_badge" style="padding: 4px 10px; border-radius: 20px; font-size: 0.75em; font-weight: bold; background: ${item.seller_is_delivered == 1 ? '#dcfce7' : '#dbeafe'}; color: ${item.seller_is_delivered == 1 ? '#166534' : '#1e40af'}; text-align: center;">
                            <i id="order_logistics_badge_icon_${idx}" class="fas ${item.seller_is_delivered == 1 ? 'fa-store' : 'fa-shuttle-van'}"></i>
                            <span id="order_logistics_badge_text_${idx}">${item.seller_is_delivered == 1 ? 'توصيل خاص بالمحل' : 'توصيل عبر Bazaar'}</span>
                        </span>
                    </div>
                    ${deliveriesHTML ? `
                        <div id="order_del_cont_${idx}" class="order_assigned_couriers" style="border-top: 1px dashed #cbd5e1; padding-top: 10px;">
                            <div id="order_del_crew_title_${idx}" style="font-size: 0.8em; color: #64748b; margin-bottom: 8px;"><i id="order_del_crew_icon_${idx}" class="fas fa-user-check"></i> طاقم التوصيل المخصص:</div>
                            ${deliveriesHTML}
                        </div>
                    ` : ''}
                </div>

                <div id="order_actions_${idx}" class="order_item_actions" style="margin-top: 10px; border-top: 1px solid #eee; padding-top: 10px;">
                    ${detailsButtonHTML}
                </div>
            </div>
        `;
    }
};
