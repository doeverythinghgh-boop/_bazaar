/**
 * @file pages/register/js/locations/locations-draft.js
 * @description Draft IO + map iframe synchronization (coords-driven only).
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

  window.RegisterLocationsDraft = window.RegisterLocationsDraft || {};
  const api = window.RegisterLocationsDraft;

  let lastRenderedMapCoords = null;

  api.getDraft = function getDraft() {
    const els = window.RegisterLocationsShared?.getEls?.() || {};
    const savedCoords = window.RegisterLocationsShared?.getSavedCoordsFallback?.() || "";
    const coords = window.UserLocationsClient
      ? window.UserLocationsClient.normalizeCoords(els.coordsInput?.value || savedCoords)
      : String(els.coordsInput?.value || savedCoords).trim();
    const address = window.UserLocationsClient
      ? window.UserLocationsClient.normalizeAddress(els.address?.value || "")
      : String(els.address?.value || "").trim();
    return { coords, address };
  };

  api.setDraft = function setDraft({ coords, address }) {
    const els = window.RegisterLocationsShared?.getEls?.() || {};
    const cleanCoords = (coords || "").trim();
    const cleanAddress = (address || "").trim();

    if (els.coordsInput && els.coordsInput.value !== cleanCoords) {
      els.coordsInput.value = cleanCoords;
    }

    // Only update address if not focused to prevent cursor jumping while typing
    if (els.address && document.activeElement !== els.address && els.address.value !== cleanAddress) {
      els.address.value = cleanAddress;
    }

    // Map: update only when coords change (never on address typing)
    if (els.mapIframe) {
      const normalizedCoords = (cleanCoords && cleanCoords.includes(",")) ? cleanCoords : "";
      const shouldUpdateMap = normalizedCoords !== (lastRenderedMapCoords || "");
      if (shouldUpdateMap) {
        lastRenderedMapCoords = normalizedCoords;
        const timestamp = Date.now();
        if (normalizedCoords) {
          const [lat, lng] = normalizedCoords.split(",").map((c) => c.trim());
          els.mapIframe.src = `/location/LOCATION.html?embedded=true&hideSave=true&lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}&v=${timestamp}`;
        } else {
          els.mapIframe.src = `/location/LOCATION.html?embedded=true&hideSave=true&v=${timestamp}`;
        }
      }
    }
  };
})();

