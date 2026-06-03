/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */
/**
 * @file pages/productEdit/js/edit/edit.validation.js
 * @description Input validation logic for Product Edit.
 */

window.EDIT_Validation = {
    /**
     * @function validateForm
     * @description Validates the entire edit form.
     */
    validateForm: (context) => {
        let isValid = true;
        const {
            uploaderEl, productNameInput, descriptionTextarea, sellerMessageTextarea,
            quantityInput, priceInput, categoryDisplay, selectedCategories, images
        } = context;

        const requireImages = typeof window.ProductCategoryUi === 'undefined'
            ? true
            : window.ProductCategoryUi.isFieldRequired('edit', 'images');

        if (requireImages && !window.ProductFormSubmitCore.validateImageCollection({
            images: images,
            uploaderEl,
            clearError: EDIT_clearError,
            showError: EDIT_showError,
            requiredMessage: window.langu('edit_err_img_required'),
            processingMessage: window.langu('edit_err_img_processing'),
            failedMessage: window.langu('gen_err_compression')
        })) {
            isValid = false;
        }

        const isSpecialtyListing = window.ProductSpecialtyListingBridge?.isSpecialtyProduct?.() === true;
        if (!isSpecialtyListing && !window.ProductFormSubmitCore.validateRequiredCategory({
            categories: selectedCategories,
            categoryDisplay,
            clearError: EDIT_clearError,
            showError: EDIT_showError,
            message: window.langu('product_select_category_required')
        })) {
            isValid = false;
        }

        if ((typeof window.ProductCategoryUi === 'undefined' || window.ProductCategoryUi.isFieldRequired('edit', 'productName')) &&
            !window.ProductFormSubmitCore.validateRequiredText({
                input: productNameInput,
                clearError: EDIT_clearError,
                showError: EDIT_showError,
                message: window.langu('edit_err_name_required')
            })) {
            isValid = false;
        }

        // Product Description (Now mandatory, minLength: 10)
        if (!window.ProductFormSubmitCore.validateRequiredText({
            input: descriptionTextarea,
            clearError: EDIT_clearError,
            showError: EDIT_showError,
            message: 'وصف المنتج إجباري ويجب ألا يقل عن 10 أحرف.',
            minLength: 10
        })) {
            isValid = false;
        }

        const sellerMessageConfig = window.ProductCategoryUi?.getFieldConfig?.('edit', 'sellerMessage');
        if ((typeof window.ProductCategoryUi !== 'undefined' && window.ProductCategoryUi.isFieldRequired('edit', 'sellerMessage')) &&
            !window.ProductFormSubmitCore.validateRequiredText({
                input: sellerMessageTextarea,
                clearError: EDIT_clearError,
                showError: EDIT_showError,
                message: window.langu('edit_err_msg_required'),
                minLength: sellerMessageConfig?.minLength || 1
            })) {
            isValid = false;
        }

        // Quantity (Now optional)
        if (!window.ProductFormSubmitCore.validateMinimumNumber({
            input: quantityInput,
            clearError: EDIT_clearError,
            showError: EDIT_showError,
            message: window.langu('edit_err_qty_required'),
            min: 0,
            allowEmpty: true
        })) {
            isValid = false;
        }

        const requirePrice = typeof window.ProductCategoryUi !== 'undefined' && window.ProductCategoryUi.isFieldRequired('edit', 'price');
        if (!window.ProductFormSubmitCore.validateMinimumNumber({
            input: priceInput,
            clearError: EDIT_clearError,
            showError: EDIT_showError,
            message: window.langu('edit_err_price_required'),
            min: 0,
            allowEmpty: !requirePrice
        })) {
            isValid = false;
        }

        if (window.ProductSpecialtyListingBridge?.validateForm &&
            !window.ProductSpecialtyListingBridge.validateForm(EDIT_clearError, EDIT_showError)) {
            isValid = false;
        }

        return isValid;
    }
};
