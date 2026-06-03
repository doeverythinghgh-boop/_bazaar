/**
 * @file pages/login/login-ui.js
 * @description Login form bindings and settings modal UI.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

export function login_setupLoginForm() {
    try {
        const loginForm = document.getElementById("login_form");
        if (!loginForm) return;

        const loginPhoneInput = document.getElementById("login_phone");
        const loginPasswordInput = document.getElementById("login_password");
        const loginTogglePassword = document.getElementById("login_togglePassword");
        const loginGuestBtn = document.getElementById("login_guest-btn");

        if (loginTogglePassword && loginPasswordInput) {
            loginTogglePassword.addEventListener("click", function () {
                const type = loginPasswordInput.getAttribute("type") === "password" ? "text" : "password";
                loginPasswordInput.setAttribute("type", type);
                this.classList.toggle("fa-eye");
                this.classList.toggle("fa-eye-slash");
            });
        }

        if (loginPhoneInput) {
            loginPhoneInput.addEventListener("input", function (e) {
                const normalized = window.normalizeDigits ? window.normalizeDigits(e.target.value) : e.target.value;
                if (window.AuthValidators?.normalizePhone) {
                    e.target.value = window.AuthValidators.normalizePhone(normalized);
                } else {
                    e.target.value = normalized;
                }
            });
        }

        if (typeof window.login_handleSubmit === 'function') {
            loginForm.addEventListener("submit", window.login_handleSubmit);
        }

        if (loginGuestBtn && typeof window.login_handleGuestLogin === 'function') {
            loginGuestBtn.addEventListener("click", window.login_handleGuestLogin);
        }

        const registerLink = document.getElementById("login_go-to-register-link");
        if (registerLink && typeof window.login_handleRegisterClick === 'function') {
            registerLink.addEventListener("click", window.login_handleRegisterClick);
        }
    } catch (error) {
        console.error(" Error login_setupLoginForm:", error);
    }

    const settingsBtn = document.getElementById("index-settings-btn");
    if (settingsBtn) {
        settingsBtn.addEventListener("click", login_openSettingsModal);
    }
}

export function login_openSettingsModal() {
    if (typeof Swal === 'undefined') {
        console.error("[LoginUI] Swal not found for settings modal");
        return;
    }

    const isDark = document.body.classList.contains('dark-theme');
    const themeIcon = isDark ? 'fa-sun' : 'fa-moon';
    const themeText = isDark ? (window.langu ? window.langu("dash_theme_day") : "Day Mode") : (window.langu ? window.langu("dash_theme_night") : "Night Mode");
    const themeColor = isDark ? '#f39c12' : '#555';

    Swal.fire({
        title: window.langu ? window.langu("dash_settings_title") : "Settings",
        html: `
          <div class="settings-modal-content" style="text-align: inherit; direction: inherit;">
            <div style="display: flex; flex-direction: column; gap: 8px;">
               <div onclick="window.toggleAppTheme();"
                    class="settings-list-item" style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: rgba(0,0,0,0.03); border-radius: 12px; cursor: pointer;">
                  <span>
                     <i class="fas ${themeIcon}" style="color: ${themeColor}; width: 20px;"></i> ${themeText}
                  </span>
                <div style="width: 36px; height: 20px; background: ${isDark ? '#4cd964' : '#e5e5ea'}; border-radius: 20px; position: relative;">
                    <div style="width: 16px; height: 16px; background: var(--bg-color-white); border-radius: 50%; position: absolute; top: 2px; ${isDark ? 'left' : 'right'}: 2px; box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></div>
                  </div>
               </div>

               <div onclick="window.toggleAppLanguage();"
                    class="settings-list-item" style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: rgba(0,0,0,0.03); border-radius: 12px; cursor: pointer;">
                  <span>
                     <i class="fas fa-language" style="color: var(--primary-color); width: 20px;"></i> ${LocalDBStorage.getItem('app_language') === 'en' ? (window.langu ? window.langu('lang_english') : "English") : (window.langu ? window.langu('lang_arabic') : "Arabic")}
                  </span>
                  <div style="width: 36px; height: 20px; background: ${LocalDBStorage.getItem('app_language') === 'en' ? '#e5e5ea' : '#4cd964'}; border-radius: 20px; position: relative;">
                    <div style="width: 16px; height: 16px; background: var(--bg-color-white); border-radius: 50%; position: absolute; top: 2px; ${LocalDBStorage.getItem('app_language') === 'en' ? 'inset-inline-end' : 'inset-inline-start'}: 2px; box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></div>
                  </div>
               </div>

               <div onclick="window.location.href = '/pages/contact/contact.html'; Swal.close();"
                    class="settings-list-item" style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: rgba(0,0,0,0.03); border-radius: 12px; cursor: pointer;">
                  <span>
                     <i class="fas fa-headset"></i> ${window.langu ? window.langu("dash_support") : "Support"}
                  </span>
                  <i class="fas fa-chevron-left chevron"></i>
               </div>
            </div>
          </div>
        `,
        showConfirmButton: false,
        showCloseButton: true,
        background: 'var(--modal-bg)',
        color: 'var(--text-color-dark)',
        width: '350px',
        padding: '20px',
        customClass: {
            popup: 'swal-modern-mini-popup',
            title: 'swal-modern-mini-title',
            htmlContainer: 'swal-modern-mini-text',
            closeButton: 'swal-modern-mini-close'
        }
    });
}

// Hybrid bridge
window.login_setupLoginForm = login_setupLoginForm;
window.login_openSettingsModal = login_openSettingsModal;

console.log("[ESM Load] login-ui.js: Hybrid bridge established.");
