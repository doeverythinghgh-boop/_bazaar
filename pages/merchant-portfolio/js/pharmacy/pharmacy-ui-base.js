/**
 * @file pages/merchant-portfolio/js/pharmacy/pharmacy-ui-base.js
 * @description Core helpers and shared logic for pharmacy UI.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


(function () {
    const { state, fetchJsonCached, loadPharmacyContext } = window.pharmacyStorefrontData;

    function getLanguageValue(arValue, enValue) {
        return (window.app_language === 'en' ? (enValue || arValue) : (arValue || enValue || ''));
    }

    function renderFeedback(container, options = {}) {
        const iconClass = options.iconClass || 'fas fa-box-open';
        const extraClass = options.isLoading ? ' is-loading' : '';
        container.innerHTML = `
            <div class="pharmacy-feedback${extraClass}">
                <i class="${iconClass}${options.isLoading ? ' fa-spin' : ''}"></i>
                <p>${options.message || ''}</p>
            </div>
        `;
    }

    window.pharmacyUIBase = {
        state,
        fetchJsonCached,
        loadPharmacyContext,
        getLanguageValue,
        renderFeedback
    };
})();
