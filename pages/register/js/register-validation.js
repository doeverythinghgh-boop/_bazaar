/**
 * @file pages/register/js/register-validation.js
 * @description Input validation logic for the registration form.
 */

/**
 * Validates all register form inputs before submission.
 * @returns {Object} An object containing the validity status and the normalized form data.
 */
function registerValidateInputs() {
    const els = registerGetElements();
    const result = { isValid: true, data: {} };

    // Clear previous validation messages
    if (els.usernameInput) AuthUI.clearFieldValidationMsg(els.usernameInput);
    if (els.phoneInput) AuthUI.clearFieldValidationMsg(els.phoneInput);
    if (els.passwordInput) AuthUI.clearFieldValidationMsg(els.passwordInput);
    if (els.addressInput) AuthUI.clearFieldValidationMsg(els.addressInput);
    if (els.mapError) els.mapError.style.display = "none";

    // 1. Validate Username
    const username = els.usernameInput?.value.trim() || "";
    const usernameValidation = AuthValidators.validateUsername(username);
    if (!usernameValidation.isValid) {
        AuthUI.showFieldValidationMsg(els.usernameInput, usernameValidation.message);
        result.isValid = false;
    }

    // 2. Validate Phone
    const rawPhone = els.phoneInput?.value.trim() || "";
    const normalizedPhone = AuthValidators.normalizePhone(rawPhone);
    const phoneValidation = AuthValidators.validatePhone(normalizedPhone);
    if (!phoneValidation.isValid) {
        AuthUI.showFieldValidationMsg(els.phoneInput, phoneValidation.message);
        result.isValid = false;
    }

    // 3. Validate Password
    const password = els.passwordInput?.value || ""; // Don't trim password usually, but here we trim in original code? 
    // Original code: register_password.value.trim(). Let's stick to it.
    const passwordValidation = AuthValidators.validatePassword(password.trim());
    if (!passwordValidation.isValid) {
        AuthUI.showFieldValidationMsg(els.passwordInput, passwordValidation.message);
        result.isValid = false;
    }

    // 4. Validate Location (Mandatory)
    const coordsValue = els.coordsInput?.value || "";
    if (!coordsValue) {
        if (els.mapError) {
            els.mapError.textContent = window.langu("register_map_mandatory_error");
            els.mapError.style.display = "block";
            els.mapError.style.color = "#dc2626";
            els.mapError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        result.isValid = false;
    }

    // 5. Validate Address Detail
    const address = els.addressInput?.value.trim() || "";
    const addressValidation = AuthValidators.validateAddress(address, !!coordsValue);
    if (!addressValidation.isValid) {
        AuthUI.showFieldValidationMsg(els.addressInput, addressValidation.message);
        result.isValid = false;
    }

    // Return sanitized data
    result.data = {
        username,
        phone: normalizedPhone,
        password: password.trim(), // Send trimmed
        location: coordsValue,
        address
    };

    return result;
}
