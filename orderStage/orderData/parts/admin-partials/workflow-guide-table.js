/**
 * @file orderStage/orderData/parts/admin-partials/workflow-guide-table.js
 * @description Standard order workflow table renderer.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


window.OrderData_Admin_WorkflowGuideTable = {
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
                        <th style="padding: 8px; border: 1px solid #ddd;">نص الرسالة المرسلة</th>
                        <th style="padding: 8px; border: 1px solid #ddd;">المستلم</th>
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
                        <td id="order_wkf_td_desc_0" style="padding: 8px; border: 1px solid #ddd;">تم إنشاء الطلب وبانتظار معاينة مقدم الخدمة</td>
                        <td id="order_wkf_td_own_0" style="padding: 8px; border: 1px solid #ddd;"><div style="font-weight: bold; margin-bottom: 4px;">النظام (تلقائي)</div><span style="display:block; font-size: 0.85em; color: #2c3e50;">الصفحة: <b>cardPackage.html</b></span><span style="display:block; font-size: 0.75em; color: #7f8c8d;">العنصر: <code>cartPage_checkoutBtn</code></span></td>
                        <td id="order_wkf_td_msg_0" style="padding: 8px; border: 1px solid #ddd; font-style: italic;">"مبيعات جديدة! طلب جديد رقم #..."</td>
                        <td id="order_wkf_td_rec_0" style="padding: 8px; border: 1px solid #ddd;">مقدم الخدمة</td>
                    </tr>
                    <tr id="order_wkf_row_1">
                        <td id="order_wkf_td_id_1" style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">
                            <label id="order_wkf_lbl_1" style="cursor: pointer; display: flex; align-items: center; gap: 8px;">
                                <input id="order_wkf_rad_1" type="radio" name="admin_order_step" value="1" ${statusObj.step_id == 1 ? 'checked' : ''} onchange="window.orderAdminConfirmUpdateStep(1)">
                                1- المراجعة (Review)
                            </label>
                        </td>
                        <td id="order_wkf_td_desc_1" style="padding: 8px; border: 1px solid #ddd;">تأكيد مقدم الخدمة لتوافر الخدمات وتجهيزها للتغليف</td>
                        <td id="order_wkf_td_own_1" style="padding: 8px; border: 1px solid #ddd;"><div style="font-weight: bold; margin-bottom: 4px;">مقدم الخدمة، الأدمن</div><span style="display:block; font-size: 0.85em; color: #2c3e50;">اللوحة: <b>order_role_commercial</b></span><span style="display:block; font-size: 0.75em; color: #7f8c8d;">العنصر: <code>chk_review</code></span></td>
                        <td id="order_wkf_td_msg_1" style="padding: 8px; border: 1px solid #ddd; font-style: italic;">"تم تأكيد الطلب، جاري التجهيز للشحن."</td>
                        <td id="order_wkf_td_rec_1" style="padding: 8px; border: 1px solid #ddd;">المشتري</td>
                    </tr>
                    <tr id="order_wkf_row_2">
                        <td id="order_wkf_td_id_2" style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9; font-weight: bold;">
                            <label id="order_wkf_lbl_2" style="cursor: pointer; display: flex; align-items: center; gap: 8px;">
                                <input id="order_wkf_rad_2" type="radio" name="admin_order_step" value="2" ${statusObj.step_id == 2 ? 'checked' : ''} onchange="window.orderAdminConfirmUpdateStep(2)">
                                2- الشحن (Shipping)
                            </label>
                        </td>
                        <td id="order_wkf_td_desc_2" style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;">تسليم الخدمات لمندوب التوصيل وبدء التحرك</td>
                        <td id="order_wkf_td_own_2" style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><div style="font-weight: bold; margin-bottom: 4px;">مقدم الخدمة، المندوب</div><span style="display:block; font-size: 0.85em; color: #2c3e50;">اللوحات: <b>order_role_commercial</b> / <b>order_role_delivery</b></span><span style="display:block; font-size: 0.75em; color: #7f8c8d;">العناصر: <code>chk_shipping</code> / <code>chk_delivery_pickup</code></span></td>
                        <td id="order_wkf_td_msg_2" style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9; font-style: italic;">"تم شحن طلبك. في الطريق إليك!"</td>
                        <td id="order_wkf_td_rec_2" style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;">المشتري</td>
                    </tr>
                    <tr id="order_wkf_row_3">
                        <td id="order_wkf_td_id_3" style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">
                            <label id="order_wkf_lbl_3" style="cursor: pointer; display: flex; align-items: center; gap: 8px;">
                                <input id="order_wkf_rad_3" type="radio" name="admin_order_step" value="3" ${statusObj.step_id == 3 ? 'checked' : ''} onchange="window.orderAdminConfirmUpdateStep(3)">
                                3- التسليم (Delivery)
                            </label>
                        </td>
                        <td id="order_wkf_td_desc_3" style="padding: 8px; border: 1px solid #ddd;">وصول المندوب لموقع العميل (جاهز للتسليم أو الرفض)</td>
                        <td id="order_wkf_td_own_3" style="padding: 8px; border: 1px solid #ddd;"><div style="font-weight: bold; margin-bottom: 4px;">المشتري (حصراً)</div><span style="display:block; font-size: 0.85em; color: #2c3e50;">اللوحة: <b>order_role_buyer</b></span><span style="display:block; font-size: 0.75em; color: #7f8c8d;">العناصر: <code>chk_buyer_receipt</code> (قبول) <br>أو <code>chk_buyer_refuse</code> (رفض)</span></td>
                        <td id="order_wkf_td_msg_3" style="padding: 8px; border: 1px solid #ddd; font-style: italic;">- في حال القبول: "تم تسليم الطلب بنجاح..."<br>- في حال الرفض: "تنبيه: قام المشتري برفض الاستلام..."</td>
                        <td id="order_wkf_td_rec_3" style="padding: 8px; border: 1px solid #ddd;">مقدم الخدمة</td>
                    </tr>
                    <tr id="order_wkf_row_4">
                        <td id="order_wkf_td_id_4" style="padding: 8px; border: 1px solid #ddd; background: #d4edda; color: #155724; font-weight: bold;">
                            <label id="order_wkf_lbl_4" style="cursor: pointer; display: flex; align-items: center; gap: 8px;">
                                <input id="order_wkf_rad_4" type="radio" name="admin_order_step" value="4" ${statusObj.step_id == 4 ? 'checked' : ''} onchange="window.orderAdminConfirmUpdateStep(4)">
                                4- مكتمل (Completed)
                            </label>
                        </td>
                        <td id="order_wkf_td_desc_4" style="padding: 8px; border: 1px solid #ddd; background: #d4edda; color: #155724;">استلام العميل للمنتج فعلياً وإغلاق الطلب</td>
                        <td id="order_wkf_td_own_4" style="padding: 8px; border: 1px solid #ddd; background: #d4edda; color: #155724;"><div style="font-weight: bold; margin-bottom: 4px;">N/A</div><span style="display:block; font-size: 0.85em; color: #155724;">(الحالة النهائية لنجاح الطلب)</span></td>
                        <td id="order_wkf_td_msg_4" style="padding: 8px; border: 1px solid #ddd; background: #d4edda; color: #155724; font-style: italic;">-</td>
                        <td id="order_wkf_td_rec_4" style="padding: 8px; border: 1px solid #ddd; background: #d4edda; color: #155724;">-</td>
                    </tr>
                    <tr id="order_wkf_row_5">
                        <td id="order_wkf_td_id_5" style="padding: 8px; border: 1px solid #ddd; font-weight: bold; color: #c0392b;">
                            <label id="order_wkf_lbl_5" style="cursor: pointer; display: flex; align-items: center; gap: 8px;">
                                <input id="order_wkf_rad_5" type="radio" name="admin_order_step" value="5" ${statusObj.step_id == 5 ? 'checked' : ''} onchange="window.orderAdminConfirmUpdateStep(5)">
                                5- ملغي (Cancelled)
                            </label>
                        </td>
                        <td id="order_wkf_td_desc_5" style="padding: 8px; border: 1px solid #ddd; color: #c0392b;">إلغاء الطلب بالكامل (متاح قبل الشحن أو عند رفض الاستلام على الباب)</td>
                        <td id="order_wkf_td_own_5" style="padding: 8px; border: 1px solid #ddd; color: #c0392b;"><div style="font-weight: bold; margin-bottom: 4px;">المشتري، الأدمن</div><span style="display:block; font-size: 0.85em;">اللوحة: <b>order_role_buyer</b></span><span style="display:block; font-size: 0.75em; opacity: 0.8;">العنصر: <code>chk_buyer_cancel</code> / <code>chk_buyer_refuse</code></span></td>
                        <td id="order_wkf_td_msg_5" style="padding: 8px; border: 1px solid #ddd; font-style: italic;">"تنبيه: قام المشتري بإلغاء الطلب (أو رفض الاستلام). يرجى مراجعة التفاصيل."</td>
                        <td id="order_wkf_td_rec_5" style="padding: 8px; border: 1px solid #ddd;">مقدم الخدمة</td>
                    </tr>
                </tbody>
            </table>
        `;
    }
};
