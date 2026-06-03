/**
 * @file pages/register/js/register-error-manager.js
 * @description Centralized error message mapping and dictionary for registration.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


window.RegisterErrorManager = (function () {
    'use strict';

    const errorDictionary = {
        'USERNAME_REQUIRED': 'profile_error_username_required',
        'USERNAME_INVALID': 'profile_error_username_invalid',
        'USERNAME_EXISTS': 'register_error_username_exists',
        'PHONE_REQUIRED': 'register_error_phone_required',
        'PHONE_INVALID': 'register_error_phone_invalid',
        'PHONE_EXISTS': 'register_error_phone_exists',
        'CONNECTION_FAILED': 'register_error_app',
        'PASSWORD_REQUIRED': 'profile_error_password_required',
        'PASSWORD_SHORT': 'profile_error_password_short',
        'PASSWORD_MISMATCH': 'profile_error_password_mismatch',
        'ADDRESS_REQUIRED': 'register_error_address_required',
        'LOCATION_REQUIRED': 'register_error_location_required',
        'NO_CATEGORY': 'register_error_no_category',
        'BUSINESS_NAME_REQUIRED': 'register_error_username_required'
    };

    /**
     * Gets a localized error message from a code.
     * @param {string} code
     * @returns {string}
     */
    function getMessage(code) {
        const lkey = errorDictionary[code];
        if (!lkey) return code; // Fallback to code if no mapping

        return (typeof window.langu === 'function')
            ? (window.langu(lkey) || code)
            : code;
    }

    return {
        getMessage
    };
})();
