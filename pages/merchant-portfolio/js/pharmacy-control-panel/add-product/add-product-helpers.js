/**
 * @file add-product-helpers.js
 * @description Utility functions and DOM helpers.
 *
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 */
(function() {
    if (!window.PharmacyAddModule) return;

    const utils = {
        getEl: function(id) {
            return document.getElementById(id);
        },

        getImageUrl: function(imageName) {
            if (!imageName) return '';

            let resolvedUrl = '';
            const nameStr = String(imageName);

            if (nameStr.startsWith('images/') || nameStr.includes('pharmList/') || nameStr.includes('shared/')) {
                resolvedUrl = '/' + nameStr.replace(/^\/+/, '');
            } else {
                resolvedUrl = (typeof window.getPublicR2FileUrl === 'function')
                    ? window.getPublicR2FileUrl(imageName)
                    : ('/' + imageName);
            }

            console.log(`[Pharmacy] Resolved final image URL: ${resolvedUrl}`);
            return resolvedUrl;
        }
    };

    window.PharmacyAddModule.utils = utils;
    console.log("[Pharmacy-Add-Module] Helpers loaded.");
})();
