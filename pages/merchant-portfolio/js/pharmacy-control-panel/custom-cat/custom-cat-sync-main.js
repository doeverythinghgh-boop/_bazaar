/**
 * @file custom-cat-sync-main.js
 * @description Main entry point for custom category synchronization.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

(function() {
    function pharmacySetupCustomCategoryCreation(userKey) {
        if (window.pharmacyCustomCatEvents) {
            window.pharmacyCustomCatEvents.bindEvents(userKey);
        }
        if (window.pharmacyCustomCatLogic) {
            window.pharmacyCustomCatLogic.reload(userKey);
        }

        // Backward compatibility
        window.pharmacyCustomCategoryController = {
            bindEvents: () => window.pharmacyCustomCatEvents.bindEvents(userKey),
            reload: () => window.pharmacyCustomCatLogic.reload(userKey)
        };
    }

    window.pharmacyCustomCatSync = {
        setupCreation: pharmacySetupCustomCategoryCreation
    };

    window.pharmacySetupCustomCategoryCreation = pharmacySetupCustomCategoryCreation;
})();
