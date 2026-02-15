/**
 * @file pages/productAdd/js/add1_image.js
 * @description Logic for image compression, validation, and processing.
 */

/**
 * @function add1_supportsWebP
 * @description Checks if the browser supports WebP format.
 * @returns {Promise<boolean>}
 */
async function add1_supportsWebP() {
    try {
        if (!self.createImageBitmap) return false;
        const blob = await fetch('data:image/webp;base64,UklGRiIAAABXRUJQVlA4TAYAAAAvAAAAAAfQ//73v/+BiOh/AAA=')
            .then(r => r.blob()).catch(() => null);
        if (!blob) return false;
        try { await createImageBitmap(blob); return true; } catch (e) { return false; }
    } catch (error) {
        console.error('[Add1] Error in add1_supportsWebP:', error);
        return false;
    }
}
var add1_WEBP_SUPPORTED_PROMISE = add1_supportsWebP();

/**
 * @function add1_compressImage
 * @description Compresses an image file using Canvas with high-performance fallbacks.
 *   Optimized for Android WebView and content:// URI stability.
 * @param {File|Blob} file - The image file to compress.
 * @returns {Promise<Blob>} - A Promise resolving to the compressed image Blob.
 */
async function add1_compressImage(file) {
    let imgBitmap = null;
    let objectUrl = null;
    let drawSource = null;
    let sourceWidth = 0;
    let sourceHeight = 0;

    console.log(`[Add1-Debug] Starting compression for: ${file.name} (${add1_formatBytes(file.size)})`);

    try {
        // Strategy 1: High-Performance createImageBitmap (Most reliable for content:// URIs)
        if (typeof createImageBitmap === 'function') {
            try {
                console.log('[Add1-Debug] Attempting initial load with createImageBitmap...');
                imgBitmap = await createImageBitmap(file);
                drawSource = imgBitmap;
                sourceWidth = imgBitmap.width;
                sourceHeight = imgBitmap.height;
                console.log(`[Add1-Debug] Success using createImageBitmap. Size: ${sourceWidth}x${sourceHeight}`);
            } catch (e) {
                console.warn('[Add1-Debug] createImageBitmap initial load failed, trying legacy Image...', e);
            }
        }

        // Strategy 2: Legacy Image element (Fallback)
        if (!drawSource) {
            const tempImg = new Image();
            await new Promise((resolve, reject) => {
                // Try ObjectURL first
                objectUrl = URL.createObjectURL(file);
                tempImg.onload = () => {
                    drawSource = tempImg;
                    sourceWidth = tempImg.width;
                    sourceHeight = tempImg.height;
                    console.log(`[Add1-Debug] Success using ObjectURL. Size: ${sourceWidth}x${sourceHeight}`);
                    resolve();
                };

                tempImg.onerror = () => {
                    console.warn('[Add1-Debug] ObjectURL failed. Falling back to FileReader...');
                    URL.revokeObjectURL(objectUrl);
                    objectUrl = null;

                    const reader = new FileReader();
                    reader.onload = (e) => {
                        tempImg.onload = () => {
                            drawSource = tempImg;
                            sourceWidth = tempImg.width;
                            sourceHeight = tempImg.height;
                            console.log(`[Add1-Debug] Success using FileReader. Size: ${sourceWidth}x${sourceHeight}`);
                            resolve();
                        };
                        tempImg.onerror = () => reject(new Error('Image decoding failed after FileReader'));
                        tempImg.src = e.target.result;
                    };
                    reader.onerror = () => reject(new Error('FileReader source failed: ' + (reader.error ? reader.error.message : 'Unknown')));
                    reader.readAsDataURL(file);
                };
                tempImg.src = objectUrl;
            });
        }

        // Calculate Target Dimensions
        const ratio = Math.min(1, add1_IMAGE_MAX_WIDTH / sourceWidth, add1_IMAGE_MAX_HEIGHT / sourceHeight);
        const newWidth = Math.round(sourceWidth * ratio);
        const newHeight = Math.round(sourceHeight * ratio);
        console.log(`[Add1-Debug] Target dimensions: ${newWidth}x${newHeight} (Ratio: ${ratio.toFixed(4)})`);

        // Optimization: Try to use createImageBitmap with resize if available
        if (imgBitmap && typeof createImageBitmap === 'function' && ratio < 1) {
            try {
                const resizedBitmap = await createImageBitmap(file, {
                    resizeWidth: newWidth,
                    resizeHeight: newHeight,
                    resizeQuality: 'medium'
                });
                imgBitmap.close(); // Close original
                imgBitmap = resizedBitmap;
                drawSource = imgBitmap;
                console.log('[Add1-Debug] Successfully optimized with resized ImageBitmap.');
            } catch (e) {
                console.warn('[Add1-Debug] createImageBitmap resize failed, using original source.');
            }
        }

        // Draw to Canvas
        console.log('[Add1-Debug] Drawing to Canvas...');
        const canvas = Object.assign(document.createElement('canvas'), { width: newWidth, height: newHeight });
        const ctx = canvas.getContext('2d', { alpha: false }); // Optimization: ignore alpha if possible

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, newWidth, newHeight);
        ctx.drawImage(drawSource, 0, 0, newWidth, newHeight);

        // Export
        const webpSupported = await add1_WEBP_SUPPORTED_PROMISE;
        const mime = webpSupported ? 'image/webp' : 'image/jpeg';
        console.log(`[Add1-Debug] Exporting as ${mime}...`);

        const blob = await new Promise((res) => canvas.toBlob(res, mime, add1_IMAGE_QUALITY));
        if (!blob) throw new Error('Canvas export failed (Blob is null)');

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
    } finally {
        if (imgBitmap && typeof imgBitmap.close === 'function') imgBitmap.close();
        if (objectUrl) {
            try { URL.revokeObjectURL(objectUrl); } catch (e) { }
        }
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
        const fileInput = document.getElementById('add1_file_input');

        console.log(`[ImageUploader-Add1] معالجة ${fileList.length} ملفات جديدة.`);
        add1_clearError(add1_uploaderEl);

        const availableSlots = add1_MAX_FILES - add1_images.length;
        if (availableSlots <= 0) {
            Swal.fire(window.langu('alert_title_info'), window.langu('gen_err_max_files').replace('{n}', add1_MAX_FILES), 'warning');
            return;
        }

        // [Android Fix] Immediately read files into Blobs to preserve permissions
        // We do this BEFORE any other async operations to 'lock' the content:// data.
        const filesArr = [];
        const rawFiles = Array.from(fileList).slice(0, availableSlots);

        for (const f of rawFiles) {
            try {
                const u = URL.createObjectURL(f);
                const b = await fetch(u).then(r => r.blob());
                URL.revokeObjectURL(u);
                // Preserve File metadata on the Blob
                b.name = f.name;
                b.lastModified = f.lastModified;
                filesArr.push(b);
            } catch (e) {
                console.warn(`[Add1] Early read failed for ${f.name}, using original.`, e);
                filesArr.push(f);
            }
        }

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
                console.log(`[ImageUploader-Add1] ضغط الصورة: ${file.name}`);
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

                console.log(`%c[ImageUploader-Add1] تم ضغط الصورة بنجاح: ${file.name} -> ${add1_formatBytes(compressed.size)}`, 'color: green;');

                if (state._metaEl) {
                    state._metaEl.textContent = add1_formatBytes(compressed.size);
                }
            } catch (err) {
                console.error('[ImageUploader-Add1] خطأ أثناء معالجة الصورة:', err.message || err);

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
        console.error('[ImageUploader-Add1] خطأ حرج في معالجة الملفات:', error);
    }
}
