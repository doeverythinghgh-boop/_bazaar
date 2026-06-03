/**
 * @file pages/productAdd/js/add1_config.js
 * @description Configuration constants and shared variables for the Product Addition Page.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


(function initializeAdd1PageState(global) {
    const pageState = global.Add1PageState || {
        config: {
            imageMaxWidth: 1600,
            imageMaxHeight: 1600,
            imageQuality: 0.75,
            maxFiles: 4
        },
        images: [],
        idCounter: 1,
        isProcessingFiles: false
    };

    global.Add1PageState = pageState;

    Object.defineProperties(global, {
        add1_IMAGE_MAX_WIDTH: {
            configurable: true,
            get() { return pageState.config.imageMaxWidth; }
        },
        add1_IMAGE_MAX_HEIGHT: {
            configurable: true,
            get() { return pageState.config.imageMaxHeight; }
        },
        add1_IMAGE_QUALITY: {
            configurable: true,
            get() { return pageState.config.imageQuality; }
        },
        add1_MAX_FILES: {
            configurable: true,
            get() { return pageState.config.maxFiles; }
        },
        add1_images: {
            configurable: true,
            get() { return pageState.images; },
            set(value) { pageState.images = Array.isArray(value) ? value : []; }
        },
        add1_idCounter: {
            configurable: true,
            get() { return pageState.idCounter; },
            set(value) { pageState.idCounter = value; }
        },
        isProcessingFilesAdd1: {
            configurable: true,
            get() { return pageState.isProcessingFiles; },
            set(value) { pageState.isProcessingFiles = value === true; }
        }
    });
})(window);
