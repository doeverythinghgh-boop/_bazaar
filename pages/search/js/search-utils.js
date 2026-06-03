/**
 * @file search-utils.js
 * @description Utility functions for the search module.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


/**
 * @function debounce
 * @description Delayed execution function (Debounce) to improve search performance while typing.
 * @param {function(...any): any} func - The function to be debounced.
 * @param {number} delay - The delay in milliseconds.
 * @returns {function(...any): void} - A modified function that executes the original function after the delay.
 */
function debounce(func, delay) {
    console.log(` [Search Module - Utils] debounce() Created with delay: ${delay}ms`);
    let timeout;
    return function (...args) {
        console.log(" [Search Module - Utils] debounced function invoked");
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            console.info(" [Search Module - Utils] Executing original debounced function");
            func.apply(this, args);
        }, delay);
    };
}

/**
 * @function updateInputAttributes
 * @description Updates the search input placeholder and icon based on the mode.
 */
function updateInputAttributes(mode) {
    console.log(` [Search Module - Utils] updateInputAttributes() Started for mode: ${mode}`);
    const { searchModalInput, searchTextTrigger, searchTextDisplay } = searchElements;
    if (!searchModalInput) {
        console.warn(" [Search Module - Utils] searchModalInput not found");
        console.log(" [Search Module - Utils] updateInputAttributes() Finished");
        return;
    }

    // Use consistent text input icon (fa-font)
    const rowIcon = searchTextTrigger ? searchTextTrigger.querySelector('.search-action-icon') : null;

    if (mode === 'merchants') {
        searchModalInput.setAttribute("data-lkey-placeholder", "search_merchant_name_placeholder");
        searchModalInput.value = ""; // Clear input for fresh mode
        if (searchTextDisplay) {
            searchTextDisplay.textContent = 'مقدم خدمة/نشاط';
            searchTextDisplay.dataset.lkey = "search_mode_sellers"; // Use specific translation key
        }
        console.info(" [Search Module - Utils] Attributes updated for 'merchants' mode");
    } else {
        searchModalInput.setAttribute("data-lkey-placeholder", "search_modal_input_placeholder");
        searchModalInput.value = ""; // Clear input for fresh mode
        if (searchTextDisplay) {
            searchTextDisplay.textContent = 'نص';
            searchTextDisplay.dataset.lkey = "search_modal_input_placeholder"; // Generic text search
        }
        console.info(" [Search Module - Utils] Attributes updated for 'products' mode");
    }

    // Force fa-font for text input regardless of mode
    if (rowIcon) {
        rowIcon.className = 'fas fa-font search-action-icon';
    }

    // Apply translations to updated keys if available
    if (typeof window.applyAppTranslations === 'function') {
        console.info(" [Search Module - Utils] Applying translations");
        window.applyAppTranslations();
    }
    console.log(" [Search Module - Utils] updateInputAttributes() Finished");
}
