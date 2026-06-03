/**
 * @file pages/register/js/register-submit-helpers.js
 * @description Submit payload and shared small UI helpers for the registration page.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


function registerTogglePasswordVisibility(input, icon) {
    if (!input || !icon) return;

    const isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";

    icon.classList.toggle("fa-eye");
    icon.classList.toggle("fa-eye-slash");
}

function registerBuildSettingsPayload(els, isBusinessAccount) {
    const isDeliveryServiceSpecialty = typeof window.registerHasDeliveryServiceCategorySelection === "function"
        && window.registerHasDeliveryServiceCategorySelection();
    const rawDeliveryChecked = parseInt(els.isDeliveredInput?.value || 0, 10) || 0;
    const isDeliveryChecked = isDeliveryServiceSpecialty ? 1 : rawDeliveryChecked;
    const deliveryMethod = isDeliveryServiceSpecialty
        ? "self"
        : (window.RegisterDeliveryPartnerManager?.getMethod?.() || (isDeliveryChecked ? "self" : "platform"));
    const deliveryProviderKey = isDeliveryServiceSpecialty ? "" : (document.getElementById("register_delivery-provider-key")?.value || "");
    const ratingEnabled = els.ratingEnabledInput ? !!els.ratingEnabledInput.checked : true;
    const ratingMode = els.ratingModeStarsOnly && els.ratingModeStarsOnly.checked ? "stars_only" : "stars_comments";
    const productRatingEnabled = els.productRatingEnabledInput ? !!els.productRatingEnabledInput.checked : true;
    const productRatingMode = els.productRatingModeStarsOnly && els.productRatingModeStarsOnly.checked ? "stars_only" : "stars_comments";
    const discountPercent = window.UserFormService?.normalizeDiscountPercent
        ? window.UserFormService.normalizeDiscountPercent(els.discountPercentInput?.value || 0)
        : (parseFloat(els.discountPercentInput?.value || 0) || 0);
    const locations = window.registerLocationsApi && typeof window.registerLocationsApi.getNormalizedLocationsForSettings === "function"
        ? window.registerLocationsApi.getNormalizedLocationsForSettings()
        : [];
    const accountType = isBusinessAccount ? registerGetSelectedAccountType() : (window.ACCOUNT_ROLES?.BUYER || 1);
    const settings = window.UserFormService?.buildSettingsPayload
        ? window.UserFormService.buildSettingsPayload({
            accountType,
            isDelivered: isDeliveryChecked,
            ratingEnabled,
            ratingMode,
            productRatingEnabled,
            productRatingMode,
            locations
        })
        : { isDelivered: isDeliveryChecked, locations };

    if (isBusinessAccount) {
        settings.deliveryMode = deliveryMethod;
        settings.deliveryProviderKey = deliveryMethod === "platform" ? deliveryProviderKey : "";
        settings.discountPercent = discountPercent;
    }

    return {
        isDeliveryChecked,
        settings
    };
}
