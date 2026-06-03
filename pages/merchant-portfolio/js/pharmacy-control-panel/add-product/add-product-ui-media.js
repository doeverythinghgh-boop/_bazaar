/**
 * @file add-product-ui-media.js
 * @description UI media handling for image previews.
 *
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 */
(function() {
    if (!window.PharmacyAddModule) return;
    const { utils } = window.PharmacyAddModule;
    const EMPTY_IMAGE_SRC = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

    const media = {
        setImagePreview: function(imageName) {
            const imagePreview = utils.getEl('profile-avatar-preview');
            const imagePlaceholder = utils.getEl('profile-avatar-placeholder');
            const editIconWrapper = utils.getEl('pm-avatar-edit-icon-wrapper');

            console.log(`[Pharmacy] Setting image preview for: "${imageName || 'empty'}"`);
            if (!imagePreview || !imagePlaceholder || !editIconWrapper) {
                console.warn("[Pharmacy] Preview elements not found in DOM!");
                return;
            }

            if (!imageName) {
                imagePreview.src = EMPTY_IMAGE_SRC;
                imagePreview.style.display = 'none';
                imagePlaceholder.style.display = 'block';
                editIconWrapper.style.display = 'flex';
                return;
            }

            const url = utils.getImageUrl(imageName);
            console.log(` - Resolved preview image URL: ${url}`);
            imagePreview.src = url;
            imagePreview.style.display = 'block';
            imagePlaceholder.style.display = 'none';
            editIconWrapper.style.display = 'none';
        }
    };

    window.PharmacyAddModule.ui.media = media;
    console.log("[Pharmacy-Add-Module] UI Media handling loaded.");
})();
