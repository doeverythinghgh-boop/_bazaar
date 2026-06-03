/**
 * @file js/network.js
 * @description Manages network connection state in the application and provides a central function for making API requests.
 *   Includes mechanisms for periodic connection checking, displaying offline notifications, and caching connection state.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


/* ----------------------------------------
    🟦 Connection State Cache
---------------------------------------- */
/**
 * @description Timestamp of the last internet connection check.
 * @type {number}
 */
var lastConnectionCheck = typeof lastConnectionCheck !== 'undefined' ? lastConnectionCheck : 0;
/**
 * @description Cached internet connection state.
 * @type {boolean}
 */
var isConnectedCache = typeof isConnectedCache !== 'undefined' ? isConnectedCache : true; // Assume online by default to avoid flash of warning
/**
 * @description Reference to the "Swal" (SweetAlert) object for offline notification, to enable closing it.
 * @type {object|null}
 */
var offlineToast = typeof offlineToast !== 'undefined' ? offlineToast : null;
/**
 * @description Interval (in milliseconds) between periodic internet connection checks.
 * @type {number}
 * @const
 */
var CONNECTION_CHECK_INTERVAL = 30000; // Increase to 30 seconds to reduce noise

/* ----------------------------------------
    🟦 Function used from anywhere
---------------------------------------- */
/**
 * @description Returns the cached internet connection state.
 * @function checkInternetConnection
 * @returns {boolean} - `true` if there is an internet connection, otherwise `false`.
 * @async
 * @see isConnectedCache
 */
async function checkInternetConnection() {
  return isConnectedCache;
}

/* ----------------------------------------
    🟦 Fixed Snackbar on connection loss
---------------------------------------- */
/**
 * @description Performs an actual internet connection check by attempting to fetch a resource from `gstatic.com`.
 *   Updates the cached connection state (`isConnectedCache`) and shows or hides the offline notification (`offlineToast`) as needed.
 * @function performActualConnectionCheck
 * @returns {Promise<boolean>} - Promise returning `true` if connection is available, otherwise `false`.
 * @async
 * @throws {Error} - If `navigator.onLine` is false or the fetch request fails.
 * @see isConnectedCache
 * @see offlineToast
 * @see lastConnectionCheck
 */
async function performActualConnectionCheck() {
  lastConnectionCheck = Date.now();

  const checkEndpoint = async (url, timeoutMs = 2000) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const cacheBuster = `?cb=${Date.now()}`;
      await fetch(url + cacheBuster, {
        method: "GET",
        mode: "no-cors",
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timeout);
      return true;
    } catch (e) {
      clearTimeout(timeout);
      return false;
    }
  };

  try {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        throw new Error("Navigator reports offline");
    }

    // Run probes in parallel with 2s timeout
    const results = await Promise.all([
      checkEndpoint("https://www.gstatic.com/generate_204", 2000),
      checkEndpoint(window.location.origin + "/favicon.ico", 2000)
    ]);

    const isUp = results.some(res => res === true);

    if (!isUp) throw new Error("Probes failed");

    // 🔹 Connection restored
    if (!isConnectedCache) {
      console.log(`[Network] Connection restored`);
    }

    isConnectedCache = true;

    // 🔹 Close Snackbar if visible
    if (offlineToast) {
      Swal.close();
      offlineToast = null;
    }

    return true;

  } catch (error) {
    // Only show warning if we are actually sure it's down
    isConnectedCache = false;

    // 🔹 Show fixed Snackbar *only once*
    if (!offlineToast) {
      offlineToast = Swal.fire({
        toast: true,
        position: 'bottom',
        html: `
    <div style="display: grid; align-items:center;justify-items: center;margin:0;padding:0;">
      <i class="fas fa-wifi-slash" style=""></i>
      <span style="font-size:14px;">${langu('net_weak_or_disconnected')}</span>
    </div>
  `,
        showConfirmButton: false,
        background: '#979797d9',
        color: 'white',
        padding: 0,
        width: 300,
        timer: undefined,
        timerProgressBar: false,
      });
    }

    return false;
  }
}

/* ----------------------------------------
    🟦 Periodic Check
---------------------------------------- */
/**
 * @description Starts periodic internet connection checking and sets up event handlers for browser connection state changes.
 * @function startPeriodicConnectionCheck
 * @returns {void}
 * @see performActualConnectionCheck
 * @see CONNECTION_CHECK_INTERVAL
 * @see isConnectedCache
 * @see offlineToast
 */
var isPeriodicCheckStarted = typeof isPeriodicCheckStarted !== 'undefined' ? isPeriodicCheckStarted : false;

