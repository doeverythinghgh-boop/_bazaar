/**
 * @file pages/register/js/register-business-helpers.js
 * @description Business validation and payload helpers for the registration page.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


function registerGetBusinessValidationState() {
    const els = registerGetElements();
    if (window.UserFormService && typeof window.UserFormService.getBusinessState === "function") {
        return window.UserFormService.getBusinessState({
            businessName: els.businessName?.value || "",
            businessTagline: els.businessTagline?.value || "",
            categoryJson: els.businessCategoryJson?.value || "{}",
            categoriesList: window.appCategoriesList?.categories || []
        });
    }

    return {
        businessName: els.businessName?.value.trim() || "",
        businessTagline: els.businessTagline?.value.trim() || "",
        categoryJson: els.businessCategoryJson?.value || "{}",
        parsedCategories: {},
        isBusinessNameValid: true,
        isBusinessTaglineValid: true,
        hasCategorySelection: true,
        hasSubcategorySelection: true
    };
}

function registerGetBusinessValidationMessages() {
    return {
        businessName: window.langu("reg_err_business_name_short"),
        businessTagline: window.langu("reg_err_tagline_short"),
        categories: window.langu("register_error_no_category")
    };
}

function registerBuildBusinessPayload(els, businessState) {
    const tagline = els.businessTagline?.value || "";
    const bioLong = els.businessBio?.value || "";

    return {
        business_name: els.businessName?.value.trim() || "",
        business_category: window.UserFormService?.normalizeBusinessCategoryJson
            ? window.UserFormService.normalizeBusinessCategoryJson(businessState?.categoryJson || "{}")
            : (businessState?.categoryJson || "{}"),
        business_bio: window.UserFormService?.buildBusinessBio
            ? window.UserFormService.buildBusinessBio({ tagline, bio: bioLong })
            : [String(tagline || "").trim(), String(bioLong || "").trim()].filter(Boolean).join("\n\n")
    };
}

function registerBuildBusinessLinksPayload(els) {
    const multi = window.registerSocialLinksApi && typeof window.registerSocialLinksApi.collectLinksForStorage === "function"
        ? window.registerSocialLinksApi.collectLinksForStorage()
        : null;
    return {
        links: JSON.stringify(window.UserFormService?.compactLinksForStorage
            ? window.UserFormService.compactLinksForStorage(multi || {
                facebook: els.businessFacebook?.value.trim() || "",
                instagram: els.businessInstagram?.value.trim() || "",
                tiktok: els.businessTiktok?.value.trim() || "",
                telegram: els.businessTelegram?.value.trim() || "",
                x: els.businessX?.value.trim() || "",
                website: els.businessWebsite?.value.trim() || ""
            })
            : (multi || {
            facebook: els.businessFacebook?.value.trim() || "",
            instagram: els.businessInstagram?.value.trim() || "",
            tiktok: els.businessTiktok?.value.trim() || "",
            telegram: els.businessTelegram?.value.trim() || "",
            x: els.businessX?.value.trim() || "",
            website: els.businessWebsite?.value.trim() || ""
        }))
    };
}

function registerParseBusinessCategorySelection(rawValue) {
    try {
        if (typeof window.parseBusinessCategorySelection === "function") {
            return window.parseBusinessCategorySelection(rawValue);
        }
        return typeof rawValue === "string" ? JSON.parse(rawValue || "{}") : (rawValue || {});
    } catch (_) {
        return {};
    }
}

function registerHasDeliveryServiceCategorySelection(rawValue = null) {
    const els = typeof registerGetElements === "function" ? registerGetElements() : {};
    const categoryValue = rawValue ?? els.businessCategoryJson?.value ?? "{}";
    const categoryMap = registerParseBusinessCategorySelection(categoryValue);
    return Object.prototype.hasOwnProperty.call(
        categoryMap,
        String(window.DELIVERY_SERVICE_CATEGORY_ID || "46")
    );
}

function registerSyncDeliveryGroupForCategories() {
    const group = document.getElementById("reg-business-delivery-group");
    if (!group) return false;

    const hasSpecialty = !!(typeof registerGetBusinessValidationState === "function"
        && typeof registerValidateBusinessStateSnapshot === "function"
        && registerValidateBusinessStateSnapshot(registerGetBusinessValidationState()).hasCategories);
    const isDeliverySpecialty = registerHasDeliveryServiceCategorySelection();
    const shouldShow = hasSpecialty && !isDeliverySpecialty;

    group.hidden = !shouldShow;
    group.setAttribute("aria-hidden", shouldShow ? "false" : "true");

    if (!shouldShow) {
        const deliveryInput = document.getElementById("register_is-delivered");
        const providerInput = document.getElementById("register_delivery-provider-key");
        const platformInput = document.getElementById("register_delivery_method_platform");
        const selfInput = document.getElementById("register_delivery_method_self");
        const error = document.getElementById("reg-delivery-partner-error");

        if (isDeliverySpecialty) {
            if (deliveryInput) deliveryInput.value = "1";
            if (providerInput) providerInput.value = "";
            if (platformInput) platformInput.checked = false;
            if (selfInput) selfInput.checked = true;
        }
        if (error) error.textContent = "";
    }

    return shouldShow;
}

window.registerParseBusinessCategorySelection = registerParseBusinessCategorySelection;
window.registerHasDeliveryServiceCategorySelection = registerHasDeliveryServiceCategorySelection;
window.registerSyncDeliveryGroupForCategories = registerSyncDeliveryGroupForCategories;
