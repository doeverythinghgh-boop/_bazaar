/**
 * @file pages/register/js/register-listeners.js
 * @description Event listener setup for the registration page.
 */

/**
 * Initializes all event listeners for the register module.
 */
function registerSetupListeners() {
    console.log("[Register] Setting up listeners...");
    const els = registerGetElements();

    // 1. Avatar Listeners
    if (els.avatarPickBtn) els.avatarPickBtn.addEventListener("click", () => els.avatarInput && els.avatarInput.click());
    if (els.avatarCameraBtn) els.avatarCameraBtn.addEventListener("click", registerHandleCameraTrigger);
    if (els.avatarTrigger) els.avatarTrigger.addEventListener("click", () => els.avatarInput && els.avatarInput.click());
    if (els.avatarInput) els.avatarInput.addEventListener("change", registerHandleAvatarChange);

    // 2. Tabs
    if (els.tabBtns) {
        els.tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                els.tabBtns.forEach(b => b.classList.remove('active'));
                els.tabContents.forEach(c => c.classList.remove('active'));

                btn.classList.add('active');
                const targetTabId = btn.getAttribute('data-tab');
                document.getElementById(`register-tab-${targetTabId}`).classList.add('active');
            });
        });
    }

    // 3. Password Toggle
    if (els.passwordToggleIcon && els.passwordInput) {
        els.passwordToggleIcon.addEventListener("click", () => {
            registerTogglePasswordVisibility(els.passwordInput, els.passwordToggleIcon);
        });
    }

    // 4. Phone Input Normalization
    if (els.phoneInput) {
        els.phoneInput.addEventListener("input", function (e) {
            e.target.value = AuthValidators.normalizePhone(e.target.value);
        });
    }

    // 5. Seller Options
    if (els.sellerOptionsBtn) {
        els.sellerOptionsBtn.addEventListener("click", registerHandleSellerOptions);
    }

    // 6. Form Submit
    if (els.form) {
        els.form.addEventListener("submit", registerHandleSubmit);
    }

    // 7. Login Link
    if (els.loginLink) {
        els.loginLink.addEventListener("click", function (e) {
            e.preventDefault();
            window.location.href = "/pages/login/login.html";
        });
    }

    // 8. Map Message Listener (PostMessage)
    window.addEventListener('message', registerHandleMapMessage);
}

/**
 * Handles messages received from the embedded map iframe.
 */
function registerHandleMapMessage(event) {
    const els = registerGetElements();

    if (event.data && event.data.type === 'LOCATION_SELECTED') {
        const coords = event.data.coordinates;
        console.log("[Register] Map location selected:", coords);
        
        if (els.coordsInput) els.coordsInput.value = coords;

        if (els.mapStatus) {
            els.mapStatus.style.color = "#10b981";
            els.mapStatus.innerHTML = `<i class="fas fa-check-circle"></i> ${window.langu("register_map_success")}`;
            els.mapStatus.style.display = "block";
        }
        if (els.mapError) els.mapError.style.display = "none";

    } else if (event.data && event.data.type === 'LOCATION_RESET') {
        if (els.coordsInput) els.coordsInput.value = "";
        
        if (els.mapStatus) {
            els.mapStatus.style.display = "none";
            els.mapStatus.innerHTML = "";
        }
        if (els.mapError) els.mapError.style.display = "none";
    }
}
