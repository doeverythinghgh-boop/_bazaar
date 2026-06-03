/**
 * @file pages/register/js/draft-manager/persistence.js
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

    window.DraftManagerInternals.persistDraftNow = function() {
        if (!window.RegisterState) return;
        const stateData = window.RegisterState.getFullState();
        const payload = {
            version: 2,
            mode: window.regWizard?.mode || 'REGISTER',
            state: stateData,
            snapshot: window.DraftManagerInternals.captureSnapshot()
        };
        try {
            const currentKey = window.DraftManagerInternals.getDraftKey();
            LocalDBStorage.setItem(currentKey, JSON.stringify(payload));
            console.log(`[DraftManager] State persisted for mode: ${payload.mode} to ${currentKey}`);
        } catch (e) {
            console.warn("[DraftManager] Save failed:", e);
        }
    };

    window.DraftManagerInternals.saveDraft = window.DraftManagerInternals.debounce(window.DraftManagerInternals.persistDraftNow, 500);

    window.DraftManagerInternals.loadDraft = function() {
        try {
            const currentKey = window.DraftManagerInternals.getDraftKey();
            const saved = LocalDBStorage.getItem(currentKey);
            if (!saved) return null;

            const parsed = JSON.parse(saved);

            if (!parsed || typeof parsed !== 'object') {
                console.warn("[DraftManager] Malformed draft detected, discarding.");
                window.DraftManagerInternals.clearDraft();
                return null;
            }

            // Backward compatibility
            if (parsed.fields && !parsed.state) {
                return { version: 1, state: parsed, snapshot: null };
            }

            if (!parsed.state) return null;

            return parsed;
        } catch (e) {
            console.error("[DraftManager] Critical parse error:", e);
            window.DraftManagerInternals.clearDraft();
            return null;
        }
    };

    window.DraftManagerInternals.clearDraft = function() {
        const currentKey = window.DraftManagerInternals.getDraftKey();
        LocalDBStorage.removeItem(currentKey);
    };

    window.DraftManagerInternals.sanitizeDraft = function(draft) {
        const snapshotFields = draft?.snapshot?.fields;
        if (snapshotFields && window.DraftManagerInternals.looksLikePhoneAutofill(snapshotFields.register_username)) {
            snapshotFields.register_username = "";
        }

        const stateFields = draft?.state?.fields;
        if (stateFields) {
            ["username", "register_username"].forEach((key) => {
                if (window.DraftManagerInternals.looksLikePhoneAutofill(stateFields[key]?.value)) {
                    stateFields[key].value = "";
                    stateFields[key].state = "idle";
                    stateFields[key].error = "";
                }
            });
        }
    };
})();
