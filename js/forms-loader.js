/**
 * @file js/forms-loader.js
 * @description Main dynamic content loader entrypoint.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


async function mainLoader(
    pageUrl,
    containerId,
    waitMs = 300,
    cssRules = `
        flex: 1;
        border: none;
        overflow-y: auto;
        overflow-x: hidden;
    `,
    callbackName,
    reload = false
) {
    try {
        const container = document.getElementById(containerId);
        const currentLoadedUrl = container ? container.getAttribute('data-page-url') : null;

        if (!reload && currentLoadedUrl === pageUrl) {
            console.log(`[SmartLoader] Page ${pageUrl} already in ${containerId}, just displaying.`);

            profileHandleRegistry(containerId, false);

            if (container) {
                container.classList.remove('main-loader-active');
                container.style.display = "block";
                container.classList.remove('animate-fade-up');
                void container.offsetWidth;
                container.classList.add('animate-fade-up');
            }

            if (typeof window.applyAppTranslations === 'function') {
                await window.applyAppTranslations();
            }

            console.log(
                `[SmartLoader] Container shown from memory successfully\n` +
                `containerId: ${containerId}`
            );

            profileExecuteCallback(callbackName);
            return;
        }

        const skipLoading = profileHandleRegistry(containerId, reload);
        if (skipLoading) {
            profileExecuteCallback(callbackName);
            return;
        }

        if (reload) {
            profileClearOldContent(containerId);
        }

        if (!container) {
            console.error("[Forms] Element not found: " + containerId);
            return;
        }

        container.style.display = "block";
        container.innerHTML = '<div class="loader"></div>';
        container.classList.add('main-loader-active');

        const html = await profileFetchContent(pageUrl);
        if (html === null) {
            container.innerHTML = "";
            container.classList.remove('main-loader-active');
            return;
        }

        const styleTag = document.createElement("style");
        styleTag.setAttribute('data-loader-id', containerId);
        styleTag.innerHTML = `
            #${containerId} {
                ${cssRules}
            }
        `;
        document.head.appendChild(styleTag);

        const buffer = document.createElement('div');
        buffer.className = 'main-loader-buffer';
        buffer.style.display = 'none';
        buffer.innerHTML = html;
        container.appendChild(buffer);

        await profileRestartScripts(buffer);
        await new Promise((resolve) => setTimeout(resolve, waitMs));

        while (buffer.firstChild) {
            container.appendChild(buffer.firstChild);
        }

        await new Promise((resolve) => requestAnimationFrame(resolve));

        const currentLoader = container.querySelector('.loader');
        if (currentLoader) currentLoader.remove();
        buffer.remove();
        container.classList.remove('main-loader-active');
        container.classList.remove('animate-fade-up');
        void container.offsetWidth;
        container.classList.add('animate-fade-up');
        container.setAttribute('data-page-url', pageUrl);

        console.log(
            `[SmartLoader] Load and Merge Complete\n` +
            `pageUrl: ${pageUrl}\n` +
            `containerId: ${containerId}\n` +
            `reload: ${reload}`
        );

        if (typeof window.applyAppTranslations === 'function') {
            await window.applyAppTranslations();
        }

        profileExecuteCallback(callbackName);
    } catch (globalError) {
        console.error("[Forms] Unexpected global error in mainLoader:", globalError);
    }
}
