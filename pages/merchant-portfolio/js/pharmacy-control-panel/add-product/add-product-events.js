/**
 * @file add-product-events.js
 * @description Event listener bindings for the Pharmacy Add Product module.
 *
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 */
(function() {
    if (!window.PharmacyAddModule) return;
    const { utils } = window.PharmacyAddModule;

    const events = {
        bindCategoryEvents: function() {
            const mainSelect = utils.getEl('main-category');
            const subSelect = utils.getEl('sub-category');
            const detailsSection = utils.getEl('product-details-section');

            if (mainSelect) {
                mainSelect.addEventListener('change', event => {
                    window.PharmacyAddModule.controller.handleMainCategoryChange(event.target.value);
                });
            }

            if (subSelect) {
                subSelect.addEventListener('change', event => {
                    if (event.target.value) {
                        detailsSection?.classList.remove('hidden');
                        setTimeout(() => {
                            detailsSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 100);
                        return;
                    }
                    detailsSection?.classList.add('hidden');
                });
            }
        },

        bindImageEvents: function() {
            window.pendingProductImage = null;
            const imageInput = utils.getEl('product-image');
            const pickBtn = utils.getEl('profile-avatar-pick-btn');
            const cameraBtn = utils.getEl('profile-avatar-camera-btn');
            const imagePreview = utils.getEl('profile-avatar-preview');
            const imagePlaceholder = utils.getEl('profile-avatar-placeholder');
            const editIconWrapper = utils.getEl('pm-avatar-edit-icon-wrapper');

            if (pickBtn) {
                pickBtn.onclick = () => {
                    imageInput?.removeAttribute("capture");
                    imageInput?.click();
                };
            }

            if (cameraBtn) {
                cameraBtn.onclick = () => {
                    imageInput?.setAttribute("capture", "environment");
                    imageInput?.click();
                };
            }

            if (imageInput) {
                imageInput.addEventListener('change', async event => {
                    const file = event.target.files?.[0];
                    if (!file) return;

                    try {
                        window.pendingProductImage = (typeof compressImage === 'function')
                            ? await compressImage(file, 600, 600, 0.8)
                            : file;

                        if (imagePreview) {
                            imagePreview.src = URL.createObjectURL(window.pendingProductImage);
                            imagePreview.style.display = 'block';
                        }
                        if (imagePlaceholder) imagePlaceholder.style.display = 'none';
                        if (editIconWrapper) editIconWrapper.style.display = 'none';
                    } catch (error) {
                        console.error("[PharmacyAddProduct] Image processing failed:", error);
                    }
                });
            }
        },

        bindSubmit: function() {
            const submitBtn = utils.getEl('btn-submit-product');
            if (submitBtn) {
                submitBtn.addEventListener('click', () => window.PharmacyAddModule.form.handleSubmit());
            }
        }
    };

    window.PharmacyAddModule.events = events;
    console.log("[Pharmacy-Add-Module] Event bindings loaded.");
})();
