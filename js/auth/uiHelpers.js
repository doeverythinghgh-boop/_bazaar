/**
 * @file js/auth/uiHelpers.js
 * @description Centralized UI helpers for authentication interactions (Alerts, Loaders, Confirmations).
 * Using SweetAlert2.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

export const AuthUI = {
    /**
     * @function showLoading
     * @description Shows a loading popup with a spinner.
     * @param {string} title - Title of the loading popup.
     * @param {string} text - Optional text description.
     */
    showLoading: (title, text = window.langu ? window.langu("auth_wait_moment") : "Please wait...") => {
        if (typeof Swal === 'undefined') {
            console.warn("[AuthUI] Swal not found for showLoading");
            return;
        }
        Swal.fire({
            title: title,
            text: text,
            allowOutsideClick: false,
            showCloseButton: true,
            didOpen: () => {
                Swal.showLoading();
            },
            customClass: {
                popup: 'swal-modern-mini-popup',
                title: 'swal-modern-mini-title',
                htmlContainer: 'swal-modern-mini-text'
            },
            buttonsStyling: false
        });
    },

    /**
     * @function close
     * @description Closes any open SweetAlert popup.
     */
    close: () => {
        if (typeof Swal !== 'undefined') Swal.close();
    },

    /**
     * @function showSuccess
     * @description Shows a success message.
     * @param {string} title - Title of the message.
     * @param {string} text - Body text of the message.
     * @returns {Promise} - Resolves when the user closes the alert.
     */
    showSuccess: (title, text = "") => {
        if (typeof Swal === 'undefined') {
            console.warn("[AuthUI] Swal not found for showSuccess");
            return Promise.resolve();
        }
        return Swal.fire({
            title: title,
            html: text,
            confirmButtonText: window.langu ? window.langu("alert_confirm_btn") : "OK",
            showCloseButton: true,
            buttonsStyling: false,
            customClass: {
                popup: 'swal-modern-mini-popup',
                title: 'swal-modern-mini-title',
                htmlContainer: 'swal-modern-mini-text',
                confirmButton: 'swal-modern-mini-confirm'
            }
        });
    },

    /**
     * @function showError
     * @description Shows an error message.
     * @param {string} title - Title of the error.
     * @param {string} text - Body text of the error.
     */
    showError: (title, text) => {
        if (typeof Swal === 'undefined') {
            console.warn("[AuthUI] Swal not found for showError");
            return;
        }
        Swal.fire({
            title: title,
            text: text,
            confirmButtonText: window.langu ? window.langu("alert_confirm_btn") : "OK",
            showCloseButton: true,
            buttonsStyling: false,
            customClass: {
                popup: 'swal-modern-mini-popup',
                title: 'swal-modern-mini-title',
                htmlContainer: 'swal-modern-mini-text',
                confirmButton: 'swal-modern-mini-confirm'
            }
        });
    },

    /**
     * @function showFieldValidationMsg
     * @description Shows a validation error message below a specific input field.
     * @param {HTMLElement} inputElement - The input element.
     * @param {string} message - The error message.
     */
    showFieldValidationMsg: (inputElement, message) => {
        if (!inputElement) return;

        console.warn(`[Validation Error] Field: #${inputElement.id} | Message: ${message}`);

        const errorDiv = document.getElementById(`${inputElement.id}-error`);
        if (errorDiv) {
            errorDiv.innerHTML = message;
            errorDiv.style.display = 'block';
        }
    },

    /**
     * @function clearFieldValidationMsg
     * @description Clears validation error message for a specific input field.
     * @param {HTMLElement} inputElement - The input element.
     */
    clearFieldValidationMsg: (inputElement) => {
        if (!inputElement) return;
        const errorDiv = document.getElementById(`${inputElement.id}-error`);
        if (errorDiv) {
            errorDiv.textContent = "";
            errorDiv.style.display = 'none';
        }
    },

    /**
     * @function confirmPassword
     * @description Shows a popup to prompt the user to enter their password for confirmation.
     * @returns {Promise<string|null>} - Resolves with the password if confirmed, or null if cancelled.
     */
    confirmPassword: async (title = window.langu ? window.langu("auth_confirm_identity") : "Confirm Identity", 
                          text = window.langu ? window.langu("auth_enter_password_to_continue") : "Please enter your password.") => {
        if (typeof Swal === 'undefined') {
            console.error("[AuthUI] Swal not found for confirmPassword");
            return null;
        }
        const { value: password, isConfirmed } = await Swal.fire({
            title: title,
            text: text,
            input: "password",
            inputPlaceholder: window.langu ? window.langu("auth_enter_password_placeholder") : "Password",
            inputAttributes: { autocapitalize: "off", autocorrect: "off" },
            customClass: {
                popup: 'swal-modern-mini-popup',
                title: 'swal-modern-mini-title',
                htmlContainer: 'swal-modern-mini-text',
                confirmButton: 'swal-modern-mini-confirm',
                cancelButton: 'swal-modern-mini-cancel'
            },
            buttonsStyling: false,
            showCancelButton: true,
            confirmButtonText: window.langu ? window.langu("auth_confirm_btn") : "Confirm",
            cancelButtonText: window.langu ? window.langu("alert_cancel_btn") : "Cancel",
            showCloseButton: true,
            allowOutsideClick: () => !Swal.isLoading(),
        });

        if (isConfirmed && password) {
            return password;
        }
        return null;
    },

    /**
     * @function triggerShake
     * @description Applies a temporary shake animation to an element.
     * @param {HTMLElement} element - The element to shake.
     */
    triggerShake: (element) => {
        if (!element) return;
        const shakeClass = 'smart-focus-shake';
        element.classList.remove(shakeClass);
        void element.offsetWidth; // Trigger reflow to restart animation
        element.classList.add(shakeClass);
        setTimeout(() => {
            element.classList.remove(shakeClass);
        }, 850);
    }
};

// Hybrid bridge
window.AuthUI = AuthUI;

export default AuthUI;

console.log("[ESM Load] uiHelpers.js: Hybrid bridge established.");
