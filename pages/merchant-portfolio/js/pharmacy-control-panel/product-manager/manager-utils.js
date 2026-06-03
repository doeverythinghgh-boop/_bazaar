/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */
(function() {
    if (!window.PharmacyProductManagerModule) return;
    window.PharmacyProductManagerModule.utils = {
        /**
         * Safely extracts the first element if input is an array
         */
        getFirst: (val) => Array.isArray(val) ? val[0] : val,

        /**
         * Normalizes an ID to a string, handling arrays and nulls
         */
        normalizeId: (id) => {
            let val = id;
            if (Array.isArray(val)) val = val[0];
            return String(val || '');
        }
    };
    console.log("[Pharmacy-Manager] Utils loaded.");
})();
