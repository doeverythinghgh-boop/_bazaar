/**
 * @file security-shield.js
 * @description Implements technical protections (Debugger traps, UI restrictions, Environment awareness)
 * to prevent reverse engineering. Organized using Clean Code principles (SoC, SRP, Modularity).
 * @module security-shield
 * @version 1.17.172
 */

console.log("[ESM Load] js/security-shield.js: Initializing...");

// --- 1. Configuration Constants ---
const runtimeInfra = typeof window.getBazaarInfrastructureConfig === 'function'
    ? window.getBazaarInfrastructureConfig()
    : {};

export const CONFIG = {
    OFFICIAL_DOMAIN: runtimeInfra.officialDomain || '',
    PLAY_STORE_URL: 'market://details?id=hgh.hgh.suezbazaar',
    DEBUGGER_INTERVAL: 100,
    INTEGRITY_CHECK_INTERVAL: 2000,
    SWAL_CHECK_INTERVAL: 300
};

// --- 2. Environment & Detection Module ---
export const Env = {
    getUA: function () { return navigator.userAgent; },
    isAndroidNative: function () { return !!window.Android; },
    isIOS: function () { return /iPad|iPhone|iPod/.test(this.getUA()) && !window.MSStream; },
    isWindows: function () { return /Win/i.test(this.getUA()); },
    isAndroidUA: function () { return /Android/i.test(this.getUA()); },

    isPWA: function () {
        return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    },
    isLocal: function () {
        return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    },
    isOfficialDomain: function () {
        return window.location.hostname === CONFIG.OFFICIAL_DOMAIN;
    },
    isPortfolioPage: function () {
        return window.location.pathname.indexOf('merchant-portfolio.html') > -1;
    },
    isPublicSharePage: function () {
        return this.isPortfolioPage();
    },
    isDeveloper: function () {
        try {
            const user = window.UserService && typeof window.UserService.get === 'function'
                ? window.UserService.get()
                : null;
            const capabilities = typeof window.resolveUserCapabilities === 'function'
                ? window.resolveUserCapabilities(user)
                : null;
            return !!(capabilities && capabilities.isAdmin);
        } catch (e) {
            console.error("[Security] Dev check failed:", e);
        }
        return false;
    }
};

// --- 3. UI & Redirection Actions Module ---
export const Actions = {
    getText: function (key, fallback) {
        if (typeof window.langu !== 'function') return fallback;
        const value = window.langu(key);
        return (!value || value === key) ? fallback : value;
    },
    stopExecution: function () {
        if (typeof window.stop === 'function') window.stop();
    },
    redirectToStore: function () {
        this.stopExecution();
        window.location.href = CONFIG.PLAY_STORE_URL;
        document.documentElement.innerHTML = '<html><body style="background:#fff;"></body></html>';
    },
    showIOSPopup: function () {
        this.showModernPopup(
            this.getText('security_ios_install_title', 'تثبيت على الآيفون'),
            this.getText('security_ios_install_text', 'اضغط مشاركة <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#007aff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle; margin: 0 5px;"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg> ثم إضافة إلى الشاشة الرئيسية')
        );
    },
    showWindowsPopup: function () {
        this.showModernPopup(
            this.getText('security_windows_install_title', 'تثبيت على ويندوز'),
            this.getText('security_windows_install_text', 'للحصول على أفضل تجربة، يرجى تثبيت التطبيق عبر المتصفح (Install App) من شريط العنوان.')
        );
    },
    showModernPopup: function (title, html) {
        const interval = setInterval(function () {
            if (window.Swal) {
                clearInterval(interval);
                window.Swal.fire({
                    title: title,
                    html: html,
                    confirmButtonText: Actions.getText('alert_confirm_btn', 'موافق'),
                    customClass: {
                        popup: 'swal-modern-mini-popup',
                        title: 'swal-modern-mini-title',
                        htmlContainer: 'swal-modern-mini-text',
                        confirmButton: 'swal-modern-mini-confirm'
                    },
                    buttonsStyling: false,
                    backdrop: 'rgba(0,0,0,0.5)',
                    position: 'center'
                });
            }
        }, CONFIG.SWAL_CHECK_INTERVAL);
    },

    performHardExit: function (reason) {
        console.error("[Security] Hard Exit Triggered: " + (reason || "Unauthorized Environment"));

        this.stopExecution();

        try {
            document.documentElement.innerHTML = '<html><head><title>Access Denied</title></head><body style="background:#000;"></body></html>';
            document.write("");
        } catch { }

        try {
            window.close();
        } catch { }

        window.location.replace("about:blank");

        throw new Error("[Security] Forbidden Activity Detected.");
    }
};

