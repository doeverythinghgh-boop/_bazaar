/**
 * @file pages/merchant-portfolio/js/pharmacy-control-panel/pharmacy-localization.js
 * @description محرك الترجمة الخاص بموديولات الصيدلية
 *
 * ⚠️ WARNING: DO NOT USE :hover OR tooltip/title attributes in this module.
 * This interface is optimized for touch/hybrid devices where hover states are unreliable.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


function pharmacyL(key) {
    // 1. Try global translation system first (centralized)
    if (typeof window.langu === 'function') {
        const globalValue = window.langu('pharmacy_ctrl_' + key);
        if (globalValue && globalValue !== 'pharmacy_ctrl_' + key) {
            return globalValue;
        }

        // Try direct key if prefixed failed
        const directValue = window.langu(key);
        if (directValue && directValue !== key) {
            return directValue;
        }
    }

    // 2. Fallback to returning the key itself if no translation found
    return key;
}

window.pharmacyL = pharmacyL;
