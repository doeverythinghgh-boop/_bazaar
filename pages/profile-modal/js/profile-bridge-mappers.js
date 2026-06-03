/**
 * @file pages/profile-modal/js/profile-bridge-mappers.js
 * @description Focused mapping helpers used by ProfileDataBridge.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


window.ProfileBridgeMappers = (function () {
    "use strict";

    function mapIdentity(ctx, user) {
        const rawUsername = user.username || "";
        const isPhoneNumber = /^[0-9+ ]+$/.test(rawUsername) && rawUsername.length > 8;
        const safeUsername = isPhoneNumber ? "" : rawUsername;
        ctx.setDomValue("register_username", safeUsername);
        ctx.updateWizardField("username", safeUsername);
    }

    function mapPhones(ctx, user) {
        if (Array.isArray(user.phones) && user.phones.length) {
            if (typeof window.registerCreatePhoneEntry === "function") {
                window.registerPhoneEntries = user.phones.map((phoneEntry) => {
                    const entry = window.registerCreatePhoneEntry(phoneEntry);
                    if (entry.is_primary) entry.has_whatsapp = true;
                    return entry;
                });
            }
            ctx.markProfilePhonesAsVerified(user.phones);
            const primary = user.phones.find((phoneEntry) => phoneEntry.is_primary)?.number || user.phone;
            ctx.updateWizardField("phone", primary);
            if (typeof window.registerRenderPhones === "function") window.registerRenderPhones();
            return;
        }

        if (user.phone) {
            if (typeof window.registerCreatePhoneEntry === "function") {
                window.registerPhoneEntries = [window.registerCreatePhoneEntry({
                    number: user.phone,
                    is_primary: true,
                    has_whatsapp: true
                })];
            }
            ctx.markProfilePhonesAsVerified([{ number: user.phone, is_primary: true }]);
            ctx.updateWizardField("phone", user.phone);
            if (typeof window.registerRenderPhones === "function") window.registerRenderPhones();
        }
    }

    function mapBusiness(ctx, user) {
        ctx.setDomValue("register_business_name", user.business_name || "");
        ctx.updateWizardField("businessName", user.business_name || "");

        const rawBio = user.business_bio || "";
        const bioParts = rawBio.split(/\n\n/);
        const taglinePart = (bioParts[0] || "").trim();
        const longBioPart = bioParts.slice(1).join("\n\n").trim() || "";

        ctx.setDomValue("register_business_tagline", taglinePart);
        ctx.updateWizardField("businessTagline", taglinePart);
        ctx.setDomValue("register_business_bio", longBioPart);
        ctx.updateWizardField("register_business_bio", longBioPart);
    }

    function mapSettings(ctx, user) {
        if (!user.settings) return;
        try {
            const settings = typeof user.settings === "string" ? JSON.parse(user.settings) : user.settings;
            const deliveryMethod = settings.deliveryMode || (settings.isDelivered ? "self" : "platform");
            ctx.updateWizardField("register_is-delivered", deliveryMethod === "self" ? "1" : "0");
            ctx.updateWizardField("register_limit-package", settings.limitPackage || 0);
            const discountPercent = window.UserFormService?.normalizeDiscountPercent
                ? window.UserFormService.normalizeDiscountPercent(settings.discountPercent ?? user.discountPercent ?? 0)
                : (parseFloat(settings.discountPercent ?? user.discountPercent ?? 0) || 0);
            ctx.updateWizardField("register_discount_percent", discountPercent);

            const delInput = document.getElementById("register_is-delivered");
            const platformInput = document.getElementById("register_delivery_method_platform");
            const selfInput = document.getElementById("register_delivery_method_self");
            const providerInput = document.getElementById("register_delivery-provider-key");
            if (delInput) delInput.value = deliveryMethod === "self" ? "1" : "0";
            if (platformInput) platformInput.checked = deliveryMethod !== "self";
            if (selfInput) selfInput.checked = deliveryMethod === "self";
            if (providerInput) providerInput.value = settings.deliveryProviderKey || "";
            if (window.RegisterDeliveryPartnerManager?.bindUiOnce) {
                window.RegisterDeliveryPartnerManager.bindUiOnce();
            }
            if (typeof window.registerSyncDeliveryGroupForCategories === "function") {
                window.registerSyncDeliveryGroupForCategories();
            }
            const limitInput = document.getElementById("register_limit-package");
            if (limitInput) limitInput.value = settings.limitPackage || 0;
            const discountInput = document.getElementById("register_discount_percent");
            if (discountInput) discountInput.value = discountPercent;

            ctx.updateWizardField("register_rating_enabled", settings.ratingEnabled !== false);
            ctx.updateWizardField("register_product_rating_enabled", settings.productRatingEnabled !== false);

            const ratEn = document.getElementById("register_rating_enabled");
            if (ratEn) ratEn.checked = settings.ratingEnabled !== false;
            const pratEn = document.getElementById("register_product_rating_enabled");
            if (pratEn) pratEn.checked = settings.productRatingEnabled !== false;

            const ratMode = settings.ratingMode || "stars_comments";
            const pratMode = settings.productRatingMode || "stars_comments";
            const ratModeInput = document.getElementById(`register_rating_mode_${ratMode}`);
            if (ratModeInput) ratModeInput.checked = true;
            const pratModeInput = document.getElementById(`register_product_rating_mode_${pratMode}`);
            if (pratModeInput) pratModeInput.checked = true;
        } catch (error) {
            console.warn("[ProfileBridgeMappers] Failed to parse settings", error);
        }
    }

    function mapMedia(ctx, user) {
        if (!user.user_image) return;
        try {
            const imageData = typeof user.user_image === "string" ? JSON.parse(user.user_image) : user.user_image;
            if (imageData.avatar) {
                const avatarEl = document.getElementById("register_avatar-preview");
                if (avatarEl) {
                    const finalSrc = imageData.avatar.startsWith("http")
                        ? imageData.avatar
                        : (typeof window.getPublicR2FileUrl === "function"
                            ? window.getPublicR2FileUrl(imageData.avatar)
                            : `/api/images/${imageData.avatar}`);
                    avatarEl.src = finalSrc;
                    avatarEl.style.display = "block";
                    const placeholder = document.getElementById("register_avatar-placeholder");
                    if (placeholder) placeholder.style.display = "none";
                }
            }
            if (Array.isArray(imageData.covers)) {
                window.registerPendingCovers = imageData.covers;
                setTimeout(() => {
                    const items = document.querySelectorAll(".cover-mgmt-item");
                    imageData.covers.forEach((coverPath, index) => {
                        if (!coverPath || !items[index]) return;
                        const previewImg = items[index].querySelector(".cover-mgmt-preview img");
                        const placeholder = items[index].querySelector(".cover-mgmt-preview .placeholder-icon");
                        const deleteBtn = items[index].querySelector(".reg-delete-btn");
                        if (previewImg) {
                            const finalSrc = coverPath.startsWith("http")
                                ? coverPath
                                : (typeof window.getPublicR2FileUrl === "function"
                                    ? window.getPublicR2FileUrl(coverPath)
                                    : `/api/images/${coverPath}`);
                            previewImg.src = finalSrc;
                            previewImg.style.display = "block";
                        }
                        if (placeholder) placeholder.style.display = "none";
                        if (deleteBtn) deleteBtn.style.display = "flex";
                    });
                }, 100);
            }
        } catch (error) {
            console.warn("[ProfileBridgeMappers] Failed to parse user_image", error);
        }
    }

    function mapCategories(ctx, user) {
        if (!user.business_category) return;
        try {
            const catData = typeof user.business_category === "string"
                ? JSON.parse(user.business_category)
                : user.business_category;
            ctx.updateWizardField("categories", catData);
            ctx.updateWizardField("businessCategoryJson", JSON.stringify(catData || {}));
            ctx.setDomValue("register_business_category_json", JSON.stringify(catData || {}));

            if (typeof window.registerUpdateCategoriesDisplay === "function") {
                window.registerUpdateCategoriesDisplay();
                return;
            }

            if (window.CategoryTreeModal?.renderDetailedSelection) {
                const els = typeof window.registerGetElements === "function" ? window.registerGetElements() : {};
                if (!els.businessCategoryDisplay) return;
                const renderCats = () => {
                    window.CategoryTreeModal.renderDetailedSelection(catData, els.businessCategoryDisplay);
                };
                if (window.appCategoriesList) {
                    renderCats();
                } else if (typeof window.fetchAppCategories === "function") {
                    window.fetchAppCategories().then(renderCats).catch((error) => console.warn("Failed to fetch categories", error));
                }
            }
        } catch (error) {
            console.warn("[ProfileBridgeMappers] Failed to parse business_category", error);
        }
    }

    function mapLocation(ctx, user) {
        ctx.setDomValue("register_address", user.address || "");
        ctx.updateWizardField("address", user.address || "");
        ctx.updateWizardField("location", user.location || "");
        ctx.setDomValue("register_coords", user.location || "");
        ctx.primeProfileLocations(user);
    }

    function mapLinks(ctx, user) {
        console.log("[ProfileBridgeMappers] mapLinks called.", { hasLinks: !!user.links, links: user.links });
        if (!user.links) return;
        try {
            const linksData = typeof user.links === "string" ? JSON.parse(user.links) : user.links;
            ctx.updateWizardField("links", linksData);
            ["facebook", "instagram", "tiktok", "telegram", "x", "website"].forEach((type) => {
                const linkValues = Array.isArray(linksData[type]) ? linksData[type] : [linksData[type]];

                // Map up to 3 links per type
                for (let i = 0; i < 3; i++) {
                    const val = linkValues[i];
                    if (val) {
                        const id = i === 0 ? `register_business_${type}` : `register_business_${type}_${i + 1}`;
                        ctx.setDomValue(id, val);
                    }
                }
            });
        } catch (error) {
            console.warn("[ProfileBridgeMappers] Failed to parse links", error);
        }
    }

    function mapSecurityDefaults(ctx) {
        ctx.updateWizardField("currentPassword", "");
        ctx.updateWizardField("password", "");
        ctx.updateWizardField("confirmPassword", "");
    }

    return {
        mapIdentity,
        mapPhones,
        mapBusiness,
        mapSettings,
        mapMedia,
        mapCategories,
        mapLocation,
        mapLinks,
        mapSecurityDefaults
    };
})();
