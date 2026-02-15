/**
 * @file orderStage/orderData/parts/admin-partials\workflow-guide.js
 * @description Generates the workflow guide table with interactive radio buttons.
 */
window.OrderData_Admin_WorkflowGuide = {
    render: function (statusObj) {
        return `
            <div id="order_workflow_title" class="order_section_title" style="margin-top:20px; color: #27ae60;">
                <i class="fas fa-project-diagram"></i> دليل مراحل سير الطلب (الخدمات القياسية Standard Only)
            </div>
            <table id="order_workflow_table" style="width: 100%; border-collapse: collapse; font-size: 0.9em; text-align: right; border: 1px solid #27ae60;">
                <thead>
                    <tr style="background: #eafaf1; border-bottom: 2px solid #27ae60;">
                        <th style="padding: 8px; border: 1px solid #ddd;">المرحلة (Step ID)</th>
                        <th style="padding: 8px; border: 1px solid #ddd;">الوصف والهدف</th>
                        <th style="padding: 8px; border: 1px solid #ddd;">المتحكم المسؤول (Action Owner)</th>
                        <th style="padding: 8px; border: 1px solid #ddd;">الإشعارات الناتجة</th>
                    </tr>
                </thead>
                <tbody>
                    <tr id="order_wkf_row_0">
                        <td id="order_wkf_td_id_0" style="padding: 8px; border: 1px solid #ddd; color: #7f8c8d; font-weight: bold;">
                            <label id="order_wkf_lbl_0" style="cursor: pointer; display: flex; align-items: center; gap: 8px;">
                                <input id="order_wkf_rad_0" type="radio" name="admin_order_step" value="0" ${statusObj.step_id == 0 ? 'checked' : ''} onchange="window.orderAdminConfirmUpdateStep(0)">
                                0- معلق (Pending)
                            </label>
                        </td>
                        <td id="order_wkf_td_desc_0" style="padding: 8px; border: 1px solid #ddd;">تم إنشاء الطلب وبانتظار معاينة البائع</td>
                        <td id="order_wkf_td_own_0" style="padding: 8px; border: 1px solid #ddd;">النظام (تلقائي)</td>
                        <td id="order_wkf_td_notif_0" style="padding: 8px; border: 1px solid #ddd;">تنبيه للبائع بوجود طلب جديد</td>
                    </tr>
                    <tr id="order_wkf_row_1">
                        <td id="order_wkf_td_id_1" style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">
                            <label id="order_wkf_lbl_1" style="cursor: pointer; display: flex; align-items: center; gap: 8px;">
                                <input id="order_wkf_rad_1" type="radio" name="admin_order_step" value="1" ${statusObj.step_id == 1 ? 'checked' : ''} onchange="window.orderAdminConfirmUpdateStep(1)">
                                1- المراجعة (Review)
                            </label>
                        </td>
                        <td id="order_wkf_td_desc_1" style="padding: 8px; border: 1px solid #ddd;">تأكيد البائع لتوافر المنتجات وتجهيزها للتغليف</td>
                        <td id="order_wkf_td_own_1" style="padding: 8px; border: 1px solid #ddd;">البائع، الأدمن</td>
                        <td id="order_wkf_td_notif_1" style="padding: 8px; border: 1px solid #ddd;">تنبيه للمشتري (الطلب قيد التجهيز)</td>
                    </tr>
                    <tr id="order_wkf_row_2">
                        <td id="order_wkf_td_id_2" style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9; font-weight: bold;">
                            <label id="order_wkf_lbl_2" style="cursor: pointer; display: flex; align-items: center; gap: 8px;">
                                <input id="order_wkf_rad_2" type="radio" name="admin_order_step" value="2" ${statusObj.step_id == 2 ? 'checked' : ''} onchange="window.orderAdminConfirmUpdateStep(2)">
                                2- الشحن (Shipping)
                            </label>
                        </td>
                        <td id="order_wkf_td_desc_2" style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;">تسليم المنتجات لمندوب التوصيل وبدء التحرك</td>
                        <td id="order_wkf_td_own_2" style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;">البائع، المندوب</td>
                        <td id="order_wkf_td_notif_2" style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;">تتبع حي (المندوب استلم الشحنة)</td>
                    </tr>
                    <tr id="order_wkf_row_3">
                        <td id="order_wkf_td_id_3" style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">
                            <label id="order_wkf_lbl_3" style="cursor: pointer; display: flex; align-items: center; gap: 8px;">
                                <input id="order_wkf_rad_3" type="radio" name="admin_order_step" value="3" ${statusObj.step_id == 3 ? 'checked' : ''} onchange="window.orderAdminConfirmUpdateStep(3)">
                                3- التسليم (Delivery)
                            </label>
                        </td>
                        <td id="order_wkf_td_desc_3" style="padding: 8px; border: 1px solid #ddd;">وصول المندوب لموقع العميل (جاهز للتسليم)</td>
                        <td id="order_wkf_td_own_3" style="padding: 8px; border: 1px solid #ddd;">المندوب فقط</td>
                        <td id="order_wkf_td_notif_3" style="padding: 8px; border: 1px solid #ddd;">تنبيه للمشتري (المندوب بالخارج)</td>
                    </tr>
                    <tr id="order_wkf_row_4">
                        <td id="order_wkf_td_id_4" style="padding: 8px; border: 1px solid #ddd; background: #d4edda; color: #155724; font-weight: bold;">
                            <label id="order_wkf_lbl_4" style="cursor: pointer; display: flex; align-items: center; gap: 8px;">
                                <input id="order_wkf_rad_4" type="radio" name="admin_order_step" value="4" ${statusObj.step_id == 4 ? 'checked' : ''} onchange="window.orderAdminConfirmUpdateStep(4)">
                                4- مكتمل (Completed)
                            </label>
                        </td>
                        <td id="order_wkf_td_desc_4" style="padding: 8px; border: 1px solid #ddd; background: #d4edda; color: #155724;">استلام العميل للمنتج فعلياً وإغلاق الطلب</td>
                        <td id="order_wkf_td_own_4" style="padding: 8px; border: 1px solid #ddd; background: #d4edda; color: #155724;">المشتري (حصراً)</td>
                        <td id="order_wkf_td_notif_4" style="padding: 8px; border: 1px solid #ddd; background: #d4edda; color: #155724;">إبلاغ البائع والمندوب بالنجاح</td>
                    </tr>
                    <tr id="order_wkf_row_5">
                        <td id="order_wkf_td_id_5" style="padding: 8px; border: 1px solid #ddd; font-weight: bold; color: #c0392b;">
                            <label id="order_wkf_lbl_5" style="cursor: pointer; display: flex; align-items: center; gap: 8px;">
                                <input id="order_wkf_rad_5" type="radio" name="admin_order_step" value="5" ${statusObj.step_id == 5 ? 'checked' : ''} onchange="window.orderAdminConfirmUpdateStep(5)">
                                5- ملغي (Cancelled)
                            </label>
                        </td>
                        <td id="order_wkf_td_desc_5" style="padding: 8px; border: 1px solid #ddd; color: #c0392b;">إلغاء الطلب بالكامل (متاح قبل مرحلة الشحن)</td>
                        <td id="order_wkf_td_own_5" style="padding: 8px; border: 1px solid #ddd; color: #c0392b;">المشتري، الأدمن</td>
                        <td id="order_wkf_td_notif_5" style="padding: 8px; border: 1px solid #ddd; color: #c0392b;">تنبيه بالإلغاء لجميع الأطراف</td>
                    </tr>
                    <tr id="order_wkf_row_ret">
                        <td id="order_wkf_td_id_ret" style="padding: 8px; border: 1px solid #ddd; font-weight: bold; color: #c0392b;">
                                <label id="order_wkf_lbl_ret" style="cursor: pointer; display: flex; align-items: center; gap: 8px;">
                                <input id="order_wkf_rad_ret" type="radio" name="admin_order_step" value="-1" disabled>
                                حالة خاصة: مرتجع
                            </label>
                        </td>
                        <td id="order_wkf_td_desc_ret" style="padding: 8px; border: 1px solid #ddd; color: #c0392b;">رفض المشتري للاستلام أو فشل الوصول</td>
                        <td id="order_wkf_td_own_ret" style="padding: 8px; border: 1px solid #ddd; color: #c0392b;">المندوب، الأدمن</td>
                        <td id="order_wkf_td_notif_ret" style="padding: 8px; border: 1px solid #ddd; color: #c0392b;">تقرير مشكلة للبائع والإدارة</td>
                    </tr>
                    <tr id="order_wkf_row_rate">
                        <td id="order_wkf_td_id_rate" style="padding: 8px; border: 1px solid #ddd; font-weight: bold; color: #004085;">
                            <label id="order_wkf_lbl_rate" style="cursor: pointer; display: flex; align-items: center; gap: 8px;">
                                <input id="order_wkf_rad_rate" type="radio" name="admin_order_step" value="-2" disabled>
                                ما بعد الطلب: تقييم
                            </label>
                        </td>
                        <td id="order_wkf_td_desc_rate" style="padding: 8px; border: 1px solid #ddd; color: #004085;">إبداء الرأي في جودة المنتج والخدمة</td>
                        <td id="order_wkf_td_own_rate" style="padding: 8px; border: 1px solid #ddd; color: #004085;">المشتري فقط</td>
                        <td id="order_wkf_td_notif_rate" style="padding: 8px; border: 1px solid #ddd; color: #004085;">تحديث تقييم البائع والمنتج</td>
                    </tr>
                </tbody>
            </table>

            <div id="order_service_diff_title" class="order_section_title" style="margin-top:25px; color: #8e44ad;">
                <i class="fas fa-balance-scale"></i> مقارنة أنواع الخدمات (Service Types Comparison)
            </div>
            <table id="order_service_compare_table" style="width: 100%; border-collapse: collapse; font-size: 0.85em; text-align: right; border: 1px solid #9b59b6; margin-bottom: 20px;">
                <thead>
                    <tr style="background: #f4ecf7; border-bottom: 2px solid #9b59b6;">
                        <th style="padding: 8px; border: 1px solid #ddd; width: 20%;">وجه المقارنة</th>
                        <th style="padding: 8px; border: 1px solid #ddd; width: 40%;">الخدمات القياسية (0, 1, N/A)</th>
                        <th style="padding: 8px; border: 1px solid #ddd; width: 40%;">الخدمات الخاصة (Type 2)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">شريط المراحل (Stepper)</td>
                        <td style="padding: 8px; border: 1px solid #ddd; background: #eafaf1; color: #27ae60;">
                            <i class="fas fa-check"></i> ظاهر ويعمل (3 مراحل)
                        </td>
                        <td style="padding: 8px; border: 1px solid #ddd; background: #fdedec; color: #c0392b;">
                            <i class="fas fa-times"></i> مخفي تماماً
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">أزرار التحكم (Actions)</td>
                        <td style="padding: 8px; border: 1px solid #ddd; background: #eafaf1; color: #27ae60;">
                            <i class="fas fa-check-square"></i> قوائم مهام تفاعلية (Checklists) للمراجعة والشحن والاستلام.
                        </td>
                        <td style="padding: 8px; border: 1px solid #ddd; background: #fffcf5; color: #d35400;">
                            <i class="fas fa-comment-slash"></i> معطلة (تظهر رسالة توجيه للتواصل اليدوي).
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">معرض الصور (Gallery)</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">
                            يعتمد على صور المنتج الأساسية (Catalog).
                        </td>
                        <td style="padding: 8px; border: 1px solid #ddd; background: #e8f6f3; color: #16a085;">
                            <i class="fas fa-images"></i> معرض صور مخصص ديناميكي خاص بالطلب نفسه.
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">آلية العمل (Workflow)</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">
                             مسار مؤتمت (Automated Flow) ينتقل عبر الحالات 1->2->3->4.
                        </td>
                        <td style="padding: 8px; border: 1px solid #ddd;">
                             تدفق يدوي / تفاوضي (Manual Negotiation) خارج النظام الآلي.
                        </td>
                    </tr>
                </tbody>
            </table>
        `;
    }
};
