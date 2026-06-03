/**
 * @file js/tools-loader.js
 * @description Dynamic HTML fragment loading utilities.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


const pageSnapshots = {};

/**
 * @description Fetches HTML page content and caches it, then inserts it into a specified container.
 */
async function insertUniqueSnapshot(pageUrl, containerId) {
    try {
        if (!pageSnapshots[pageUrl]) {
            const response = await fetch(pageUrl, { cache: "no-store" });
            if (!response.ok) throw new Error("Load failed: " + pageUrl);
            pageSnapshots[pageUrl] = await response.text();
        }

        document.querySelectorAll(`[data-page-url="${pageUrl}"]`).forEach((el) => el.remove());

        const container = document.getElementById(containerId);
        if (!container) throw new Error("Element not found: " + containerId);

        container.replaceChildren();
        container.innerHTML = pageSnapshots[pageUrl];
        container.setAttribute("data-page-url", pageUrl);

        const scripts = [...container.querySelectorAll("script")];
        for (const oldScript of scripts) {
            const newScript = document.createElement("script");
            for (const attr of oldScript.attributes) {
                newScript.setAttribute(attr.name, attr.value);
            }

            if (!oldScript.src) {
                let code = oldScript.textContent.trim();
                code = `(function(){\n${code}\n})();`;
                newScript.textContent = code;
            } else {
                const uniqueSrc = oldScript.src + "?v=" + Date.now();
                newScript.src = uniqueSrc;
                if (oldScript.type) newScript.type = oldScript.type;
            }

            oldScript.replaceWith(newScript);

            if (newScript.src) {
                await new Promise((resolve) => {
                    newScript.onload = resolve;
                    newScript.onerror = resolve;
                });
            }
        }
    } catch (err) {
        console.error("Error:", err);
    }
}

/**
 * @description Function that loads an HTML fragment from an external file and merges it into another page.
 */
async function loader(pageUrl, containerId, waitMs = 300) {
    try {
        let response, html;
        try {
            response = await fetch(pageUrl, { cache: "no-store" });
            if (!response.ok) throw new Error("File load failed: " + pageUrl);
            html = await response.text();
        } catch (fetchError) {
            console.error("Error fetching file:", fetchError);
            return;
        }

        let container;
        try {
            container = document.getElementById(containerId);
            if (!container) throw new Error("Element not found: " + containerId);
            container.replaceChildren();
            container.innerHTML = html;
        } catch (domError) {
            console.error("Error inserting content into DOM:", domError);
            return;
        }

        try {
            const scripts = [...container.querySelectorAll("script")];
            for (const oldScript of scripts) {
                const newScript = document.createElement("script");
                if (oldScript.type) newScript.type = oldScript.type;
                if (oldScript.src) {
                    newScript.src = oldScript.src;
                    newScript.async = oldScript.async || false;
                }
                if (oldScript.innerHTML.trim() !== "") {
                    newScript.textContent = oldScript.innerHTML;
                }
                for (const attr of oldScript.attributes) {
                    if (attr.name !== "src" && attr.name !== "type")
                        newScript.setAttribute(attr.name, attr.value);
                }

                oldScript.replaceWith(newScript);

                if (newScript.src) {
                    await new Promise((resolve) => {
                        newScript.onload = resolve;
                        newScript.onerror = resolve;
                    });
                }
            }
        } catch (scriptError) {
            console.error("Error executing scripts:", scriptError);
            return;
        }

        try {
            await new Promise((resolve) => setTimeout(resolve, waitMs));
        } catch (delayError) {
            console.warn("Error while waiting:", delayError);
        }
    } catch (globalError) {
        console.error("Unexpected error in loader function:", globalError);
    }
}
