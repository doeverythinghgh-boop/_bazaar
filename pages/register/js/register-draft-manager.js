/**
 * @file pages/register/js/register-draft-manager.js
 * @description Public API wrapper for the Draft Manager module.
 * This file delegates to the internal modules in the draft-manager/ folder.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

window.RegisterDraftManager = (function () {
    'use strict';

    return {
        /**
         * Initializes the draft manager.
         */
        init: function(options) {
            if (window.DraftManagerInternals?.init) {
                return window.DraftManagerInternals.init(options);
            }
            console.error("[DraftManager] Lifecycle module not loaded.");
        },

        /**
         * Debounced save of the current draft.
         */
        saveDraft: function() {
            if (window.DraftManagerInternals?.saveDraft) {
                return window.DraftManagerInternals.saveDraft();
            }
        },

        /**
         * Immediate save of the current draft.
         */
        saveNow: function() {
            if (window.DraftManagerInternals?.persistDraftNow) {
                return window.DraftManagerInternals.persistDraftNow();
            }
        },

        /**
         * Immediate restoration of the saved draft.
         */
        restoreNow: function(options) {
            if (window.DraftManagerInternals?.restoreSavedDraft) {
                return window.DraftManagerInternals.restoreSavedDraft(options);
            }
        },

        /**
         * Clears the current draft from LocalDBStorage.
         */
        clearDraft: function() {
            if (window.DraftManagerInternals?.clearDraft) {
                return window.DraftManagerInternals.clearDraft();
            }
        }
    };
})();
