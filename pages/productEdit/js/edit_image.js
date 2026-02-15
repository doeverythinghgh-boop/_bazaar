/**
 * @file pages/productEdit/js/edit_image.js
 * @description Logic for image compression, loading, and WebP support for Product Edit.
 */

async function EDIT_supportsWebP() {
    if (!self.createImageBitmap) return false;
    const blob = await fetch('data:image/webp;base64,UklGRiIAAABXRUJQVlA4TAYAAAAvAAAAAAfQ//73v/+BiOh/AAA=')
        .then(r => r.blob()).catch(() => null);
    if (!blob) return false;
    try { await createImageBitmap(blob); return true; } catch (e) { return false; }
}
var EDIT_WEBP_SUPPORTED_PROMISE = EDIT_supportsWebP();

/**
 * @function EDIT_compressImage
 * @description Compresses an image file using Canvas with high-performance fallbacks for Product Edit.
 * @param {File|Blob} file - The image file to compress.
 * @returns {Promise<Blob>} Compressed image blob.
 */
async function EDIT_compressImage(file) {
    let imgBitmap = null;
    let objectUrl = null;
    let drawSource = null;
    let sourceWidth = 0;
    let sourceHeight = 0;

    console.log(`[Edit-Debug] Starting compression for: ${file.name} (${EDIT_formatBytes(file.size)})`);

    try {
        // Strategy 1: High-Performance createImageBitmap
        if (typeof createImageBitmap === 'function') {
            try {
                imgBitmap = await createImageBitmap(file);
                drawSource = imgBitmap;
                sourceWidth = imgBitmap.width;
                sourceHeight = imgBitmap.height;
                console.log(`[Edit-Debug] Loaded via createImageBitmap: ${sourceWidth}x${sourceHeight}`);
            } catch (e) {
                console.warn('[Edit-Debug] createImageBitmap failed, falling back to legacy Image.', e);
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
        const ratio = Math.min(1, EDIT_IMAGE_MAX_WIDTH / sourceWidth, EDIT_IMAGE_MAX_HEIGHT / sourceHeight);
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
        const webpSupported = await EDIT_WEBP_SUPPORTED_PROMISE;
        const mime = webpSupported ? 'image/webp' : 'image/jpeg';

        const blob = await new Promise((res) => canvas.toBlob(res, mime, EDIT_IMAGE_QUALITY));
        if (!blob) throw new Error('Blob creation failed');

        return blob;

    } catch (err) {
        console.error('[Edit] Safe Compression Error:', err);
        throw err;
    } finally {
        if (imgBitmap && typeof imgBitmap.close === 'function') imgBitmap.close();
        if (objectUrl) {
            try { URL.revokeObjectURL(objectUrl); } catch (e) { }
        }
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

    const imageNames = currentProduct.ImageName.split(',').filter(name => name.trim());
    EDIT_originalImageNames = [...imageNames];

    console.log(`[ProductEdit] تحميل ${imageNames.length} صور موجودة`);

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
        const imageUrl = EDIT_CLOUDFLARE_BASE_URL + name;

        const state = {
            id: id,
            file: null,
            compressedBlob: null,
            status: 'uploaded',
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
            console.error(`فشل تحميل الصورة: ${name}`);
            state.status = 'error';
            EDIT_createPreviewItem(state, '');
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
    const fileInput = document.getElementById('file-input');

    console.log(`[ImageUploader] معالجة ${fileList.length} ملفات جديدة.`);
    EDIT_clearError(uploaderEl);

    // [Android Fix] Lock permissions by reading into Blobs immediately
    const filesArr = [];
    const rawFiles = Array.from(fileList).slice(0, EDIT_MAX_FILES - EDIT_images.length);
    for (const f of rawFiles) {
        try {
            const u = URL.createObjectURL(f);
            const b = await fetch(u).then(r => r.blob());
            URL.revokeObjectURL(u);
            b.name = f.name;
            b.lastModified = f.lastModified;
            filesArr.push(b);
        } catch (e) {
            console.warn(`[Edit] Early read failed for ${f.name}`, e);
            filesArr.push(f);
        }
    }

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
            console.log(`[ImageUploader] ضغط الصورة: ${file.name}`);
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

            console.log(`%c[ImageUploader] تم ضغط الصورة بنجاح: ${file.name} -> ${EDIT_formatBytes(compressed.size)}`, 'color: green;');

            if (state._metaEl) {
                state._metaEl.textContent = EDIT_formatBytes(compressed.size);
            }
        } catch (err) {
            console.error('[ImageUploader] خطأ أثناء معالجة الصورة:', err.message || err);

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