function startPeriodicConnectionCheck() {
  if (isPeriodicCheckStarted) return;
  isPeriodicCheckStarted = true;

  // Correction: Removed the initial page-load check (was firing after 2.5s on every page).
  // The periodic check (every 30s) and online/offline events are sufficient.
  setInterval(performActualConnectionCheck, CONNECTION_CHECK_INTERVAL);

  window.addEventListener("online", () => {
    isConnectedCache = true;
    if (offlineToast) Swal.close();
    offlineToast = null;
    performActualConnectionCheck();
  });

  window.addEventListener("offline", () => {
    isConnectedCache = false;
    performActualConnectionCheck();
  });
}

/* ----------------------------------------
    🟦 Start
---------------------------------------- */
startPeriodicConnectionCheck();


/* ----------------------------------------
    🟦 In-Memory API Cache & Stale-While-Revalidate
---------------------------------------- */
window.apiFetchCache = window.apiFetchCache || new Map();

/**
 * Helper to deep clone cached response payloads to prevent reference mutations.
 */
function apiFetchClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch (e) {
    return obj;
  }
}

/**
 * Asynchronously revalidates stale cache records in the background.
 */
async function apiFetchBackground(url, fetchOptions, cacheKey) {
  try {
    const response = await fetch(url, fetchOptions);
    if (!response.ok) return;

    const data = await response.json();
    const isEnvelope = !!(
      data &&
      typeof data === 'object' &&
      Object.prototype.hasOwnProperty.call(data, 'success') &&
      Object.prototype.hasOwnProperty.call(data, 'data') &&
      Object.prototype.hasOwnProperty.call(data, 'error')
    );

    let resolvedData = data;
    if (isEnvelope) {
      if (data.success === false) return;
      resolvedData = data.data;
    }

    window.apiFetchCache.set(cacheKey, {
      data: resolvedData,
      timestamp: Date.now()
    });
    console.log(`[Network Cache] Background revalidation successful for: ${cacheKey}`);
  } catch (err) {
    console.warn(`[Network Cache] Background revalidation failed for: ${cacheKey}`, err);
  }
}

/**
 * @description Central function for making API requests.
 *   Wraps `fetch` logic, error handling, and JSON conversion.
 * @function apiFetch
 * @param {string} endpoint - API endpoint path (e.g., '/users').
 * @param {object} [options={}] - `fetch` request options, including `method`, `body`, `headers`, and `specialHandlers`.
 * @param {string} [options.method='GET'] - HTTP request method (GET, POST, PUT, DELETE).
 * @param {object|null} [options.body=null] - Data to send with request, converted to JSON.
 * @param {object} [options.headers={}] - HTTP request headers.
 * @param {object} [options.specialHandlers={}] - Object containing functions to handle specific HTTP response statuses (like 401, 404).
 * @returns {Promise<Object>} - Promise containing server response data as JSON object, or error object on failure.
 * @async
 * @throws {Error} - If the fetch request fails or the server responds with a non-OK status.
 * @see baseURL
 */
