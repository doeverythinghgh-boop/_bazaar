/**
 * @file pages/register/js/locations/locations-state.js
 * @description State helpers for locations (active/primary/new-draft flags).
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

  window.RegisterLocationsState = window.RegisterLocationsState || {};
  const api = window.RegisterLocationsState;

  function max() {
    return window.RegisterLocationsShared?.MAX || 20;
  }

  api.ensureState = function ensureState() {
    if (!Array.isArray(window.registerLocations)) window.registerLocations = [];

    if (!window.registerDraftNewLocation && !window.registerActiveLocationId && window.registerLocations.length > 0) {
      const primary = window.UserLocationsClient
        ? window.UserLocationsClient.getPrimary(window.registerLocations)
        : (window.registerLocations[0] || null);
      window.registerActiveLocationId = primary?.id || window.registerLocations[0]?.id || "";
    }
  };

  api.normalizeState = function normalizeState() {
    api.ensureState();
    const out = window.UserLocationsClient
      ? window.UserLocationsClient.normalizeLocations(window.registerLocations, { max: max() })
      : (Array.isArray(window.registerLocations) ? window.registerLocations.slice(0, max()) : []);
    window.registerLocations = out;
    return out;
  };

  api.getActiveLocation = function getActiveLocation(list = api.normalizeState()) {
    api.ensureState();
    if (!list.length) return null;
    const byActive = list.find((loc) => loc.id === window.registerActiveLocationId);
    if (byActive) return byActive;
    const primary = window.UserLocationsClient ? window.UserLocationsClient.getPrimary(list) : list[0];
    return primary || list[0] || null;
  };
})();

