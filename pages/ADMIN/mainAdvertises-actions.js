/**
 * @file pages/ADMIN/mainAdvertises-actions.js
 * @description Logical actions module for advertisements management.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


async function compressImage(file) {
    const IMAGE_MAX_WIDTH = 1600;
    const IMAGE_MAX_HEIGHT = 1600;
    const IMAGE_QUALITY = 0.75;

    let imgBitmap = null;
    let objectUrl = null;
    let drawSource = null;
    let sourceWidth = 0;
    let sourceHeight = 0;

    try {
        if (typeof createImageBitmap === "function") {
            try {
                imgBitmap = await createImageBitmap(file);
                drawSource = imgBitmap;
                sourceWidth = imgBitmap.width;
                sourceHeight = imgBitmap.height;
            } catch (e) {
                console.warn("[AdminAdver-Actions] createImageBitmap failed, falling back.", e);
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
                        tempImg.onerror = () => reject(new Error("Image decoding failed"));
                        tempImg.src = e.target.result;
                    };
                    reader.readAsDataURL(file);
                };
                tempImg.src = objectUrl;
            });
        }

        const ratio = Math.min(1, IMAGE_MAX_WIDTH / sourceWidth, IMAGE_MAX_HEIGHT / sourceHeight);
        const newWidth = Math.round(sourceWidth * ratio);
        const newHeight = Math.round(sourceHeight * ratio);

        if (imgBitmap && typeof createImageBitmap === "function" && ratio < 1) {
            try {
                const resizedBitmap = await createImageBitmap(file, {
                    resizeWidth: newWidth,
                    resizeHeight: newHeight,
                    resizeQuality: "medium"
                });
                imgBitmap.close();
                imgBitmap = resizedBitmap;
                drawSource = imgBitmap;
            } catch { }
        }

        const canvas = Object.assign(document.createElement("canvas"), { width: newWidth, height: newHeight });
        const ctx = canvas.getContext("2d", { alpha: false });
        ctx.fillStyle = getComputedStyle(document.body).getPropertyValue("--bg-color-white") || "#FFFFFF";
        ctx.fillRect(0, 0, newWidth, newHeight);
        ctx.drawImage(drawSource, 0, 0, newWidth, newHeight);

        const isWebPSupported = await (typeof checkWebP === "function" ? checkWebP() : Promise.resolve(false));
        const mime = isWebPSupported ? "image/webp" : "image/jpeg";

        return await new Promise((res) => canvas.toBlob(res, mime, IMAGE_QUALITY));
    } catch (err) {
        console.error("[AdminAdver-Actions] Compression failed:", err);
        throw err;
    } finally {
        if (imgBitmap && imgBitmap.close) imgBitmap.close();
        if (objectUrl) URL.revokeObjectURL(objectUrl);
    }
}

async function handleNewFiles(fileList) {
    const MAX_FILES = 10;
    const availableSlots = MAX_FILES - mainAdver_state.images.length;
    if (fileList.length > availableSlots) {
        Swal.fire(
            adminAdsText("gen_swal_info_title", "تنبيه"),
            adminAdsText("admin_ads_max_files", "الحد الأقصى هو {max} صورة. (المتبقي: {remaining})")
                .replace("{max}", MAX_FILES)
                .replace("{remaining}", availableSlots),
            "warning"
        );
        return;
    }

    console.log(`[AdminAdver] Processing ${fileList.length} new advertisement files.`);

    const processedFiles = [];
    const rawFiles = Array.from(fileList).slice(0, availableSlots);

    for (const f of rawFiles) {
        try {
            const u = URL.createObjectURL(f);
            const b = await fetch(u).then((r) => r.blob());
            URL.revokeObjectURL(u);
            b.name = f.name;
            b.lastModified = f.lastModified;
            processedFiles.push(b);
        } catch (e) {
            console.warn(`[AdminAdver] Early read failed for ${f.name}, using original.`, e);
            processedFiles.push(f);
        }
    }

    for (const file of processedFiles) {
        if (!file.type.startsWith("image/")) continue;

        const id = `ad_img_${Date.now() + mainAdver_state.idCounter++}`;
        const state = { id, file, compressedBlob: null, status: "pending", query: "" };
        mainAdver_state.images.push(state);
        if (typeof createPreview === "function") createPreview(state);

        try {
            console.log(`[AdminAdver] Compressing ad image: ${file.name}`);
            state.status = "compressing";
            if (state._el) state._el.classList.add("is-processing");

            state.compressedBlob = await compressImage(file);

            if (!mainAdver_state.images.some((img) => img.id === state.id)) {
                console.warn(`[AdminAdver] Image ${state.id} removed during compression.`);
                continue;
            }

            state.status = "ready";
            if (state._el) state._el.classList.remove("is-processing");
            if (state._metaEl) state._metaEl.textContent = adminAdsText("admin_ads_ready", "جاهز");
        } catch (err) {
            console.error("[AdminAdver] Error:", err);
            if (!mainAdver_state.images.some((img) => img.id === state.id)) continue;
            state.status = "error";
            if (state._metaEl) {
                state._metaEl.textContent = adminAdsText("admin_ads_compress_error", "خطأ في الضغط");
                state._metaEl.style.color = "red";
            }
        }
    }
}

function removeImage(id) {
    Swal.fire({
        title: adminAdsText("admin_ads_delete_image", "حذف الصورة؟"),
        icon: "question",
        showCancelButton: true,
        confirmButtonText: adminAdsText("alert_confirm_yes", "نعم"),
        cancelButtonText: adminAdsText("alert_confirm_no", "لا")
    }).then((res) => {
        if (res.isConfirmed) {
            const idx = mainAdver_state.images.findIndex((x) => x.id === id);
            if (idx > -1) {
                if (mainAdver_state.images[idx]._el) mainAdver_state.images[idx]._el.remove();
                mainAdver_state.images.splice(idx, 1);
            }
        }
    });
}

async function resizeImageUI(id) {
    const idx = mainAdver_state.images.findIndex((x) => x.id === id);
    if (idx === -1) return;
    const imgState = mainAdver_state.images[idx];

    const { value: formValues } = await Swal.fire({
        title: adminAdsText("admin_ads_resize_title", "تغيير أبعاد الصورة"),
        html: `
            <div style="display: flex; flex-wrap: wrap; gap: 15px; justify-content: center;">
                <div style="flex: 1 1 140px; min-width: 120px; text-align: center;">
                    <label style="display:block; margin-bottom:5px; font-weight:bold;">${adminAdsText("admin_ads_width_px", "العرض (px)")}</label>
                    <input id="swal-input-width" class="swal2-input" type="number" value="1000" style="width: 100%; margin: 0; box-sizing: border-box;">
                </div>
                <div style="flex: 1 1 140px; min-width: 120px; text-align: center;">
                    <label style="display:block; margin-bottom:5px; font-weight:bold;">${adminAdsText("admin_ads_height_px", "الارتفاع (px)")}</label>
                    <input id="swal-input-height" class="swal2-input" type="number" value="500" style="width: 100%; margin: 0; box-sizing: border-box;">
                </div>
            </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: adminAdsText("admin_ads_resize_btn", "تغيير"),
        cancelButtonText: adminAdsText("alert_cancel_btn", "إلغاء"),
        preConfirm: () => [
            document.getElementById("swal-input-width").value,
            document.getElementById("swal-input-height").value
        ]
    });

    if (formValues) {
        const [w, h] = formValues;
        if (!w || !h) return;

        Swal.fire({ title: adminAdsText("admin_ads_processing", "جاري المعالجة..."), didOpen: () => Swal.showLoading() });

        try {
            if (imgState.status === "uploaded" && !imgState.file) {
                Swal.fire({
                    icon: "warning",
                    title: adminAdsText("gen_swal_info_title", "تنبيه"),
                    text: adminAdsText("admin_ads_resize_cors_warning", "لا يمكن تعديل حجم الصور المرفوعة مسبقاً بسبب قيود أمنية (CORS). يرجى حذف الصورة وإعادة رفعها لتتمكن من تعديل أبعادها.")
                });
                return;
            }

            let source = imgState.file || imgState.compressedBlob;
            const bitmap = await createImageBitmap(source);
            const canvas = document.createElement("canvas");
            canvas.width = parseInt(w, 10);
            canvas.height = parseInt(h, 10);
            const ctx = canvas.getContext("2d");
            ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

            const isWebP = await (typeof checkWebP === "function" ? checkWebP() : Promise.resolve(false));
            const newBlob = await new Promise((r) => canvas.toBlob(r, isWebP ? "image/webp" : "image/jpeg", 0.9));

            imgState.compressedBlob = newBlob;
            imgState.status = "ready";
            const newUrl = URL.createObjectURL(newBlob);
            const imgEl = imgState._el.querySelector("img");
            if (imgEl) imgEl.src = newUrl;
            if (imgState._metaEl) imgState._metaEl.textContent = `Resized (${w}x${h})`;

            Swal.fire(
                adminAdsText("gen_swal_success_title", "تم"),
                adminAdsText("admin_ads_resize_success", "تم تغيير الأبعاد بنجاح. اضغط \"نشر\" لحفظ التعديلات."),
                "success"
            );
        } catch (e) {
            console.error(e);
            Swal.fire(adminAdsText("gen_swal_error_title", "خطأ"), adminAdsText("admin_ads_processing_error", "حدث خطأ أثناء المعالجة"), "error");
        }
    }
}

function removeFeatured(key) {
    Swal.fire({
        title: adminAdsText("admin_ads_delete_product", "حذف المنتج؟"),
        text: adminAdsText("admin_ads_delete_featured_text", "سيتم إزالة المنتج من القائمة المفضلة فوراً."),
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: adminAdsText("admin_ads_yes_delete", "نعم، احذف"),
        cancelButtonText: adminAdsText("alert_cancel_btn", "إلغاء")
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const newList = mainAdver_state.featuredList.filter((item) => {
                    if (typeof item === "string") return item !== key;
                    return item.key !== key;
                });
                mainAdver_state.featuredList = newList;
                await saveFeaturedAPI(newList);
                Swal.fire(adminAdsText("port_delete_success_title", "تم الحذف!"), adminAdsText("admin_ads_featured_updated", "تم تحديث القائمة بنجاح."), "success");
                if (typeof renderFeaturedItems === "function") renderFeaturedItems(newList);
            } catch (e) {
                Swal.fire(adminAdsText("gen_swal_error_title", "خطأ"), adminAdsText("admin_ads_save_failed", "فشل في حفظ التغييرات."), "error");
            }
        }
    });
}

async function submitManagerForm() {
    const previewsEl = document.getElementById("mainAdver_previews");
    const domIds = Array.from(previewsEl.querySelectorAll(".mainAdver_preview")).map((x) => x.dataset.id);
    mainAdver_state.images.sort((a, b) => domIds.indexOf(a.id) - domIds.indexOf(b.id));

    Swal.fire({ title: adminAdsText("admin_ads_publishing", "جاري النشر..."), didOpen: () => Swal.showLoading(), allowOutsideClick: false });

    try {
        const newManifest = [];
        const uploads = [];

        for (const imgState of mainAdver_state.images) {
            if (imgState.status === "uploaded") {
                newManifest.push({ img: imgState.fileName, query: imgState.query || "" });
            } else if (imgState.status === "ready" && imgState.compressedBlob) {
                const ext = imgState.compressedBlob.type === "image/webp" ? "webp" : "jpg";
                const uniqueName = `ad_${Date.now()}_${Math.floor(Math.random() * 1000)}.${ext}`;
                uploads.push({ blob: imgState.compressedBlob, name: uniqueName });
                newManifest.push({ img: uniqueName, query: imgState.query || "" });
                imgState.fileName = uniqueName;
                imgState.status = "uploaded";
            }
        }

        if (uploads.length > 0) {
            for (const up of uploads) {
                await uploadFile2cf(up.blob, up.name);
            }
        }

        await saveManifestAPI(newManifest);

        const currentNamesInManifest = newManifest.map((m) => m.img);
        const filesToDelete = mainAdver_state.originalImageNames.filter((oldName) => !currentNamesInManifest.includes(oldName));

        if (filesToDelete.length > 0) {
            await Promise.all(filesToDelete.map((name) => deleteFile2cf(name).catch((e) => console.warn(e))));
        }

        if (typeof addUpdate === "function") await addUpdate(adminAdsText("admin_ads_update_log", "تحديث الإعلانات"));

        Swal.fire(adminAdsText("gen_swal_success_title", "تم!"), adminAdsText("admin_ads_publish_success", "تم تحديث الإعلانات بنجاح."), "success");
        if (typeof loadImages === "function") loadImages();
    } catch (err) {
        console.error("Upload error", err);
        Swal.fire(adminAdsText("gen_swal_error_title", "خطأ"), adminAdsText("admin_ads_upload_failed", "فشل رفع البيانات."), "error");
    }
}

