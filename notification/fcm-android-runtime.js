/**
 * @file notification/fcm-android-runtime.js
 * @description Android-only FCM helpers: bridge readiness, native permission repair, token flush, watchdog.
 */

let androidNotificationWatchdogStarted = false;
let androidNotificationWatchdogTimer = null;

export function isAndroidRuntime() {
    return !!window.Android ||
        (window.BridgeManager && typeof window.BridgeManager.isAndroid === 'function' && window.BridgeManager.isAndroid()) ||
        window.location?.hostname === 'appassets.androidplatform.net';
}

export function isIndexRoute() {
    const path = window.location.pathname || '';
    return path === '/' || /(^|\/)index\.html$/.test(path);
}

export function getNativeNotificationReadinessReport() {
    if (!isAndroidRuntime()) return null;
    try {
        if (window.BridgeManager && typeof window.BridgeManager.invokeForResult === 'function') {
            const raw = window.BridgeManager.invokeForResult('getNotificationReadinessReport');
            return raw ? JSON.parse(raw) : null;
        }
    } catch (error) {
        console.error('[FCM Android Runtime] Failed to read native readiness report:', error);
    }
    return null;
}

export function logNativeNotificationRootCause(stage, report) {
    if (!isAndroidRuntime() || !report) return;
    const issues = Array.isArray(report.issues) ? report.issues.join(',') : '';
    const alertIssues = Array.isArray(report.alertIssues) ? report.alertIssues.join(',') : '';
    console.log(
        `[NOTIFICATION_ROOT_CAUSE][AndroidRuntime:${stage}] ok=${report.ok === true} receiveReady=${report.receiveReady === true} alertReady=${report.alertReady !== false} notificationsEnabled=${report.notificationsEnabled === true} postNotificationsGranted=${report.postNotificationsGranted === true} channelId=${report.channelId || ''} channelReady=${report.channelReady === true} channelImportance=${report.channelImportance ?? 'n/a'} channelSound=${report.channelSound || 'null'} channelShouldVibrate=${report.channelShouldVibrate === true} issues=${issues || 'none'} alertIssues=${alertIssues || 'none'} reason=${report.diagnosticReason || 'No native diagnostic reason.'}`
    );
}

export function isNativeNotificationReceiveReady() {
    if (!isAndroidRuntime()) return true;
    const report = getNativeNotificationReadinessReport();
    logNativeNotificationRootCause('receive-check', report);
    return report ? (report.receiveReady === true || report.ok === true) : false;
}

export async function ensureAndroidBridgeReady(reason = 'fcm_android_setup') {
    if (!isAndroidRuntime() || !window.BridgeManager || typeof window.BridgeManager.signalReady !== 'function') {
        return;
    }
    if (isIndexRoute()) {
        console.log('[FCM Android Runtime] Bridge ready signal deferred on index route.');
        return;
    }
    window.BridgeManager.signalReady(reason);
    await new Promise((resolve) => setTimeout(resolve, 200));
}

