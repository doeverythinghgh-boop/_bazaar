/**
 * @file js/tools-ui.js
 * @description UI interaction utilities: alerts, errors, and user display.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


/**
 * @description Checks for an original admin session and displays a watermark.
 */
function checkImpersonationMode() {
    const isImpersonating = SessionManager.isImpersonating();

    if (isImpersonating) {
        if (!document.querySelector(".admin-watermark")) {
            const watermark = document.createElement("div");
            watermark.className = "admin-watermark";
            watermark.innerHTML = `
            <i class="${window.ROLE_ICONS?.ADMIN || 'fas fa-user-gear'}"></i>
            <span>${langu('admin_mode_watermark')}</span>
            `;
            document.body.appendChild(watermark);
        }
    } else {
        const watermark = document.querySelector(".admin-watermark");
        if (watermark) {
            watermark.remove();
        }
    }
}

/**
 * @description Displays an error message below the specified input field.
 */
const showError = (input, message) => {
    const errorDiv = document.getElementById(`${input.id}-error`);
    input.classList.add("input-error");
    errorDiv.textContent = message;
};

/**
 * @description Removes the error message from below the specified input field.
 */
const clearError = (input) => {
    const errorDiv = document.getElementById(`${input.id}-error`);
    input.classList.remove("input-error");
    errorDiv.textContent = "";
};

/**
 * @description Updates login text in the top bar of the page.
 */
function setUserNameInIndexBar() {
    try {
        const loginTextElement = document.getElementById("index-login-text");
        const loginIcon = document.getElementById("index-login-icon");
        const loginBtn = document.getElementById("index-login-btn");

        if (!loginTextElement) {
            if (!window._indexBarRetryCount) window._indexBarRetryCount = 0;
            if (window._indexBarRetryCount < 10) {
                window._indexBarRetryCount++;
                setTimeout(setUserNameInIndexBar, 500);
            }
            return;
        }

        let session = window.userSession;
        const storedRaw = LocalDBStorage.getItem("loggedInUser");

        if (!session && storedRaw) {
            try {
                const parsed = JSON.parse(storedRaw);
                const userObj = (parsed && parsed.user) ? parsed.user : parsed;
                session = (typeof normalizeSessionUser === 'function') ? normalizeSessionUser(userObj) : userObj;
                if (session && !window.userSession) window.userSession = session;
            } catch { }
        }

        if (session && session.username) {
            let displayName = session.username;
            if (displayName.length > 8) {
                displayName = displayName.substring(0, 8) + "...";
            }
            loginTextElement.textContent = displayName;

            const images = parseProfileImages(session.user_image);
            if (images.avatar) {
                if (loginIcon) loginIcon.style.display = "none";

                let userImg = document.getElementById("index-login-avatar");
                if (!userImg) {
                    userImg = document.createElement("img");
                    userImg.id = "index-login-avatar";
                    userImg.className = "index-user-avatar";
                    if (loginBtn && loginIcon) {
                        loginBtn.insertBefore(userImg, loginIcon);
                    } else if (loginBtn) {
                        loginBtn.appendChild(userImg);
                    }
                }

                let avatarUrl = "";
                if (typeof getPublicR2FileUrl === "function") {
                    avatarUrl = getPublicR2FileUrl(images.avatar);
                } else {
                    const c = (typeof getBazaarInfrastructureConfig === 'function' ? getBazaarInfrastructureConfig() : {});
                    const baseUrl = (c.r2PublicUrl || "").replace(/\/$/, "");
                    avatarUrl = baseUrl ? `${baseUrl}/${images.avatar.replace(/^\//, "")}` : (images.avatar.startsWith("/") ? images.avatar : "/" + images.avatar);
                }
                userImg.src = avatarUrl;
                userImg.style.display = "inline-block";
            } else {
                if (loginIcon) {
                    loginIcon.style.display = "inline-block";
                    if (session.is_guest || session.user_key === "guest_user") {
                        loginIcon.classList.remove("fa-user-circle");
                        loginIcon.classList.add("fa-user-tag");
                    } else {
                        loginIcon.classList.add("fa-user-circle");
                        loginIcon.classList.remove("fa-user-tag");
                    }
                }
                const userImg = document.getElementById("index-login-avatar");
                if (userImg) userImg.style.display = "none";
            }
        }
        else if (storedRaw && (!session || !session.username)) {
            if (!window._indexBarSessionRetryCount) window._indexBarSessionRetryCount = 0;
            if (window._indexBarSessionRetryCount < 5) {
                window._indexBarSessionRetryCount++;
                setTimeout(setUserNameInIndexBar, 1000);
            } else {
                loginTextElement.textContent = window.langu ? window.langu("login_text") : "Login";
            }
        }
        else {
            loginTextElement.textContent = window.langu ? window.langu("login_text") : "Login";
            if (loginIcon) {
                loginIcon.style.display = "inline-block";
                loginIcon.classList.add("fa-user-circle");
                loginIcon.classList.remove("fa-user-tag");
            }
            const userImg = document.getElementById("index-login-avatar");
            if (userImg) userImg.style.display = "none";
        }
    } catch (error) {
        console.error("[Header] Error in setUserNameInIndexBar:", error);
    }
}





