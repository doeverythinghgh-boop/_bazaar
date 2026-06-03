/**
 * @file pages/productAdd/js/add1_ui_dom.js
 * @description DOM cache and preview helpers for Product Add.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


var add1Dom = window.ProductFormUiCore.collectElements({
    fileInput: 'add1_file_input_00',
    pickFilesBtn: 'add1_pick_files_btn',
    takePhotoBtn: 'add1_take_photo_btn',
    previewsEl: 'add1_previews',
    uploaderEl: 'add1_image_uploader',
    form: 'add1_product_form',
    descriptionTextarea: 'add1_product_description',
    productNameInput: 'add1_product_name',
    sellerMessageTextarea: 'add1_seller_message',
    notesInput: 'add1_product_notes',
    quantityInput: 'add1_product_quantity',
    priceInput: 'add1_product_price',
    originalPriceInput: 'add1_original_price',
    originalPriceGroup: 'add1_group_original_price',
    realPriceInput: 'add1_real_price',
    realPriceGroup: 'add1_group_real_price',
    heavyLoadCheckbox: 'add1_heavy_load',
    btnSubmit: 'add1_btn_submit'
});

var add1_fileInput = add1Dom.fileInput;
var add1_pickFilesBtn = add1Dom.pickFilesBtn;
var add1_takePhotoBtn = add1Dom.takePhotoBtn;
var add1_previewsEl = add1Dom.previewsEl;
var add1_uploaderEl = add1Dom.uploaderEl;
var add1_form = add1Dom.form;
var add1_descriptionTextarea = add1Dom.descriptionTextarea;
var add1_productNameInput = add1Dom.productNameInput;
var add1_sellerMessageTextarea = add1Dom.sellerMessageTextarea;
var add1_notesInput = add1Dom.notesInput;
var add1_quantityInput = add1Dom.quantityInput;
var add1_priceInput = add1Dom.priceInput;
var add1_originalPriceInput = add1Dom.originalPriceInput;
var add1_originalPriceGroup = add1Dom.originalPriceGroup;
var add1_realPriceInput = add1Dom.realPriceInput;
var add1_realPriceGroup = add1Dom.realPriceGroup;
var add1_heavyLoadCheckbox = add1Dom.heavyLoadCheckbox;
var add1_btnSubmit = add1Dom.btnSubmit;
var add1_isAppPriceEnabled = window.AppBehavior?.enableAppPrice !== false;
var add1_isOriginalPriceEnabled = window.AppBehavior?.enableOriginalPrice !== false;

if (!add1_isAppPriceEnabled && add1_realPriceGroup && add1_realPriceInput) {
    add1_realPriceGroup.style.display = 'none';
    add1_realPriceInput.value = '';
    add1_realPriceInput.disabled = true;
}

if (!add1_isOriginalPriceEnabled && add1_originalPriceGroup && add1_originalPriceInput) {
    add1_originalPriceGroup.style.display = 'none';
    add1_originalPriceInput.value = '';
    add1_originalPriceInput.disabled = true;
}

function add1_createPreviewItem(state, existingImageUrl = null) {
    try {
        window.ProductFormDomCore.createImagePreview(state, {
            existingImageUrl: existingImageUrl,
            previewsEl: add1_previewsEl,
            removeHandler: add1_removeImage,
            removeTitle: window.langu('gen_tooltip_remove_image'),
            processingText: window.langu('gen_lbl_processing'),
            currentImageText: window.langu('gen_lbl_current_img'),
            wrapperClass: 'add1_product_modal__preview',
            selectedClass: 'add1_product_modal__preview__selected',
            removeClass: 'add1_product_modal__preview_remove',
            metaClass: 'add1_product_modal__preview_meta',
            wrapperId: `add1_preview_${state.id}`,
            removeBtnId: `add1_preview_remove_${state.id}`,
            imgId: `add1_preview_img_${state.id}`,
            metaId: `add1_preview_meta_${state.id}`,
            useObjectUrl: false,
            removeIconHtml: `<i class="fas fa-trash-alt" id="add1_icon_trash_${state.id}"></i>`
        });
    } catch (error) {
        console.error('[Add1] Error in add1_createPreviewItem:', error);
    }
}

function add1_removeImage(id) {
    try {
        console.log(`[Add1] Attempting to remove image: ${id}`);
        window.ProductFormDomCore.confirmAndRemoveImage(id, {
            images: add1_images,
            confirmTitle: window.langu('gen_swal_title_confirm'),
            confirmText: window.langu('gen_swal_remove_text'),
            confirmButtonText: window.langu('gen_swal_btn_yes_delete'),
            cancelButtonText: window.langu('gen_swal_btn_cancel'),
            logPrefix: 'Add1'
        });
    } catch (error) {
        console.error('[Add1] Error in add1_removeImage:', error);
    }
}
