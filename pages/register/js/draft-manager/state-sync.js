/**
 * @file pages/register/js/draft-manager/state-sync.js
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

(function() {
    'use strict';
    window.DraftManagerInternals = window.DraftManagerInternals || {};

    window.DraftManagerInternals.syncRestoredFieldState = function(id, value, element) {
        if (!window.RegisterState) return;

        const stateKeyMap = {
            register_username: "username",
            register_password: "password",
            register_confirm_password: "confirmPassword",
            profile_current_password: "currentPassword",
            register_address: "address",
            register_coords: "location",
            register_business_name: "businessName",
            register_business_tagline: "businessTagline",
            register_business_category_json: "categories",
            "register_is-delivered": "register_is-delivered",
            "register_delivery-provider-key": "register_delivery-provider-key",
            "register_limit-package": "register_limit-package",
            register_discount_percent: "register_discount_percent",
            register_business_bio: "register_business_bio",
            register_rating_enabled: "register_rating_enabled",
            register_product_rating_enabled: "register_product_rating_enabled"
        };

        const stateKey = stateKeyMap[id] || id;
        const normalizedValue = element?.type === "checkbox" || element?.type === "radio"
            ? !!value
            : (value ?? "");
        const validState = window.DraftManagerInternals.inferRestoredFieldState(id, normalizedValue);
        window.RegisterState.updateField(stateKey, normalizedValue, validState.state, validState.error);

        if (stateKey !== id) {
            window.RegisterState.updateField(id, normalizedValue, validState.state, validState.error);
        }
    };

    window.DraftManagerInternals.inferRestoredFieldState = function(id, value) {
        const raw = String(value ?? "").trim();

        if (id === "register_username" && typeof registerValidateUsernameValue === "function") {
            const validation = registerValidateUsernameValue(raw);
            return { state: validation.isValid ? "valid" : "idle", error: validation.isValid ? "✓" : "" };
        }

        if (id === "register_business_name" || id === "register_business_tagline") {
            return { state: raw ? "valid" : "idle", error: "" };
        }

        if (id === "register_business_category_json") {
            return { state: window.DraftManagerInternals.hasRestoredCategorySelection(raw) ? "valid" : "idle", error: "" };
        }

        if (id === "register_address" || id === "register_coords") {
            return { state: raw ? "valid" : "idle", error: "" };
        }

        if (id === "register_delivery-provider-key") {
            return { state: raw ? "valid" : "idle", error: "" };
        }

        return { state: raw || typeof value === "boolean" ? "valid" : "idle", error: "" };
    };

    window.DraftManagerInternals.hasRestoredCategorySelection = function(raw) {
        try {
            const parsed = typeof raw === "string" ? JSON.parse(raw || "{}") : raw;
            return Object.values(parsed || {}).some((subIds) => Array.isArray(subIds) && subIds.length > 0);
        } catch (_) {
            return false;
        }
    };
})();
