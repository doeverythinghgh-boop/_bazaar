/**
 * @file pages/merchant-portfolio/js/send-request-media.js
 * @description Image handling and compression for the Pharmacy Request page.
 */

const RequestMedia = {
    /**
     * @function setup
     * @description Configures event listeners for Gallery and Camera buttons.
     */
    setup() {
        const galleryBtn = document.getElementById('req-btn-gallery');
        const cameraBtn = document.getElementById('req-btn-camera');
        const galleryInput = document.getElementById('file-input');
        const cameraInput = document.getElementById('req-camera-input');

        if (galleryBtn) galleryBtn.onclick = () => galleryInput.click();
        if (cameraBtn) cameraBtn.onclick = () => cameraInput.click();

        if (galleryInput) {
            galleryInput.onchange = (e) => {
                this.handleFiles(Array.from(e.target.files));
                galleryInput.value = '';
            };
        }

        if (cameraInput) {
            cameraInput.onchange = (e) => {
                this.handleFiles(Array.from(e.target.files));
                cameraInput.value = '';
            };
        }
    },

    /**
     * @function compressImage
     * @description Resizes and compresses images to optimize upload speed and storage.
     */
    async compressImage(file) {
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        const QUALITY = 0.8;

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob((blob) => {
                        if (!blob) return reject(new Error("Compression failed"));
                        blob.name = file.name;
                        resolve(blob);
                    }, 'image/jpeg', QUALITY);
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },

    /**
     * @function handleFiles
     * @description Processes selected files, compresses them, and adds them to the request state.
     */
    async handleFiles(files) {
        const remainingSlots = window.RequestState.maxImages - window.RequestState.attachedImages.length;
        const filesToAdd = files.slice(0, remainingSlots);

        for (const file of filesToAdd) {
            if (!file.type.startsWith('image/')) continue;
            try {
                const compressed = await this.compressImage(file);
                window.RequestState.attachedImages.push(compressed);
            } catch (error) {
                console.error("[RequestMedia] Compression error:", error);
            }
        }
        
        if (typeof RequestUI !== 'undefined') {
            RequestUI.renderPreviews();
        }
    },

    /**
     * @function removeImage
     * @description Removes an image from the request state and refreshes the UI.
     */
    removeImage(index) {
        window.RequestState.attachedImages.splice(index, 1);
        if (typeof RequestUI !== 'undefined') {
            RequestUI.renderPreviews();
        }
    }
};

window.RequestMedia = RequestMedia;
