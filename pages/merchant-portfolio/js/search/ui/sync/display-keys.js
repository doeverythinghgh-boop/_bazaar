/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

window.portfolioResetSellerSearchDisplayKey = function (element, key, fallbackAr, fallbackEn) {
    if (!element) return;
    element.dataset.lkey = key;
    element.textContent = window.portfolioSellerSearchL(key, fallbackAr, fallbackEn);
};
