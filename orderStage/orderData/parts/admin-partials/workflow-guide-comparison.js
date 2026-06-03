/**
 * @file orderStage/orderData/parts/admin-partials/workflow-guide-comparison.js
 * @description Service type comparison renderer for admin workflow guide.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


window.OrderData_Admin_WorkflowComparison = {
    render: function () {
        return `
            <div id="order_service_diff_title" class="order_section_title" style="margin-top:25px; color: #8e44ad;">
                <i class="fas fa-balance-scale"></i> مقارنة أنواع الخدمات (Service Types Comparison)
            </div>
            <table id="order_service_compare_table" style="width: 100%; border-collapse: collapse; font-size: 0.85em; text-align: right; border: 1px solid #9b59b6; margin-bottom: 20px;">
                <thead>
                    <tr style="background: #f4ecf7; border-bottom: 2px solid #9b59b6;">
                        <th style="padding: 8px; border: 1px solid #ddd; width: 20%;">وجه المقارنة</th>
                        <th style="padding: 8px; border: 1px solid #ddd; width: 40%;">الخدمات القياسية (0, 1, N/A)</th>
                        <th style="padding: 8px; border: 1px solid #ddd; width: 40%;">المنتجات الخاصة (Type 2)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">شريط المراحل (Stepper)</td><td style="padding: 8px; border: 1px solid #ddd; background: #eafaf1; color: #27ae60;"><i class="fas fa-check"></i> ظاهر ويعمل (3 مراحل)</td><td style="padding: 8px; border: 1px solid #ddd; background: #fdedec; color: #c0392b;"><i class="fas fa-times"></i> مخفي تماماً</td></tr>
                    <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">أزرار التحكم (Actions)</td><td style="padding: 8px; border: 1px solid #ddd; background: #eafaf1; color: #27ae60;"><i class="fas fa-check-square"></i> قوائم مهام تفاعلية (Checklists) للمراجعة والشحن والاستلام.</td><td style="padding: 8px; border: 1px solid #ddd; background: #fffcf5; color: #d35400;"><i class="fas fa-comment-slash"></i> معطلة (تظهر رسالة توجيه للتواصل اليدوي).</td></tr>
                    <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">معرض الصور (Gallery)</td><td style="padding: 8px; border: 1px solid #ddd;">يعتمد على الصور الأساسية (Catalog).</td><td style="padding: 8px; border: 1px solid #ddd; background: #e8f6f3; color: #16a085;"><i class="fas fa-images"></i> معرض صور مخصص ديناميكي خاص بالطلب نفسه.</td></tr>
                    <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">آلية العمل (Workflow)</td><td style="padding: 8px; border: 1px solid #ddd;">مسار مؤتمت (Automated Flow) ينتقل عبر الحالات 1->2->3->4.</td><td style="padding: 8px; border: 1px solid #ddd;">تدفق يدوي / تفاوضي (Manual Negotiation) خارج النظام الآلي.</td></tr>
                </tbody>
            </table>
        `;
    }
};
