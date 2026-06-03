/**
 * @file pages/productEdit/js/edit_utils.js
 * @description Utility functions for error handling, formatting, and ID generation for Product Edit.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


/**
 * @function EDIT_showError
 * @description Displays an error message below the specified element.
 * @param {HTMLElement} element - The element where the error occurred.
 * @param {string} message - The error message to display.
 */
function EDIT_showError(element, message) {
    window.ProductFormUiCore.showError(element, message, 'edit-product-modal__error-message', 'edit_error');
}

/**
 * @function EDIT_clearError
 * @description Removes the error message from below the specified element.
 * @param {HTMLElement} element - The element to clear errors for.
 */
function EDIT_clearError(element) {
    window.ProductFormUiCore.clearError(element, 'edit-product-modal__error-message');
}

/**
 * @function EDIT_formatBytes
 * @description Converts bytes to a human-readable string (KB, MB, etc.).
 * @param {number} bytes - Size in bytes.
 * @param {number} decimals - Number of decimal places.
 * @returns {string} Formatted string.
 */
function EDIT_formatBytes(bytes, decimals = 2) {
    return window.ProductFormCore
        ? window.ProductFormCore.formatBytes(bytes, decimals, '0 Bytes')
        : '0 Bytes';
}

/**
 * @function EDIT_genId
 * @description Generates a lightweight unique identity for image items.
 * @returns {string} Unique ID.
 */
function EDIT_genId() {
    return 'img_' + (Date.now() + EDIT_idCounter++);
}

// Map to global for compatibility
window.productModule.genId = EDIT_genId;
