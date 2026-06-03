/**
 * @file pages/merchant-portfolio/js/portfolio-persistence.js
 * @description Robust LocalDBStorage-based persistence layer with TTL and merchant scoping.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


window.portfolioPersistence = (function () {
    const PREFIX = 'pp_';
    const DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    /**
     * Creates a unique key for an entry.
     */
    function createKey(userKey, type, params = '', offset = 0) {
        const cleanParams = String(params).replace(/[^a-z0-9]/gi, '_').toLowerCase();
        return `${PREFIX}${userKey}_${type}_${cleanParams}_${offset}`;
    }

    /**
     * Saves data to LocalDBStorage with a timestamp.
     */
    function save(userKey, type, params, offset, data) {
        try {
            const key = createKey(userKey, type, params, offset);
            const entry = {
                timestamp: Date.now(),
                data: data
            };
            LocalDBStorage.setItem(key, JSON.stringify(entry));
            console.log(`[Persistence] Saved: ${key}`);
        } catch (e) {
            console.error('[Persistence] Save failed:', e);
            // If quota exceeded, we might want to clear old entries, but autoPurge handles this on load.
        }
    }

    /**
     * Retrieves data from LocalDBStorage if it hasn't expired.
     */
    function get(userKey, type, params, offset) {
        try {
            const key = createKey(userKey, type, params, offset);
            const raw = LocalDBStorage.getItem(key);
            if (!raw) return null;

            const entry = JSON.parse(raw);
            const age = Date.now() - entry.timestamp;

            if (age > DEFAULT_TTL) {
                console.log(`[Persistence] Expired: ${key} (Age: ${Math.round(age / 3600000)}h)`);
                LocalDBStorage.removeItem(key);
                return null;
            }

            console.log(`[Persistence] Cache Hit: ${key}`);
            return entry.data;
        } catch (e) {
            console.error('[Persistence] Get failed:', e);
            return null;
        }
    }

    /**
     * Clears all cached data for a specific merchant.
     */
    function clearMerchant(userKey) {
        try {
            const searchPrefix = `${PREFIX}${userKey}_`;
            const keysToRemove = [];
            for (let i = 0; i < LocalDBStorage.length; i++) {
                const key = LocalDBStorage.key(i);
                if (key && key.startsWith(searchPrefix)) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(k => LocalDBStorage.removeItem(k));
            console.log(`[Persistence] Cleared all data for merchant: ${userKey}`);
        } catch (e) {
            console.error('[Persistence] Clear failed:', e);
        }
    }

    /**
     * Removes all expired entries from LocalDBStorage.
     */
    function autoPurge() {
        try {
            const keysToRemove = [];
            for (let i = 0; i < LocalDBStorage.length; i++) {
                const key = LocalDBStorage.key(i);
                if (key && key.startsWith(PREFIX)) {
                    const raw = LocalDBStorage.getItem(key);
                    if (raw) {
                        const entry = JSON.parse(raw);
                        if (Date.now() - entry.timestamp > DEFAULT_TTL) {
                            keysToRemove.push(key);
                        }
                    }
                }
            }
            keysToRemove.forEach(k => LocalDBStorage.removeItem(k));
            if (keysToRemove.length > 0) {
                console.log(`[Persistence] Auto-purged ${keysToRemove.length} expired entries.`);
            }
        } catch (e) {
            console.warn('[Persistence] Auto-purge failed:', e);
        }
    }

    // Run auto-purge immediately on module load
    autoPurge();

    return {
        save,
        get,
        clearMerchant,
        autoPurge
    };
})();
