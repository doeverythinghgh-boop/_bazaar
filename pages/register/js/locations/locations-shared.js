/**
 * @file pages/register/js/locations/locations-shared.js
 * @description Shared helpers for locations manager (non-module global scripts).
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

  window.RegisterLocationsShared = window.RegisterLocationsShared || {};

  const api = window.RegisterLocationsShared;

  api.MAX = (window.UserLocationsClient && window.UserLocationsClient.MAX_LOCATIONS) || 20;

  api.t = function t(key, fallback) {
    try {
      const value = typeof window.langu === "function" ? window.langu(key) : "";
      return value && value !== key ? value : fallback;
    } catch (_) {
      return fallback;
    }
  };

  api.getEls = function getEls() {
    return typeof registerGetElements === "function" ? registerGetElements() : {};
  };

  api.getSavedCoordsFallback = function getSavedCoordsFallback() {
    try {
      const raw = LocalDBStorage.getItem("saved_location") || LocalDBStorage.getItem("bidstory_user_saved_location");
      if (!raw) return "";
      const saved = JSON.parse(raw);
      if (saved?.coordinates) return String(saved.coordinates);
      if (saved?.lat && saved?.lng) return `${saved.lat}, ${saved.lng}`;
    } catch (error) {
      console.warn("[Locations] Failed to read saved map coordinates fallback:", error);
    }
    return "";
  };
})();

