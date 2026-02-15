/**
 * @file js/core-loader.js
 * @description Centralized loader for all core application resources.
 * Injects Meta, CSS, and JS dependencies to ensure consistency across pages.
 * This script should be placed in the <head> of every HTML page.
 * @version 1.0.0
 */

(function () {
    'use strict';

    /**
     * @typedef {Object} Resource
     * @property {string} type - 'meta', 'link', 'script'
     * @property {Object} [attributes] - Key-value pairs for attributes
     * @property {boolean} [defer] - For scripts
     * @property {boolean} [async] - For scripts
     */

    /** @type {Resource[]} */
    const resources = [
        // --- 1. Meta Tags ---
        { type: 'meta', attributes: { charset: 'UTF-8' } },
        { type: 'meta', attributes: { name: 'viewport', content: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover, interactive-widget=resizes-content' } },
        { type: 'meta', attributes: { name: 'theme-color', content: '#007bff' } },
        { type: 'meta', attributes: { name: 'robots', content: 'noarchive, noimageindex' } },
        { type: 'meta', attributes: { name: 'googlebot', content: 'noarchive' } },
        { type: 'meta', attributes: { name: 'apple-mobile-web-app-capable', content: 'yes' } },
        { type: 'meta', attributes: { name: 'mobile-web-app-capable', content: 'yes' } },
        { type: 'meta', attributes: { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' } },
        { type: 'meta', attributes: { name: 'apple-mobile-web-app-title', content: 'Suez Bazaar' } },

        // --- 2. Link Tags (Favicons, Manifest, Preconnect) ---
        { type: 'link', attributes: { rel: 'icon', href: '/favicon.png', type: 'image/png' } },
        { type: 'link', attributes: { rel: 'shortcut icon', href: '/favicon.png', type: 'image/png' } },
        { type: 'link', attributes: { rel: 'manifest', href: '/manifest.json' } },
        { type: 'link', attributes: { rel: 'apple-touch-icon', href: '/images/icons/icon-192x192.png' } },
        { type: 'link', attributes: { rel: 'preconnect', href: 'https://pub-e828389e2f1e484c89d8fb652c540c12.r2.dev', crossorigin: '' } },
        { type: 'link', attributes: { rel: 'dns-prefetch', href: 'https://bazaar-suez.vercel.app' } },
        { type: 'link', attributes: { rel: 'dns-prefetch', href: 'https://fcm.googleapis.com' } },

        // --- 3. CSS Styles (Order Matters) ---
        { type: 'link', attributes: { rel: 'stylesheet', href: '/assets/fontawesome/css/all.css' } },
        { type: 'link', attributes: { rel: 'stylesheet', href: '/style/variables.css' } },
        { type: 'link', attributes: { rel: 'stylesheet', href: '/style/index.css' } },
        { type: 'link', attributes: { rel: 'stylesheet', href: '/style/utilities.css' } },
        { type: 'link', attributes: { rel: 'stylesheet', href: '/style/splash.css' } },
        { type: 'link', attributes: { rel: 'stylesheet', href: '/notification/page/notifications.css' } },
        { type: 'link', attributes: { rel: 'stylesheet', href: '/style/modals-and-dialogs.css' } },
        { type: 'link', attributes: { rel: 'stylesheet', href: '/style/register-page.css' } },
        { type: 'link', attributes: { rel: 'stylesheet', href: '/style/cart-package-modal.css' } },

        // --- 4. Scripts (Order Matters - Dependencies First) ---

        // 4.1. Security & Bridge (Important to run early)
        { type: 'script', attributes: { src: '/js/security-shield.js' } },
        { type: 'script', attributes: { src: '/js/bridge-manager.js' } },
        // 4.2. Third Party Libraries
        { type: 'script', attributes: { src: '/assets/libs/sweetalert2/sweetalert2.all.min.js' }, defer: true },
        { type: 'script', attributes: { src: '/assets/libs/jsrsasign/jsrsasign-all-min.js' }, defer: true },

        // 4.3. Configuration & Globals
        { type: 'script', attributes: { src: '/js/config.js' }, defer: true },
        { type: 'script', attributes: { src: '/js/globalVariable.js' }, defer: true },

        // 4.4. Core Utilities
        { type: 'script', attributes: { src: '/js/network.js' }, defer: true },
        { type: 'script', attributes: { src: '/js/tools.js' }, defer: true },
        { type: 'script', attributes: { src: '/js/cloudFileManager.js' }, defer: true },

        // 4.5. Auth & User Session
        { type: 'script', attributes: { src: '/js/auth/uiHelpers.js' }, defer: true },
        { type: 'script', attributes: { src: '/js/auth/validators.js' }, defer: true },
        { type: 'script', attributes: { src: '/js/auth/sessionManager.js' }, defer: true },
        { type: 'script', attributes: { src: '/js/auth.js' }, defer: true },

        // 4.6. Data & State Management
        { type: 'script', attributes: { src: '/notification/notification-db-manager.js' }, defer: true },
        { type: 'script', attributes: { src: '/orderStage/order-db-manager.js' }, defer: true },
        { type: 'script', attributes: { src: '/orderStage/order-sync-manager.js' }, defer: true },
        { type: 'script', attributes: { src: '/js/PRODUCT_SERVICE/serviceCategoryHelper.js' }, defer: true },
        { type: 'script', attributes: { src: '/js/PRODUCT_SERVICE/productStateManager.js' }, defer: true },
        { type: 'script', attributes: { src: '/js/PRODUCT_SERVICE/productMapper.js' }, defer: true },

        // 4.7. Notifications System
        { type: 'script', attributes: { src: '/notification/notification-credentials.js' }, defer: true },
        { type: 'script', attributes: { src: '/notification/notification-p2p-web.js' }, defer: true },
        { type: 'script', attributes: { src: '/notification/fcm-config.js' }, defer: true },
        { type: 'script', attributes: { src: '/notification/fcm-api.js' }, defer: true },
        { type: 'script', attributes: { src: '/notification/fcm-p2p-bridge.js' }, defer: true },
        { type: 'script', attributes: { src: '/notification/fcm-android-bridge.js' }, defer: true },
        { type: 'script', attributes: { src: '/notification/fcm-event-handlers.js' }, defer: true },

        // 4.8. Feature Modules
        { type: 'script', attributes: { src: '/js/forms.js' }, defer: true },
        { type: 'script', attributes: { src: '/pages/cardPackage/js/cardPackage.js' }, defer: true },
        { type: 'script', attributes: { src: '/js/connectUsers.js' }, defer: true },
        { type: 'script', attributes: { src: '/js/connectProduct.js' }, defer: true },
        { type: 'script', attributes: { src: '/pages/category/categoryModal.js' }, defer: true },

        // 4.9. Initialization logic
        { type: 'script', attributes: { src: '/notification/fcm-web-setup.js' }, defer: true },
        { type: 'script', attributes: { src: '/notification/fcm-android-setup.js' }, defer: true },
        { type: 'script', attributes: { src: '/notification/fcm-main-setup.js' }, defer: true },
        { type: 'script', attributes: { src: '/notification/page/global-counter.js' }, defer: true },
        { type: 'script', attributes: { src: '/notification/page/global-events.js' }, defer: true },
        { type: 'script', attributes: { src: '/notification/page/global-system-notif.js' }, defer: true },
        { type: 'script', attributes: { src: '/notification/page/notifications.js' }, defer: true },
        { type: 'script', attributes: { src: '/notification/page/notifications-ui.js' }, defer: true },
        { type: 'script', attributes: { src: '/notification/page/notifications-logic.js' }, defer: true },
        { type: 'script', attributes: { src: '/notification/page/actions-events.js' }, defer: true },
        { type: 'script', attributes: { src: '/notification/page/actions-data-refresh.js' }, defer: true },
        { type: 'script', attributes: { src: '/notification/page/actions-permissions.js' }, defer: true },

        // 4.10. Mobile & UI Helpers
        { type: 'script', attributes: { src: '/js/mobile-keyboard-handler.js' }, defer: true },
        // **CRITICAL**: Always include dev-console for Super Admin
        { type: 'script', attributes: { src: '/js/dev-console.js' }, defer: true },

        // 4.11. Modular Application Components
        { type: 'script', attributes: { src: '/js/app-i18n.js' }, defer: true },
        { type: 'script', attributes: { src: '/js/app-theme.js' }, defer: true },
        { type: 'script', attributes: { src: '/js/app-config.js' }, defer: true },
        { type: 'script', attributes: { src: '/js/app-nav.js' }, defer: true },
        { type: 'script', attributes: { src: '/js/app-ux.js' }, defer: true },
        { type: 'script', attributes: { src: '/js/app-header.js' }, defer: true },
    ];

    /**
     * Checks if a resource already exists in the document to prevent duplicates.
     * @param {Resource} resource 
     * @returns {boolean}
     */
    function resourceExists(resource) {
        if (resource.type === 'meta') {
            // Basic check for meta name
            if (resource.attributes.name) {
                return !!document.querySelector(`meta[name="${resource.attributes.name}"]`);
            }
            return false;
        }
        if (resource.type === 'link') {
            return !!document.querySelector(`link[href="${resource.attributes.href}"]`);
        }
        if (resource.type === 'script') {
            return !!document.querySelector(`script[src="${resource.attributes.src}"]`);
        }
        return false;
    }

    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    /**
     * Injects the resources into the document using document.write to preserve execution order
     * and ensuring integration with the browser's defer queue.
     */
    function loadCoreResources() {
        if (isLocal) {
            console.log("🛠️ [Dev Mode] Detected Localhost. Disabling Security Shield and PWA features for better development experience.");
        }

        // We build a single string to write to minimize DOM thrashing
        // and ensure the browser parser handles them as a contiguous block.
        let htmlToInject = '<!-- Injected by core-loader.js -->';

        resources.forEach(res => {
            // --- 5. Developer Environment Filtering ---
            if (isLocal) {
                // Skip Security Shield
                if (res.attributes && res.attributes.src === '/js/security-shield.js') return;
                // Skip PWA Manifest
                if (res.attributes && res.attributes.rel === 'manifest') return;
                // WARNING: Enabling FCM scripts in local dev might cause errors if config is missing, but is required for "setupFCM" to be defined.
                // If you want to test notification logic UI, let them load (they might fail to initialize FCM but functions will exist).
                /*
                // Skip Service Worker & FCM Web setups (Keep Android bridge for testing if needed, or skip both)
                if (res.attributes && (
                    res.attributes.src === '/notification/fcm-web-setup.js' ||
                    res.attributes.src === '/notification/fcm-main-setup.js' ||
                    res.attributes.src === '/sw.js'
                )) return;
                */
            }

            if (resourceExists(res)) {
                return;
            }

            if (res.type === 'meta') {
                // Meta tags can be appended to head safely without document.write usually, 
                // but for consistency we can write them or just use DOM API.
                // Meta tags don't block, so DOM API is safer/modern for them to avoid <head> breaking?
                // Actually, document.write in <head> is valid.
                // Let's stick to DOM API for Meta to avoid breaking <head> structure implicitly if write closes it?
                // No, write in head stays in head.
                // Let's use string building for everything for consistency.
                let attrStr = '';
                if (res.attributes) {
                    Object.keys(res.attributes).forEach(key => {
                        attrStr += ` ${key}="${res.attributes[key]}"`;
                    });
                }
                htmlToInject += `<meta${attrStr}>\n`;
            }
            else if (res.type === 'link') {
                let attrStr = '';
                if (res.attributes) {
                    Object.keys(res.attributes).forEach(key => {
                        attrStr += ` ${key}="${res.attributes[key]}"`;
                    });
                }
                htmlToInject += `<link${attrStr}>\n`;
            }
            else if (res.type === 'script') {
                let attrStr = '';
                if (res.attributes) {
                    Object.keys(res.attributes).forEach(key => {
                        attrStr += ` ${key}="${res.attributes[key]}"`;
                    });
                }
                if (res.defer) attrStr += ' defer';
                if (res.async) attrStr += ' async';
                htmlToInject += `<script${attrStr}></script>\n`;
            }
        });

        // Inject all resources at once
        document.write(htmlToInject);

        // Add page title fallback if missing (check document.title)
        if (!document.title) {
            document.title = "Suez Bazaar";
        }
    }

    // Execute immediately
    loadCoreResources();

    // --- 5. Android UI Sanitation ---
    if (window.Android || isLocal) {
        document.write('<style>#pwa-splash-screen { display: none !important; }</style>');
    }

})();

