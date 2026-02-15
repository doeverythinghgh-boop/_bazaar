/**
 * @file pages/productAdd2/js/add2_image.js
 * @description Logic for image compression, validation, and processing for Product Add 2.
 */

/**
 * @function add2_supportsWebP
 * @description Checks if the browser supports WebP format.
 * @returns {Promise<boolean>}
 */
async function add2_supportsWebP() {
    try {
        if (!self.createImageBitmap) return false;
        const blob = await fetch('data:image/webp;base64,UklGRiIAAABXRUJQVlA4TAYAAAAvAAAAAAfQ//73v/+BiOh/AAA=')
            .then(r => r.blob()).catch(() => null);
        if (!blob) return false;
        try { await createImageBitmap(blob); return true; } catch (e) { return false; }
    } catch (error) {
        console.error('[Add2] Error in add2_supportsWebP:', error);
        return false;
    }
}
var add2_WEBP_SUPPORTED_PROMISE = add2_supportsWebP();

/**
 * @function add2_compressImage
 * @description Compresses an image file using Canvas with high-performance fallbacks.
 * @param {File|Blob} file - The image file to compress.
 * @returns {Promise<Blob>} Compressed image blob.
 */
async function add2_compressImage(file) {
    let imgBitmap = null;
    let objectUrl = null;
    let drawSource = null;
    let sourceWidth = 0;
    let sourceHeight = 0;

    console.log(`[Add2-Debug] Starting compression for: ${file.name} (${add2_formatBytes(file.size)})`);

    try {
        // Strategy 1: High-Performance createImageBitmap
        if (typeof createImageBitmap === 'function') {
            try {
                imgBitmap = await createImageBitmap(file);
                drawSource = imgBitmap;
                sourceWidth = imgBitmap.width;
                sourceHeight = imgBitmap.height;
                console.log(`[Add2-Debug] Loaded via createImageBitmap: ${sourceWidth}x${sourceHeight}`);
            } catch (e) {
                console.warn('[Add2-Debug] createImageBitmap failed, falling back to legacy Image.', e);
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
        const ratio = Math.min(1, add2_IMAGE_MAX_WIDTH / sourceWidth, add2_IMAGE_MAX_HEIGHT / sourceHeight);
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
        const webpSupported = await add2_WEBP_SUPPORTED_PROMISE;
        const mime = webpSupported ? 'image/webp' : 'image/jpeg';

        const blob = await new Promise((res) => canvas.toBlob(res, mime, add2_IMAGE_QUALITY));
        if (!blob) throw new Error('Blob creation failed');

        return blob;
    } catch (err) {
        const errorDetail = {
            message: err.message || 'Unknown Error',
            name: err.name || 'Error',
            stack: err.stack || ''
        };
        console.error('[Add2] Fatal Compression Error:', errorDetail);
        throw err;
    } finally {
        if (imgBitmap && typeof imgBitmap.close === 'function') imgBitmap.close();
        if (objectUrl) {
            try { URL.revokeObjectURL(objectUrl); } catch (e) { }
        }
    }
}

/**
 * @function add2_handleNewFiles
 * @description Processes newly selected files for upload.
 * @param {FileList|Array<File>} fileList - List of files.
 */
async function add2_handleNewFiles(fileList) {
    try {
        const uploaderEl = document.getElementById('add2_image_uploader');
        const fileInput = document.getElementById('add2_file_input');

        console.log(`[ImageUploader-Add2] معالجة ${fileList.length} ملفات جديدة.`);
        add2_clearError(uploaderEl);

        const availableSlots = add2_MAX_FILES - add2_images.length;
        if (availableSlots <= 0) {
            Swal.fire(window.langu('alert_title_info'), window.langu('gen_err_max_files').replace('{n}', add2_MAX_FILES), 'warning');
            return;
        }

        // [Android Fix] Lock permissions by reading into Blobs immediately
        const filesArr = [];
        const rawFiles = Array.from(fileList).slice(0, availableSlots);
        for (const f of rawFiles) {
            try {
                const u = URL.createObjectURL(f);
                const b = await fetch(u).then(r => r.blob());
                URL.revokeObjectURL(u);
                b.name = f.name;
                b.lastModified = f.lastModified;
                filesArr.push(b);
            } catch (e) {
                console.warn(`[Add2] Early read failed for ${f.name}`, e);
                filesArr.push(f);
            }
        }

        // Sequential processing for mobile memory safety
        for (const file of filesArr) {
            if (!file.type.startsWith('image/')) {
                console.warn(`[ImageUploader-Add2] Skip non-image file: ${file.name}`);
                continue;
            }

            const id = add2_genId();
            const state = { id, file, fileName: file.name, compressedBlob: null, status: 'pending' };
            add2_images.push(state);

            if (typeof add2_createPreviewItem === 'function') {
                add2_createPreviewItem(state);
            }

            try {
                console.log(`[ImageUploader-Add2] ضغط الصورة: ${file.name}`);
                state.status = 'compressing';
                if (state._el) state._el.classList.add('is-processing');

                const compressed = await add2_compressImage(file);

                // [RACE CONDITION CHECK]
                if (!add2_images.some(img => img.id === state.id)) {
                    console.warn(`[ImageUploader-Add2] Image ${state.id} removed. Aborting.`);
                    continue;
                }

                state.compressedBlob = compressed;
                state.status = 'ready';
                if (state._el) state._el.classList.remove('is-processing');

                console.log(`%c[ImageUploader-Add2] تم ضغط الصورة بنجاح: ${file.name} -> ${add2_formatBytes(compressed.size)}`, 'color: green;');

                if (state._metaEl) {
                    state._metaEl.textContent = add2_formatBytes(compressed.size);
                }
            } catch (err) {
                console.error('[ImageUploader-Add2] خطأ أثناء معالجة الصورة:', err.message || err);
                if (!add2_images.some(img => img.id === state.id)) continue;
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
        console.error('[ImageUploader-Add2] خطأ حرج في معالجة الملفات:', error);
    }
}
