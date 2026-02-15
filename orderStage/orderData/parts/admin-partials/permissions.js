/**
 * @file orderStage/orderData/parts/admin-partials/permissions.js
 * @description Generates the permissions table for the Super Admin view.
 */
window.OrderData_Admin_Permissions = {
    render: function () {
        return `
            <div id="order_sec_permissions" class="order_section">
                <div id="order_title_permissions" class="order_section_title"><i class="fas fa-user-lock"></i> خريطة معرفات اللوحات والصلاحيات</div>
                <div id="order_cont_permissions" class="order_section_content">
                    <table id="order_permissions_table" style="width: 100%; border-collapse: collapse; font-size: 0.9em; text-align: right; margin-bottom: 20px;">
                        <thead>
                            <tr style="background: #f0f0f0; border-bottom: 2px solid #ddd;">
                                <th style="padding: 8px; border: 1px solid #ddd;">المعرف (ID)</th>
                                <th style="padding: 8px; border: 1px solid #ddd;">اسم اللوحة</th>
                                <th style="padding: 8px; border: 1px solid #ddd;">من يمكنه المشاهدة</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr id="order_perm_row_prod">
                                <td id="order_perm_id_prod" style="padding: 8px; border: 1px solid #ddd;"><code id="order_perm_code_prod">order_role_products</code></td>
                                <td id="order_perm_name_prod" style="padding: 8px; border: 1px solid #ddd;">لوحة المنتجات</td>
                                <td id="order_perm_view_prod" style="padding: 8px; border: 1px solid #ddd;">الجميع (أدمن، بائع، مشتري، مندوب)</td>
                            </tr>
                            <tr id="order_perm_row_buyer">
                                <td id="order_perm_id_buyer" style="padding: 8px; border: 1px solid #ddd; background: #fafafa;"><code id="order_perm_code_buyer">order_role_buyer</code></td>
                                <td id="order_perm_name_buyer" style="padding: 8px; border: 1px solid #ddd; background: #fafafa;">لوحة المشتري</td>
                                <td id="order_perm_view_buyer" style="padding: 8px; border: 1px solid #ddd; background: #fafafa;">سوبر أدمن، أدمن، مشتري فقط</td>
                            </tr>
                            <tr id="order_perm_row_seller">
                                <td id="order_perm_id_seller" style="padding: 8px; border: 1px solid #ddd;"><code id="order_perm_code_seller">order_role_seller</code></td>
                                <td id="order_perm_name_seller" style="padding: 8px; border: 1px solid #ddd;">لوحة البائع</td>
                                <td id="order_perm_view_seller" style="padding: 8px; border: 1px solid #ddd;">سوبر أدمن، أدمن، بائع فقط</td>
                            </tr>
                            <tr id="order_perm_row_del">
                                <td id="order_perm_id_del" style="padding: 8px; border: 1px solid #ddd; background: #fafafa;"><code id="order_perm_code_del">order_role_delivery</code></td>
                                <td id="order_perm_name_del" style="padding: 8px; border: 1px solid #ddd; background: #fafafa;">لوحة التوصيل</td>
                                <td id="order_perm_view_del" style="padding: 8px; border: 1px solid #ddd; background: #fafafa;">سوبر أدمن، أدمن، مندوب فقط</td>
                            </tr>
                            <tr id="order_perm_row_admin" style="color: #c0392b; font-weight: bold;">
                                <td id="order_perm_id_admin" style="padding: 8px; border: 1px solid #ddd;"><code id="order_perm_code_admin">order_admaindata</code></td>
                                <td id="order_perm_name_admin" style="padding: 8px; border: 1px solid #ddd;">تفاصيل الطلب (أدمن)</td>
                                <td id="order_perm_view_admin" style="padding: 8px; border: 1px solid #ddd;">سوبر أدمن فقط</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }
};
