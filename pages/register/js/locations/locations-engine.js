/**
 * @file pages/register/js/locations/locations-engine.js
 * @description Selection-driven editing engine + autosave + de-dupe coords.
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

  window.RegisterLocationsEngine = window.RegisterLocationsEngine || {};
  const api = window.RegisterLocationsEngine;

  const AUTO_SAVE_DELAY_MS = 550;
  let draftMutationTimer = null;

  function state() {
    return window.RegisterLocationsState;
  }

  function draft() {
    return window.RegisterLocationsDraft;
  }

  function shared() {
    return window.RegisterLocationsShared;
  }

  function syncWizardAfterLocationInput() {
    if (typeof registerCheckCurrentStepVisibility !== "function") return;
    const isTypingAddress = document.activeElement?.id === "register_address";
    registerCheckCurrentStepVisibility({
      preserveReveal: true,
      preserveCurrentStep: isTypingAddress,
      preserveFocusedInput: isTypingAddress,
      skipScroll: isTypingAddress
    });
  }

  api.selectLocationById = function selectLocationById(locationId, { renderAfter = true } = {}) {
    state().ensureState();
    const list = state().normalizeState();
    const selected = list.find((loc) => loc.id === locationId);
    if (!selected) return false;

    window.registerDraftNewLocation = false;
    window.registerActiveLocationId = selected.id;
    window.registerLocations = list.map((entry) => ({ ...entry, is_primary: entry.id === selected.id }));
    draft().setDraft({ coords: selected.coords || "", address: selected.address || "" });

    if (renderAfter) window.RegisterLocationsUI?.render?.();
    if (window.RegisterDraftManager) window.RegisterDraftManager.saveDraft();
    syncWizardAfterLocationInput();
    return true;
  };

  api.commitDraftToActiveLocation = function commitDraftToActiveLocation({ silent = false } = {}) {
    state().ensureState();
    const list = state().normalizeState();
    const active = state().getActiveLocation(list);
    if (!active) return false;

    const { coords, address } = draft().getDraft();
    const hasAny = !!(coords || address);
    const complete = !!(coords && address);
    const error = document.getElementById("reg-locations-error");

    if (!hasAny) {
      if (!silent && error) error.textContent = shared().t("loc_err_enter_before_add", "أدخل موقعًا وعنوانًا قبل الإضافة.");
      return false;
    }
    if (!complete) {
      if (!silent && error) error.textContent = shared().t("loc_err_incomplete_pair", "لا يمكن حفظ موقع بدون عنوان أو العكس.");
      return false;
    }
    if (error) error.textContent = "";

    window.registerLocations = list.map((entry) => (
      entry.id === active.id
        ? { ...entry, coords, address, is_primary: true }
        : { ...entry, is_primary: false }
    ));
    window.registerActiveLocationId = active.id;

    if (window.RegisterDraftManager) window.RegisterDraftManager.saveDraft();
    if (typeof registerCheckCurrentStepVisibility === "function") {
      registerCheckCurrentStepVisibility({ preserveReveal: true, preserveCurrentStep: true, skipScroll: true });
    }
    return true;
  };

  function scheduleDraftAutoSave() {
    if (draftMutationTimer) clearTimeout(draftMutationTimer);
    draftMutationTimer = setTimeout(() => {
      api.commitDraftToActiveLocation({ silent: true });
      window.RegisterLocationsUI?.render?.();
    }, AUTO_SAVE_DELAY_MS);
  }

  api.createNewLocationDraft = function createNewLocationDraft() {
    state().ensureState();
    if (window.registerLocations.length >= (shared().MAX || 20)) return false;
    window.registerDraftNewLocation = true;
    window.registerActiveLocationId = "";
    draft().setDraft({ coords: "", address: "" });
    const error = document.getElementById("reg-locations-error");
    if (error) error.textContent = "";
    if (window.RegisterDraftManager) window.RegisterDraftManager.saveDraft();
    return true;
  };

  api.handleDraftMutation = function handleDraftMutation() {
    const list = state().normalizeState();
    const d = draft().getDraft();
    const complete = !!(d.coords && d.address);

    // ✅ Fix: Allow the first location to be added automatically if the list is empty,
    // even if the user didn't explicitly click "Add New Location".
    if (window.registerDraftNewLocation || list.length === 0) {
      if (!complete) {
        // Even if not complete, we must trigger validation so the UI can show the address field
        syncWizardAfterLocationInput();
        window.RegisterLocationsUI?.render?.();
        return;
      }

      const existingByCoords = list.find((entry) => String(entry.coords || "").trim() === String(d.coords || "").trim());
      if (existingByCoords) {
        window.registerLocations = list.map((entry) => (
          entry.id === existingByCoords.id
            ? { ...entry, coords: d.coords, address: d.address }
            : entry
        ));
        window.registerDraftNewLocation = false;
        window.registerActiveLocationId = existingByCoords.id;
        api.selectLocationById(existingByCoords.id, { renderAfter: false });
      } else {
        if (list.length >= (shared().MAX || 20)) return;
        const id = window.UserLocationsClient ? window.UserLocationsClient.randomId("loc") : `loc_${Date.now()}`;
        const is_primary = list.length === 0;
        window.registerLocations = [...list, { id, coords: d.coords, address: d.address, is_primary }];
        window.registerDraftNewLocation = false;
        window.registerActiveLocationId = id;
        api.selectLocationById(id, { renderAfter: false });
      }

      if (window.RegisterDraftManager) window.RegisterDraftManager.saveDraft();

      if (window.REGISTER_DEBUG) {
        console.log(` [Reg-Locations] Auto-adding/updating location: ${d.coords} | ${d.address}`);
      }

      syncWizardAfterLocationInput();
      window.RegisterLocationsUI?.render?.();
      return;
    }

    // Update existing active location
    if (!list.length) return;
    if (!window.registerActiveLocationId) {
      const primary = window.UserLocationsClient ? window.UserLocationsClient.getPrimary(list) : (list[0] || null);
      window.registerActiveLocationId = primary?.id || list[0]?.id || "";
    }
    scheduleDraftAutoSave();
    syncWizardAfterLocationInput();
  };

})();

