/**
 * @file pages/products/shared/form/product-form-ui-core.js
 * @description Shared UI helpers for product add/edit forms.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


window.ProductFormUiCore = window.ProductFormUiCore || (function createProductFormUiCore() {
    function showError(element, message, errorClass, idPrefix = 'product_form_error') {
        if (!element || !element.parentElement) return;
        clearError(element, errorClass);

        const errorDiv = document.createElement('div');
        errorDiv.id = element.id ? `${element.id}_error` : `${idPrefix}_${Date.now()}`;
        errorDiv.className = errorClass;
        errorDiv.textContent = message;
        element.parentElement.appendChild(errorDiv);
    }

    function clearError(element, errorClass) {
        if (!element || !element.parentElement) return;
        const errorDiv = element.parentElement.querySelector(`.${errorClass}`);
        if (errorDiv) errorDiv.remove();
    }

    function collectElements(map = {}) {
        const result = {};
        Object.keys(map).forEach((key) => {
            result[key] = document.getElementById(map[key]);
        });
        return result;
    }

    return {
        clearError,
        collectElements,
        showError
    };
})();
