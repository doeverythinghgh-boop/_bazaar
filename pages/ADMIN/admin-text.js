/**
 * @file pages/ADMIN/admin-text.js
 * @description Shared translation helpers for Admin pages.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


function adminResolveText(key, fallback) {
    const value = typeof window.langu === "function" ? window.langu(key) : null;
    return (!value || value === key) ? fallback : value;
}

function adminApiText(key, fallback) {
    return adminResolveText(key, fallback);
}

function adminUiText(key, fallback) {
    return adminResolveText(key, fallback);
}

function adminSearchText(key, fallback) {
    return adminResolveText(key, fallback);
}

function adminAdsText(key, fallback) {
    return adminResolveText(key, fallback);
}

function adminActionText(key, fallback) {
    return adminResolveText(key, fallback);
}

function adminInitText(key, fallback) {
    return adminResolveText(key, fallback);
}

function adminRelationsText(key, fallback) {
    return adminResolveText(key, fallback);
}

function adminPendingText(key, fallback) {
    return adminResolveText(key, fallback);
}

function adminUnwrapPayload(payload) {
    if (
        payload &&
        typeof payload === "object" &&
        Object.prototype.hasOwnProperty.call(payload, "success") &&
        Object.prototype.hasOwnProperty.call(payload, "data") &&
        Object.prototype.hasOwnProperty.call(payload, "error")
    ) {
        if (payload.success === false) {
            throw new Error(payload?.error?.message || "API request failed");
        }
        return payload.data;
    }

    return payload;
}
