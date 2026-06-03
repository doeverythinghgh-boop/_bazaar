/**
 * @file pages/register/js/register-map-helpers.js
 * @description Map and location helpers for the registration page.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


function registerRestoreSavedLocation() {
    const els = registerGetElements();
    if (!els.coordsInput) return;

    try {
        const savedLocation = LocalDBStorage.getItem("saved_location") || LocalDBStorage.getItem("bidstory_user_saved_location");
        let initialCoords = "";

        if (savedLocation) {
            try {
                const parsed = JSON.parse(savedLocation);
                if (parsed && (parsed.lat || parsed.lng)) {
                    initialCoords = parsed.coordinates || `${parsed.lat}, ${parsed.lng}`;
                }
            } catch (e) {
                console.error("[Register] Error parsing saved location:", e);
            }
        }

        const timestamp = Date.now();

        if (initialCoords) {
            els.coordsInput.value = initialCoords;
            els.coordsInput.dispatchEvent(new Event('change', { bubbles: true }));
            registerSetMapStatus(window.langu ? window.langu("register_map_restored") : "تم تحديد الموقع بنجاح");

            if (els.mapIframe) {
                const [lt, ln] = initialCoords.split(",").map((coord) => coord.trim());
                els.mapIframe.src = `/location/LOCATION.html?lat=${lt}&lng=${ln}&embedded=true&hideSave=true&v=${timestamp}`;
            }
        } else if (els.mapIframe) {
            els.mapIframe.src = `/location/LOCATION.html?embedded=true&hideSave=true&v=${timestamp}`;
        }
    } catch (error) {
        console.error("[Register] Error restoring location:", error);
    }
}

function registerResolveMapOrigin() {
    const els = registerGetElements();
    const iframeSrc = els.mapIframe?.getAttribute("src") || "/location/LOCATION.html";

    try {
        return new URL(iframeSrc, window.location.origin).origin;
    } catch (error) {
        return window.location.origin;
    }
}

function registerIsTrustedMapMessage(event) {
    const els = registerGetElements();
    const mapWindow = els.mapIframe?.contentWindow || null;
    const allowedOrigin = registerResolveMapOrigin();
    const messageType = event?.data?.type;

    if (!event || !event.data || (messageType !== "LOCATION_SELECTED" && messageType !== "LOCATION_RESET")) {
        return false;
    }

    if (mapWindow && event.source && event.source !== mapWindow) {
        return false;
    }

    if (typeof event.origin === "string" && event.origin !== "null" && event.origin !== allowedOrigin) {
        return false;
    }

    if (messageType === "LOCATION_SELECTED") {
        return typeof event.data.coordinates === "string" && event.data.coordinates.trim().length > 0;
    }

    return true;
}

function registerSetMapError(message) {
    const els = registerGetElements();
    if (els.mapError) {
        els.mapError.textContent = message || "";
        els.mapError.style.display = message ? "block" : "none";
        if (message) {
            els.mapError.style.color = "#dc2626";
        }
    }

    if (message && els.mapStatus) {
        els.mapStatus.style.display = "none";
        els.mapStatus.textContent = "";
    }
}

function registerSetMapStatus(message) {
    const els = registerGetElements();
    if (els.mapStatus) {
        els.mapStatus.textContent = "";
        els.mapStatus.innerHTML = message ? `<i class="fas fa-check-circle"></i> ${message}` : "";
        els.mapStatus.style.display = message ? "block" : "none";
        els.mapStatus.style.color = "#10b981";
    }

    if (message && els.mapError) {
        els.mapError.textContent = "";
        els.mapError.style.display = "none";
    }
}
