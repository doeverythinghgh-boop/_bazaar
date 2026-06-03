/**
 * @file js/auth/session-manager-core.js
 * @description Session normalization and helper utilities.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

const SESSION_LOGIN_TOUCH_DAY_PREFIX = "last_login_touch_day_";

export function getTodayUtcKey() {
    return new Date().toISOString().slice(0, 10);
}

export function nowIso() {
    return new Date().toISOString();
}

export function unwrapSessionApiPayload(payload) {
    if (
        payload &&
        typeof payload === "object" &&
        Object.prototype.hasOwnProperty.call(payload, "success") &&
        Object.prototype.hasOwnProperty.call(payload, "data") &&
        Object.prototype.hasOwnProperty.call(payload, "error")
    ) {
        if (payload.success === false) {
            return payload;
        }
        return payload.data;
    }

    return payload;
}

export function normalizeSessionPhones(user) {
    const sourcePhones = Array.isArray(user?.phones) ? user.phones : [];
    const fallbackPhones = sourcePhones.length ? sourcePhones : (() => {
        const phones = [];
        const AuthValidators = window.AuthValidators;
        const primaryPhone = typeof AuthValidators !== "undefined"
            ? AuthValidators.normalizePhone(user?.phone || "")
            : (user?.phone || "");
        const whatsappPhone = typeof AuthValidators !== "undefined"
            ? AuthValidators.normalizePhone(user?.business_whatsapp || "")
            : (user?.business_whatsapp || "");
        const isPrimaryValid = typeof AuthValidators !== "undefined" && typeof AuthValidators.isValidPhone === "function"
            ? AuthValidators.isValidPhone(primaryPhone)
            : !!primaryPhone;
        const isWhatsappValid = typeof AuthValidators !== "undefined" && typeof AuthValidators.isValidPhone === "function"
            ? AuthValidators.isValidPhone(whatsappPhone)
            : !!whatsappPhone;

        if (isPrimaryValid) {
            phones.push({ number: primaryPhone, is_primary: true, has_whatsapp: true });
        }
        if (isWhatsappValid && whatsappPhone !== primaryPhone) {
            phones.push({ number: whatsappPhone, is_primary: false, has_whatsapp: true });
        }
        return phones;
    })();

    const AuthValidators = window.AuthValidators;
    const normalizedPhones = typeof AuthValidators !== "undefined" && typeof AuthValidators.normalizePhonesList === "function"
        ? AuthValidators.normalizePhonesList(fallbackPhones)
        : fallbackPhones;

    const primaryPhone = normalizedPhones.find((item) => item.is_primary)?.number || "";
    const whatsappPhone = normalizedPhones.find((item) => item.is_primary && item.has_whatsapp)?.number
        || normalizedPhones.find((item) => item.has_whatsapp)?.number
        || "";
    const businessWhatsappPhone = normalizedPhones.find((item) => !item.is_primary && item.has_whatsapp)?.number
        || whatsappPhone;
    const fallbackWhatsappPhone = typeof AuthValidators !== "undefined"
        ? AuthValidators.normalizePhone(user?.business_whatsapp || "")
        : (user?.business_whatsapp || "");
    const fallbackWhatsappValid = typeof AuthValidators !== "undefined" && typeof AuthValidators.isValidPhone === "function"
        ? AuthValidators.isValidPhone(fallbackWhatsappPhone)
        : !!fallbackWhatsappPhone;

    return {
        phones: normalizedPhones,
        primary_phone: primaryPhone,
        whatsapp_phone: whatsappPhone || (primaryPhone ? primaryPhone : (fallbackWhatsappValid ? fallbackWhatsappPhone : "")),
        phone: primaryPhone || (user?.phone || ""),
        business_whatsapp: businessWhatsappPhone || (fallbackWhatsappValid ? fallbackWhatsappPhone : (user?.business_whatsapp || "")),
        phone_link: primaryPhone ? `tel:${primaryPhone}` : ""
    };
}

export function normalizeSessionUser(user) {
    if (!user) return null;

    if (window.UserService && typeof window.UserService.normalizeUser === "function") {
        return window.UserService.normalizeUser(user);
    }

    const normalizedUser = { ...user };
    const parsedSettings = {};
    const normalizedPhones = normalizeSessionPhones(normalizedUser);
    normalizedUser.user_image = normalizedUser.user_image || null;
    normalizedUser.business_name = normalizedUser.business_name || "";
    normalizedUser.business_category = normalizedUser.business_category || "";
    normalizedUser.business_bio = normalizedUser.business_bio || "";
    normalizedUser.phones = normalizedPhones.phones;
    normalizedUser.primary_phone = normalizedPhones.primary_phone;
    normalizedUser.whatsapp_phone = normalizedPhones.whatsapp_phone;
    normalizedUser.phone = normalizedPhones.phone;
    normalizedUser.business_whatsapp = normalizedPhones.business_whatsapp;
    normalizedUser.phone_link = normalizedPhones.phone_link;
    normalizedUser.isDelivered = parsedSettings.isDelivered !== undefined
        ? parsedSettings.isDelivered
        : (normalizedUser.isDelivered !== undefined ? normalizedUser.isDelivered : 0);
    return normalizedUser;
}

export async function touchLastLoginOncePerDay(user) {
    try {
        if (!user || !user.user_key || user.user_key === "guest_user") return;

        const storageKey = `${SESSION_LOGIN_TOUCH_DAY_PREFIX}${user.user_key}`;
        const today = getTodayUtcKey();
        if (LocalDBStorage.getItem(storageKey) === today) return;

        let result = null;
        if (typeof window.touchUserLastLogin === "function") {
            result = await window.touchUserLastLogin(user.user_key);
        } else if (typeof window.apiFetch === "function") {
            result = await window.apiFetch('/api/users', {
                method: 'POST',
                body: { action: 'touch_login', user_key: user.user_key },
            });
        } else {
            const endpoint = (typeof window.baseURL === "string" && window.baseURL) ? `${window.baseURL}/api/users` : "/api/users";
            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "touch_login", user_key: user.user_key })
            });
            result = unwrapSessionApiPayload(await response.json());
        }

        if (!result || result.error || result.success === false) return;

        const refreshedSession = {
            ...window.userSession,
            last_login_at: result.last_login_at || nowIso()
        };
        window.userSession = refreshedSession;
        window.UserService?.save?.(refreshedSession);
        LocalDBStorage.setItem(storageKey, today);
    } catch (error) {
        console.error("[SessionManager] Failed to touch last_login_at:", error);
    }
}

// Hybrid bridge
window.getTodayUtcKey = getTodayUtcKey;
window.nowIso = nowIso;
window.unwrapSessionApiPayload = unwrapSessionApiPayload;
window.normalizeSessionPhones = normalizeSessionPhones;
window.normalizeSessionUser = normalizeSessionUser;
window.touchLastLoginOncePerDay = touchLastLoginOncePerDay;

console.log("[ESM Load] session-manager-core.js: Hybrid bridge established.");
