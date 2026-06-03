/**
 * @file pages/profile-modal/js/profile-submit-pipeline.js
 * @description Dedicated pipeline helpers for profile update submission.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


window.ProfileSubmitPipeline = (function () {
    "use strict";

    function logError(message, payload) {
        if (window.RegisterDevLogger) {
            window.RegisterDevLogger.error("ProfileSubmitPipeline", message, payload);
            return;
        }
        if (payload === undefined) {
            console.error(`[ProfileSubmitPipeline] ${message}`);
            return;
        }
        console.error(`[ProfileSubmitPipeline] ${message}`, payload);
    }

    function resolveCurrentUserPhone(user) {
        if (user?.phone) return user.phone;
        if (user?.primary_phone) return user.primary_phone;
        if (Array.isArray(user?.phones)) {
            return user.phones.find((entry) => entry?.is_primary)?.number || user.phones[0]?.number || "";
        }
        return "";
    }

    function validateBusinessLocationRequirement() {
        if (!window.regWizard.isBusinessAccount) return;
        const hasLocation = window.registerLocations?.some((loc) => loc.coords && loc.address);
        if (!hasLocation) {
            throw new Error(window.langu ? window.langu("location_address_required") : "يرجى إضافة موقع جغرافي وعنوان واحد على الأقل لنشاطك مقدمي الخدمةي.");
        }
    }

    async function validatePasswordChangeIfRequested(fields, currentUser) {
        const newPassword = fields.password?.value;
        const currentPassword = fields.currentPassword?.value;
        if (!newPassword) {
            return { newPassword: "" };
        }
        if (!currentPassword) {
            throw new Error(window.langu ? window.langu("profile_error_current_password_required") : "يرجى إدخال كلمة المرور الحالية.");
        }
        const verifyResult = await window.verifyUserPassword(resolveCurrentUserPhone(currentUser), currentPassword);
        if (verifyResult?.error) {
            throw new Error(window.langu ? window.langu("login_invalid_credentials") : "كلمة المرور الحالية غير صحيحة.");
        }
        return { newPassword };
    }

    async function uploadMedia(userKey) {
        if (!window.ProfileMediaService?.uploadPendingMedia) {
            return { avatar: null, covers: null };
        }
        return window.ProfileMediaService.uploadPendingMedia(userKey);
    }

    function buildUpdates(fields, currentUser, mediaResult) {
        const getVal = (domId, stateKey) => {
            const el = document.getElementById(domId);
            return el ? el.value : (fields[stateKey]?.value || "");
        };
        const getJsonVal = (domId, stateKey) => {
            const el = domId ? document.getElementById(domId) : null;
            if (el && el.value) {
                try {
                    return JSON.parse(el.value);
                } catch (error) {
                    logError("Failed to parse JSON input value; using state fallback.", {
                        domId,
                        stateKey,
                        error: error?.message || error
                    });
                    return fields[stateKey]?.value || {};
                }
            }
            return fields[stateKey]?.value || {};
        };
        const socialLinks = window.registerSocialLinksApi
            ? window.registerSocialLinksApi.collectLinksForStorage()
            : getJsonVal("", "links");
        const locationsPayload = window.registerLocations || [];
        const isDeliveryServiceSpecialty = typeof window.registerHasDeliveryServiceCategorySelection === "function"
            && window.registerHasDeliveryServiceCategorySelection();
        const deliveryMethod = isDeliveryServiceSpecialty ? "self" : (window.RegisterDeliveryPartnerManager?.getMethod?.() || "platform");
        const isDelivered = deliveryMethod === "self";
        const deliveryProviderKey = isDeliveryServiceSpecialty ? "" : (document.getElementById("register_delivery-provider-key")?.value || "");
        const discountPercent = window.UserFormService?.normalizeDiscountPercent
            ? window.UserFormService.normalizeDiscountPercent(document.getElementById("register_discount_percent")?.value || 0)
            : (parseFloat(document.getElementById("register_discount_percent")?.value || 0) || 0);

        const updates = {
            user_key: currentUser.user_key,
            username: getVal("register_username", "username"),
            account_type: window.regWizard.isBusinessAccount ? 32 : 1,
            address: getVal("register_address", "address"),
            location: locationsPayload[0]?.coords || fields.location?.value,
            business_name: getVal("register_business_name", "businessName"),
            business_bio: [getVal("register_business_tagline", "businessTagline").trim(), getVal("register_business_bio", "register_business_bio").trim()].filter(Boolean).join("\n\n"),
            links: JSON.stringify(socialLinks),
            business_category: JSON.stringify(getJsonVal("register_business_category_json", "categories")),
            phones: (window.registerPhoneEntries || []).map((phoneEntry) => ({
                number: phoneEntry.number,
                is_primary: !!phoneEntry.is_primary,
                has_whatsapp: !!phoneEntry.has_whatsapp,
                type: phoneEntry.type || "mobile"
            })),
            settings: JSON.stringify({
                locations: locationsPayload,
                isDelivered,
                deliveryMode: deliveryMethod,
                deliveryProviderKey: isDelivered ? "" : deliveryProviderKey,
                limitPackage: parseFloat(document.getElementById("register_limit-package")?.value || 0),
                discountPercent,
                ratingEnabled: !!document.getElementById("register_rating_enabled")?.checked,
                ratingMode: document.querySelector('input[name="register_rating_mode"]:checked')?.value || "stars_comments",
                productRatingEnabled: !!document.getElementById("register_product_rating_enabled")?.checked,
                productRatingMode: document.querySelector('input[name="register_product_rating_mode"]:checked')?.value || "stars_comments"
            }),
            discountPercent
        };

        let existingImages = {};
        if (typeof currentUser.user_image === "string") {
            try {
                existingImages = JSON.parse(currentUser.user_image || "{}");
            } catch (error) {
                logError("Failed to parse current user image payload; using empty image object.", {
                    error: error?.message || error
                });
                existingImages = {};
            }
        } else if (currentUser.user_image && typeof currentUser.user_image === "object") {
            existingImages = currentUser.user_image;
        }
        updates.user_image = JSON.stringify({
            avatar: mediaResult.avatar || existingImages.avatar,
            covers: Array.isArray(mediaResult.covers) ? mediaResult.covers : (existingImages.covers || []),
            cover: (Array.isArray(mediaResult.covers) ? mediaResult.covers[0] : existingImages.covers?.[0]) || existingImages.cover || null
        });
        return updates;
    }

    async function submitUpdates(updates) {
        return window.updateUser(updates);
    }

    function areUpdatesSignificant(updates, currentUser) {
        const isEquivalent = (a, b) => {
            if (a === b) return true;
            if (typeof a !== typeof b) return false;
            if (a && b && typeof a === "object") {
                const keysA = Object.keys(a).sort();
                const keysB = Object.keys(b).sort();
                if (keysA.length !== keysB.length) return false;
                return keysA.every((k, i) => k === keysB[i] && isEquivalent(a[k], b[k]));
            }
            return String(a || "").trim() === String(b || "").trim();
        };

        const parseJsonSafe = (val) => {
            if (!val) return {};
            if (typeof val === "object") return val;
            try { return JSON.parse(val); } catch (e) { return {}; }
        };

        // 1. Scalar Fields
        const scalars = ["username", "address", "business_name", "business_bio"];
        for (const key of scalars) {
            const upVal = updates[key];
            const curVal = currentUser[key];
            if (!isEquivalent(upVal, curVal)) return true;
        }

        // 2. Password
        if (updates.password) return true;

        // 3. JSON Object Fields (Semantic Comparison)
        const jsonFields = ["links", "business_category", "settings", "user_image"];
        for (const key of jsonFields) {
            const upObj = parseJsonSafe(updates[key]);
            const curObj = parseJsonSafe(currentUser[key]);
            if (!isEquivalent(upObj, curObj)) return true;
        }

        // 4. Phones (Order-independent)
        const upPhones = (updates.phones || []).map(p => `${p.number}:${p.is_primary}`).sort();
        const curPhones = (currentUser.phones || []).map(p => `${p.number}:${p.is_primary}`).sort();
        if (JSON.stringify(upPhones) !== JSON.stringify(curPhones)) return true;

        // 5. Location
        const upLoc = updates.location || {};
        const curLoc = currentUser.location || {};
        if (parseFloat(upLoc.lat || 0).toFixed(6) !== parseFloat(curLoc.lat || 0).toFixed(6) ||
            parseFloat(upLoc.lng || 0).toFixed(6) !== parseFloat(curLoc.lng || 0).toFixed(6)) {
            return true;
        }

        return false;
    }

    return {
        resolveCurrentUserPhone,
        validateBusinessLocationRequirement,
        validatePasswordChangeIfRequested,
        uploadMedia,
        buildUpdates,
        submitUpdates,
        areUpdatesSignificant
    };
})();
