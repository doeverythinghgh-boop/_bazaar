/**
 * @file pages/register/js/register-locations-manager.js
 * @description Compatibility wrapper that exposes window.registerLocationsApi.
 *
 * Important: This project uses classic global scripts, not ES modules.
 * The actual implementation lives under pages/register/js/locations/*.js
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


(function () {
  "use strict";

  function requireGlobal(name) {
    if (!window[name]) {
      console.error(`[LocationsManager] Missing dependency: ${name}. Check script order in HTML.`);
      return false;
    }
    return true;
  }

  const ok =
    requireGlobal("RegisterLocationsShared")
    && requireGlobal("RegisterLocationsState")
    && requireGlobal("RegisterLocationsDraft")
    && requireGlobal("RegisterLocationsEngine")
    && requireGlobal("RegisterLocationsUI");

  if (!ok) return;

  // Public API used by validators and submit helpers (kept stable)
  window.registerLocationsApi = {
    render: window.RegisterLocationsUI.render,
    bindUiOnce: window.RegisterLocationsUI.bindUiOnce,
    // legacy compatibility
    upsertFromDraft: function () {
      // Backward-compatible behavior: attempt to save current draft.
      // - If in "new location draft" mode, it will add/update based on coords de-dupe.
      // - Otherwise it will auto-save to active location if draft is complete.
      if (window.registerDraftNewLocation) {
        window.RegisterLocationsEngine.handleDraftMutation();
        return true;
      }
      return !!window.RegisterLocationsEngine.commitDraftToActiveLocation({ silent: false });
    },
    cancelEdit: function () {
      // Legacy no-op (we no longer use edit/cancel modes)
      window.registerDraftNewLocation = false;
      return;
    },
    // modern API
    selectLocationById: window.RegisterLocationsEngine.selectLocationById,
    handleDraftMutation: window.RegisterLocationsEngine.handleDraftMutation,
    // existing consumers rely on these
    getNormalizedLocationsForSettings: function () {
      const list = window.RegisterLocationsState.normalizeState();
      const draft = window.RegisterLocationsDraft.getDraft();
      const hasDraft = !!(draft.coords || draft.address);
      const draftComplete = !!(draft.coords && draft.address);
      let combined = list.slice();
      if (combined.length === 0 && hasDraft && draftComplete) {
        combined = [{
          id: window.UserLocationsClient ? window.UserLocationsClient.randomId("loc") : `loc_${Date.now()}`,
          coords: draft.coords,
          address: draft.address,
          is_primary: true
        }];
      }
      return window.UserLocationsClient
        ? window.UserLocationsClient.normalizeLocations(combined, { max: window.RegisterLocationsShared.MAX || 20 })
        : combined.slice(0, window.RegisterLocationsShared.MAX || 20);
    },
    getPrimaryLegacyFromState: function () {
      const locations = window.registerLocationsApi.getNormalizedLocationsForSettings();
      const primary = window.UserLocationsClient ? window.UserLocationsClient.getPrimary(locations) : (locations[0] || null);
      return { location: primary?.coords || "", address: primary?.address || "" };
    },
    validateLocationsForCurrentRole: function ({ silent = false } = {}) {
      const mandatory = (typeof registerHasBusinessRole === "function") ? !!registerHasBusinessRole() : false;
      const locations = window.registerLocationsApi.getNormalizedLocationsForSettings();
      const d = window.RegisterLocationsDraft.getDraft();
      const hasDraft = !!(d.coords || d.address);
      const draftComplete = !!(d.coords && d.address);
      const error = document.getElementById("reg-locations-error");

      const hasAtLeastOne = locations.length > 0;
      const primary = window.UserLocationsClient ? window.UserLocationsClient.getPrimary(locations) : (locations[0] || null);
      const primaryComplete = window.UserLocationsClient ? window.UserLocationsClient.isComplete(primary) : !!(primary?.coords && primary?.address);

      const isValid = (function() {
        const result = (function() {
          if (!mandatory) {
            if (hasDraft && !draftComplete) return false;
            return true;
          }

          if (!hasAtLeastOne && (!hasDraft || !draftComplete)) return false;
          if (hasAtLeastOne && !primaryComplete) return false;
          if (hasDraft && !draftComplete) return false;
          return true;
        })();

        if (window.REGISTER_DEBUG) {
           console.log(` [Reg-Locations] Validation Logic: Mandatory(${mandatory}) | Total(${locations.length}) | HasDraft(${hasDraft}) | DraftComplete(${draftComplete}) | PrimaryComplete(${primaryComplete}) => Result: ${result}`);
        }
        return result;
      })();

      if (window.RegisterState) {
        const locVal = hasDraft ? d.coords : (primary?.coords || "");
        const addrVal = hasDraft ? d.address : (primary?.address || "");

        const isLocValid = !!locVal;
        const isAddrValid = !!addrVal;

        window.RegisterState.updateField("location", locVal, isLocValid ? "valid" : "invalid", "");
        window.RegisterState.updateField("address", addrVal, isAddrValid ? "valid" : "invalid", "");
        window.RegisterState.updateField("locationAddress", locVal, isValid ? "valid" : "invalid", "");
        window.RegisterState.setStepStatus("location", isValid, isValid);
      }

      if (!isValid) {
        if (!silent && error) {
          if (!mandatory && hasDraft && !draftComplete) error.textContent = window.RegisterLocationsShared.t("loc_err_buyer_half_filled", "لو هتكتب عنوان لازم تحدد موقع (والعكس).");
          else if (!hasAtLeastOne && (!hasDraft || !draftComplete)) error.textContent = window.RegisterLocationsShared.t("loc_err_business_required_one", "يرجى إضافة موقع واحد على الأقل (موقع + عنوان).");
          else if (hasAtLeastOne && !primaryComplete) error.textContent = window.RegisterLocationsShared.t("loc_err_primary_incomplete", "يرجى التأكد أن الموقع الأساسي يحتوي على موقع وعنوان.");
          else if (hasDraft && !draftComplete) error.textContent = window.RegisterLocationsShared.t("loc_err_draft_incomplete", "لا يمكن ترك إدخال غير مكتمل (موقع بدون عنوان أو العكس).");
        }
        return false;
      }

      if (!silent && error) error.textContent = "";
      return true;
    }

  };

  // keep old behavior: rerender on roles change
  window.addEventListener("change", (e) => {
    if (e.target && e.target.classList && e.target.classList.contains("role-checkbox")) {
      window.registerLocationsApi.render();
    }
  });
})();

