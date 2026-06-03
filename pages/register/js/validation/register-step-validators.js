/**
 * @file pages/register/js/validation/register-step-validators.js
 * @description Step validators registry (split from register-step-validation.js).
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


(function () {
  "use strict";

  // Preserve object identity if other scripts already referenced it.
  window.registerStepValidators = window.registerStepValidators || {};

  const V = window.registerStepValidators;

  V.identity = async function ({ silent, els }) {
    const usernameValid = await V.username({ silent, els });
    console.log(`[Reg-Step] Validation: Identity -> Username valid: ${usernameValid}`);
    if (!usernameValid) return false;

    const phoneValid = await V.phone({ silent, els });
    console.log(`[Reg-Step] Validation: Identity -> Phone valid: ${phoneValid}`);
    return phoneValid;
  };

  V.username = async function ({ silent, els }) {
    const username = els.username?.value || "";
    const validation = registerValidateUsernameValue(username);
    const fieldId = "username";
    console.log(`[Reg-Step] Validator: Checking [${fieldId}] -> Val: "${username}"`);

    if (!validation.isValid) {
      console.warn(`[Reg-Step] Validator: [${fieldId}] is INVALID: ${validation.errorCode}`);
      if (window.RegisterState) {
        const errorCode = validation.errorCode || "USERNAME_INVALID";
        const errorMsg = window.RegisterErrorManager ? window.RegisterErrorManager.getMessage(errorCode) : errorCode;
        window.RegisterState.updateField(fieldId, username, "invalid", silent ? "" : errorMsg);
      }
      return false;
    }

    console.log(`[Reg-Step] Validator: [${fieldId}] is VALID.`);
    if (window.RegisterState) window.RegisterState.updateField(fieldId, username, "valid", "✓");
    return true;
  };

  V.avatar = registerAlwaysValid;

  V.phone = async function ({ silent, els }) {
    const fieldId = "phone";
    const validation = registerCollectPhones();
    const primaryPhone = registerGetPrimaryPhone(validation);
    const isVerified = window.registerVerifiedPhones?.has(AuthValidators.normalizePhone(primaryPhone));

    console.log(`[Reg-Step] Validator: Checking [${fieldId}] -> Primary: "${primaryPhone}", Verified: ${isVerified}`);

    if (!validation.isValid) {
      console.warn(`[Reg-Step] Validator: [${fieldId}] Collection INVALID.`);
      if (window.RegisterState) {
        const errorCode = validation.errorCode || "PHONE_INVALID";
        const errorMsg = window.RegisterErrorManager ? window.RegisterErrorManager.getMessage(errorCode) : errorCode;
        window.RegisterState.updateField(fieldId, primaryPhone || "", "invalid", silent ? "" : errorMsg);
      }
      return false;
    }

    if (!isVerified) {
      console.warn(`[Reg-Step] Validator: [${fieldId}] NOT VERIFIED.`);
      if (window.RegisterState) {
        const currentState = window.RegisterState.getField(fieldId);
        const isSameValue = (currentState?.value || "").trim() === (primaryPhone || "").trim();

        if (isSameValue && (currentState.state === "checking" || currentState.state === "valid")) {
          console.log(`[Reg-Step] Validator: [${fieldId}] preserving existing state: ${currentState.state}`);
          return currentState.state === "valid";
        }

        const isLongEnough = (primaryPhone || "").replace(/\D/g, "").length >= 12;
        const errorCode = isLongEnough ? "register_phone_verifying" : "PHONE_INVALID";
        const errorMsg = window.RegisterErrorManager ? window.RegisterErrorManager.getMessage(errorCode) : errorCode;
        const currentError = currentState?.error || "";
        window.RegisterState.updateField(fieldId, primaryPhone, "invalid", silent ? currentError : errorMsg);
      }
      return false;
    }

    console.log(`[Reg-Step] Validator: [${fieldId}] is VALID.`);
    if (window.RegisterState) window.RegisterState.updateField(fieldId, primaryPhone, "valid", "register_phone_available");
    return true;
  };

  V.security = async function ({ silent, els }) {
    const mode = window.regWizard?.mode || "REGISTER";
    const currentPass = els.currentPassword?.value || "";
    const pass = els.password?.value || "";
    const confirm = els.confirmPassword?.value || "";

    console.log(`[Reg-Step] Validator: Checking [security] Mode: ${mode}`);
    const isChanging = pass || confirm || currentPass;

    if (mode === "PROFILE" && !isChanging) {
      console.log(`[Reg-Step] Validator: [security] No changes detected, step is VALID.`);
      return true;
    }

    if (mode === "PROFILE" && isChanging && !currentPass) {
      if (window.RegisterState) {
        const errorMsg = window.RegisterErrorManager ? window.RegisterErrorManager.getMessage("profile_error_current_password_required") : "profile_error_current_password_required";
        window.RegisterState.updateField("currentPassword", "", "invalid", silent ? "" : errorMsg);
      }
      return false;
    }
    if (window.RegisterState && currentPass) window.RegisterState.updateField("currentPassword", currentPass, "valid");

    const validation = registerValidatePasswordFields(pass, confirm);
    if (!validation.passwordValidation.isValid) {
      if (window.RegisterState) {
        const errorMsg = window.RegisterErrorManager ? window.RegisterErrorManager.getMessage(validation.passwordValidation.message) : validation.passwordValidation.message;
        window.RegisterState.updateField("password", pass, "invalid", silent ? "" : errorMsg);
      }
      return false;
    }
    if (window.RegisterState) window.RegisterState.updateField("password", pass, "valid");

    if (!validation.passwordsMatch) {
      if (window.RegisterState) {
        const errorMsg = window.RegisterErrorManager ? window.RegisterErrorManager.getMessage("register_error_password_mismatch") : "register_error_password_mismatch";
        window.RegisterState.updateField("confirmPassword", confirm, "invalid", silent ? "" : errorMsg);
      }
      return false;
    }
    if (window.RegisterState) window.RegisterState.updateField("confirmPassword", confirm, "valid", "✓");
    return true;
  };

  V.password = async function (params) {
    return V.security(params);
  };

  V.location = async function ({ silent, els }) {
    const coords = els.coordsInput?.value || "";
    const fieldId = "location";
    const isBusiness = typeof registerHasBusinessRole === "function" && registerHasBusinessRole();
    console.log(`[Reg-Step] Validator: Checking [${fieldId}] (Business: ${isBusiness}) -> Val: "${coords}"`);

    const locationValidation = registerValidateLocationValue(coords);

    if (!isBusiness && !locationValidation.hasLocation) {
      console.log(`[Reg-Step] Validator: [${fieldId}] is optional for buyer and empty. Assuming VALID.`);
      if (window.RegisterState) window.RegisterState.updateField(fieldId, coords, "idle");
      if (!silent) registerSetMapError("");
      return true;
    }

    if (!locationValidation.isValid) {
      console.warn(`[Reg-Step] Validator: [${fieldId}] INVALID for Business: ${locationValidation.message}`);
      const errorMsg = window.RegisterErrorManager ? window.RegisterErrorManager.getMessage(locationValidation.message) : locationValidation.message;
      if (window.RegisterState) window.RegisterState.updateField(fieldId, coords, "invalid", silent ? "" : errorMsg);
      if (!silent) {
        registerSetMapError((locationValidation.message === "register_error_location_required") ? "يرجى تحديد موقعك على الخريطة أولاً" : errorMsg);
      }
      return false;
    }

    console.log(`[Reg-Step] Validator: [${fieldId}] is VALID.`);
    if (window.RegisterState) window.RegisterState.updateField(fieldId, coords, "valid");
    if (!silent) registerSetMapError("");
    return true;
  };

  V.locationAddress = async function ({ silent, els }) {
    if (window.registerLocationsApi && typeof window.registerLocationsApi.validateLocationsForCurrentRole === "function") {
      return window.registerLocationsApi.validateLocationsForCurrentRole({ silent });
    }
    const locationValid = await V.location({ silent, els });
    if (!locationValid) return false;
    return await V.address({ silent, els });
  };

  V.address = async function ({ silent, els }) {
    const val = els.address?.value?.trim() || "";
    const locationValidation = registerValidateLocationValue(els.coordsInput?.value || "");
    const addressValidation = registerValidateAddressValue(val, locationValidation.hasLocation);
    const fieldId = "address";
    console.log(`[Reg-Step] Validator: Checking [address] Val: "${val}", HasLocation: ${locationValidation.hasLocation}`);

    if (!addressValidation.isValid) {
      console.warn(`[Reg-Step] Validator: [address] INVALID: ${addressValidation.message}`);
      const errorCode = addressValidation.message || "register_error_address_required";
      const errorMsg = window.RegisterErrorManager ? window.RegisterErrorManager.getMessage(errorCode) : errorCode;
      if (window.RegisterState) window.RegisterState.updateField(fieldId, val, "invalid", silent ? "" : errorMsg);
      return false;
    }
    console.log(`[Reg-Step] Validator: [address] is VALID.`);
    if (window.RegisterState) window.RegisterState.updateField(fieldId, val, "valid");
    return true;
  };

  V.covers = registerAlwaysValid;

  V.business = async function ({ silent }) {
    console.log(`[Reg-Step] Validator: Checking [business]...`);
    const businessValidation = registerValidateBusinessStateSnapshot(registerGetBusinessValidationState());
    const validName = businessValidation.state.isBusinessNameValid;
    const validTagline = businessValidation.state.isBusinessTaglineValid;
    const valid = businessValidation.hasBusinessBasics;

    console.log(`[Reg-Step] Validator: [business] Result -> ${valid}`);
    if (window.RegisterState) {
      const nameError = window.RegisterErrorManager ? window.RegisterErrorManager.getMessage("BUSINESS_NAME_REQUIRED") : "BUSINESS_NAME_REQUIRED";
      window.RegisterState.updateField("register_business_name", "", validName ? "valid" : "invalid", validName ? "" : nameError);
      window.RegisterState.updateField("register_business_tagline", "", validTagline ? "valid" : "invalid");
      const subsequentValid = validTagline ? "valid" : "idle";
      window.RegisterState.updateField("register_business_bio", "", subsequentValid);
      window.RegisterState.updateField("register_is-delivered", "", subsequentValid);
      window.RegisterState.updateField("register_limit-package", "", subsequentValid);
    }
    return valid;
  };

  V.businessSetup = async function ({ silent, els }) {
    const businessValid = await V.business({ silent, els });
    if (!businessValid) return false;
    const categoriesValid = await V.categories({ silent, els });
    if (!categoriesValid) return false;
    return await V.deliveryRelation({ silent, els });
  };

  V.deliveryRelation = async function ({ silent }) {
    if (!window.RegisterDeliveryPartnerManager || !registerHasBusinessRole()) return true;
    if (typeof window.registerHasDeliveryServiceCategorySelection === "function"
      && window.registerHasDeliveryServiceCategorySelection()) {
      return true;
    }
    return window.RegisterDeliveryPartnerManager.validate({ silent });
  };

  V.delivery = V.deliveryRelation;
  V.limit = registerAlwaysValid;

  V.categories = async function ({ silent }) {
    const fieldId = "categories";
    console.log(`[Reg-Step] Validator: Checking [categories]...`);
    const businessValidation = registerValidateBusinessStateSnapshot(registerGetBusinessValidationState());
    const valid = businessValidation.hasCategories;
    console.log(`[Reg-Step] Validator: [categories] Result -> ${valid}`);
    if (window.RegisterState) {
      const errorMsg = window.RegisterErrorManager ? window.RegisterErrorManager.getMessage("NO_CATEGORY") : "NO_CATEGORY";
      window.RegisterState.updateField(fieldId, "", valid ? "valid" : "invalid", valid ? "" : errorMsg);
    }
    return valid;
  };

  V.whatsapp = registerAlwaysValid;
  V.social = registerAlwaysValid;
  V.rating = registerAlwaysValid;
})();

