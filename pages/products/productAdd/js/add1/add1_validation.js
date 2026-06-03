/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */
/**
 * @file pages/productAdd/js/add1/add1.validation.js
 * @description Input validation logic for Product Add.
 */

window.ADD1_Validation = {
    /**
     * @function validateImageStates
     * @description Validates the state of images before submission.
     */
    validateImageStates: (images, uploaderEl) => {
        window.ProductDebugConsole?.log('productAdd-submit', 'validate-image-states-start', {
            totalImages: Array.isArray(images) ? images.length : 0
        });

        const imageRequired = typeof window.ProductCategoryUi === 'undefined'
            ? true
            : window.ProductCategoryUi.isFieldRequired('add', 'images');

        return window.ProductFormSubmitCore.validateImageCollection({
            images: images,
            uploaderEl: uploaderEl,
            clearError: add1_clearError,
            showError: add1_showError,
            requiredMessage: imageRequired ? window.langu('add1_err_img_required') : '',
            processingMessage: window.langu('gen_lbl_processing'),
            failedMessage: window.langu('gen_err_compression')
        });
    },

    /**
     * @function validateForm
     * @description Validates the entire add form.
     */
    validateForm: (context) => {
        let isValid = true;
        const {
            images, uploaderEl, categoryDisplay, categories,
            productNameInput, descriptionTextarea, sellerMessageTextarea,
            quantityInput, priceInput
        } = context;

        const requireImages = typeof window.ProductCategoryUi === 'undefined'
            ? true
            : window.ProductCategoryUi.isFieldRequired('add', 'images');

        if (requireImages && !ADD1_Validation.validateImageStates(images, uploaderEl)) isValid = false;

        const isSpecialtyListing = window.ProductSpecialtyListingBridge?.isSpecialtyRoute?.() === true;
        if (!isSpecialtyListing && !window.ProductFormSubmitCore.validateRequiredCategory({
            categories,
            categoryDisplay,
            clearError: add1_clearError,
            showError: add1_showError,
            message: 'يرجى اختيار القسم الرئيسي والفرعي.'
        })) {
            isValid = false;
        }

        if ((typeof window.ProductCategoryUi === 'undefined' || window.ProductCategoryUi.isFieldRequired('add', 'productName')) &&
            !window.ProductFormSubmitCore.validateRequiredText({
                input: productNameInput,
                clearError: add1_clearError,
                showError: add1_showError,
                message: window.langu('add1_err_name_required')
            })) {
            isValid = false;
        }

        // Product Description (Now mandatory for all, minLength: 10)
        if (!window.ProductFormSubmitCore.validateRequiredText({
            input: descriptionTextarea,
            clearError: add1_clearError,
            showError: add1_showError,
            message: 'وصف المنتج إجباري ويجب ألا يقل عن 10 أحرف.',
            minLength: 10
        })) {
            isValid = false;
        }

        const sellerMessageConfig = window.ProductCategoryUi?.getFieldConfig?.('add', 'sellerMessage');
        if ((typeof window.ProductCategoryUi !== 'undefined' && window.ProductCategoryUi.isFieldRequired('add', 'sellerMessage')) &&
            !window.ProductFormSubmitCore.validateRequiredText({
                input: sellerMessageTextarea,
                clearError: add1_clearError,
                showError: add1_showError,
                message: window.langu('add1_err_msg_required'),
                minLength: sellerMessageConfig?.minLength || 1
            })) {
            isValid = false;
        }

        // Quantity (Now optional)
        if (!window.ProductFormSubmitCore.validateMinimumNumber({
            input: quantityInput,
            clearError: add1_clearError,
            showError: add1_showError,
            message: window.langu('add1_err_qty_required'),
            min: 0,
            allowEmpty: true
        })) {
            isValid = false;
        }

        const requirePrice = typeof window.ProductCategoryUi !== 'undefined' && window.ProductCategoryUi.isFieldRequired('add', 'price');
        if (!window.ProductFormSubmitCore.validateMinimumNumber({
            input: priceInput,
            clearError: add1_clearError,
            showError: add1_showError,
            message: window.langu('add1_err_price_required'),
            min: 0,
            allowEmpty: !requirePrice
        })) {
            isValid = false;
        }

        if (window.ProductSpecialtyListingBridge?.validateForm &&
            !window.ProductSpecialtyListingBridge.validateForm(add1_clearError, add1_showError)) {
            isValid = false;
        }

        return isValid;
    }
};
