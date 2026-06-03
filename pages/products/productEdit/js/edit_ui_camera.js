/**
 * @file pages/productEdit/js/edit_ui_camera.js
 * @description Camera modal support for Product Edit.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


async function EDIT_openDesktopCamera() {
    const cameraModalContainer = document.getElementById('camera-modal-container');
    if (!cameraModalContainer) {
        console.error('Camera modal container not found!');
        return;
    }

    cameraModalContainer.innerHTML = `
        <div class="modal-content camera-modal-content">
            <button class="close-button" id="camera-modal-close-btn" aria-label="Close"><i class="fas fa-times"></i></button>
            <video id="camera-preview" autoplay playsinline></video>
            <canvas id="camera-canvas" style="display:none;"></canvas>
            <div class="camera-controls">
                <button id="capture-photo-btn" class="btn btn-warning"><i class="fas fa-camera"></i> Capture Photo</button>
            </div>
        </div>
    `;
    cameraModalContainer.style.display = 'flex';

    const video = document.getElementById('camera-preview');
    const captureBtn = document.getElementById('capture-photo-btn');
    const closeBtn = document.getElementById('camera-modal-close-btn');

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        video.srcObject = stream;

        const closeStream = () => {
            stream.getTracks().forEach((track) => track.stop());
            cameraModalContainer.style.display = 'none';
            cameraModalContainer.innerHTML = '';
        };

        closeBtn.onclick = closeStream;
        captureBtn.onclick = () => {
            const canvas = document.getElementById('camera-canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d').drawImage(video, 0, 0);
            canvas.toBlob((blob) => {
                EDIT_handleNewFiles([blob]);
                closeStream();
            }, 'image/jpeg', 0.9);
        };
    } catch (err) {
        console.error('Error accessing camera: ', err);
        cameraModalContainer.style.display = 'none';
    }
}