// --- 4. Protection Mechanisms Module ---
export const Protections = {
    initUI: function () {
        document.addEventListener('contextmenu', function (e) { e.preventDefault(); }, false);
        document.addEventListener('keydown', function (e) {
            const forbiddenKeys = [123, 73, 74, 67, 85, 83]; // F12, I, J, C, U, S
            if (forbiddenKeys.indexOf(e.keyCode) > -1 && (e.ctrlKey || e.metaKey || e.keyCode === 123)) {
                e.preventDefault();
            }
        }, false);
    },
    initDebugger: function () {
        setInterval(function () {
            (function () { return false; }['constructor']('debugger')['call']());
        }, CONFIG.DEBUGGER_INTERVAL);
    },
    initIntegrity: function () {
        const nativeCheck = function (fn) { return fn && fn.toString().indexOf('[native code]') > -1; };

        setInterval(function () {
            if (!nativeCheck(window.matchMedia)) {
                Shield.checkEnvironment(true);
            }
        }, CONFIG.INTEGRITY_CHECK_INTERVAL);

        const observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (m) {
                m.removedNodes.forEach(function (n) {
                    if (n.src && n.src.indexOf('security-shield.js') > -1) location.reload();
                });
            });
        });
        observer.observe(document.head, { childList: true });
    },
    verifyHeuristics: function () {
        if (navigator.webdriver) return false;
        if (!navigator.languages || navigator.languages.length === 0) return false;
        if (window.screen.width === 0 || window.screen.height === 0) return false;

        const ua = Env.getUA();
        const BOT_LIST = /HTTrack|Wget|offline|scraper|spider|bot|crawl|curl|python|php|java|libwww|downloader|teleport|archive|headless/i;
        if (BOT_LIST.test(ua)) {
            console.warn("[Security] Known bot/cloner agent detected.");
            return false;
        }

        const robotProps = ['__nightmare', '_selenium', '_phantom', 'callPhantom', 'domAutomation', 'domAutomationController'];
        for (let i = 0; i < robotProps.length; i++) {
            if (window[robotProps[i]]) return false;
        }

        const path = window.location.pathname;
        if (!Env.isAndroidNative() && !Env.isPWA() && !Env.isLocal()) {
            if (Env.isPublicSharePage()) return true;
            if (!Env.isWindows() && !Env.isIOS()) {
                const allowedPages = ['/', '/index.html', '/offline.html', '/pages/offline/offline.html', '/privacy.html', '/pages/privacy/privacy.html', '/delete-account.html', '/pages/delete-account/delete-account.html'];
                const isExplicitFile = /\.[a-z0-9]+$/i.test(path);
                if ((!isExplicitFile && path.length > 1) || (isExplicitFile && allowedPages.indexOf(path) === -1)) {
                    console.warn("[Security] Unauthorized direct access detected.");
                    return false;
                }
            }
        }

        if (/Safari/.test(ua) && !/Chrome|CriOS|FxiOS|Edg|Android/i.test(ua)) {
            if (navigator.vendor !== "Apple Computer, Inc.") return false;
        }
        return true;
    }
};

// --- 5. Main Orchestrator ---
export const Shield = {
    init: function () {
        if (Env.isPublicSharePage()) {
            console.log("[Security] Public share page bypass applied.");
            return;
        }

        if (Env.isAndroidUA() && !Env.isAndroidNative() && !Env.isPWA() && !Env.isLocal() && !Env.isPortfolioPage()) {
            Actions.redirectToStore();
            return;
        }

        if (Env.isDeveloper() || Env.isLocal()) {
            console.log("[Security] Shield bypassed (Local or Developer mode).");
            return;
        }

        try {
            this.checkEnvironment();
            Protections.initUI();
            Protections.initDebugger();
            Protections.initIntegrity();
            console.log("[Security] Shield activated.");
        } catch (e) {
            console.warn(e.message);
        }
    },

    checkEnvironment: function (forceGate) {
        const isSecure = Protections.verifyHeuristics();

        if (Env.isAndroidNative() || Env.isPWA() || Env.isLocal() || Env.isPortfolioPage()) {
            if (!isSecure) Actions.performHardExit("Tampering detected in whitelist environment");
            return;
        }

        if (forceGate || !isSecure) {
            Actions.performHardExit("Virtual Instance or Compromised Environment Detected");
            return;
        }

        if (Env.isAndroidUA()) {
            Actions.redirectToStore();
        } else if (Env.isIOS()) {
            Actions.showIOSPopup();
        } else if (Env.isWindows()) {
            Actions.showWindowsPopup();
        } else {
            Actions.performHardExit("Unrecognized Platform - Restricted Access");
        }
    }
};

// -----------------------------------------------------------------------------
// Hybrid Export Bridge (Legacy Compatibility)
// -----------------------------------------------------------------------------
window.SecurityShield = Shield; // Alias for module access if needed
// Individual global functions/objects if legacy code needs them
// Note: legacy code usually just relies on the script executing.

Shield.init();

console.log("[ESM Load] js/security-shield.js: Hybrid bridge established.");