export async function waitForNativeNotificationReady(timeoutMs = 15000, intervalMs = 400) {
    const startedAt = Date.now();
    let lastReport = null;
    while (Date.now() - startedAt < timeoutMs) {
        lastReport = getNativeNotificationReadinessReport();
        if (lastReport?.ok === true || lastReport?.receiveReady === true) {
            return lastReport;
        }
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
    logNativeNotificationRootCause('wait-timeout', lastReport);
    return lastReport;
}

export async function flushPendingAndroidFcmTokenToServer(userKey) {
    if (!userKey || userKey === 'guest_user') return false;
    if (LocalDBStorage.getItem('notifications_user_disabled') === 'true') return false;

    const token = LocalDBStorage.getItem('android_fcm_key');
    if (!token || typeof window.sendTokenToServer !== 'function') {
        return false;
    }

    const saved = await window.sendTokenToServer(userKey, token, 'android');
    if (saved && isNativeNotificationReceiveReady()) {
        LocalDBStorage.removeItem('notifications_user_disabled');
        LocalDBStorage.setItem('notifications_enabled', 'true');
        return true;
    }
    if (saved) {
        console.warn('[FCM Android Runtime] Token saved but native receive path is not ready.');
        LocalDBStorage.setItem('notifications_enabled', 'false');
    }
    return !!saved;
}

export async function requestNativeNotificationSetup(userKey) {
    if (!isAndroidRuntime() || !window.BridgeManager || typeof window.BridgeManager.invoke !== 'function') {
        return null;
    }
    if (LocalDBStorage.getItem('notifications_user_disabled') === 'true') {
        console.log('[FCM Android Runtime] Native notification setup skipped because user disabled notifications.');
        return null;
    }

    await ensureAndroidBridgeReady('native_notification_setup');

    if (userKey && userKey !== 'guest_user') {
        window.BridgeManager.invoke('onUserLoggedIn', userKey);
    }

    let report = getNativeNotificationReadinessReport();
    if (report?.ok === true) {
        return report;
    }

    console.log('[FCM Android Runtime] Requesting native permission and channel setup...');
    window.BridgeManager.invoke('onNotificationsEnabled');
    return waitForNativeNotificationReady();
}

export async function repairAndroidNotificationState(userKeyOverride) {
    if (!isAndroidRuntime()) return false;

    const userKey = userKeyOverride || window.userSession?.user_key;
    if (!userKey || userKey === 'guest_user') return false;
    if (LocalDBStorage.getItem('notifications_user_disabled') === 'true') return false;

    console.log('[FCM Android Runtime] Starting Android notification repair cycle...');
    await requestNativeNotificationSetup(userKey);

    if (await flushPendingAndroidFcmTokenToServer(userKey)) {
        console.log('[FCM Android Runtime] Android token repair completed successfully.');
        window.refreshSettingsNotificationState?.();
        return true;
    }

    if (typeof window.setupFCM === 'function' && await window.setupFCM()) {
        console.log('[FCM Android Runtime] Android notification repair completed via setupFCM.');
        window.refreshSettingsNotificationState?.();
        return true;
    }

    console.warn('[FCM Android Runtime] Android notification repair did not complete successfully.');
    return false;
}

async function runAndroidNotificationWatchdogTick() {
    if (!isAndroidRuntime() || document.visibilityState === 'hidden') return;

    const userKey = window.userSession?.user_key;
    if (!userKey || userKey === 'guest_user') return;
    if (LocalDBStorage.getItem('notifications_user_disabled') === 'true') return;

    if (!LocalDBStorage.getItem('android_fcm_key')) {
        console.log('[FCM Android Runtime] Watchdog: missing local Android token. Running repair...');
        await repairAndroidNotificationState(userKey);
        return;
    }

    if (typeof window.getCurrentUserNotificationState !== 'function') return;

    const state = await window.getCurrentUserNotificationState();
    if (!state.matchedServerToken || !state.hasServerToken) {
        console.log('[FCM Android Runtime] Watchdog: token mismatch detected. Re-syncing to server...');
        await flushPendingAndroidFcmTokenToServer(userKey);
    }

    if (state.isAndroid && state.nativeReport && state.nativeReport.receiveReady === false) {
        console.log('[FCM Android Runtime] Watchdog: native receive path not ready. Requesting setup...');
        await requestNativeNotificationSetup(userKey);
    }
}

export function startAndroidNotificationWatchdog() {
    if (!isAndroidRuntime() || androidNotificationWatchdogStarted) return;

    androidNotificationWatchdogStarted = true;
    console.log('[FCM Android Runtime] Android notification watchdog started.');

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            runAndroidNotificationWatchdogTick().catch((error) => {
                console.error('[FCM Android Runtime] Watchdog visibility tick failed:', error);
            });
        }
    });

    androidNotificationWatchdogTimer = window.setInterval(() => {
        runAndroidNotificationWatchdogTick().catch((error) => {
            console.error('[FCM Android Runtime] Watchdog interval tick failed:', error);
        });
    }, 180000);

    window.setTimeout(() => {
        runAndroidNotificationWatchdogTick().catch((error) => {
            console.error('[FCM Android Runtime] Watchdog initial tick failed:', error);
        });
    }, 5000);
}

export async function ensureBridgeReadyForP2PSend() {
    if (!isAndroidRuntime()) return true;
    await ensureAndroidBridgeReady('p2p_send');
    return true;
}

window.isAndroidRuntime = isAndroidRuntime;
window.ensureAndroidBridgeReady = ensureAndroidBridgeReady;
window.getNativeNotificationReadinessReport = getNativeNotificationReadinessReport;
window.waitForNativeNotificationReady = waitForNativeNotificationReady;
window.flushPendingAndroidFcmTokenToServer = flushPendingAndroidFcmTokenToServer;
window.requestNativeNotificationSetup = requestNativeNotificationSetup;
window.repairAndroidNotificationState = repairAndroidNotificationState;
window.startAndroidNotificationWatchdog = startAndroidNotificationWatchdog;
window.ensureBridgeReadyForP2PSend = ensureBridgeReadyForP2PSend;

console.log('[ESM Load] fcm-android-runtime.js: Hybrid bridge established.');
