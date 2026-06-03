/**
 * @file js/tools-text.js
 * @description Text and digit normalization utilities.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


/**
 * @description Converts Hindi digits (0-9) to English digits (0-9) in a string.
 */
function normalizeDigits(str) {
    if (!str) return "";
    const easternArabicNumerals = /[\u0660-\u0669]/g;
    return str.replace(easternArabicNumerals, (d) => d.charCodeAt(0) - 0x0660);
}

/**
 * @description Sanitizes and normalizes Arabic text.
 */
function normalizeArabicText(text) {
    if (!text) return "";
    text = text.replace(/[\u064B-\u0652]/g, "");
    text = text.replace(/[آأإ]/g, "ا");
    text = text.replace(/ة/g, "ه");
    text = text.replace(/[ى]/g, "ي");
    text = text.replace(/ـ+/g, "");
    text = text.replace(/\s+/g, " ").trim();
    return text;
}

/**
 * @description Parses the user_image field.
 */
function normalizeProfileImageValue(value) {
    if (value === null || value === undefined) return null;
    const normalized = String(value).trim();
    if (!normalized || /^(null|undefined|none|nan)$/i.test(normalized)) return null;
    return normalized;
}

function parseProfileImages(imageField) {
    if (!imageField) return { avatar: null, cover: null, covers: [] };

    // 1. If already an object (e.g. normalized by UserService)
    if (typeof imageField === 'object' && !Array.isArray(imageField)) {
        const avatar = normalizeProfileImageValue(imageField.avatar);
        const cover = normalizeProfileImageValue(imageField.cover);
        const covers = Array.isArray(imageField.covers)
            ? imageField.covers.map(normalizeProfileImageValue).filter(Boolean)
            : (cover ? [cover] : []);

        return {
            avatar,
            cover,
            covers
        };
    }

    try {
        // 2. If it's a JSON string
        if (typeof imageField === 'string' && imageField.trim().startsWith('{')) {
            const parsed = JSON.parse(imageField);
            const avatar = normalizeProfileImageValue(parsed.avatar);
            const cover = normalizeProfileImageValue(parsed.cover);
            const covers = Array.isArray(parsed.covers)
                ? parsed.covers.map(normalizeProfileImageValue).filter(Boolean)
                : (cover ? [cover] : []);

            return {
                avatar,
                cover,
                covers
            };
        }
        // 3. Fallback for simple string (legacy avatar-only field)
        return { avatar: normalizeProfileImageValue(imageField), cover: null, covers: [] };
    } catch (e) {
        console.warn("[Profile] Failed to parse images JSON:", e);
        return { avatar: normalizeProfileImageValue(imageField), cover: null, covers: [] };
    }
}

/**
 * @description Generates a unique 6-character alphanumeric serial.
 */
function generateSerial() {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let serial = "";
    for (let i = 0; i < 6; i++) {
        serial += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return serial;
}