async function apiFetch(endpoint, options = {}) {
  const { method = 'GET', body = null, specialHandlers = {}, ...restOptions } = options;
  const normalizedMethod = method.toUpperCase();
  const endpointPath = (() => {
    try {
      return new URL(endpoint, window.location.origin).pathname;
    } catch (_) {
      return String(endpoint || "");
    }
  })();

  if (window.ApiClientRouter && typeof window.ApiClientRouter.handleApiFetch === "function") {
    if (normalizedMethod !== "GET" && window.apiFetchCache.size > 0) {
      console.log(`[Network Cache] Client mutation detected (${normalizedMethod} ${endpoint}). Clearing cache...`);
      window.apiFetchCache.clear();
    }

    const cacheKey = `${normalizedMethod}:client-api:${endpoint}`;
    const isCacheable = normalizedMethod === "GET" && !options.bypassCache && options.cache !== "no-store";
    if (isCacheable) {
      const cached = window.apiFetchCache.get(cacheKey);
      const now = Date.now();
      if (cached && now - cached.timestamp < 10000) {
        console.log(`[Network Cache] Fresh client API hit for ${cacheKey}.`);
        return apiFetchClone(cached.data);
      }
    }

    console.log(`[API Fetch] ${method} ${endpoint} intercepted via ApiClientRouter`, body ? { payload: body } : "");
    const result = await window.ApiClientRouter.handleApiFetch(endpoint, {
      ...restOptions,
      method,
      body,
      specialHandlers,
    });

    if (isCacheable && !(result && result.error)) {
      window.apiFetchCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });
    }
    return result;
  }

  const isFirestoreIdentityEndpoint = endpointPath === "/api/users" || endpointPath === "/api/tokens";

  if (isFirestoreIdentityEndpoint && window.FirestoreIdentityApi && typeof window.FirestoreIdentityApi.handleApiFetch === "function") {
    if (normalizedMethod !== "GET" && window.apiFetchCache.size > 0) {
      console.log(`[Network Cache] Firestore identity mutation detected (${normalizedMethod} ${endpoint}). Clearing cache...`);
      window.apiFetchCache.clear();
    }

    const identityCacheKey = `${normalizedMethod}:firestore-identity:${endpoint}`;
    const isIdentityCacheable = normalizedMethod === "GET" && !options.bypassCache && options.cache !== "no-store";
    if (isIdentityCacheable) {
      const cached = window.apiFetchCache.get(identityCacheKey);
      const now = Date.now();
      if (cached && now - cached.timestamp < 10000) {
        console.log(`[Network Cache] Fresh Firestore identity hit for ${identityCacheKey}.`);
        return apiFetchClone(cached.data);
      }
    }

    console.log(`[API Fetch] ${method} ${endpoint} routed to Firestore identity`, body ? { payload: body } : "");
    const result = await window.FirestoreIdentityApi.handleApiFetch(endpoint, {
      ...restOptions,
      method,
      body,
      specialHandlers,
    });
    if (isIdentityCacheable && !(result && result.error)) {
      window.apiFetchCache.set(identityCacheKey, {
        data: result,
        timestamp: Date.now()
      });
    }
    return result;
  }

  const url = `${baseURL}${endpoint}`;

  const fetchOptions = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...restOptions.headers,
    },
    ...restOptions,
  };

  if (body) {
    fetchOptions.body = JSON.stringify(body);
  }

  // Cache Invalidation on Mutation: Clear cache if a modifying request is sent
  if (normalizedMethod !== 'GET') {
    if (window.apiFetchCache.size > 0) {
      console.log(`[Network Cache] Mutation detected (${normalizedMethod} ${endpoint}). Clearing cache to guarantee consistency...`);
      window.apiFetchCache.clear();
    }
  }

  // Check if we should cache this GET request
  const isCacheable = normalizedMethod === 'GET' && !options.bypassCache && options.cache !== 'no-store';

  if (isCacheable) {
    const cacheKey = `${normalizedMethod}:${url}`;
    const cached = window.apiFetchCache.get(cacheKey);
    const now = Date.now();

    if (cached) {
      const age = now - cached.timestamp;
      
      // 1. Fresh Cache Hit (within 10 seconds) -> Return immediately
      if (age < 10000) {
        console.log(`[Network Cache] Fresh Hit for ${cacheKey} (${(age / 1000).toFixed(1)}s old). Returning from cache instantly.`);
        return apiFetchClone(cached.data);
      }

      // 2. Stale Cache Hit (between 10 seconds and 5 minutes) -> Return stale value, fetch fresh in background
      if (age < 300000) {
        console.log(`[Network Cache] Stale Hit for ${cacheKey} (${(age / 1000).toFixed(0)}s old). Returning stale instantly and launching background fetch...`);
        apiFetchBackground(url, fetchOptions, cacheKey);
        return apiFetchClone(cached.data);
      }

      // 3. Expired Cache (over 5 minutes) -> Proceed to block and fetch
      console.log(`[Network Cache] Expired Cache for ${cacheKey} (${(age / 1000).toFixed(0)}s old). Proceeding with blocking fetch.`);
    } else {
      console.log(`[Network Cache] Miss for ${cacheKey}. Proceeding with blocking fetch.`);
    }
  }

  console.log(`[API Fetch] ${method} ${endpoint}`, body ? { payload: body } : '');

  // Define AbortController and timeout only for actual network request
  const timeoutMs = options.timeoutMs || 30000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.warn(`[Network] Request to ${endpoint} timed out after ${timeoutMs}ms. Aborting...`);
    controller.abort();
  }, timeoutMs);

  fetchOptions.signal = controller.signal;

  try {
    const response = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);

    if (specialHandlers[response.status]) {
      return specialHandlers[response.status]();
    }

    const data = await response.json();

    const isEnvelope = !!(
      data &&
      typeof data === 'object' &&
      Object.prototype.hasOwnProperty.call(data, 'success') &&
      Object.prototype.hasOwnProperty.call(data, 'data') &&
      Object.prototype.hasOwnProperty.call(data, 'error')
    );

    let finalData = data;

    if (isEnvelope) {
      if (!response.ok || data.success === false) {
        return {
          error: data?.error?.message || `${langu('api_http_error')} ${response.status}`,
          code: data?.error?.code || null,
          details: data?.error?.details || null,
        };
      }
      finalData = data.data;
    } else {
      if (!response.ok) {
        return { error: data.error || `${langu('api_http_error')} ${response.status}` };
      }
    }

    // Populate Cache on successful fetch
    if (isCacheable) {
      const cacheKey = `${normalizedMethod}:${url}`;
      window.apiFetchCache.set(cacheKey, {
        data: finalData,
        timestamp: Date.now()
      });
      console.log(`[Network Cache] Populate Cache for ${cacheKey}`);
    }

    return finalData;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.error(`[Network] Request to ${endpoint} failed: Request timed out after ${timeoutMs}ms.`);
      return { error: `${langu('api_connection_failed')} Request timed out.` };
    }
    console.error(`[Network] Request to ${endpoint} failed:`, error);
    return { error: `${langu('api_connection_failed')} ${error.message}` };
  }
}
