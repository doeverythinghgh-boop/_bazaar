/**
 * @file pages/register/js/draft-manager/snapshot-apply.js
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

    window.DraftManagerInternals.applySnapshotFields = function(snapshot) {
        const fields = snapshot?.fields || {};
        const fieldCount = Object.keys(fields).length;
        console.log(` [Data Mirror] Restoring Basic Fields (${fieldCount} fields) using Element IDs...`);

        Object.entries(fields).forEach(([id, value]) => {
            const element = document.getElementById(id);
            const displayVal = (typeof value === 'boolean') ? (value ? 'true' : 'false') : (value ? `"${value}"` : '(Empty)');

            if (!element) {
                console.log(` ↳ Field ID [${id}]: ${displayVal} -> (Element Not Found in DOM)`);
                return;
            }

            if (element.type === 'checkbox' || element.type === 'radio') {
                element.checked = !!value;
            } else {
                if (id === 'register_username' && window.DraftManagerInternals.looksLikePhoneAutofill(value)) {
                    element.value = '';
                    console.log(` ↳ Field ID [${id}]: ${displayVal} -> ️ (Sanitized Autofill Phone) -> (Applied)`);
                    return;
                }
                element.value = value ?? '';
            }

            console.log(` ↳ Field ID [${id}]: ${displayVal} -> (Element Found & Applied)`);
            window.DraftManagerInternals.syncRestoredFieldState(id, value, element);
        });
    };

    window.DraftManagerInternals.applyStateFallbackFields = function() {
        if (!window.RegisterState) return;
        const state = window.RegisterState.getFullState?.();
        const fields = state?.fields || {};

        const fallbackMap = {
            username: "register_username",
            businessName: "register_business_name",
            businessTagline: "register_business_tagline",
            address: "register_address",
            location: "register_coords",
            categories: "register_business_category_json",
            register_discount_percent: "register_discount_percent"
        };

        Object.entries(fallbackMap).forEach(([stateKey, domId]) => {
            const element = document.getElementById(domId);
            const value = fields[stateKey]?.value;
            if (!element || element.value || value == null || value === "") return;
            element.value = typeof value === "string" ? value : JSON.stringify(value);
            window.DraftManagerInternals.syncRestoredFieldState(domId, element.value, element);
        });
    };
})();
