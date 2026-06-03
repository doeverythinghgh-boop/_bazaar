/**
 * @file pages/register/js/register-validation-shared.js
 * @description Shared validation primitives reused by step and final register validation flows.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


function registerGetPrimaryPhone(phoneValidationState) {
    if (window.UserFormService && typeof window.UserFormService.extractPrimaryPhone === "function") {
        return window.UserFormService.extractPrimaryPhone(phoneValidationState?.phones || []);
    }
    return phoneValidationState?.phones?.find((item) => item.is_primary)?.number || "";
}

function registerValidateUsernameValue(username) {
    const normalized = (username || "").trim();
    const result = AuthValidators.validateUsername(normalized);
    if (result.isValid) {
        return { ...result, errorCode: "" };
    }

    return {
        ...result,
        errorCode: normalized ? "USERNAME_INVALID" : "USERNAME_REQUIRED"
    };
}

function registerValidatePasswordFields(password, confirmPassword) {
    const normalizedPassword = password || "";
    const normalizedConfirmPassword = confirmPassword || "";
    const passwordValidation = AuthValidators.validatePassword(normalizedPassword.trim());
    const passwordsMatch = normalizedPassword === normalizedConfirmPassword;

    return {
        passwordValidation,
        passwordsMatch,
        isValid: !!(passwordValidation.isValid && passwordsMatch)
    };
}

function registerValidateLocationValue(coordsValue) {
    const hasLocation = !!(coordsValue || "").trim();

    return {
        isValid: hasLocation,
        hasLocation,
        message: window.langu("register_error_location_required")
    };
}

function registerValidateAddressValue(address, hasLocation) {
    return AuthValidators.validateAddress((address || "").trim(), !!hasLocation);
}

function registerValidateBusinessStateSnapshot(businessState) {
    const categoriesList = window.appCategoriesList?.categories || [];
    const state = businessState || (window.UserFormService?.getBusinessState ? window.UserFormService.getBusinessState({
        businessName: document.getElementById("register_business_name")?.value || "",
        businessTagline: document.getElementById("register_business_tagline")?.value || "",
        categoryJson: document.getElementById("reg-business-category-json")?.value || "{}",
        categoriesList
    }) : registerGetBusinessValidationState());

    const hasBusinessBasics = !!(state.isBusinessNameValid && state.isBusinessTaglineValid);
    const hasCategories = !!(state.hasCategorySelection && state.hasSubcategorySelection);

    return {
        state,
        hasBusinessBasics,
        hasCategories
    };
}

async function registerAlwaysValid() {
    return true;
}
