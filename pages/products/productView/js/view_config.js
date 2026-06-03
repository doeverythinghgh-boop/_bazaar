/**
 * @file pages/productView/js/view_config.js
 * @description Configuration and shared state manager for ProductView module.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


(function initializeProductViewPageState(global) {
    global.productView_state = global.productView_state || {
        currentProductKey: null,
        currentQuantity: 1,
        lastShareUrl: '',
        gallery: {
            activeIndex: 0
        }
    };
})(window);
