/**
 * @file pages/login/login-init.js
 * @description Login page boot and shared UI actions.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

let loginIsSubmitting = false;

export async function loadPage(params) {
    try {
        const userSession = window.SessionManager?.getUser ? window.SessionManager.getUser() : window.userSession;

        if (userSession) {
            console.log("[Login] User already logged in, redirecting to profile.");
            window.location.href = "/pages/home/home.html";
            return;
        }

        const loginFormWrapper = document.getElementById("login_form-wrapper");
        if (loginFormWrapper) {
            loginFormWrapper.style.display = "flex";
        }

        if (typeof window.login_setupLoginForm === 'function') {
            window.login_setupLoginForm();
        }
    } catch (error) {
        console.error(" Error loadPage:", error);
    }
}

export function login_handleRegisterClick(e) {
    e.preventDefault();
    window.location.href = "/pages/register/register.html";
}

export function login_handleGuestLogin(event) {
    event.preventDefault();
    if (loginIsSubmitting) {
        return;
    }
    loginIsSubmitting = true;
    const guestUser = {
        username: "Guest",
        is_guest: true,
        location: "",
        account_type: 1,
        user_key: "guest_user",
        notifications_enabled: false
    };

    const loginPromise = window.SessionManager?.login 
        ? window.SessionManager.login(guestUser) 
        : Promise.reject("SessionManager.login not available");

    loginPromise.finally(() => {
        loginIsSubmitting = false;
    });
}

// Set initial submitting state
window.loginIsSubmitting = loginIsSubmitting;

// Hybrid bridge
window.loadPage = loadPage;
window.login_handleRegisterClick = login_handleRegisterClick;
window.login_handleGuestLogin = login_handleGuestLogin;

console.log("[ESM Load] login-init.js: Hybrid bridge established.");
