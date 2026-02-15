/**
 * @file pages/productEdit2/js/edit2_image.js
 * @description Logic for image compression, loading, and WebP support for Service Edit.
 */

/**
 * @function EDIT2_supportsWebP
 * @description Checks if the browser supports WebP format.
 * @returns {Promise<boolean>}
 */
async function EDIT2_supportsWebP() {
    if (!self.createImageBitmap) return false;
    const blob = await fetch('data:image/webp;base64,UklGRiIAAABXRUJQVlA4TAYAAAAvAAAAAAfQ//73v/+BiOh/AAA=')
        .then(r => r.blob()).catch(() => null);
    if (!blob) return false;
    try { await createImageBitmap(blob); return true; } catch (e) { return false; }
}
var EDIT2_WEBP_SUPPORTED_PROMISE = EDIT2_supportsWebP();

/**
 * @function EDIT2_compressImage
 * @description Compresses an image file using Canvas with high-performance fallbacks.
 * @param {File|Blob} file - The image file to compress.
 * @returns {Promise<Blob>} Compressed image blob.
 */
async function EDIT2_compressImage(file) {
    let imgBitmap = null;
    let objectUrl = null;
    let drawSource = null;
    let sourceWidth = 0;
    let sourceHeight = 0;

    console.log(`[Edit2-Debug] Starting compression for: ${file.name} (${EDIT2_formatBytes(file.size)})`);

    try {
        // Strategy 1: High-Performance createImageBitmap
        if (typeof createImageBitmap === 'function') {
            try {
                imgBitmap = await createImageBitmap(file);
                drawSource = imgBitmap;
                sourceWidth = imgBitmap.width;
                sourceHeight = imgBitmap.height;
                console.log(`[Edit2-Debug] Loaded via createImageBitmap: ${sourceWidth}x${sourceHeight}`);
            } catch (e) {
                console.warn('[Edit2-Debug] createImageBitmap failed, falling back to legacy Image.', e);
            }
        }

        // Strategy 2: Legacy Image element
        if (!drawSource) {
            const tempImg = new Image();
            await new Promise((resolve, reject) => {
                objectUrl = URL.createObjectURL(file);
                tempImg.onload = () => {
                    drawSource = tempImg;
                    sourceWidth = tempImg.width;
                    sourceHeight = tempImg.height;
                    resolve();
                };
                tempImg.onerror = () => {
                    URL.revokeObjectURL(objectUrl);
                    objectUrl = null;

                    const reader = new FileReader();
                    reader.onload = (e) => {
                        tempImg.onload = () => {
                            drawSource = tempImg;
                            sourceWidth = tempImg.width;
                            sourceHeight = tempImg.height;
                            resolve();
                        };
                        tempImg.onerror = () => reject(new Error('Image decoding failed (FileReader)'));
                        tempImg.src = e.target.result;
                    };
                    reader.onerror = () => reject(new Error('FileReader failed: ' + (reader.error ? reader.error.message : 'Unknown')));
                    reader.readAsDataURL(file);
                };
                tempImg.src = objectUrl;
            });
        }

        // Calculate Target Size
        const ratio = Math.min(1, EDIT2_IMAGE_MAX_WIDTH / sourceWidth, EDIT2_IMAGE_MAX_HEIGHT / sourceHeight);
        const newWidth = Math.round(sourceWidth * ratio);
        const newHeight = Math.round(sourceHeight * ratio);

        // Optimization: Try to use resize feature of createImageBitmap
        if (imgBitmap && typeof createImageBitmap === 'function' && ratio < 1) {
            try {
                const resizedBitmap = await createImageBitmap(file, {
                    resizeWidth: newWidth,
                    resizeHeight: newHeight,
                    resizeQuality: 'medium'
                });
                imgBitmap.close();
                imgBitmap = resizedBitmap;
                drawSource = imgBitmap;
            } catch (e) { }
        }

        // Draw to canvas
        const canvas = Object.assign(document.createElement('canvas'), { width: newWidth, height: newHeight });
        const ctx = canvas.getContext('2d', { alpha: false });

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, newWidth, newHeight);
        ctx.drawImage(drawSource, 0, 0, newWidth, newHeight);

        // Export
        const webpSupported = await EDIT2_WEBP_SUPPORTED_PROMISE;
        const mime = webpSupported ? 'image/webp' : 'image/jpeg';

        const blob = await new Promise((res) => canvas.toBlob(res, mime, EDIT2_IMAGE_QUALITY));
        if (!blob) throw new Error('Generated blob is null (Canvas failure)');

        return blob;
    } catch (err) {
        const errorDetail = {
            message: err.message || 'Unknown Error',
            name: err.name || 'Error',
            stack: err.stack || ''
        };
        console.error('[Edit2] Fatal Compression Error:', errorDetail);
        throw err;
    } finally {
        if (imgBitmap && typeof imgBitmap.close === 'function') imgBitmap.close();
        if (objectUrl) {
            try { URL.revokeObjectURL(objectUrl); } catch (e) { }
        }
    }
}

