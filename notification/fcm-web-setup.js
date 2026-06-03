/**
 * @file notification/fcm-web-setup.js
 * @description Web-specific FCM registration and initialization.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

export function ensureClassicScriptLoaded(src) {
    const absoluteSrc = new URL(src, window.location.href).href;
    const existingScript = document.querySelector(`script[data-runtime-src="${absoluteSrc}"]`);

    if (existingScript) {
        if (existingScript.dataset.loaded === "true") return Promise.resolve();
        return new Promise((resolve, reject) => {
            existingScript.addEventListener("load", () => resolve(), { once: true });
            existingScript.addEventListener("error", () => reject(new Error(`Script load failed: ${absoluteSrc}`)), { once: true });
        });
    }

    return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = absoluteSrc;
        script.async = false;
        script.dataset.runtimeSrc = absoluteSrc;
        script.onload = () => {
            script.dataset.loaded = "true";
            resolve();
        };
        script.onerror = () => reject(new Error(`Script load failed: ${absoluteSrc}`));
        document.head.appendChild(script);
    });
}

function isNativeAndroidRuntime() {
    if (window.BridgeManager && typeof window.BridgeManager.isAndroid === "function" && window.BridgeManager.isAndroid()) {
        return true;
    }

    const host = window.location && window.location.hostname;
    return !!window.Android ||
        host === "appassets.androidplatform.net";
}

export async function registerServiceWorker() {
    // Skip SW registration for Native Android App or if disabled in behavior
    if (isNativeAndroidRuntime()) {
        console.log("[SW] Skipping registration for Mobile/Native environment.");
        return false;
    }

    if (window.AppBehavior && window.AppBehavior.enablePWA === false) return false;
    if (!("serviceWorker" in navigator)) return false;
    try {
        console.log("[SW] Registering...");
        const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        const registration = await navigator.serviceWorker.ready;

        if (!registration.active) {
            await new Promise((resolve) => {
                const onStateChange = () => { if (registration.active) resolve(); };
                if (registration.installing) registration.installing.addEventListener('statechange', onStateChange);
                else if (registration.waiting) registration.waiting.addEventListener('statechange', onStateChange);
                else resolve();
            });
        }
        return registration;
    } catch (err) {
        console.error("[SW] Registration failed:", err);
        return false;
    }
}

export async function setupFirebaseWeb(userId) {
    if (isNativeAndroidRuntime()) {
        console.log("[FCM Web] Native Android runtime detected. Web FCM setup delegated to Android.");
        return false;
    }

    if (window.AppBehavior && window.AppBehavior.enablePWA === false) return false;
    console.log("[Dev] Web FCM Setup...");
    try {
        const swReg = await registerServiceWorker();
        if (!swReg) throw new Error("SW registration failed");

        if (!window.firebase || !window.firebase.firestore) {
            await ensureClassicScriptLoaded("/assets/libs/firebase/firebase-app-8.10.1.js");
            await ensureClassicScriptLoaded("/assets/libs/firebase/firebase-messaging-8.10.1.js");
            await ensureClassicScriptLoaded("/assets/libs/firebase/firebase-firestore-8.10.1.js");
        }

        const firebase = window.firebase;
        if (!firebase) throw new Error("Firebase load failed");

        const firebaseRuntime = typeof window.getBazaarFirebaseConfig === 'function'
            ? window.getBazaarFirebaseConfig()
            : {};
        const firebaseConfig = firebaseRuntime.webConfig;
        if (!firebaseConfig) throw new Error("Missing Firebase web configuration");

        if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
        const messaging = firebase.messaging();

        try { messaging.useServiceWorker(swReg); } catch (e) { }

        const currentPermission = Notification.permission;
        if (currentPermission === "denied") {
            if (typeof window.Swal !== 'undefined' && !isNativeAndroidRuntime()) {
                window.Swal.fire({ title: 'Notifications Disabled', icon: 'warning', confirmButtonText: 'OK' });
            }
            return;
        }
        if (currentPermission === "default") return;

        const VAPID_KEY = firebaseRuntime.vapidKey;
        if (!VAPID_KEY) throw new Error("Missing Firebase VAPID key");
        try {
            const currentToken = await messaging.getToken({ vapidKey: VAPID_KEY, serviceWorkerRegistration: swReg });
            if (currentToken) {
                LocalDBStorage.setItem("fcm_token", currentToken);
                if (userId) {
                    const saved = await window.sendTokenToServer?.(userId, currentToken, "web");
                    LocalDBStorage.setItem('notifications_enabled', saved ? 'true' : 'false');
                }
                messaging.onMessage((payload) => {
                    const { title, body } = payload.notification || payload.data || {};
                    if (title || body) {
                        if (typeof window.addNotificationLog === 'function') {
                            const defaultSenderName = window.app_language === 'ar' ? 'بازار السويس' : 'Suez Bazaar';
                            window.addNotificationLog({
                                messageId: payload.messageId || `fg_${Date.now()}`,
                                type: 'received',
                                title: title,
                                body: body,
                                timestamp: new Date(),
                                status: 'unread',
                                relatedUser: { key: 'system', name: defaultSenderName },
                                payload: payload.data
                            });
                        }
                    }
                });
            }
        } catch (tokenErr) { console.error("Token error:", tokenErr); }
    } catch (err) { console.error("Setup error:", err); throw err; }
}

export async function ensureFirestoreDb() {
    try {
        if (!window.firebase || !window.firebase.firestore) {
            console.log("[Dev] Dynamic loading of Firebase Firestore libraries...");
            await ensureClassicScriptLoaded("/assets/libs/firebase/firebase-app-8.10.1.js");
            await ensureClassicScriptLoaded("/assets/libs/firebase/firebase-firestore-8.10.1.js");
        }

        const firebase = window.firebase;
        if (!firebase) throw new Error("Firebase load failed");

        const firebaseRuntime = typeof window.getBazaarFirebaseConfig === 'function'
            ? window.getBazaarFirebaseConfig()
            : {};
        const firebaseConfig = firebaseRuntime.webConfig;
        if (!firebaseConfig) throw new Error("Missing Firebase web configuration");

        if (!firebase.apps.length) {
            console.log("[Dev] Initializing Firebase App...");
            firebase.initializeApp(firebaseConfig);
        }

        return firebase.firestore();
    } catch (err) {
        console.error("ensureFirestoreDb failed:", err);
        throw err;
    }
}

// Hybrid bridge
window.setupFirebaseWeb = setupFirebaseWeb;
window.registerServiceWorker = registerServiceWorker;
window.ensureFirestoreDb = ensureFirestoreDb;

console.log("[ESM Load] fcm-web-setup.js: Hybrid bridge established.");
