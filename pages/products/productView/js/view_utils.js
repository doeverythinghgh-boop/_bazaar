/**
 * @file pages/productView/js/view_utils.js
 * @description Calculation and utility functions for ProductView.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


/**
 * @function productView_formatAmount
 * @description Formats a numeric amount while preserving whole numbers.
 * @param {number|string} value
 * @returns {number|string}
 */
function productView_formatAmount(value) {
    if (window.ProductViewCore) {
        return window.ProductViewCore.formatAmount(value);
    }
    const amount = parseFloat(value) || 0;
    return amount % 1 === 0 ? amount : amount.toFixed(2);
}