/**
 * @function EDIT2_loadExistingImages
 * @description Loads existing service images from the cloud storage.
 */
async function EDIT2_loadExistingImages() {
    const imagesLoadingEl = document.getElementById('images-loading');
    const currentProduct = (typeof ProductStateManager !== 'undefined') ? ProductStateManager.getCurrentProduct() : null;

    const hideLoader = () => {
        if (imagesLoadingEl) imagesLoadingEl.style.display = 'none';
    };

    if (!currentProduct || !currentProduct.ImageName) {
        hideLoader();
        return;
    }

    const imageNames = currentProduct.ImageName.split(',').filter(name => name.trim());
    EDIT2_originalImageNames = [...imageNames];

    console.log(`[ProductEdit2] تحميل ${imageNames.length} صور موجودة`);
    if (imageNames.length === 0) {
        hideLoader();
        return;
    }

    let loadedCount = 0;
    const checkCompletion = () => {
        loadedCount++;
        if (loadedCount === imageNames.length) hideLoader();
    };

    for (const name of imageNames) {
        const id = EDIT2_genId();
        const imageUrl = EDIT2_CLOUDFLARE_BASE_URL + name.trim();
        const state = { id, file: null, compressedBlob: null, status: 'uploaded', fileName: name.trim(), isExisting: true };
        EDIT2_images.push(state);

        const img = new Image();
        img.onload = () => { EDIT2_createPreviewItem(state, imageUrl); checkCompletion(); };
        img.onerror = () => {
            console.error(`فشل تحميل الصورة: ${name}`);
            state.status = 'error';
            EDIT2_createPreviewItem(state, '');
            if (state._metaEl) state._metaEl.textContent = window.langu('gen_err_upload_failed');
            checkCompletion();
        };
        img.src = imageUrl;
    }
}

/**
 * @function EDIT2_handleNewFiles
 * @description Processes newly selected files for upload.
 * @param {FileList|Array<File>} fileList - List of files.
 */
async function EDIT2_handleNewFiles(fileList) {
    const uploaderEl = document.getElementById('image-uploader');
    const fileInput = document.getElementById('file-input');

    console.log(`[ImageUploader-Edit2] معالجة ${fileList.length} ملفات جديدة.`);
    EDIT2_clearError(uploaderEl);

    // [Android Fix] Lock permissions by reading into Blobs immediately
    const filesArr = [];
    const rawFiles = Array.from(fileList).slice(0, EDIT2_MAX_FILES - EDIT2_images.length);
    for (const f of rawFiles) {
        try {
            const u = URL.createObjectURL(f);
            const b = await fetch(u).then(r => r.blob());
            URL.revokeObjectURL(u);
            b.name = f.name;
            b.lastModified = f.lastModified;
            filesArr.push(b);
        } catch (e) {
            console.warn(`[Edit2] Early read failed for ${f.name}`, e);
            filesArr.push(f);
        }
    }

    // Sequential processing for mobile memory safety
    for (const file of filesArr) {
        if (!file.type.startsWith('image/')) {
            console.warn(`[ImageUploader-Edit2] Skip non-image file: ${file.name}`);
            continue;
        }

        const id = EDIT2_genId();
        const state = { id, file, compressedBlob: null, status: 'pending', isExisting: false };
        EDIT2_images.push(state);
        EDIT2_createPreviewItem(state);

        try {
            console.log(`[ImageUploader-Edit2] ضغط الصورة: ${file.name}`);
            state.status = 'compressing';
            if (state._el) state._el.classList.add('is-processing');

            const compressed = await EDIT2_compressImage(file);

            // [RACE CONDITION CHECK] Ensure item wasn't removed while compressing
            if (!EDIT2_images.some(img => img.id === state.id)) {
                console.warn(`[ImageUploader-Edit2] Image ${state.id} was removed. Aborting.`);
                continue;
            }

            state.compressedBlob = compressed;
            state.status = 'ready';
            if (state._el) state._el.classList.remove('is-processing');

            console.log(`%c[ImageUploader-Edit2] تم ضغط الصورة بنجاح: ${file.name} -> ${EDIT2_formatBytes(compressed.size)}`, 'color: green;');
            if (state._metaEl) {
                state._metaEl.textContent = EDIT2_formatBytes(compressed.size);
            }
        } catch (err) {
            console.error('[ImageUploader-Edit2] خطأ أثناء معالجة الصورة:', err.message || err);

            if (!EDIT2_images.some(img => img.id === state.id)) continue;
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
}

// Map to global for compatibility
window.productModule.loadExistingImages = EDIT2_loadExistingImages;
