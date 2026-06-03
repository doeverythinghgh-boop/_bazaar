/**
 * @file js/shared/user-locations-client.js
 * @description Client-side helpers for storing multiple user locations inside settings.locations.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


(() => {
  const MAX_LOCATIONS = 20;

  function normalizeCoords(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";
    return raw.replace(/\s+/g, " ").replace(/\s*,\s*/g, ", ").trim();
  }

  function normalizeAddress(value) {
    return String(value || "").trim();
  }

  function safeParseSettings(raw) {
    if (!raw) return {};
    if (typeof raw === "object") return raw && !Array.isArray(raw) ? raw : {};
    try {
      return JSON.parse(raw);
    } catch (_) {
      return {};
    }
  }

  function randomId(prefix = "loc") {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function normalizeLocations(list, { max = MAX_LOCATIONS } = {}) {
    const src = Array.isArray(list) ? list : [];
    const out = [];

    for (const item of src) {
      if (!item || typeof item !== "object") continue;
      const coords = normalizeCoords(item.coords);
      const address = normalizeAddress(item.address);
      const is_primary = item.is_primary === true;
      const id = String(item.id || "").trim() || randomId();
      if (!coords && !address) continue;
      out.push({ id, coords, address, is_primary });
      if (out.length >= max) break;
    }

    if (out.length) {
      const idx = out.findIndex((l) => l.is_primary);
      if (idx < 0) out[0].is_primary = true;
      else out.forEach((l, i) => (l.is_primary = i === idx));
    }

    return out;
  }

  function deriveFromLegacy(legacyCoords, legacyAddress) {
    const coords = normalizeCoords(legacyCoords);
    const address = normalizeAddress(legacyAddress);
    if (!coords && !address) return [];
    return [{ id: randomId(), coords, address, is_primary: true }];
  }

  function getPrimary(list) {
    const arr = Array.isArray(list) ? list : [];
    return arr.find((l) => l.is_primary) || arr[0] || null;
  }

  function isComplete(loc) {
    return !!(loc && String(loc.coords || "").trim() && String(loc.address || "").trim());
  }

  function mergeIntoSettings(rawSettings, { locations, legacyCoords, legacyAddress }) {
    const settings = safeParseSettings(rawSettings);
    const base = settings.locations && Array.isArray(settings.locations)
      ? settings.locations
      : deriveFromLegacy(legacyCoords, legacyAddress);
    const merged = normalizeLocations(locations ?? base);
    return { settings: { ...settings, locations: merged }, locations: merged, primary: getPrimary(merged) };
  }

  window.UserLocationsClient = {
    MAX_LOCATIONS,
    normalizeCoords,
    normalizeAddress,
    safeParseSettings,
    normalizeLocations,
    deriveFromLegacy,
    getPrimary,
    isComplete,
    mergeIntoSettings,
    randomId,
  };
})();

