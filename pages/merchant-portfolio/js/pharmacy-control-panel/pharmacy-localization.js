/**
 * @file pages/merchant-portfolio/js/pharmacy-control-panel/pharmacy-localization.js
 * @description محرك الترجمة الخاص بموديولات الصيدلية
 */

function pharmacyL(key) {
    const isEn = window.app_language === 'en';
    const strings = {
        'restored_pending': isEn ? 'Pharmacy: Restored pending changes from localStorage' : 'الصيدلية: تم استعادة التعديلات المعلقة من الذاكرة المحلية',
        'no_sub_categories': isEn ? 'No sub-categories' : 'لا يوجد أقسام فرعية',
        'choose_parent': isEn ? '-- Choose Parent Category --' : '-- اختر القسم الأب --',
        'system_source': isEn ? '(System)' : '(من النظام)',
        'load_failed': isEn ? 'Failed to load catalog' : 'فشل تحميل الكتالوج',
        'confirm_title': isEn ? 'Confirm Changes' : 'تأكيد الحفظ',
        'confirm_text': isEn ? 'Save these visibility preferences to the store?' : 'هل تريد حفظ تفضيلات الظهور الجديدة في المتجر؟',
        'btn_confirm': isEn ? 'Confirm Save' : 'تأكيد الحفظ',
        'btn_revert': isEn ? 'Revert Changes' : 'تراجع عن الكل',
        'save_success_title': isEn ? 'Saved Successfully' : 'تم الحفظ بنجاح',
        'save_success_text': isEn ? 'Visibility preferences updated successfully.' : 'تم تحديث تفضيلات ظهور الكتالوج بنجاح.',
        'save_error_title': isEn ? 'Save Error' : 'خطأ في الحفظ',
        'save_error_text': isEn ? 'Update failed, please try again later.' : 'فشل التحديث، يرجى المحاولة لاحقاً.',
        'btn_ok': isEn ? 'OK' : 'حسناً',
        'btn_close': isEn ? 'Close' : 'إغلاق',
        'nav_save': isEn ? 'Save' : 'حفظ',
        'warning': isEn ? 'Attention' : 'تنبيه',
        'name_required': isEn ? 'Please enter the category name in Arabic at least' : 'يرجى كتابة اسم القسم بالعربية على الأقل',
        'creating': isEn ? 'Creating...' : 'جاري الإنشاء...',
        'success': isEn ? 'Success' : 'نجاح',
        'new_category_success': isEn ? 'New category registered successfully.' : 'تم تسجيل القسم الجديد بنجاح.',
        'error': isEn ? 'Error' : 'خطأ',
        'add_failed': isEn ? 'Failed to add category on server' : 'تعذر إضافة القسم في السيرفر',
        'create_btn': isEn ? 'Create and Save' : 'إنشاء القسم وحفظه',
        'none': isEn ? 'None' : 'بدون',
        'images_label': isEn ? 'Images:' : 'الصور:',
        'manage_products': isEn ? 'Manage Products' : 'إدارة المنتجات',
        'loading_products': isEn ? 'Loading products...' : 'جاري تحميل المنتجات...',
        'no_products_found': isEn ? 'No products in this category' : 'لا يوجد منتجات في هذه الفئة',
        'product_visibility': isEn ? 'Product Visibility' : 'ظهور منتج معين',
        // Tab & Heading Keys
        'pharmacy_ctrl_tab_catalog': isEn ? 'Catalog' : 'الكتالوج المركزي',
        'pharmacy_ctrl_tab_custom': isEn ? 'Custom Sections' : 'الأقسام المخصصة',
        'pharmacy_ctrl_tab_products': isEn ? 'Products' : 'المنتجات والأدوية',
        'pharmacy_ctrl_catalog_heading': isEn ? 'Catalog Management' : 'التحكم في الكتالوج الموحد'
    };
    return strings[key] || key;
}

window.pharmacyL = pharmacyL;
