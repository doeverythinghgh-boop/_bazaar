/**
 * @file pages/products/shared/modules/product-page-bootstrap.js
 * @description Shared ESM bootstrap helpers for product pages.
 */

export function onReady(callback) {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", callback, { once: true });
    } else {
        callback();
    }
}

export async function initProductPageShell(pageName, options = {}) {
    window.ProductDebugConsole?.log(pageName, "dom-content-loaded");

    if (typeof window.initAppTheme === "function") {
        window.initAppTheme();
        window.ProductDebugConsole?.log(pageName, "theme-initialized");
    }

    if (typeof window.loadIndexTranslations === "function") {
        await window.loadIndexTranslations();
        window.ProductDebugConsole?.log(pageName, "translations-loaded");
    }

    if (typeof window.SessionManager !== "undefined") {
        window.SessionManager.init();
        window.ProductDebugConsole?.snapshot(pageName, "session-initialized", {
            hasUserSession: typeof window.userSession !== "undefined" && !!window.userSession
        });
    }

    if (options.fetchCategories && typeof window.fetchAppCategories === "function") {
        window.ProductDebugConsole?.log(pageName, "fetch-categories-start");
        await window.fetchAppCategories();
        window.ProductDebugConsole?.log(pageName, "fetch-categories-complete");
    }

    if (typeof window.AppHeader !== "undefined" && window.AppHeader.init) {
        await window.AppHeader.init("header-injection-point", options.homeButtonId || "");
        window.ProductDebugConsole?.log(pageName, "header-initialized");
    }
}

