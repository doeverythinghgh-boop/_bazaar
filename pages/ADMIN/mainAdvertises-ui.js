/**
 * @file pages/ADMIN/mainAdvertises-ui.js
 * @description UI rendering module for advertisements management.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


function createPreview(state, existingUrl = null) {
    const previewsEl = document.getElementById("mainAdver_previews");
    if (!previewsEl) return;

    const wrapper = document.createElement("div");
    wrapper.className = "mainAdver_preview";
    wrapper.dataset.id = state.id;

    const removeBtn = document.createElement("button");
    removeBtn.className = "mainAdver_remove";
    removeBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
    removeBtn.type = "button";
    removeBtn.onclick = (e) => {
        e.stopPropagation();
        if (typeof removeImage === "function") removeImage(state.id);
    };

    if (!existingUrl) {
        const resizeBtn = document.createElement("button");
        resizeBtn.className = "mainAdver_resize";
        resizeBtn.innerHTML = '<i class="fas fa-compress-arrows-alt"></i>';
        resizeBtn.type = "button";
        resizeBtn.title = adminAdsText("admin_ads_resize_title", "تغيير الأبعاد");
        resizeBtn.onclick = (e) => {
            e.stopPropagation();
            if (typeof resizeImageUI === "function") resizeImageUI(state.id);
        };
        wrapper.append(resizeBtn);
    }

    const img = document.createElement("img");
    const meta = document.createElement("div");
    meta.className = "mainAdver_meta";

    if (existingUrl) {
        img.src = existingUrl;
        meta.textContent = adminAdsText("admin_ads_published", "منشور");
    } else {
        const r = new FileReader();
        r.onload = (e) => { img.src = e.target.result; };
        r.readAsDataURL(state.file);
        meta.textContent = adminAdsText("admin_ads_new", "جديد");
    }

    const queryInput = document.createElement("input");
    queryInput.type = "text";
    queryInput.className = "swal2-input mainAdver_query-input";
    queryInput.placeholder = adminAdsText("admin_ads_search_keyword_optional", "كلمة البحث (اختياري)");
    queryInput.style.cssText = "width: 100%; margin: 5px 0; height: 35px; font-size: 0.85rem; padding: 5px; box-sizing: border-box; border-radius: 4px; border: 1px solid var(--border-color); background: var(--bg-color-white); color: var(--text-color-dark);";
    queryInput.value = state.query || "";
    queryInput.onchange = (e) => { state.query = e.target.value; };

    wrapper.append(removeBtn, img, queryInput, meta);
    previewsEl.appendChild(wrapper);

    state._el = wrapper;
    state._metaEl = meta;
}

function renderFeaturedItems(list) {
    const container = document.getElementById("featured_list_container");
    if (!container) return;
    container.innerHTML = "";

    const validItems = list.filter((item) => typeof item === "object" && item.key);

    if (validItems.length === 0) {
        container.innerHTML = `<div style="text-align: center; width: 100%; padding: 20px; color: grey;">${adminAdsText("admin_ads_no_featured_products", "لا توجد خدمات مختارة حالياً.")}</div>`;
        return;
    }

    validItems.forEach((item) => {
        const div = document.createElement("div");
        div.className = "featured-admin-card";

        const R2_PUBLIC_URL = (typeof window.getBazaarInfrastructureConfig === "function"
            ? window.getBazaarInfrastructureConfig().r2PublicUrl
            : null) || "";
        const imgUrl = item.img ? (item.img.startsWith("http") ? item.img : `${R2_PUBLIC_URL}/${item.img}`) : "images/placeholder.png";

        div.innerHTML = `
            <div class="featured-admin-image-box">
                <img src="${imgUrl}">
            </div>
            <div style="font-size: 0.8rem; font-weight: bold; margin-top: auto; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.name || adminAdsText("admin_relations_default_username", "بدون اسم")}</div>
            <div style="font-size: 0.75rem; color: green;">${item.price} EGP</div>
            <button type="button" class="mainAdver_remove" title="${adminAdsText("gen_delete", "حذف")}" style="position: absolute; top: -8px; right: -8px; width: 25px; height: 25px; line-height: 25px; font-size: 12px; opacity: 1;">
                <i class="fas fa-trash-alt"></i>
            </button>
        `;

        const removeBtn = div.querySelector("button");
        if (removeBtn) {
            removeBtn.onclick = () => {
                if (typeof removeFeatured === "function") removeFeatured(item.key);
            };
        }

        container.appendChild(div);
    });
}

async function openDesktopCameraUI() {
    const cameraModal = document.getElementById("mainAdver_cameraModalContainer");
    if (!cameraModal) return;

    const html = `
        <div class="mainAdver_cameraModalContent" style="background-color: var(--bg-color-white); color: var(--text-color-dark);">
            <button id="camClose" style="position:absolute;top:10px;right:10px;border:none;background:none;font-size:20px; color: var(--text-color-dark);">&times;</button>
            <video id="camVideo" autoplay playsinline style="width:100%;border-radius:10px;background:#000;"></video>
            <div style="text-align:center;margin-top:10px;">
                <button id="camSnap" class="mainAdver_btn mainAdver_btnPrimary">${adminAdsText("gen_btn_capture_photo", "التقاط صورة")}</button>
            </div>
        </div>
     `;
    cameraModal.innerHTML = html;
    cameraModal.style.display = "flex";

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const v = document.getElementById("camVideo");
        v.srcObject = stream;

        document.getElementById("camClose").onclick = () => {
            stream.getTracks().forEach((t) => t.stop());
            cameraModal.style.display = "none";
        };

        document.getElementById("camSnap").onclick = () => {
            const cvs = document.createElement("canvas");
            cvs.width = v.videoWidth;
            cvs.height = v.videoHeight;
            cvs.getContext("2d").drawImage(v, 0, 0);
            cvs.toBlob((blob) => {
                const f = new File([blob], `cam_${Date.now()}.jpg`, { type: "image/jpeg" });
                if (typeof handleNewFiles === "function") handleNewFiles([f]);
                document.getElementById("camClose").click();
            }, "image/jpeg", 0.9);
        };
    } catch (e) {
        console.error("[AdminAdver-UI] Camera Error:", e);
        cameraModal.style.display = "none";
    }
}
