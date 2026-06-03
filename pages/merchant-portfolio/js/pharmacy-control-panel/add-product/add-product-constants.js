/**
 * @file add-product-constants.js
 * @description Default form values and constants.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

(function() {
    if (!window.PharmacyAddModule) return;

    window.PharmacyAddModule.CONSTANTS = {
        FORM_DEFAULTS: {
            nameAr: '',
            nameEn: '',
            price: '',
            description: '',
            discount: '0',
            stock: '100',
            barcode: '',
            brandAr: '',
            brandEn: '',
            manufacturer: '',
            rx: false,
            ingredients: '',
            status: '1'
        }
    };

    console.log("[Pharmacy-Add-Module] Constants loaded.");
})();
