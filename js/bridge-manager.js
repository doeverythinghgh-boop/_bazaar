/**
 * @file bridge-manager.js
 * @description Centralized and protected manager for the JavaScript Bridge.
 * Implements security (Function Freezing), auditing (Logging), and environment checks.
 * @version 1.0.0
 */

(function () {
    "use strict";

    // --- 1. Internal Log Helper ---
    function bridgeLog(type, message, data) {
        const timestamp = new Date().toLocaleTimeString();
        const prefix = `[BridgeManager] [${timestamp}]`;
        const logMsg = `${prefix} ${message}`;

        if (window.onNativeLog) {
            window.onNativeLog(type, logMsg + (data ? ": " + JSON.stringify(data) : ""));
        } else {
            if (type === 'error') console.error(logMsg, data || '');
            else if (type === 'warn') console.warn(logMsg, data || '');
            else console.log(logMsg, data || '');
        }
    }

    // --- 2. The Bridge Manager Object ---
    const BridgeManager = {
        /**
         * Checks if the Android bridge is available.
         */
        isAndroid: function () {
            return !!window.Android;
        },

        /**
         * Safely invokes an Android bridge method with logging.
         */
        invoke: function (methodName, ...args) {
            if (!this.isAndroid()) {
                bridgeLog('warn', `Method ${methodName} ignored: Not in Android environment.`);
                return false;
            }

            if (typeof window.Android[methodName] === 'function') {
                try {
                    bridgeLog('info', `Calling Native: ${methodName}`, args);
                    window.Android[methodName](...args);
                    return true;
                } catch (e) {
                    bridgeLog('error', `Failed to call ${methodName}`, e.message);
                    return false;
                }
            } else {
                bridgeLog('error', `Method ${methodName} not found on window.Android`);
                return false;
            }
        },

        /**
         * Signal that the Web App is fully ready.
         */
        signalReady: function () {
            this.invoke('onWebAppReady');
        },

        /**
         * Sync splash slogans to native side.
         */
        syncSplashSlogans: function (slogansJson) {
            if (window.Localization && typeof window.Localization.updateSplashSlogans === 'function') {
                try {
                    bridgeLog('info', 'Syncing Splash Slogans to Native');
                    window.Localization.updateSplashSlogans(slogansJson);
                    return true;
                } catch (e) {
                    bridgeLog('error', 'Failed to sync slogans', e.message);
                }
            }
            return false;
        },

        /**
         * Notifies Android about back button state.
         * @param {boolean} canGoBack - Whether the web history has pages to go back to.
         */
        updateBackState: function (canGoBack) {
            // [Future] This would call a native method to enable/disable hardware back interception
            // bridgeLog('info', `Back state updated: canGoBack=${canGoBack}`);
        }
    };

    // --- 3. Security: Freeze the Manager ---
    // This prevents any external script from modifying our bridge logic.
    Object.freeze(BridgeManager);

    // --- 4. Global Exposure ---
    window.BridgeManager = BridgeManager;

    // --- 5. Initial Boot Log ---
    bridgeLog('info', 'BridgeManager initialized and protected.');
})();
