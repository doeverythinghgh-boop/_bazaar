/**
 * @file pages/productView/js/view_ui_gallery.js
 * @description Gallery and zoom helpers for ProductView.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


const PRODUCT_VIEW_EMPTY_IMAGE_SRC = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

function productView_populateThumbnails(imageSrcArray, mainImageEl, thumbnailsContainerEl) {
    try {
        if (!thumbnailsContainerEl || !mainImageEl) return;
        const validImages = (Array.isArray(imageSrcArray) ? imageSrcArray : [])
            .map((src) => String(src || "").trim())
            .filter(Boolean);

        thumbnailsContainerEl.innerHTML = "";
        mainImageEl.src = validImages[0] || PRODUCT_VIEW_EMPTY_IMAGE_SRC;

        validImages.forEach((src) => {
            const thumb = document.createElement("img");
            thumb.alt = "Product Thumbnail";
            thumb.src = src;

            thumb.onclick = () => {
                mainImageEl.src = src;
                document.querySelectorAll(".productView_thumbnails_container img").forEach((item) => item.classList.remove("active"));
                thumb.classList.add("active");
            };

            thumb.onerror = () => {
                console.warn("[productView_] " + window.langu("pv_thumbnail_error"), src);
                const placeholder = document.createElement("div");
                placeholder.className = "image-load-error-placeholder";
                placeholder.innerHTML = `<i class="fas fa-exclamation-triangle"></i><span>${window.langu("pv_load_failed")}</span>`;
                thumb.replaceWith(placeholder);
            };
            thumbnailsContainerEl.appendChild(thumb);
        });

        setTimeout(() => {
            if (thumbnailsContainerEl.firstChild) thumbnailsContainerEl.firstChild.classList.add("active");
        }, 0);
    } catch (error) {
        console.error("productView_populateThumbnails - Error :", error);
    }
}

function productView_setupPinchZoom(imgEl) {
    if (!imgEl) return;

    let scale = 1;
    let lastScale = 1;
    let startDist = 0;
    let startX = 0;
    let startY = 0;
    let posX = 0;
    let posY = 0;

    imgEl.addEventListener("touchstart", (e) => {
        if (e.touches.length === 2) {
            startDist = Math.hypot(
                e.touches[0].pageX - e.touches[1].pageX,
                e.touches[0].pageY - e.touches[1].pageY
            );
        } else if (e.touches.length === 1) {
            startX = e.touches[0].pageX - posX;
            startY = e.touches[0].pageY - posY;
        }
    });

    imgEl.addEventListener("touchmove", (e) => {
        if (e.touches.length === 2) {
            e.preventDefault();
            const currentDist = Math.hypot(
                e.touches[0].pageX - e.touches[1].pageX,
                e.touches[0].pageY - e.touches[1].pageY
            );
            scale = Math.min(Math.max(1, lastScale * (currentDist / startDist)), 3);
            imgEl.style.transform = `translate(${posX}px, ${posY}px) scale(${scale})`;
        } else if (e.touches.length === 1 && scale > 1) {
            e.preventDefault();
            posX = e.touches[0].pageX - startX;
            posY = e.touches[0].pageY - startY;
            imgEl.style.transform = `translate(${posX}px, ${posY}px) scale(${scale})`;
        }
    });

    imgEl.addEventListener("touchend", (e) => {
        if (e.touches.length < 2) {
            lastScale = scale;
            if (scale === 1) {
                posX = 0;
                posY = 0;
                imgEl.style.transform = "translate(0, 0) scale(1)";
            }
        }
    });

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === "src") {
                scale = 1;
                lastScale = 1;
                posX = 0;
                posY = 0;
                imgEl.style.transform = "translate(0, 0) scale(1)";
            }
        });
    });
    observer.observe(imgEl, { attributes: true });
}
