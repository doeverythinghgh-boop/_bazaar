/**
 * @file pages/advertisement/js/advertisement-api.js
 * @description API communication module for advertisements.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


/**
 * @description Fetches the latest advertisement update date from the API.
 * @returns {Promise<Object|null>} - Promise containing an object with date (`{ datetime: '...' }`), or `null` on failure.
 * @throws {Error} - If fetching data from API fails.
 */
async function getLatestUpdate() {
    try {
        const data = await apiFetch('/api/updates', {
            specialHandlers: {
                404: () => ({ datetime: null }) // Not a fatal error
            }
        });
        if (!data || data.error) {
            console.warn("[getLatestUpdate] API returned an error or empty data:", data ? data.error : "no response");
            return { datetime: null };
        }
        return data;
    } catch (error) {
        console.error("[getLatestUpdate] Failed:", error);
        return { datetime: null };
    }
}
