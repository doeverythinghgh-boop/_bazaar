/**
 * @file js/auth/validators.js
 * @description Pure functions for validating authentication inputs.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


function authValidationText(key, fallback) {
    const value = typeof window !== "undefined" && typeof window.langu === "function"
        ? window.langu(key)
        : null;
    return (!value || value === key) ? fallback : value;
}

const AuthValidators = {
    normalizePhone: (phone, options = {}) => {
        if (!phone) return "";

        const defaultCountryCode = String(options.defaultCountryCode || "20").replace(/\D/g, "") || "20";
        const hindiToArabic = {
            "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
            "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9"
        };

        const normalizedText = String(phone)
            .replace(/[٠-٩]/g, (digit) => hindiToArabic[digit] || digit)
            .trim();

        if (!normalizedText) return "";

        if (normalizedText.startsWith("+")) {
            const digits = normalizedText.slice(1).replace(/\D/g, "");
            return digits ? `+${digits}` : "";
        }

        if (normalizedText.startsWith("00")) {
            const digits = normalizedText.slice(2).replace(/\D/g, "");
            return digits ? `+${digits}` : "";
        }

        const digitsOnly = normalizedText.replace(/\D/g, "");
        if (!digitsOnly) return "";

        if (digitsOnly.startsWith(defaultCountryCode)) {
            return `+${digitsOnly}`;
        }

        if (digitsOnly.startsWith("0")) {
            return `+${defaultCountryCode}${digitsOnly.slice(1)}`;
        }

        return `+${digitsOnly}`;
    },

    isValidPhone: (phone) => {
        return /^\+[1-9]\d{7,14}$/.test(String(phone || "").trim());
    },

    validatePhone: (phone) => {
        if (!phone) {
            return { isValid: false, message: authValidationText("auth_validation_phone_required", "Phone number is required.") };
        }

        if (!AuthValidators.isValidPhone(phone)) {
            return { isValid: false, message: authValidationText("auth_validation_phone_min", "Enter a valid phone number in E.164 format such as +201001234567.") };
        }

        return { isValid: true, message: "" };
    },

    normalizePhonesList: (phones) => {
        if (!Array.isArray(phones)) return [];

        const normalized = [];
        const seen = new Set();

        phones.forEach((item, index) => {
            const number = AuthValidators.normalizePhone(item?.number || item);
            if (!number || seen.has(number)) return;

            seen.add(number);
            normalized.push({
                number,
                is_primary: !!item?.is_primary,
                has_whatsapp: !!item?.has_whatsapp
            });
        });

        return normalized;
    },

    validatePhonesList: (phones) => {
        const original = Array.isArray(phones) ? phones : [];
        const normalized = AuthValidators.normalizePhonesList(original);
        const validNormalizedValues = original
            .map((item) => AuthValidators.normalizePhone(item?.number || item))
            .filter((item) => item && AuthValidators.isValidPhone(item));
        const hasDuplicates = new Set(validNormalizedValues).size !== validNormalizedValues.length;

        if (!normalized.length) {
            return {
                isValid: false,
                message: authValidationText("auth_validation_phone_required", "At least one phone number is required."),
                phones: []
            };
        }

        if (hasDuplicates) {
            return {
                isValid: false,
                message: "Duplicate phone numbers are not allowed.",
                phones: normalized
            };
        }

        const primaryPhones = normalized.filter((item) => item.is_primary);
        if (primaryPhones.length !== 1) {
            return {
                isValid: false,
                message: primaryPhones.length > 1
                    ? "Only one primary phone number is allowed."
                    : "A primary phone number is required.",
                phones: normalized
            };
        }

        for (const item of normalized) {
            if (!AuthValidators.isValidPhone(item.number)) {
                return {
                    isValid: false,
                    message: authValidationText("auth_validation_phone_min", "Enter a valid phone number in E.164 format such as +201001234567."),
                    phones: normalized
                };
            }
        }

        if (!primaryPhones[0].has_whatsapp) {
            return {
                isValid: false,
                message: "Primary phone number must have WhatsApp enabled.",
                phones: normalized
            };
        }

        return { isValid: true, message: "", phones: normalized };
    },

    validatePassword: (password) => {
        if (!password) {
            return { isValid: false, message: authValidationText("auth_validation_password_required", "Password is required.") };
        }
        if (password.length < 4) {
            return { isValid: false, message: authValidationText("auth_validation_password_min", "Password must be at least 4 characters.") };
        }
        return { isValid: true, message: "" };
    },

    validateUsername: (username) => {
        if (!username) {
            return { isValid: false, message: authValidationText("auth_validation_username_required", "Name is required.") };
        }
        if (username.length < 3 || username.length > 30) {
            return { isValid: false, message: authValidationText("auth_validation_username_length", "Name must be between 3 and 30 characters.") };
        }
        return { isValid: true, message: "" };
    },

    validateAddress: (address, hasCoordinates = false) => {
        if (!address || address.trim().length === 0) {
            if (hasCoordinates) {
                return { isValid: false, message: authValidationText("auth_validation_address_details_required", "Please add clear address details like floor or landmark.") };
            }
            return { isValid: false, message: authValidationText("auth_validation_address_delivery_hint", "Please add enough address details to help with delivery.") };
        }
        if (address.trim().length < 5) {
            return { isValid: false, message: authValidationText("auth_validation_address_min", "Address must be at least 5 characters.") };
        }
        return { isValid: true, message: "" };
    }
};

if (typeof window !== "undefined") {
    window.AuthValidators = AuthValidators;
}
