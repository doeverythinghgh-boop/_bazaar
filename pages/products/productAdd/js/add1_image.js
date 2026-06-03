/**
 * @file pages/productAdd/js/add1_image.js
 * @description Logic for image compression, validation, and processing.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


/**
 * @function add1_supportsWebP
 * @description Checks if the browser supports WebP format.
 * @returns {Promise<boolean>}
 */
async function add1_supportsWebP() {
    try {
        return window.ProductFormCore
            ? window.ProductFormCore.supportsWebP()
            : false;
    } catch (error) {
        console.error('[Add1] Error in add1_supportsWebP:', error);
        return false;
    }
}
var add1_WEBP_SUPPORTED_PROMISE = window.ProductFormCore
    ? window.ProductFormCore.webpSupportPromise
    : add1_supportsWebP();

/**
 * @function add1_compressImage
 * @description Compresses an image file using Canvas with high-performance fallbacks.
 *   Optimized for Android WebView and content:// URI stability.
 * @param {File|Blob} file - The image file to compress.
 * @returns {Promise<Blob>} - A Promise resolving to the compressed image Blob.
 */
async function add1_compressImage(file) {
    console.log(`[Add1-Debug] Starting compression for: ${file.name} (${add1_formatBytes(file.size)})`);

    try {
        const blob = await window.ProductFormCore.compressImage(file, {
            maxWidth: add1_IMAGE_MAX_WIDTH,
            maxHeight: add1_IMAGE_MAX_HEIGHT,
            quality: add1_IMAGE_QUALITY,
            logger: console
        });
        console.log(`[Add1-Debug] Compression success. Output size: ${add1_formatBytes(blob.size)}`);
        return blob;
    } catch (err) {
        const errorDetail = {
            message: err.message || 'Unknown Error',
            name: err.name || 'Error',
            stack: err.stack || ''
        };
        console.error('[Add1] Fatal Compression Error:', errorDetail);
        throw err;
    }
}

/**
 * @function add1_handleNewFiles
 * @description Processes newly selected files: validates, adds to preview, and triggers compression.
 * @param {FileList|Array<File>} fileList - The list of files to process.
 */
async function add1_handleNewFiles(fileList) {
    try {
        const add1_uploaderEl = document.getElementById('add1_image_uploader');
        const fileInput = document.getElementById('add1_file_input_00');

        console.log(`[ImageUploader-Add1] ${fileList.length} .`);
        add1_clearError(add1_uploaderEl);

        const availableSlots = add1_MAX_FILES - add1_images.length;
        if (availableSlots <= 0) {
            Swal.fire(window.langu('alert_title_info'), window.langu('gen_err_max_files').replace('{n}', add1_MAX_FILES), 'warning');
            return;
        }

        // [Android Fix] Immediately read files into Blobs to preserve permissions
        // We do this BEFORE any other async operations to 'lock' the content:// data.
        const filesArr = await window.ProductFormCore.lockFiles(fileList, availableSlots);

        // Sequential processing for mobile memory safety
        for (const file of filesArr) {
            if (!file.type.startsWith('image/')) {
                console.warn(`[ImageUploader-Add1] Skip non-image file: ${file.name}`);
                continue;
            }
            if (file.size === 0) {
                console.warn(`[ImageUploader-Add1] Skip empty file: ${file.name}`);
                continue;
            }

            const id = add1_genId();
            const state = { id, file, fileName: file.name, compressedBlob: null, status: 'pending' };
            add1_images.push(state);

            if (typeof add1_createPreviewItem === 'function') {
                add1_createPreviewItem(state);
            }

            try {
                console.log(`[ImageUploader-Add1] : ${file.name}`);
                state.status = 'compressing';
                if (state._el) state._el.classList.add('is-processing');

                const compressed = await add1_compressImage(file);

                // [RACE CONDITION CHECK] Ensure item wasn't removed while compressing
                const stillExists = add1_images.some(img => img.id === state.id);
                if (!stillExists) {
                    console.warn(`[ImageUploader-Add1] Image ${state.id} was removed. Aborting.`);
                    continue;
                }

                state.compressedBlob = compressed;
                state.status = 'ready';
                if (state._el) state._el.classList.remove('is-processing');

                console.log(`[ImageUploader-Add1] Done successfully: ${file.name} -> ${add1_formatBytes(compressed.size)}`);

                if (state._metaEl) {
                    state._metaEl.textContent = add1_formatBytes(compressed.size);
                }
            } catch (err) {
                console.error('[ImageUploader-Add1] Error :', err.message || err);

                if (!add1_images.some(img => img.id === state.id)) continue;
                state.status = 'error';
                if (state._el) {
                    state._el.classList.remove('is-processing');
                    state._el.classList.add('has-error');
                }
                if (state._metaEl) {
                    state._metaEl.textContent = window.langu('gen_err_compression');
                }
            }
        }
        if (fileInput) fileInput.value = '';
    } catch (error) {
        console.error('[ImageUploader-Add1] Error :', error);
    }
}
