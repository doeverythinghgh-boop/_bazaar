/**
 * @file js/tools-system.js
 * @description System-level utilities: storage, data reset, and version management.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


/**
 * @description Clears all locally stored browser data related to the application.
 */
async function clearAllBrowserData() {
    try {
        LocalDBStorage.clear();
    } catch (e) {
        console.warn("Failed to clear LocalDBStorage:", e);
    }

    try {
        LocalDBSession.clear();
    } catch (e) {
        console.warn("Failed to clear LocalDBSession:", e);
    }

    try {
        await window.LocalDB.clearAllData();
        await window.LocalDB.deleteLegacyDatabases();
    } catch (e) {
        console.warn("Failed to clear LocalDB:", e);
    }
    return true;
}

/**
 * @description Performs a comprehensive "Hard Reset" of the application data.
 */
async function appHardReset() {
    console.warn("[HardReset] INITIALIZING NUCLEAR CLEANUP...");

    try {
        if ('BroadcastChannel' in window) {
            try {
                const bc = new BroadcastChannel('suez_bazaar_reset_channel');
                bc.postMessage({ action: 'HARD_RESET_NOW' });
                console.log("[HardReset] Wipe signal sent to other tabs.");
            } catch (e) {
                console.warn("[HardReset] BC signal failed.", e);
            }
        }

        let highestTimeoutId = setTimeout(() => { }, 0);
        for (let i = 0; i < highestTimeoutId; i++) {
            clearTimeout(i);
            clearInterval(i);
        }
        console.log("[HardReset] Background processes killed.");

        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true }).catch(() => null);
                if (stream) {
                    stream.getTracks().forEach(track => {
                        track.stop();
                        console.log(`[HardReset] Media track stopped: ${track.kind}`);
                    });
                }
            } catch (e) { /* ignore */ }
        }

        LocalDBStorage.clear();
        LocalDBSession.clear();
        console.log("[HardReset] Storage cleared.");

        const cookies = document.cookie.split(";");
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i];
            const eqPos = cookie.indexOf("=");
            const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
            document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
            document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + window.location.hostname;
            document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=." + window.location.hostname;
        }
        console.log("[HardReset] Cookies cleared.");

        if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (const registration of registrations) {
                await registration.unregister();
                console.log(`[HardReset] SW unregistered: ${registration.scope}`);
            }
        }

        if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(name => caches.delete(name)));
            console.log("[HardReset] Cache storage cleared.");
        }

        await window.LocalDB.clearAllData();
        await window.LocalDB.deleteLegacyDatabases();
        console.log("[HardReset] LocalDB and legacy databases cleared.");

        if (navigator.storage && navigator.storage.getDirectory) {
            try {
                const root = await navigator.storage.getDirectory();
                for await (const name of root.keys()) {
                    await root.removeEntry(name, { recursive: true });
                }
                console.log("[HardReset] OPFS cleared.");
            } catch (e) {
                console.warn("[HardReset] OPFS wipe failed or empty.", e);
            }
        }

        delete window.userSession;
        delete window.appTranslations;
        delete window.SessionManager;
        delete window.AppHeader;
        console.log("[HardReset] Global memory cleared.");

        if (window.history && window.history.replaceState) {
            window.history.replaceState(null, '', window.location.origin);
            console.log("[HardReset] History state reset.");
        }

        console.log("[HardReset] THE END. Atomic reboot initiated...");
        window.location.replace("/index.html?nuclear_reset=" + Date.now());

    } catch (error) {
        console.error("[HardReset] Critical error during wipe:", error);
        window.location.replace("/index.html?error_reset=true");
    }
}

/**
 * @description Setup Cross-Tab listener for Nuclear Reset.
 */
if ('BroadcastChannel' in window) {
    try {
        const resetChannel = new BroadcastChannel('suez_bazaar_reset_channel');
        resetChannel.onmessage = (event) => {
            if (event.data && event.data.action === 'HARD_RESET_NOW') {
                console.warn("[RemoteReset] Received wipe signal from another tab. Self-destructing...");
                LocalDBStorage.clear();
                LocalDBSession.clear();
                window.location.replace("/index.html?remote_reset=true");
            }
        };
    } catch (e) { /* ignore BC errors */ }
}

/**
 * @description Checks the application version and clears data if mismatch.
 */
async function checkAppVersionAndClearData() {
    if (window.AppBehavior && window.AppBehavior.enablePWA === false) {
        return;
    }
    if (window.Android) {
        console.log('[VersionCheck] Android environment detected. Skipping PWA version management.');
        return;
    }
    const VERSION_STORAGE_KEY = 'app_version';
    try {
        // Use the tiny v.json probe for routine version checks and only reserve
        // version.json for full update manifests on the native side.
        console.log(`[VersionCheck] Fetching v.json...`);
        const response = await fetch(`v.json?t=${Date.now()}`);
        if (!response.ok) {
            console.error(`[VersionCheck] Failed to fetch v.json. Status: ${response.status}`);
            return;
        }

        const data = await response.json();
        const latestVersion = data.version;
        const storedVersion = LocalDBStorage.getItem(VERSION_STORAGE_KEY);

        if (storedVersion === latestVersion) {
            console.log(`[VersionCheck] Versions match. No update needed.`);
        } else {
            console.warn(`[VersionCheck] VERSION MISMATCH! Triggering clean-up.`);
        }

        if (storedVersion && latestVersion !== storedVersion) {
            console.log(`[VersionCheck] New version detected: ${latestVersion} (Old: ${storedVersion}). Performing deep cleanup...`);
            LocalDBSession.clear();

            const cookies = document.cookie.split(";");
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i];
                const eqPos = cookie.indexOf("=");
                const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
                document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
            }

            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (const registration of registrations) {
                    await registration.unregister();
                    console.log(`[VersionCheck] Service Worker unregistered: ${registration.scope}`);
                }
            }

            if (!(window.Android && typeof window.Android === 'object')) {
                LocalDBStorage.removeItem('fcm_token');
                LocalDBStorage.removeItem('notifications_enabled');
            }

            if ('caches' in window) {
                const cacheNames = await caches.keys();
                await Promise.all(cacheNames.map(name => caches.delete(name)));
            }

            LocalDBStorage.setItem(VERSION_STORAGE_KEY, latestVersion);
            window.location.reload(true);
        } else if (!storedVersion) {
            LocalDBStorage.setItem(VERSION_STORAGE_KEY, latestVersion);
        }
        LocalDBStorage.setItem('last_version_check_time', Date.now());
    } catch (error) {
        console.error(`[VersionCheck] Error checking for updates: ${error.message || error}`, error);
    }
}
