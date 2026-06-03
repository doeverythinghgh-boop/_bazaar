/**
 * @file pages/productEdit/js/edit_config.js
 * @description Configuration constants and global state for the Product Edit Page.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


(function initializeEditPageState(global) {
    const pageState = global.EditProductPageState || {
        config: {
            imageMaxWidth: 1600,
            imageMaxHeight: 1600,
            imageQuality: 0.75,
            maxFiles: 4,
            cloudflareBaseUrl: (((typeof global.getBazaarInfrastructureConfig === 'function'
                ? global.getBazaarInfrastructureConfig().r2PublicUrl
                : null) || '')).replace(/\/$/, '') + '/'
        },
        images: [],
        idCounter: 1,
        originalImageNames: []
    };

    global.EditProductPageState = pageState;

    Object.defineProperties(global, {
        EDIT_IMAGE_MAX_WIDTH: {
            configurable: true,
            get() { return pageState.config.imageMaxWidth; }
        },
        EDIT_IMAGE_MAX_HEIGHT: {
            configurable: true,
            get() { return pageState.config.imageMaxHeight; }
        },
        EDIT_IMAGE_QUALITY: {
            configurable: true,
            get() { return pageState.config.imageQuality; }
        },
        EDIT_MAX_FILES: {
            configurable: true,
            get() { return pageState.config.maxFiles; }
        },
        EDIT_CLOUDFLARE_BASE_URL: {
            configurable: true,
            get() { return pageState.config.cloudflareBaseUrl; }
        },
        EDIT_images: {
            configurable: true,
            get() { return pageState.images; },
            set(value) { pageState.images = Array.isArray(value) ? value : []; }
        },
        EDIT_idCounter: {
            configurable: true,
            get() { return pageState.idCounter; },
            set(value) { pageState.idCounter = value; }
        },
        EDIT_originalImageNames: {
            configurable: true,
            get() { return pageState.originalImageNames; },
            set(value) { pageState.originalImageNames = Array.isArray(value) ? value : []; }
        }
    });

    global.productModule = global.productModule || {};
    Object.defineProperties(global.productModule, {
        images: {
            configurable: true,
            get() { return pageState.images; },
            set(value) { pageState.images = Array.isArray(value) ? value : []; }
        },
        originalImageNames: {
            configurable: true,
            get() { return pageState.originalImageNames; },
            set(value) { pageState.originalImageNames = Array.isArray(value) ? value : []; }
        }
    });
})(window);
