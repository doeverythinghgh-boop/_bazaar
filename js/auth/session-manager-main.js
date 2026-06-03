/**
 * @file js/auth/session-manager-main.js
 * @description Public SessionManager API.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

// Dependency locator for session core functions (bridged via window for now)
const getCore = () => ({
    normalizeSessionUser: window.normalizeSessionUser,
    touchLastLoginOncePerDay: window.touchLastLoginOncePerDay,
    getTodayUtcKey: window.getTodayUtcKey,
    nowIso: window.nowIso
});

let sessionManagerSyncBound = false;

function sessionManagerIsAndroidRuntime() {
    return !!window.Android ||
        (window.BridgeManager && typeof window.BridgeManager.isAndroid === "function" && window.BridgeManager.isAndroid()) ||
        window.location?.hostname === "appassets.androidplatform.net";
}

export function sessionManagerRefreshUiBindings() {
    if (typeof window.setUserNameInIndexBar === 'function' && document.getElementById("index-login-text")) {
        window.setUserNameInIndexBar();
    }
}

export function sessionManagerSyncPortfolioCache(user) {
    if (!user?.user_key) return;

    const cacheKey = `portfolio_cache_${user.user_key}`;
    try {
        const rawCache = LocalDBSession.getItem(cacheKey);
        if (!rawCache) return;

        const parsed = JSON.parse(rawCache);
        LocalDBSession.setItem(cacheKey, JSON.stringify({
            ...parsed,
            user: {
                ...(parsed?.user || {}),
                ...user,
            },
            timestamp: Date.now(),
        }));
    } catch (error) {
        console.warn("[SessionManager] Failed to sync portfolio cache:", error);
    }
}

export function sessionManagerApplyMemorySession(user, reason = "sync") {
    const { normalizeSessionUser } = getCore();
    const normalizedUser = user ? normalizeSessionUser(user) : null;
    const hasChanged = window.UserService?.deepEqual
        ? !window.UserService.deepEqual(normalizedUser, window.userSession)
        : JSON.stringify(normalizedUser) !== JSON.stringify(window.userSession);
    const freshness = window.UserService?.compareUserFreshness
        ? window.UserService.compareUserFreshness(window.userSession, normalizedUser)
        : 1;

    if (normalizedUser && freshness < 0) {
        console.warn("[SessionManager] Ignored stale session payload during sync.");
        return window.userSession;
    }

    window.userSession = normalizedUser;

    if (normalizedUser) {
        sessionManagerSyncPortfolioCache(normalizedUser);
    }
    sessionManagerRefreshUiBindings();

    if (hasChanged) {
        window.UserService?.dispatchSessionChange?.(normalizedUser, {
            reason,
            source: "session-manager",
        });
    }

    return normalizedUser;
}

export function bindSessionManagerSync() {
    const { normalizeSessionUser } = getCore();
    if (sessionManagerSyncBound || typeof window === "undefined") return;
    sessionManagerSyncBound = true;

    window.addEventListener("storage", (event) => {
        if (event.key && event.key !== "loggedInUser") return;
        const nextUser = window.UserService?.get ? window.UserService.get() : null;
        sessionManagerApplyMemorySession(nextUser, "storage-sync");
    });

    window.addEventListener(window.UserService?.events?.sessionChanged || "user-session-changed", (event) => {
        const nextUser = event?.detail?.user !== undefined
            ? event.detail.user
            : (window.UserService?.get ? window.UserService.get() : null);
        const normalizedUser = nextUser ? normalizeSessionUser(nextUser) : null;
        const hasChanged = window.UserService?.deepEqual
            ? !window.UserService.deepEqual(normalizedUser, window.userSession)
            : JSON.stringify(normalizedUser) !== JSON.stringify(window.userSession);
        const freshness = window.UserService?.compareUserFreshness
            ? window.UserService.compareUserFreshness(window.userSession, normalizedUser)
            : 1;

        if (!hasChanged || (normalizedUser && freshness < 0)) return;

        window.userSession = normalizedUser;
        if (normalizedUser) {
            sessionManagerSyncPortfolioCache(normalizedUser);
        }
        sessionManagerRefreshUiBindings();
    });
}

export const SessionManager = {
    init: () => {
        const { normalizeSessionUser, touchLastLoginOncePerDay } = getCore();
        try {
            bindSessionManagerSync();
            const storedUser = window.UserService?.get
                ? window.UserService.get()
                : (() => {
                    const raw = LocalDBStorage.getItem("loggedInUser");
                    return raw ? normalizeSessionUser(JSON.parse(raw)) : null;
                })();

            window.userSession = storedUser ? normalizeSessionUser(storedUser) : null;

            if (window.userSession && window.UserService?.save) {
                window.UserService.save(window.userSession);
            }

            sessionManagerRefreshUiBindings();

            if (window.userSession && window.userSession.user_key) {
                console.log(`[SessionManager] Done user: ${window.userSession.user_key}`);
                touchLastLoginOncePerDay(window.userSession);
                const notificationsEnabled = LocalDBStorage.getItem('notifications_enabled') !== 'false';
                const notificationsUserDisabled = LocalDBStorage.getItem('notifications_user_disabled') === 'true';
                const shouldRepairAndroidToken = sessionManagerIsAndroidRuntime() && !notificationsUserDisabled;
                if (window.userSession.user_key !== "guest_user" && typeof window.syncCurrentUserNotificationState === 'function') {
                    window.syncCurrentUserNotificationState().catch((error) => {
                        console.error("[SessionManager] Failed to sync notification state on init:", error);
                    });
                }
                if (window.userSession.user_key !== "guest_user" && typeof window.setupFCM === 'function' && (notificationsEnabled || shouldRepairAndroidToken)) {
                    console.log("[SessionManager] Processing setupFCM Starting App...");
                    window.setupFCM();
                } else if (!notificationsEnabled) {
                    console.log("[SessionManager] notification user – initializing.");
                }
                if (typeof window.checkImpersonationMode === 'function') window.checkImpersonationMode();
            }
        } catch (e) {
            console.error("[SessionManager] Error initializing session:", e);
            window.userSession = null;
        }
    },

    login: async (user, redirect = true) => {
        const { normalizeSessionUser, getTodayUtcKey } = getCore();
        if (!user) return;
        user = normalizeSessionUser(user);

        window.userSession = user;
        window.UserService?.save?.(user);
        sessionManagerSyncPortfolioCache(user);
        if (user.user_key && user.user_key !== "guest_user") {
            LocalDBStorage.setItem(`last_login_touch_day_${user.user_key}`, getTodayUtcKey());
        }

        sessionManagerRefreshUiBindings();

        const isGuestUser = user.user_key === "guest_user";

        if (!isGuestUser && typeof window.askForNotificationPermission === 'function') {
            console.log("[SessionManager] Processing order notification...");
            await window.askForNotificationPermission();
        }
        if (!isGuestUser && typeof window.setupFCM === 'function') {
            console.log("[SessionManager] Processing setupFCM initializing notification...");
            await window.setupFCM();
            if (typeof window.syncCurrentUserNotificationState === 'function') {
                await window.syncCurrentUserNotificationState();
            }
        }
        if (typeof window.checkImpersonationMode === 'function') {
            window.checkImpersonationMode();
        }

        if (redirect) {
            window.location.href = "/pages/home/home.html";
        }
    },

    logout: async () => {
        const userKey = window.userSession?.user_key;

        if (window.BridgeManager && typeof window.BridgeManager.invoke === 'function') {
            window.BridgeManager.invoke('onUserLoggedOut', userKey || '');
        }

        if (userKey && typeof window.deleteTokenFromServer === 'function') {
            await window.deleteTokenFromServer(userKey);
        }

        LocalDBStorage.removeItem("android_fcm_key");
        LocalDBStorage.removeItem("fcm_token");

        const currentLang = LocalDBStorage.getItem("app_language");
        const currentTheme = LocalDBStorage.getItem("theme");

        if (typeof window.clearAllBrowserData === 'function') {
            await window.clearAllBrowserData();
        } else {
            LocalDBStorage.clear();
            LocalDBSession.clear();
        }

        if (currentLang) LocalDBStorage.setItem("app_language", currentLang);
        if (currentTheme) LocalDBStorage.setItem("theme", currentTheme);

        const containerIds = [
            "index-home-container",
            "index-productAdd-container", "index-productEdit-container",
            "index-cardPackage-container", "index-myProducts-container",
            "index-contact-container",
            "index-salesMovement-container", "index-orderPhoto-container"
        ];
        containerIds.forEach((id) => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = "";
        });

        const salesModal = document.getElementById('salesMovement_orderModal');
        if (salesModal) {
            salesModal.remove();
        }

        const stepperIframe = document.getElementById('salesMovement_stepperIframe');
        if (stepperIframe) {
            stepperIframe.src = '';
            stepperIframe.remove();
        }

        window.userSession = null;
        sessionManagerRefreshUiBindings();
        if (typeof window.checkImpersonationMode === 'function') window.checkImpersonationMode();

        window.location.href = "/pages/login/login.html";
    },

    updateUser: (updates) => {
        const { normalizeSessionUser } = getCore();
        if (!window.userSession) return;
        const updatedUser = window.UserService?.mergeUser
            ? window.UserService.mergeUser(window.userSession, updates)
            : normalizeSessionUser({ ...window.userSession, ...updates });
        window.userSession = updatedUser;
        window.UserService?.save?.(updatedUser);
        sessionManagerSyncPortfolioCache(updatedUser);
        sessionManagerRefreshUiBindings();
    },

    replaceUser: (user) => {
        const { normalizeSessionUser } = getCore();
        if (!user) return null;
        const normalizedUser = normalizeSessionUser(user);
        const freshness = window.UserService?.compareUserFreshness
            ? window.UserService.compareUserFreshness(window.userSession, normalizedUser)
            : 1;
        if (window.userSession && freshness < 0) {
            console.warn("[SessionManager] Ignored stale replaceUser payload.");
            return window.userSession;
        }
        window.userSession = normalizedUser;
        window.UserService?.save?.(normalizedUser);
        sessionManagerSyncPortfolioCache(normalizedUser);
        sessionManagerRefreshUiBindings();
        return normalizedUser;
    },

    isGuest: () => {
        return window.userSession?.user_key === "guest_user";
    },

    getUser: () => {
        return window.userSession;
    },

    impersonate: async (targetUser) => {
        try {
            const currentSession = window.UserService?.get
                ? window.UserService.get()
                : null;
            const existingOriginal = window.UserService?.getOriginalSession
                ? window.UserService.getOriginalSession()
                : null;
            const originalAdminSession = existingOriginal || currentSession;

            if (!originalAdminSession) throw new Error("No active session to save as admin.");

            if (typeof window.clearAllBrowserData === 'function') {
                await window.clearAllBrowserData();
            } else {
                LocalDBStorage.clear();
                LocalDBSession.clear();
            }

            window.UserService?.saveOriginalSession?.(originalAdminSession);

            const newUserSession = {
                ...targetUser,
                is_guest: false,
                user_key: targetUser.user_key,
                username: targetUser.username,
                phone: targetUser.phone
            };

            window.UserService?.save?.(newUserSession);
            window.location.href = 'index.html';
        } catch (error) {
            console.error("[SessionManager] Impersonation failed:", error);
            throw error;
        }
    },

    stopImpersonation: async () => {
    },

    isImpersonating: () => {
        return window.UserService?.getOriginalSession
            ? !!window.UserService.getOriginalSession()
            : !!LocalDBStorage.getItem("originalAdminSession");
    }
};

// Hybrid bridge
window.sessionManagerRefreshUiBindings = sessionManagerRefreshUiBindings;
window.sessionManagerSyncPortfolioCache = sessionManagerSyncPortfolioCache;
window.sessionManagerApplyMemorySession = sessionManagerApplyMemorySession;
window.bindSessionManagerSync = bindSessionManagerSync;
window.SessionManager = SessionManager;

export default SessionManager;

console.log("[ESM Load] session-manager-main.js: Hybrid bridge established.");
