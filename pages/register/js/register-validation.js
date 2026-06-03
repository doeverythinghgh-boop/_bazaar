/**
 * @file pages/register/js/register-validation.js
 * @description Input validation logic for the registration form.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


async function registerValidateInputs() {
    const els = registerGetElements();
    const result = { isValid: true, data: {} };
    const isBusinessAccount = registerHasBusinessRole();
    const businessState = registerGetBusinessValidationState();
    const businessMessages = registerGetBusinessValidationMessages();
    const phoneValidationState = registerCollectPhones();

    if (els.username) AuthUI.clearFieldValidationMsg(els.username);
    if (els.password) AuthUI.clearFieldValidationMsg(els.password);
    if (els.confirmPassword) AuthUI.clearFieldValidationMsg(els.confirmPassword);
    if (els.address) AuthUI.clearFieldValidationMsg(els.address);
    if (els.businessName) AuthUI.clearFieldValidationMsg(els.businessName);
    if (els.businessTagline) AuthUI.clearFieldValidationMsg(els.businessTagline);
    if (els.phoneError) els.phoneError.textContent = "";
    registerSetMapError("");

    const locations = (window.registerLocationsApi && typeof window.registerLocationsApi.getNormalizedLocationsForSettings === "function")
        ? window.registerLocationsApi.getNormalizedLocationsForSettings()
        : [];
    const primaryLoc = (window.UserLocationsClient && typeof window.UserLocationsClient.getPrimary === "function")
        ? window.UserLocationsClient.getPrimary(locations)
        : (locations[0] || null);

    const validationContext = {
        els,
        result,
        isBusinessAccount,
        businessState,
        businessMessages,
        phoneValidationState,
        locations,
        primaryLoc
    };

    const activeValidationKeys = registerGetActiveFinalValidationKeys();
    for (const validationKey of activeValidationKeys) {
        const validator = window.registerFinalValidationRules?.[validationKey];
        if (typeof validator !== "function") continue;
        await validator(validationContext);
    }

    const primaryPhone = registerGetPrimaryPhone(phoneValidationState);
    result.data = {
        username: els.username?.value.trim() || "",
        phone: primaryPhone,
        phones: phoneValidationState.phones,
        password: (els.password?.value || "").trim(),
        location: String(primaryLoc?.coords || "").trim(),
        address: String(primaryLoc?.address || "").trim(),
        isBusinessAccount,
        businessState,
        locations
    };

    return result;
}

window.registerFinalValidationRules = {
    async username({ els, result }) {
        const username = els.username?.value.trim() || "";
        const usernameValidation = registerValidateUsernameValue(username);
        if (!usernameValidation.isValid) {
            console.warn("[Register][Validation] Username failed:", usernameValidation.message);
            AuthUI.showFieldValidationMsg(els.username, usernameValidation.message);
            result.isValid = false;
        }
    },

    async phone({ els, result, phoneValidationState }) {
        if (!phoneValidationState.isValid) {
            console.warn("[Register][Validation] Phone list invalid:", phoneValidationState.message);
            if (els.phoneError) els.phoneError.textContent = phoneValidationState.message;
            result.isValid = false;
            return;
        }

        try {
            const primaryPhone = registerGetPrimaryPhone(phoneValidationState);
            if (!window.registerVerifiedPhones?.has(primaryPhone)) {
                const whatsappVerificationDisabled = window.AppBehavior?.enableWhatsappPhoneVerification === false;
                if (whatsappVerificationDisabled) {
                    const exists = await registerCheckPhoneExists(primaryPhone);
                    if (exists === null) {
                        if (els.phoneError) {
                            els.phoneError.textContent = window.langu("register_error_app") || "تعذر التحقق من الرقم الآن. حاول مرة أخرى.";
                        }
                        result.isValid = false;
                        return;
                    }
                    if (exists) {
                        if (els.phoneError) {
                            els.phoneError.textContent = window.langu("register_error_phone_exists");
                        }
                        result.isValid = false;
                        return;
                    }
                    window.registerVerifiedPhones.add(primaryPhone);
                } else {
                if (els.phoneError) {
                    els.phoneError.textContent = window.langu("register_phone_verifying") || "يرجى إكمال التحقق من واتساب أولاً.";
                }
                result.isValid = false;
                return;
                }
            }
            const exists = await registerCheckPhoneExists(primaryPhone);
            if (exists === null) {
                if (els.phoneError) {
                    els.phoneError.textContent = window.langu("register_error_app") || "تعذر التحقق من الرقم الآن. حاول مرة أخرى.";
                }
                result.isValid = false;
                return;
            }
            if (exists) {
                console.warn("[Register][Validation] Primary phone already exists:", primaryPhone);
                if (els.phoneError) {
                    els.phoneError.textContent = window.langu("register_error_phone_exists");
                }
                result.isValid = false;
            }
        } catch (error) {
            console.error("[Register] Final phone validation error:", error);
            if (els.phoneError) {
                els.phoneError.textContent = window.langu("register_error_app");
            }
            result.isValid = false;
        }
    },

    async password({ els, result }) {
        const passwordValidationState = registerValidatePasswordFields(
            els.password?.value || "",
            els.confirmPassword?.value || ""
        );
        if (!passwordValidationState.passwordValidation.isValid) {
            console.warn("[Register][Validation] Password failed:", passwordValidationState.passwordValidation.message);
            AuthUI.showFieldValidationMsg(els.password, passwordValidationState.passwordValidation.message);
            result.isValid = false;
        }
        if (!passwordValidationState.passwordsMatch) {
            console.warn("[Register][Validation] Password mismatch.");
            AuthUI.showFieldValidationMsg(
                els.confirmPassword,
                window.langu("register_error_password_mismatch")
            );
            result.isValid = false;
        }
    },

    async location({ els, result, isBusinessAccount }) {
        const locations = (window.registerLocationsApi && typeof window.registerLocationsApi.getNormalizedLocationsForSettings === "function")
            ? window.registerLocationsApi.getNormalizedLocationsForSettings()
            : [];
        const draftCoords = String(els.coordsInput?.value || "").trim();
        const draftAddr = String(els.address?.value || "").trim();
        const accountType = isBusinessAccount ? (window.ACCOUNT_ROLES?.SERVICE_PROVIDER || 32) : 1; // Simplification for validation context

        const locationValidation = window.UserFormService?.validateLocationRequirement
            ? window.UserFormService.validateLocationRequirement(accountType, locations, draftCoords, draftAddr)
            : { isValid: true };

        if (!locationValidation.isValid) {
            console.warn("[Register][Validation] Location requirements failed:", locationValidation.errorCode);
            registerSetMapError(window.langu(locationValidation.message));
            if (locationValidation.errorCode === "LOCATION_REQUIRED" && els.mapError) {
                els.mapError.scrollIntoView({ behavior: "smooth", block: "center" });
            }
            result.isValid = false;
        }
    },

    async address({ els, result, isBusinessAccount }) {
        // Shared location requirement helper handles both map & address in the 'location' step above.
        // But for granular feedback on the address field itself:
        const locations = (window.registerLocationsApi && typeof window.registerLocationsApi.getNormalizedLocationsForSettings === "function")
            ? window.registerLocationsApi.getNormalizedLocationsForSettings()
            : [];
        const draftCoords = String(els.coordsInput?.value || "").trim();
        const draftAddr = String(els.address?.value || "").trim();
        const accountType = isBusinessAccount ? (window.ACCOUNT_ROLES?.SERVICE_PROVIDER || 32) : 1;

        const locationValidation = window.UserFormService?.validateLocationRequirement
            ? window.UserFormService.validateLocationRequirement(accountType, locations, draftCoords, draftAddr)
            : { isValid: true };

        if (!locationValidation.isValid && (locationValidation.errorCode === "LOCATION_INCOMPLETE_BUYER" || locationValidation.errorCode === "LOCATION_INCOMPLETE_BUSINESS")) {
             AuthUI.showFieldValidationMsg(
                els.address,
                window.langu("loc_err_incomplete_pair")
            );
            result.isValid = false;
        }
    },

    async businessName({ els, result, isBusinessAccount, businessState, businessMessages }) {
        if (!isBusinessAccount) return;
        const businessValidation = registerValidateBusinessStateSnapshot(businessState);
        if (!businessValidation.state.isBusinessNameValid) {
            console.warn("[Register][Validation] Business name failed.");
            AuthUI.showFieldValidationMsg(els.businessName, businessMessages.businessName);
            result.isValid = false;
        }
    },

    async businessTagline({ els, result, isBusinessAccount, businessState, businessMessages }) {
        if (!isBusinessAccount) return;
        const businessValidation = registerValidateBusinessStateSnapshot(businessState);
        if (!businessValidation.state.isBusinessTaglineValid) {
            console.warn("[Register][Validation] Business tagline failed.");
            AuthUI.showFieldValidationMsg(els.businessTagline, businessMessages.businessTagline);
            result.isValid = false;
        }
    },

    async categories({ els, result, isBusinessAccount, businessState, businessMessages }) {
        if (!isBusinessAccount) return;
        const businessValidation = registerValidateBusinessStateSnapshot(businessState);
        if (!businessValidation.hasCategories) {
            console.warn("[Register][Validation] Category selection missing.", businessValidation.state);
            result.isValid = false;
            if (els.businessCategoryDisplay) {
                els.businessCategoryDisplay.scrollIntoView({ behavior: "smooth", block: "center" });
            }
            if (typeof AuthUI !== "undefined" && typeof AuthUI.showError === "function") {
                AuthUI.showError(
                    window.langu("gen_swal_error_title") || "Alert",
                    businessMessages.categories
                );
            }
        }
    },

    async delivery({ result, isBusinessAccount }) {
        if (!isBusinessAccount || !window.RegisterDeliveryPartnerManager) return;
        if (typeof window.registerHasDeliveryServiceCategorySelection === "function"
            && window.registerHasDeliveryServiceCategorySelection()) {
            return;
        }
        if (!window.RegisterDeliveryPartnerManager.validate({ silent: false })) {
            result.isValid = false;
        }
    },

    async links({ result, isBusinessAccount }) {
        if (!isBusinessAccount || !window.MultiLinksClient?.validateLinksObject) return;

        const rawLinks = window.registerSocialLinksApi?.collectLinksForStorage
            ? window.registerSocialLinksApi.collectLinksForStorage()
            : {};
        const linksValidation = window.MultiLinksClient.validateLinksObject(rawLinks);
        if (linksValidation.isValid) return;

        const firstInvalidType = Object.keys(linksValidation.invalid)[0];
        const firstInvalidIndex = linksValidation.invalid[firstInvalidType]?.[0] ?? 0;
        const suffix = firstInvalidIndex > 0 ? `_${firstInvalidIndex + 1}` : "";
        const input = document.getElementById(`register_business_${firstInvalidType}${suffix}`);

        if (input) {
            AuthUI.showFieldValidationMsg(
                input,
                window.langu("auth_validation_invalid_url") || "Please enter a valid and safe link."
            );
        }
        result.isValid = false;
    }
};
