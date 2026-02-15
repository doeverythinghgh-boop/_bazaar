/**
 * @file pages/productView2/js/view2_utils.js
 * @description Utility functions, especially for image compression.
 */

const PV2_WEBP_SUPPORTED_PROMISE = (async () => {
    const canvas = document.createElement('canvas');
    if (!!(canvas.getContext && canvas.getContext('2d'))) {
        return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    }
    return false;
})();

/**
 * @function pv2_compressImage
 * @description Compresses an image file using Canvas with high-performance fallbacks for Order Photos.
 * @param {File|Blob} file - The image file to compress.
 * @returns {Promise<Blob>} Compressed image blob.
 */
async function pv2_compressImage(file) {
    let imgBitmap = null;
    let objectUrl = null;
    let drawSource = null;
    let sourceWidth = 0;
    let sourceHeight = 0;

    console.log(`[OrderPhoto-Debug] Starting compression for: ${file.name} (${pv2_formatBytes(file.size)})`);

    try {
        // Strategy 1: High-Performance createImageBitmap
        if (typeof createImageBitmap === 'function') {
            try {
                imgBitmap = await createImageBitmap(file);
                drawSource = imgBitmap;
                sourceWidth = imgBitmap.width;
                sourceHeight = imgBitmap.height;
                console.log(`[OrderPhoto-Debug] Loaded via createImageBitmap: ${sourceWidth}x${sourceHeight}`);
            } catch (e) {
                console.warn('[OrderPhoto-Debug] createImageBitmap failed, falling back to legacy Image.', e);
            }
        }

        // Strategy 2: Legacy Image element with Multiple Fallbacks
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
        const ratio = Math.min(1, PV2_IMAGE_MAX_WIDTH / sourceWidth, PV2_IMAGE_MAX_HEIGHT / sourceHeight);
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
        const webpSupported = await PV2_WEBP_SUPPORTED_PROMISE;
        const mime = webpSupported ? 'image/webp' : 'image/jpeg';

        const blob = await new Promise((res) => canvas.toBlob(res, mime, PV2_IMAGE_QUALITY));
        if (!blob) throw new Error('Blob creation failed');

        // Restore file metadata
        blob.name = file.name;
        blob.lastModified = file.lastModified;
        blob.isCompressed = true;
        blob.extension = webpSupported ? 'webp' : 'jpg';

        return blob;

    } catch (err) {
        console.error('[OrderPhoto] Safe Compression Error:', err);
        throw err;
    } finally {
        if (imgBitmap && typeof imgBitmap.close === 'function') imgBitmap.close();
        if (objectUrl) {
            try { URL.revokeObjectURL(objectUrl); } catch (e) { }
        }
    }
}

/**
 * @function pv2_formatBytes
 */
function pv2_formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
