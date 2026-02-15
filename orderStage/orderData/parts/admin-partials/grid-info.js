/**
 * @file orderStage/orderData/parts/admin-partials/grid-info.js
 * @description Generates the financial and logistics grid for the Super Admin view.
 */
window.OrderData_Admin_GridInfo = {
    render: function (order, statusObj) {
        return `
            <div id="order_sec_grid" class="order_section_grid">
                <div id="order_sec_fin" class="order_section">
                    <div id="order_title_fin" class="order_section_title"><i class="fas fa-money-check-alt"></i> البيانات المالية</div>
                    <div id="order_cont_fin" class="order_section_content order_financial_info">
                        <div id="order_total_lbl" class="order_total_label">إجمالي الفاتورة</div>
                        <div id="order_total_val" class="order_total_value">${order.total_amount} ج.م</div>
                    </div>
                </div>
                
                <div id="order_sec_log" class="order_section">
                    <div id="order_title_log" class="order_section_title"><i class="fas fa-stream"></i> الحالة اللوجستية</div>
                    <div id="order_cont_log" class="order_section_content">
                        <div id="order_log_type" class="order_info_item"><strong>نوع الطلب الرقمي:</strong> ${order.orderType} 
                            (${order.orderType === 0 ? 'استلام' : (order.orderType === 1 ? 'توصيل' : 'غير محدد')})
                        </div>
                        <div id="order_log_status" class="order_info_item"><strong>بيانات الحالة (JSON):</strong> 
                            <pre id="order_raw_status" class="raw_status" style="background:#f4f4f4; padding:10px; border-radius:8px; font-size:0.85em; overflow:auto; max-height:200px; color:#333;">${JSON.stringify(statusObj, null, 2)}</pre>
                        </div>
                        <div id="order_status_badge" class="order_status_badge_large">خطوة رقم: ${statusObj.step_id}</div>
                        
                        <div id="order_status_parts" class="order_status_breakdown" style="margin-top:15px; border-top:1px solid #eee; padding-top:10px;">
                            <strong id="order_status_anal_title">تحليل محتوى الحالة:</strong>
                            <ul id="order_status_list" style="margin-top:8px;">
                                <li id="order_status_li_ver"><strong id="order_status_lbl_ver">الإصدار:</strong> <span id="order_status_val_ver">${statusObj.version || "N/A"}</span></li>
                                <li id="order_status_li_upd"><strong id="order_status_lbl_upd">توقيت التحديث:</strong> <span id="order_status_val_upd">${statusObj.last_updated}</span></li>
                                <li id="order_status_li_unav"><strong id="order_status_lbl_unav">المنتجات غير المتوفرة:</strong> <span id="order_status_val_unav">${statusObj.unavailable_product_keys?.length || 0}</span></li>
                                <li id="order_status_li_items"><strong id="order_status_lbl_items">حالات المواد الفردية:</strong> <span id="order_status_val_items">${Object.keys(statusObj.item_statuses || {}).length}</span></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
};
