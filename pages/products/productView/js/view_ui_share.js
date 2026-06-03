/**
 * @file pages/productView/js/view_ui_share.js
 * @description Share helpers for ProductView.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


function productView_getShareUrl(productData) {
    const params = new URLSearchParams(window.location.search);
    const productKey = productData && productData.product_key
        ? String(productData.product_key).trim()
        : String(params.get("product_key") || params.get("key") || params.get("id") || "").trim();
    if (!productKey) return "";

    const providerKey = productData && productData.user_key
        ? String(productData.user_key).trim()
        : String(params.get("provider_key") || "").trim();

    const productionDomain = (typeof window.getBazaarInfrastructureConfig === "function"
        ? window.getBazaarInfrastructureConfig().pagesUrl
        : null) || window.location.origin;

    let url = `${productionDomain}/pages/products/productView/productView.html?product_key=${encodeURIComponent(productKey)}`;
    if (providerKey) {
        url += `&provider_key=${encodeURIComponent(providerKey)}`;
    }
    return url;
}

async function productView_copyShareUrl(text) {
    if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
    }

    const tempInput = document.createElement("textarea");
    tempInput.value = text;
    tempInput.setAttribute("readonly", "readonly");
    tempInput.style.position = "fixed";
    tempInput.style.opacity = "0";
    tempInput.style.pointerEvents = "none";
    document.body.appendChild(tempInput);
    tempInput.select();

    try {
        const copied = document.execCommand("copy");
        if (!copied) throw new Error("Clipboard copy command failed");
        return true;
    } finally {
        tempInput.remove();
    }
}

function productView_showShareCopiedToast() {
    const L = (key, fallback) => (typeof window.langu === "function" ? window.langu(key) : null) || fallback;

    if (window.Swal) {
        Swal.fire({
            icon: "success",
            title: L("pv_share_copied_title", "تم نسخ رابط المنتج!"),
            text: L("pv_share_copied_text", "تم نسخ رابط صفحة المنتج للحافظة"),
            toast: true,
            position: "top-end",
            showConfirmButton: false,
            timer: 2000,
            customClass: {
                popup: "swal-modern-mini-popup"
            }
        });
        return;
    }

    alert(L("pv_share_copied_title", "تم نسخ رابط المنتج!"));
}

function productView_setupShareButton(productData, dom) {
    if (!dom.shareBtn) return;

    const shareUrl = productView_getShareUrl(productData);
    const L = (key, fallback) => (typeof window.langu === "function" ? window.langu(key) : null) || fallback;

    if (!shareUrl) {
        dom.shareBtn.disabled = true;
        dom.shareBtn.style.display = "none";
        return;
    }

    dom.shareBtn.disabled = false;
    dom.shareBtn.style.display = "inline-flex";

    dom.shareBtn.onclick = async function () {
        const shareTitle = `${L("pv_share_product", "مشاركة المنتج")}: ${productData.productName || L("pv_not_available", "غير متاح")}`;

        try {
            if (window.BridgeManager && window.BridgeManager.isAndroid()) {
                window.BridgeManager.share(shareTitle, shareUrl);
                return;
            }

            if (navigator.share) {
                try {
                    await navigator.share({
                        title: shareTitle,
                        url: shareUrl
                    });
                    return;
                } catch (error) {
                    if (error && error.name === "AbortError") return;
                    console.warn("[ProductView] navigator.share failed, falling back to clipboard.", error);
                }
            }

            await productView_copyShareUrl(shareUrl);
            productView_showShareCopiedToast();
        } catch (error) {
            console.error("[ProductView] Share failed:", error);
        }
    };
}
