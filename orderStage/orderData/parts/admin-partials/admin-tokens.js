/**
 * @file orderStage/orderData/parts/admin-partials/admin-tokens.js
 * @description Component to display Admin and Super Admin tokens in the technical view.
 */
window.OrderData_Admin_Tokens = {
    render: function (order) {
        const tokens = order.admin_tokens || [];
        if (tokens.length === 0) return '';

        return `
            <div id="order_sec_admin_tokens" class="order_section order_technical_section" style="margin-top: 20px;">
                <div id="order_title_admin_tokens" class="order_section_title">
                    <i class="fas fa-user-shield"></i> بيانات التوكن للصلاحيات الإدارية (Admins FCM)
                </div>
                <div id="order_cont_admin_tokens" class="order_section_content" style="background: #fdfdfd; padding: 10px;">
                    <div style="font-size: 0.85em; color: #666; margin-bottom: 12px; border-bottom: 1px dashed #eee; padding-bottom: 8px;">
                        <i class="fas fa-info-circle"></i> تظهر هذه القائمة جميع مدراء النظام المسجلين حالياً والذين يمتلكون توكن نشط للإشعارات.
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px;">
                        ${tokens.map((admin, idx) => `
                            <div id="order_admin_token_card_${idx}" style="background: #fff; border: 1px solid #e1e4e8; border-radius: 10px; padding: 12px; box-shadow: 0 2px 5px rgba(0,0,0,0.03);">
                                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                                    <span style="font-weight: bold; color: #1a73e8;"><i class="fas fa-user-cog"></i> ${admin.username}</span>
                                    <span style="font-size: 0.75em; background: ${admin.role == 4 ? '#e8f0fe' : '#fef2f2'}; color: ${admin.role == 4 ? '#1967d2' : '#b91c1c'}; padding: 2px 8px; border-radius: 12px; font-weight: bold;">
                                        ${admin.role == 4 ? 'سوبر آدمن' : 'آدمن'}
                                    </span>
                                </div>
                                <div style="font-size: 0.8em; color: #5f6368; margin-bottom: 6px;">
                                    <i class="fas ${admin.platform === 'android' ? 'fa-android' : 'fa-globe'}" style="color: ${admin.platform === 'android' ? '#3DDC84' : '#2196F3'}; width: 18px;"></i>
                                    <strong>المنصة:</strong> ${admin.platform === 'android' ? 'أندرويد' : 'ويب'}
                                </div>
                                <div style="font-size: 0.7em; color: #70757a; display: flex; flex-direction: column; gap: 4px;">
                                    <strong>TOKEN_ACCESS:</strong>
                                    <code style="display: block; background: #f8f9fa; padding: 8px; border: 1px solid #eee; border-radius: 6px; word-break: break-all; max-height: 100px; overflow-y: auto;">
                                        ${admin.fcm_token}
                                    </code>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }
};
