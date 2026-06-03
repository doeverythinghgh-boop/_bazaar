/**
 * @file js/app-behavior.js
 * @description Centralized configuration for application behavior.
 * 
 * CRITICAL WARNING 
 * THIS FILE MUST NEVER BE CONVERTED TO ES MODULE (ESM) AND MUST NEVER BE LOADED AS A MODULE (type="module")!
 * IT MUST ALWAYS REMAIN A STANDARD JAVASCRIPT SCRIPT IN THE ENTIRE PROJECT.
 * 
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

const AppBehavior = {
    //app Version
    appVersion: "30",

    // --- 1. Maintenance Mode ---
    // If true, the application will display a maintenance message and stop further script execution.
    isUnderMaintenance: false,

    // --- 2. Admin Restrictions ---
    // If true, all standard Admin features are disabled for regular admins,
    // and only the configured Super Admin retains administrative privileges.
    disableAdminFeatures: false,

    // --- 3. Global Security Shield ---
    // If false, all client-side security protections are disabled and security-shield.js is not loaded.
    enableSecurityShield: false,

    // --- 4. Global PWA Switch ---
    // If false, all PWA-related resources and behaviors are disabled.
    enablePWA: false,

    // --- 5. Product App Price Field ---
    // If false, the "realPrice" field is hidden in the Add, Edit, and View Product forms.
    enableAppPrice: false,

    // --- 5.1. Product Original Price Field ---
    // If false, the "originalPrice" field is hidden in the Add, Edit, and View Product forms.
    enableOriginalPrice: false,

    // --- 6. Development Error Monitor ---
    // If false, the local-only development error monitor is not loaded.
    enableDevErrorMonitor: true,

    // --- 7. Product Auto-Approval Mode ---
    // If true, products are accepted immediately (is_approved=1) and the admin is NOT notified.
    // If false, products are NOT accepted immediately (is_approved=0, under review) and the admin IS notified.
    autoApproveNotifyAdmin: true,

    // --- 8. WhatsApp Phone Verification ---
    // If false, registration/profile flows skip the WhatsApp OTP verification step after phone duplication checks pass.
    enableWhatsappPhoneVerification: true
};

// Hybrid bridge
window.AppBehavior = AppBehavior;

