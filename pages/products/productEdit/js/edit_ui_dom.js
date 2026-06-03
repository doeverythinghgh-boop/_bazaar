/**
 * @file pages/productEdit/js/edit_ui_dom.js
 * @description DOM helpers and preview generation for Product Edit.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


var EDIT_dom = {};

function EDIT_languOrFallback(key, fallbackAr, fallbackEn) {
    const translated = typeof window.langu === 'function' ? window.langu(key) : '';
    if (translated && translated !== key) return translated;
    return window.app_language === 'en' ? fallbackEn : fallbackAr;
}

function EDIT_getDomElements() {
    EDIT_dom = window.ProductFormUiCore.collectElements({
        fileInput: 'edit-file-input',
        pickFilesBtn: 'pick-files-btn',
        takePhotoBtn: 'take-photo-btn',
        previewsEl: 'previews',
        productNameInput: 'product-name',
        descriptionTextarea: 'product-description',
        sellerMessageTextarea: 'merchant-message',
        notesInput: 'product-notes',
        quantityInput: 'product-quantity',
        priceInput: 'product-price',
        originalPriceInput: 'original-price',
        realPriceInput: 'real-price',
        heavyLoadCheckbox: 'heavy-load',
        form: 'edit-product-form',
        imagesLoading: 'images-loading'
    });
    return EDIT_dom;
}

function EDIT_createPreviewItem(state, existingImageUrl = null) {
    const dom = EDIT_getDomElements();
    window.ProductFormDomCore.createImagePreview(state, {
        existingImageUrl: existingImageUrl,
        previewsEl: dom.previewsEl,
        removeHandler: EDIT_removeImage,
        removeTitle: EDIT_languOrFallback('gen_tooltip_remove_image', 'حذف الصورة', 'Remove Image'),
        processingText: EDIT_languOrFallback('gen_lbl_processing', 'جاري المعالجة...', 'Processing...'),
        currentImageText: EDIT_languOrFallback('gen_lbl_current_img', 'الصورة الحالية', 'Current Image'),
        wrapperClass: 'edit-product-modal__preview',
        selectedClass: 'edit-product-modal__preview--selected',
        removeClass: 'edit-product-modal__preview-remove',
        metaClass: 'edit-product-modal__preview-meta',
        pendingMetaClass: 'is-pending',
        useObjectUrl: !existingImageUrl,
        removeIconHtml: '<i class="fas fa-trash-alt"></i>',
        wrapperId: `edit_preview_wrapper_${state.id}`,
        removeBtnId: `edit_preview_remove_${state.id}`,
        imgId: `edit_preview_img_${state.id}`,
        metaId: `edit_preview_meta_${state.id}`,
        removeIconId: `edit_preview_remove_icon_${state.id}`
    });
}

function EDIT_removeImage(id) {
    console.log(`[ImageUploader] Attempting to remove image: ${id}`);
    window.ProductFormDomCore.confirmAndRemoveImage(id, {
        images: EDIT_images,
        confirmTitle: EDIT_languOrFallback('gen_swal_title_confirm', 'هل أنت متأكد؟', 'Are you sure?'),
        confirmText: EDIT_languOrFallback('gen_swal_remove_text', 'سيتم حذف هذه الصورة.', 'This image will be removed.'),
        confirmButtonText: EDIT_languOrFallback('gen_swal_btn_yes_delete', 'نعم، احذف', 'Yes, delete'),
        cancelButtonText: EDIT_languOrFallback('gen_swal_btn_cancel', 'إلغاء', 'Cancel'),
        logPrefix: 'ImageUploader',
        revokeObjectUrl: true
    });
}

window.productModule.createPreviewItem = EDIT_createPreviewItem;
