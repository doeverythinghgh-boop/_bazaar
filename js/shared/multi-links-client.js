/**
 * @file js/shared/multi-links-client.js
 * @description Client-side helpers for multi-value social links (max 3 per type).
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


(() => {
  const MAX_PER_TYPE = 3;
  const BLOCKED_SCHEMES = ["javascript:", "data:", "vbscript:"];

  function toArray(value) {
    if (Array.isArray(value)) return value;
    if (value == null) return [];
    const s = String(value).trim();
    if (!s || s.toLowerCase() === "null" || s.toLowerCase() === "undefined") return [];
    return [s];
  }

  function normalizeUrl(value) {
    const s = String(value || "")
      .replace(/[\u0000-\u001f\u007f]/g, "")
      .trim();
    if (!s) return "";
    if (/\s/.test(s)) return "";

    const lower = s.toLowerCase();
    if (BLOCKED_SCHEMES.some((scheme) => lower.startsWith(scheme))) {
      return "";
    }

    const hasAllowedProtocol = /^(https?:)\/\//i.test(s);
    const looksLikeBareUrl = /^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}(?:[/:?#].*)?$/i.test(s);
    if (!hasAllowedProtocol && !looksLikeBareUrl) {
      return "";
    }

    return s;
  }

  function isSafeUrl(value) {
    return !!normalizeUrl(value);
  }

  function normalizeLinksObject(rawLinks) {
    let obj = {};
    try {
      obj = typeof rawLinks === "string" ? JSON.parse(rawLinks || "{}") : (rawLinks || {});
    } catch (_) {
      obj = {};
    }
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) obj = {};

    const keys = ["facebook", "instagram", "tiktok", "telegram", "x", "website"];
    const out = {};
    keys.forEach((k) => {
      const list = toArray(obj[k]).map(normalizeUrl).filter(Boolean).slice(0, MAX_PER_TYPE);
      out[k] = list;
    });
    return out;
  }

  function compactLinksForStorage(normalized) {
    const out = {};
    Object.entries(normalized || {}).forEach(([k, list]) => {
      const clean = toArray(list).map(normalizeUrl).filter(Boolean).slice(0, MAX_PER_TYPE);
      if (!clean.length) return;
      out[k] = clean.length === 1 ? clean[0] : clean;
    });
    return out;
  }

  function validateLinksObject(rawLinks) {
    let obj = {};
    try {
      obj = typeof rawLinks === "string" ? JSON.parse(rawLinks || "{}") : (rawLinks || {});
    } catch (_) {
      obj = {};
    }
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) obj = {};

    const normalized = normalizeLinksObject(obj);
    const keys = ["facebook", "instagram", "tiktok", "telegram", "x", "website"];
    const invalid = {};

    keys.forEach((key) => {
      const list = toArray(obj[key]).slice(0, MAX_PER_TYPE);
      list.forEach((item, index) => {
        const rawValue = String(item || "").trim();
        if (!rawValue) return;
        if (!isSafeUrl(rawValue)) {
          if (!Array.isArray(invalid[key])) invalid[key] = [];
          invalid[key].push(index);
        }
      });
    });

    return {
      isValid: Object.keys(invalid).length === 0,
      normalized,
      invalid,
    };
  }

  function getFirstLink(value) {
    const list = toArray(value).map(normalizeUrl).filter(Boolean);
    return list[0] || "";
  }

  window.MultiLinksClient = {
    MAX_PER_TYPE,
    toArray,
    isSafeUrl,
    normalizeUrl,
    normalizeLinksObject,
    validateLinksObject,
    compactLinksForStorage,
    getFirstLink,
  };
})();

