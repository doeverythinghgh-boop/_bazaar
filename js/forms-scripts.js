/**
 * @file js/forms-scripts.js
 * @description Dynamic loader fetch, script restart, and callback helpers.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


async function profileFetchContent(pageUrl) {
    try {
        const response = await fetch(pageUrl, { cache: "no-store" });
        if (!response.ok) {
            throw new Error(`[Forms] Failed to load file (${response.status}): ${pageUrl}`);
        }
        return await response.text();
    } catch (error) {
        console.error("[Forms] Error in profileFetchContent:", error);
        return null;
    }
}

async function profileRestartScripts(container) {
    try {
        const scripts = [...container.querySelectorAll("script")];

        for (const oldScript of scripts) {
            const newScript = document.createElement("script");

            for (const attr of oldScript.attributes) {
                newScript.setAttribute(attr.name, attr.value);
            }

            if (oldScript.innerHTML.trim()) {
                let scriptContent = oldScript.innerHTML;
                scriptContent = `(function() {
                    try {
                        ${scriptContent}
                    } catch (err) {
                        console.error("[Forms] Error executing wrapped IIFE script after loading:", err);
                    }
                })();`;
                newScript.textContent = scriptContent;
            }

            oldScript.replaceWith(newScript);

            if (newScript.src) {
                await new Promise((resolve) => {
                    newScript.onload = () => resolve();
                    newScript.onerror = () => {
                        console.error(`[Forms] Failed to load external script: ${newScript.src}`);
                        resolve();
                    };
                });
            }
        }
    } catch (error) {
        console.error("[Forms] Error in profileRestartScripts:", error);
    }
}

function profileExecuteCallback(callbackName) {
    try {
        if (!callbackName) return;

        if (Array.isArray(callbackName)) {
            callbackName.forEach((name) => profileExecuteCallback(name));
            return;
        }

        if (!window[callbackName] || typeof window[callbackName] !== "function") return;

        const callback = window[callbackName];
        console.log(`[Forms] Successfully executed callback: ${callbackName}`);
        callback();
    } catch (error) {
        console.error("[Forms] Error in profileExecuteCallback:", error);
    }
}
