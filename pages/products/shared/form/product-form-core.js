/**
 * @file pages/products/shared/form/product-form-core.js
 * @description Shared helpers for product add/edit forms.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


window.ProductFormCore = window.ProductFormCore || (function createProductFormCore() {
    async function supportsWebP() {
        try {
            if (!self.createImageBitmap) return false;
            const blob = await fetch('data:image/webp;base64,UklGRiIAAABXRUJQVlA4TAYAAAAvAAAAAAfQ//73v/+BiOh/AAA=')
                .then((response) => response.blob())
                .catch(() => null);
            if (!blob) return false;
            try {
                await createImageBitmap(blob);
                return true;
            } catch (error) {
                return false;
            }
        } catch (error) {
            console.error('[ProductFormCore] WebP support detection failed:', error);
            return false;
        }
    }

    async function compressImage(file, options = {}) {
        const {
            maxWidth = 1600,
            maxHeight = 1600,
            quality = 0.75,
            logger = console
        } = options;

        let imgBitmap = null;
        let objectUrl = null;
        let drawSource = null;
        let sourceWidth = 0;
        let sourceHeight = 0;

        try {
            if (typeof createImageBitmap === 'function') {
                try {
                    imgBitmap = await createImageBitmap(file);
                    drawSource = imgBitmap;
                    sourceWidth = imgBitmap.width;
                    sourceHeight = imgBitmap.height;
                } catch (error) {
                    logger?.warn?.('[ProductFormCore] createImageBitmap failed, falling back to Image.', error);
                }
            }

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
                        if (objectUrl) {
                            URL.revokeObjectURL(objectUrl);
                            objectUrl = null;
                        }

                        const reader = new FileReader();
                        reader.onload = (event) => {
                            tempImg.onload = () => {
                                drawSource = tempImg;
                                sourceWidth = tempImg.width;
                                sourceHeight = tempImg.height;
                                resolve();
                            };
                            tempImg.onerror = () => reject(new Error('Image decoding failed after FileReader'));
                            tempImg.src = event.target.result;
                        };
                        reader.onerror = () => reject(new Error('FileReader failed: ' + (reader.error ? reader.error.message : 'Unknown')));
                        reader.readAsDataURL(file);
                    };
                    tempImg.src = objectUrl;
                });
            }

            const ratio = Math.min(1, maxWidth / sourceWidth, maxHeight / sourceHeight);
            const newWidth = Math.round(sourceWidth * ratio);
            const newHeight = Math.round(sourceHeight * ratio);

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
                } catch (error) {
                    logger?.warn?.('[ProductFormCore] createImageBitmap resize failed, using original source.', error);
                }
            }

            const canvas = Object.assign(document.createElement('canvas'), { width: newWidth, height: newHeight });
            const ctx = canvas.getContext('2d', { alpha: false });
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, newWidth, newHeight);
            ctx.drawImage(drawSource, 0, 0, newWidth, newHeight);

            const mime = (await webpSupportPromise) ? 'image/webp' : 'image/jpeg';
            const blob = await new Promise((resolve) => canvas.toBlob(resolve, mime, quality));
            if (!blob) throw new Error('Canvas export failed (Blob is null)');
            return blob;
        } finally {
            if (imgBitmap && typeof imgBitmap.close === 'function') imgBitmap.close();
            if (objectUrl) {
                try { URL.revokeObjectURL(objectUrl); } catch { }
            }
        }
    }

    async function lockFiles(fileList, limit) {
        const filesArr = [];
        const rawFiles = Array.from(fileList).slice(0, limit);

        for (const file of rawFiles) {
            try {
                const objectUrl = URL.createObjectURL(file);
                const blob = await fetch(objectUrl).then((response) => response.blob());
                URL.revokeObjectURL(objectUrl);
                blob.name = file.name;
                blob.lastModified = file.lastModified;
                filesArr.push(blob);
            } catch (error) {
                console.warn(`[ProductFormCore] Early read failed for ${file.name}, using original file.`, error);
                filesArr.push(file);
            }
        }

        return filesArr;
    }

    function bindCounter(input, counterId, clearError) {
        if (!input) return;
        input.addEventListener('input', () => {
            const counter = document.getElementById(counterId);
            const currentLength = input.value.length;
            if (counter) counter.textContent = `${currentLength} / ${input.maxLength}`;
            if (clearError && currentLength > 0) clearError(input);
        });
    }

    function bindIntegerInput(input, clearError) {
        if (!input) return;
        input.addEventListener('input', function handleIntegerInput() {
            let value = normalizeDigits(this.value);
            this.value = value.replace(/[^0-9]/g, '');
            if (this.value && clearError) clearError(this);
        });
    }

    function bindDecimalInput(input, clearError) {
        if (!input) return;
        input.addEventListener('input', function handleDecimalInput() {
            let value = normalizeDigits(this.value);
            value = value.replace(/[^0-9.]/g, '');
            const parts = value.split('.');
            if (parts.length > 2) value = parts[0] + '.' + parts.slice(1).join('');
            this.value = value;
            if (this.value && clearError) clearError(this);
        });
    }

    function formatBytes(bytes, decimals = 2, zeroLabel = '0 Bytes') {
        if (!+bytes) return zeroLabel;
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    }

    const webpSupportPromise = supportsWebP();

    return {
        bindCounter,
        bindDecimalInput,
        bindIntegerInput,
        compressImage,
        formatBytes,
        lockFiles,
        supportsWebP,
        webpSupportPromise
    };
})();