/**
 * @description Shows a SweetAlert2 modal prompting the user to log in.
 */
function showLoginAlert() {
    if (!window.userSession) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: window.langu("alert_title_info"),
                text: window.langu("alert_login_required"),
                showCancelButton: true,
                showCloseButton: true,
                confirmButtonText: window.langu("login_text"),
                cancelButtonText: window.langu("alert_cancel_btn"),
                buttonsStyling: false,
                customClass: {
                    popup: 'swal-modern-mini-popup',
                    title: 'swal-modern-mini-title',
                    htmlContainer: 'swal-modern-mini-text',
                    confirmButton: 'swal-modern-mini-confirm',
                    cancelButton: 'swal-modern-mini-cancel'
                },
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = "/pages/login/login.html";
                }
            });
        } else {
            console.warn("[showLoginAlert] SweetAlert2 not loaded, using fallback alert.");
            if (confirm(window.langu ? window.langu("alert_login_required") : "Login required")) {
                window.location.href = "/pages/login/login.html";
            }
        }
        return false;
    }
    return true;
}

/**
 * @description Displays notifications modal.
 */
function showNotificationsModal() {
    if (typeof window.handleNotificationsButtonClick === 'function') {
        window.handleNotificationsButtonClick();
    } else {
        window.location.href = "/notification/page/notifications.html";
    }
}

/**
 * @description Synchronizes splash slogans to Native Android.
 */
function syncSplashSlogansToAndroid() {
    if (!window.appTranslations) return;

    const slogans = { ar: {}, en: {} };
    const keys = ['splash_slogan', 'tagline_1', 'tagline_2', 'tagline_3', 'tagline_4', 'tagline_5', 'tagline_6'];

    keys.forEach(key => {
        if (window.appTranslations[key]) {
            slogans.ar[key] = window.appTranslations[key].ar || '';
            slogans.en[key] = window.appTranslations[key].en || '';
        }
    });

    const slogansJson = JSON.stringify(slogans);
    console.log("[Bridge] Syncing splash slogans to Native Android.");

    if (window.BridgeManager && typeof window.BridgeManager.syncSplashSlogans === 'function') {
        window.BridgeManager.syncSplashSlogans(slogansJson);
    }
}

/**
 * @type {AudioContext|null}
 * @description Global variable to store and reuse the AudioContext instance for notification sounds.
 */
let suzeAudioContext = null;

/**
 * @description Play notification sound using Web Audio API.
 */
function playNotificationSound() {
    const sampleRate = 44100;
    const beepDurationMs = 140;
    const silenceMs = 70;
    const pulsesCount = 3;
    const frequency = 900;
    const volume = 0.75;

    const audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: sampleRate
    });

    const beepSamples = Math.floor(beepDurationMs * sampleRate / 1000);
    const silenceSamples = Math.floor(silenceMs * sampleRate / 1000);
    const totalSamples = pulsesCount * (beepSamples + silenceSamples);

    const buffer = audioContext.createBuffer(1, totalSamples, sampleRate);
    const data = buffer.getChannelData(0);

    let index = 0;

    for (let pulse = 0; pulse < pulsesCount; pulse++) {
        for (let i = 0; i < beepSamples; i++) {
            data[index++] = Math.sin(2 * Math.PI * frequency * i / sampleRate) * volume;
        }
        for (let i = 0; i < silenceSamples; i++) {
            data[index++] = 0;
        }
    }

    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start();

    source.onended = () => {
        audioContext.close();
    };
}

