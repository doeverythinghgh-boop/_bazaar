/**
 * @file pages/productEdit/js/edit_image.js
 * @description Logic for image compression, loading, and WebP support for Product Edit.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


async function EDIT_supportsWebP() {
    return window.ProductFormCore
        ? window.ProductFormCore.supportsWebP()
        : false;
}
var EDIT_WEBP_SUPPORTED_PROMISE = window.ProductFormCore
    ? window.ProductFormCore.webpSupportPromise
    : EDIT_supportsWebP();

/**
 * @function EDIT_compressImage
 * @description Compresses an image file using Canvas with high-performance fallbacks for Product Edit.
 * @param {File|Blob} file - The image file to compress.
 * @returns {Promise<Blob>} Compressed image blob.
 */
async function EDIT_compressImage(file) {
    console.log(`[Edit-Debug] Starting compression for: ${file.name} (${EDIT_formatBytes(file.size)})`);

    try {
        const blob = await window.ProductFormCore.compressImage(file, {
            maxWidth: EDIT_IMAGE_MAX_WIDTH,
            maxHeight: EDIT_IMAGE_MAX_HEIGHT,
            quality: EDIT_IMAGE_QUALITY,
            logger: console
        });
        if (!blob) throw new Error('Blob creation failed');
        return blob;
    } catch (err) {
        console.error('[Edit] Safe Compression Error:', err);
        throw err;
    }
}

/**
 * @function EDIT_loadExistingImages
 * @description Loads existing product images from the server / cloud storage.
 */
async function EDIT_loadExistingImages() {
    const dom = EDIT_getDomElements();
    const imagesLoadingEl = dom.imagesLoading;
    const currentProduct = (typeof ProductStateManager !== 'undefined') ? ProductStateManager.getCurrentProduct() : null;

    // Helper to safely hide loader
    const hideLoader = () => {
        if (imagesLoadingEl) imagesLoadingEl.style.display = 'none';
    };

    if (!currentProduct || !currentProduct.ImageName) {
        hideLoader();
        return;
    }

    const resolveExistingImageUrl = (name) => {
        const trimmedName = String(name || '').trim();
        if (!trimmedName) return '';
        if (typeof getPublicR2FileUrl === 'function') return getPublicR2FileUrl(trimmedName);
        if (/^(\/|http:\/\/|https:\/\/|blob:|data:)/.test(trimmedName)) return trimmedName;
        return EDIT_CLOUDFLARE_BASE_URL + trimmedName;
    };

    const imageNames = currentProduct.ImageName.split(',').filter(name => name.trim());
    EDIT_originalImageNames = [...imageNames];

    console.log(`[ProductEdit] loading ${imageNames.length} exists`);

    if (imageNames.length === 0) {
        hideLoader();
        return;
    }

    let loadedCount = 0;
    const checkCompletion = () => {
        loadedCount++;
        if (loadedCount === imageNames.length) {
            hideLoader();
        }
    };

    for (let i = 0; i < imageNames.length; i++) {
        const name = imageNames[i].trim();

        const id = EDIT_genId();
        const imageUrl = resolveExistingImageUrl(name);

        const state = {
            id: id,
            file: null,
            compressedBlob: null,
            status: 'uploaded',
            url: imageUrl,
            fileName: name,
            isExisting: true
        };

        EDIT_images.push(state);

        // Load image for display
        const img = new Image();
        img.onload = () => {
            EDIT_createPreviewItem(state, imageUrl);
            checkCompletion();
        };
        img.onerror = () => {
            console.error(`Failed loading : ${name}`);
            state.status = 'error';
            EDIT_createPreviewItem(state, imageUrl);
            if (state._metaEl) state._metaEl.textContent = window.langu('gen_err_upload_failed');
            checkCompletion();
        };
        img.src = imageUrl;
    }
}

/**
 * @function EDIT_handleNewFiles
 * @description Processes newly selected files for upload.
 * @param {FileList|Array<File>} fileList - List of files.
 */
async function EDIT_handleNewFiles(fileList) {
    const uploaderEl = document.getElementById('image-uploader');
    const fileInput = document.getElementById('edit-file-input');

    console.log(`[ImageUploader] ${fileList.length} .`);
    EDIT_clearError(uploaderEl);

    // [Android Fix] Lock permissions by reading into Blobs immediately
    const filesArr = await window.ProductFormCore.lockFiles(fileList, EDIT_MAX_FILES - EDIT_images.length);

    // [OPTIMIZATION] Process files sequentially for Android/Mobile memory safety
    for (const file of filesArr) {
        if (!file.type.startsWith('image/')) {
            console.warn(`[ImageUploader] Skip non-image file: ${file.name}`);
            continue;
        }

        const id = EDIT_genId();
        const state = { id, file, compressedBlob: null, status: 'pending', isExisting: false };
        EDIT_images.push(state);
        EDIT_createPreviewItem(state);

        try {
            console.log(`[ImageUploader] : ${file.name}`);
            state.status = 'compressing';

            // UI Update: mark as processing
            if (state._el) state._el.classList.add('is-processing');

            const compressed = await EDIT_compressImage(file);

            // [RACE CONDITION CHECK] Ensure image still exists after async compression
            const stillExists = EDIT_images.some(img => img.id === state.id);
            if (!stillExists) {
                console.warn(`[ImageUploader] Image ${state.id} was removed. Aborting.`);
                continue;
            }

            state.compressedBlob = compressed;
            state.status = 'ready';
            if (state._el) state._el.classList.remove('is-processing');

            console.log(`[ImageUploader] Done successfully: ${file.name} -> ${EDIT_formatBytes(compressed.size)}`);

            if (state._metaEl) {
                state._metaEl.textContent = EDIT_formatBytes(compressed.size);
            }
        } catch (err) {
            console.error('[ImageUploader] Error :', err.message || err);

            if (!EDIT_images.some(img => img.id === state.id)) continue;

            state.status = 'error';
            if (state._el) {
                state._el.classList.remove('is-processing');
                state._el.classList.add('has-error');
            }
            if (state._metaEl) {
                state._metaEl.textContent = window.langu('edit_err_compression');
            }
        }
    }
    if (fileInput) fileInput.value = '';
}

// Map to global for compatibility
window.productModule.loadExistingImages = EDIT_loadExistingImages;
