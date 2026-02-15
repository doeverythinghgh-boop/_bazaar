/**
 * @file pages/register/js/register-helpers.js
 * @description Utility and helper functions for the registration page.
 */

/**
 * Restores the user's saved location from local storage if available.
 * Updates the map iframe and coordinates input.
 */
function registerRestoreSavedLocation() {
    const els = registerGetElements();
    if (!els.coordsInput) return;

    try {
        const savedLocation = localStorage.getItem('saved_location') || localStorage.getItem('bidstory_user_saved_location');
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

        const timestamp = new Date().getTime();

        if (initialCoords) {
            els.coordsInput.value = initialCoords;
            if (els.mapStatus) {
                els.mapStatus.style.color = "#10b981";
                if (window.langu) {
                    els.mapStatus.innerHTML = `<i class="fas fa-check-circle"></i> ${window.langu("register_map_restored")}`;
                }
                els.mapStatus.style.display = "block";
            }

            // Update Iframe with saved coords + cache busting
            if (els.mapIframe) {
                const [lt, ln] = initialCoords.split(",").map(c => c.trim());
                els.mapIframe.src = `/location/LOCATION.html?lat=${lt}&lng=${ln}&embedded=true&hideSave=true&v=${timestamp}`;
            }
        } else if (els.mapIframe) {
            // No saved location, just add cache busting
            els.mapIframe.src = `/location/LOCATION.html?embedded=true&hideSave=true&v=${timestamp}`;
        }
    } catch (error) {
        console.error("[Register] Error restoring location:", error);
    }
}

/**
 * Toggles password visibility for the given input and icon.
 * @param {HTMLElement} input - The password input element.
 * @param {HTMLElement} icon - The toggle icon element.
 */
function registerTogglePasswordVisibility(input, icon) {
    if (!input || !icon) return;
    
    const isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";
    
    icon.classList.toggle("fa-eye");
    icon.classList.toggle("fa-eye-slash");
}
