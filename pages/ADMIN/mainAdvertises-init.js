/**
 * @file pages/ADMIN/mainAdvertises-init.js
 * @description Initialization and state module for advertisements management.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


async function loadImages() {
    const previewsEl = document.getElementById("mainAdver_previews");
    const loader = document.getElementById("mainAdver_imagesLoader");
    if (!previewsEl || !loader) return;

    previewsEl.innerHTML = "";
    previewsEl.appendChild(loader);
    loader.style.display = "block";

    mainAdver_state.images = [];
    mainAdver_state.originalImageNames = [];

    const manifest = await fetchManifest();

    if (manifest && Array.isArray(manifest) && manifest.length > 0) {
        manifest.forEach((item) => {
            const adData = typeof item === "object" ? item : { img: item, query: "" };
            const finalName = adData.img || adData;
            const id = `ad_img_${Date.now() + mainAdver_state.idCounter++}`;

            const state = { id, status: "uploaded", fileName: finalName, query: adData.query || "" };
            mainAdver_state.images.push(state);
            mainAdver_state.originalImageNames.push(finalName);

            if (typeof createPreview === "function") {
                createPreview(state, `${mainAdver_state.R2_PUBLIC_URL}/${finalName}`);
            }
        });
    }

    loader.style.display = "none";
}

async function loadFeatured() {
    const list = await fetchFeaturedProducts();
    mainAdver_state.featuredList = list;
    if (typeof renderFeaturedItems === "function") {
        renderFeaturedItems(list);
    }
}

async function checkWebP() {
    try {
        if (!self.createImageBitmap) return false;
        const blob = await fetch("data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==")
            .then((r) => r.blob()).catch(() => null);
        if (!blob) return false;
        await createImageBitmap(blob);
        return true;
    } catch { return false; }
}

(async function () {
    const wrapper = document.getElementById("mainAdver_wrapper");
    if (!wrapper) return;

    console.log("[AdminAdver-Init] Initializing advertisements manager...");

    await loadImages();
    await loadFeatured();

    const els = {
        fileInput: document.getElementById("mainAdver_fileInput"),
        pickFilesBtn: document.getElementById("mainAdver_pickFilesBtn"),
        takePhotoBtn: document.getElementById("mainAdver_takePhotoBtn"),
        clearAllBtn: document.getElementById("mainAdver_clearAllBtn"),
        form: document.getElementById("mainAdver_form"),
        refreshFeatured: document.getElementById("btnRefreshFeatured")
    };

    if (els.pickFilesBtn) els.pickFilesBtn.onclick = () => els.fileInput.click();
    if (els.fileInput) els.fileInput.onchange = (e) => {
        if (typeof handleNewFiles === "function") handleNewFiles(e.target.files);
    };

    if (els.clearAllBtn) {
        els.clearAllBtn.onclick = () => {
            Swal.fire({
                title: adminAdsText("admin_ads_clear_all", "حذف الكل؟"),
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: adminAdsText("alert_confirm_yes", "نعم")
            }).then((r) => {
                if (r.isConfirmed) {
                    mainAdver_state.images = [];
                    const previewsEl = document.getElementById("mainAdver_previews");
                    const loader = document.getElementById("mainAdver_imagesLoader");
                    if (previewsEl) {
                        previewsEl.innerHTML = "";
                        if (loader) previewsEl.appendChild(loader);
                    }
                }
            });
        };
    }

    if (els.takePhotoBtn) {
        els.takePhotoBtn.onclick = () => {
            if (/Mobi|Android/i.test(navigator.userAgent)) {
                els.fileInput.setAttribute("capture", "environment");
                els.fileInput.click();
                return;
            }
            if (typeof openDesktopCameraUI === "function") openDesktopCameraUI();
        };
    }

    if (els.form) {
        els.form.onsubmit = async (e) => {
            e.preventDefault();
            if (typeof submitManagerForm === "function") await submitManagerForm();
        };
    }

    if (els.refreshFeatured) {
        els.refreshFeatured.onclick = () => loadFeatured();
    }
})();
