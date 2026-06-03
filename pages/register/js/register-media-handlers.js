/**
 * @file pages/register/js/register-media-handlers.js
 * @description Handlers for profile picture and cover images.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


async function registerHandleAvatarChange(e) {
    const file = e.target.files[0];
    const els = registerGetElements();
    if (!file) return;

    try {
        AuthUI.showLoading(window.langu("profile_verifying") || "جاري التحميل...");
        const compressed = await compressImage(file, 400, 400, 0.7);
        AuthUI.close();

        // Save global
        window.registerPendingAvatar = compressed;

        if (els.avatarPreview) {
            if (window.registerPreviewUrls?.avatar) {
                URL.revokeObjectURL(window.registerPreviewUrls.avatar);
            }
            const avatarUrl = URL.createObjectURL(compressed);
            window.registerPreviewUrls.avatar = avatarUrl;
            els.avatarPreview.src = avatarUrl;
            els.avatarPreview.style.display = "block";
            if (els.avatarPlaceholder) els.avatarPlaceholder.style.display = "none";
        }
    } catch (err) {
        console.error("[Register] Avatar error:", err);
        AuthUI.showError(window.langu("gen_swal_error_title"), window.langu("gen_err_compression"));
    }
}

async function registerHandleCameraTrigger() {
    try {
        const tempInput = document.createElement("input");
        tempInput.type = "file";
        tempInput.accept = "image/*";
        tempInput.setAttribute("capture", "user");
        tempInput.style.display = "none";
        document.body.appendChild(tempInput);

        tempInput.addEventListener("change", async (e) => {
            if (e.target.files && e.target.files.length > 0) {
                await registerHandleAvatarChange({ target: e.target });
            }
            if (tempInput.parentNode) tempInput.parentNode.removeChild(tempInput);
        });

        setTimeout(() => tempInput.click(), 100);
    } catch (err) {
        console.error("[Register] Camera trigger error:", err);
    }
}

async function registerHandleCoverChange(index, event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        AuthUI.showLoading(window.langu("profile_verifying") || "جاري التحميل...");
        const compressed = await compressImage(file, 1200, 600, 0.7); // Landscape for cover
        AuthUI.close();

        window.registerPendingCovers[index] = compressed;

        // Update UI
        const els = registerGetElements();
        const item = els.coverMgmtItems[index];
        const previewImg = item.querySelector('.cover-mgmt-preview img');
        const placeholder = item.querySelector('.cover-mgmt-preview .placeholder-icon');
        const deleteBtn = item.querySelector('.reg-delete-btn');

        if (previewImg) {
            if (window.registerPreviewUrls?.covers?.[index]) {
                URL.revokeObjectURL(window.registerPreviewUrls.covers[index]);
            }
            const coverUrl = URL.createObjectURL(compressed);
            if (window.registerPreviewUrls?.covers) {
                window.registerPreviewUrls.covers[index] = coverUrl;
            }
            previewImg.src = coverUrl;
            previewImg.style.display = 'block';
        }
        if (placeholder) placeholder.style.display = 'none';
        if (deleteBtn) deleteBtn.style.display = 'flex';

    } catch (err) {
        console.error("[Register] Cover error:", err);
        AuthUI.showError(window.langu("gen_swal_error_title"), window.langu("gen_err_compression"));
    }
}

function registerTriggerSlotCamera(index) {
    const tempInput = document.createElement("input");
    tempInput.type = "file";
    tempInput.accept = "image/*";
    tempInput.setAttribute("capture", "environment");
    tempInput.style.display = "none";
    document.body.appendChild(tempInput);

    tempInput.onchange = (e) => {
        if (e.target.files.length > 0) {
            registerHandleCoverChange(index, { target: e.target });
        }
        document.body.removeChild(tempInput);
    };
    tempInput.click();
}

function registerDeleteCoverSlot(index) {
    window.registerPendingCovers[index] = null;

    const els = registerGetElements();
    const item = els.coverMgmtItems[index];
    const previewImg = item.querySelector('.cover-mgmt-preview img');
    const placeholder = item.querySelector('.cover-mgmt-preview .placeholder-icon');
    const deleteBtn = item.querySelector('.reg-delete-btn');
    const fileInput = els.coverSlotInputs[index];

    if (previewImg) {
        if (window.registerPreviewUrls?.covers?.[index]) {
            URL.revokeObjectURL(window.registerPreviewUrls.covers[index]);
            window.registerPreviewUrls.covers[index] = null;
        }
        previewImg.src = '';
        previewImg.style.display = 'none';
    }
    if (placeholder) placeholder.style.display = 'block';
    if (deleteBtn) deleteBtn.style.display = 'none';
    if (fileInput) fileInput.value = '';
}
