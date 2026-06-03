/**
 * @file js/forms-registry.js
 * @description Loader registry management, cleanup, and back navigation helpers.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


var LOADER_REGISTRY = window.LOADER_REGISTRY || [];
window.LOADER_REGISTRY = LOADER_REGISTRY;

function profileHandleRegistry(containerId, reload) {
    try {
        LOADER_REGISTRY.forEach((id) => {
            const element = document.getElementById(id);
            if (element) element.style.display = "none";
        });

        const existingIndex = LOADER_REGISTRY.indexOf(containerId);

        if (existingIndex !== -1) {
            const container = document.getElementById(containerId);

            if (container && !reload) {
                container.style.display = "block";
            }

            LOADER_REGISTRY.splice(existingIndex, 1);
            LOADER_REGISTRY.push(containerId);

            if (!reload) {
                return true;
            }
        } else {
            LOADER_REGISTRY.push(containerId);
        }

        return false;
    } catch (error) {
        console.error("[Forms] Error in profileHandleRegistry:", error);
        return false;
    }
}

function profileClearOldContent(containerId) {
    try {
        const container = document.getElementById(containerId);
        if (container) {
            container.style.display = "none";
            container.innerHTML = '';
            container.classList.remove('main-loader-active');
        }

        document.querySelectorAll(`style[data-loader-id="${containerId}"]`).forEach((styleTag) => {
            styleTag.remove();
        });

        console.log(`[Forms] Cleared old content and CSS for container: ${containerId}`);
    } catch (error) {
        console.error("[Forms] Error in profileClearOldContent:", error);
    }
}

function containerGoBack() {
    try {
        if (LOADER_REGISTRY.length < 2) {
            console.warn("[Forms] No previous container to return to.");
            return false;
        }

        const currentContainerId = LOADER_REGISTRY.pop();
        const previousContainerId = LOADER_REGISTRY[LOADER_REGISTRY.length - 1];

        const currentContainer = document.getElementById(currentContainerId);
        if (currentContainer) {
            currentContainer.style.display = "none";
        }

        if (currentContainerId !== "index-productAdd-container" && currentContainerId !== "index-productEdit-container") {
            profileClearOldContent(currentContainerId);
        }

        const previousContainer = document.getElementById(previousContainerId);
        if (previousContainer) {
            previousContainer.style.display = "block";
            console.log(
                `[Forms] Returned from ${currentContainerId} to ${previousContainerId}\n` +
                `Current Registry: [${LOADER_REGISTRY.join(", ")}]`
            );
            return true;
        }

        console.error(`[Forms] Previous container not found: ${previousContainerId}`);
        return false;
    } catch (error) {
        console.error("[Forms] Error in containerGoBack function:", error);
        return false;
    }
}
