/**
 * @file pages/productAdd/js/add1_utils.js
 * @description Utility functions for logs, error handling, and formatting.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


console.log('[ProductForm] Starting initializing Add product (Add1)...');

/**
 * @function add1_showError
 * @description Displays an error message below the specified element.
 * @param {HTMLElement} element - The element where the error occurred.
 * @param {string} message - The error message to display.
 */
function add1_showError(element, message) {
    try {
        window.ProductFormUiCore.showError(element, message, 'add1_product_modal__error_message', 'add1_error');
    } catch (error) {
        console.error('[Add1] Error in add1_showError:', error);
    }
}

/**
 * @function add1_clearError
 * @description Removes the error message from below the specified element.
 * @param {HTMLElement} element - The element to clear errors for.
 */
function add1_clearError(element) {
    try {
        window.ProductFormUiCore.clearError(element, 'add1_product_modal__error_message');
    } catch (error) {
        console.error('[Add1] Error in add1_clearError:', error);
    }
}

/**
 * @function add1_formatBytes
 * @description Converts bytes to a human-readable string (KB, MB, etc.).
 * @param {number} bytes - Size in bytes.
 * @param {number} decimals - Number of decimal places.
 * @returns {string} Formatted string.
 */
function add1_formatBytes(bytes, decimals = 2) {
    try {
        return window.ProductFormCore
            ? window.ProductFormCore.formatBytes(bytes, decimals, '0 ' + window.langu('gen_unit_bytes'))
            : '0 ' + window.langu('gen_unit_bytes');
    } catch (error) {
        console.error('[Add1] Error in add1_formatBytes:', error);
        return 'N/A';
    }
}

/**
 * @function add1_genId
 * @description Generates a lightweight unique identity for image items.
 * @returns {string} Unique ID.
 */
function add1_genId() {
    return 'add1_img_' + (Date.now() + add1_idCounter++);
}
