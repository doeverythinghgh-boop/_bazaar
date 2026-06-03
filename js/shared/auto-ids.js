/**
 * @file js/shared/auto-ids.js
 * @description Assigns stable auto-generated IDs to elements that do not have one.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

(function initAutoIds() {
    if (window.__autoIdsInitialized) return;
    window.__autoIdsInitialized = true;

    function resolvePrefix() {
        const htmlPrefix = document.documentElement?.dataset?.idPrefix;
        const bodyPrefix = document.body?.dataset?.idPrefix;
        if (htmlPrefix) return htmlPrefix;
        if (bodyPrefix) return bodyPrefix;

        const path = (window.location.pathname || "")
            .replace(/\/+/g, "-")
            .replace(/^-|-$/g, "")
            .replace(/[^a-zA-Z0-9-]/g, "")
            .toLowerCase();
        return path || "page";
    }

    const prefix = resolvePrefix();
    const used = new Set(Array.from(document.querySelectorAll("[id]")).map(el => el.id));
    let counter = 1;

    function nextId(tagName) {
        const tag = (tagName || "el").toLowerCase();
        let candidate = "";
        do {
            candidate = `${prefix}-${tag}-${counter++}`;
        } while (used.has(candidate));
        used.add(candidate);
        return candidate;
    }

    function applyToElement(el) {
        if (!el || el.nodeType !== 1) return;
        if (!el.id) el.id = nextId(el.tagName);
    }

    function applyToTree(root) {
        if (!root || root.nodeType !== 1) return;
        applyToElement(root);
        const missing = root.querySelectorAll("*:not([id])");
        missing.forEach(applyToElement);
    }

    function applyAllNow() {
        const missingAll = document.querySelectorAll("*:not([id])");
        missingAll.forEach(applyToElement);
    }

    window.ensureAutoIds = applyAllNow;

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", applyAllNow, { once: true });
    } else {
        applyAllNow();
    }

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) applyToTree(node);
            });
        });
    });

    observer.observe(document.documentElement, { childList: true, subtree: true });
})();
