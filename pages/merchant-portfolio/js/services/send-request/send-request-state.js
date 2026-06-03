/**
 * @file pages/merchant-portfolio/js/send-request-state.js
 * @description Centralized state management for the Merchant Direct Request page.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


window.RequestState = {
    merchant: null,
    attachedImages: [],
    isRecording: false,
    maxImages: 4
};
