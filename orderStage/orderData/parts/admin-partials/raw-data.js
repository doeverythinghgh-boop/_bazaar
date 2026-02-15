/**
 * @file orderStage/orderData/parts/admin-partials/raw-data.js
 * @description Generates the raw JSON view for the Super Admin view.
 */
window.OrderData_Admin_RawData = {
    render: function (order, statusObj) {
        return `
            <details id="order_sec_tech" class="order_section order_technical_section">
                <summary id="order_title_tech" class="order_section_title">
                    <i class="fas fa-terminal"></i> system_metadata_output (Click to Expand)
                </summary>
                <div id="order_cont_tech" class="order_section_content order_raw_data_view">
                    <div id="order_tech_sync" style="display: flex; align-items: center; margin-bottom: 10px;">
                        <span id="order_tech_sync_pulse" class="order_tech_sync_pulse"></span>
                        <strong id="order_tech_sync_label">آخر مزامنة:</strong> <span id="order_tech_sync_val" style="margin-right: 10px;">${order.last_sync_at || 'غير متوفر'}</span>
                    </div>
                    <div id="order_tech_role">
                        <i id="order_tech_role_icon" class="fas fa-user-tag" style="width: 20px;"></i> <strong id="order_tech_role_label">سياق الدور:</strong> <code id="order_tech_role_val">${(order.role_context === 'admin' ? 'سوبر أدمن' : (order.role_context || 'N/A'))}</code>
                    </div>
                    <div id="order_tech_id" style="margin-top: 5px;">
                        <i id="order_tech_finger_icon" class="fas fa-fingerprint" style="width: 20px;"></i> <strong id="order_tech_finger_label">بصمة الطلب:</strong> <code id="order_tech_finger_val">${order.order_key}</code>
                    </div>

                    <div id="order_json_header" style="margin-top: 20px; font-weight: bold; display: flex; align-items: center; gap: 10px;">
                        <i id="order_json_header_icon" class="fas fa-file-code"></i> RAW_JSON_PAYLOAD:
                    </div>
                    <pre id="order_tech_json" style="background: #000; border: 1px solid rgba(255,255,255,0.2);">${JSON.stringify(order, null, 2)}</pre>
                </div>
            </details>
        `;
    }
};
