/**
 * @file pages/merchant-portfolio/js/search/ui/portfolio-search-ui-elements.js
 * @description DOM element selectors for merchant search UI.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

window.portfolioGetSellerSearchTriggerElements = function () {
    return {
        // Modal & Overlays
        panel: document.getElementById('portfolio-search-modal-overlay'),
        modalContainer: document.getElementById('portfolio-search-modal-container'),

        // Triggers & Buttons
        toggleButton: document.getElementById('portfolio-merchant-search-fab-btn'),
        closeButton: document.getElementById('btn-portfolio-search-modal-close'),
        clearButton: document.getElementById('btn-portfolio-modal-reset'),
        searchButton: document.getElementById('btn-portfolio-modal-perform-search'),
        clearTextButton: document.getElementById('btn-portfolio-search-modal-clear-text'),

        // Search Input (Integrated)
        inputField: document.getElementById('portfolio-search-modal-input'),

        // Filters (Inside Modal)
        mainTrigger: document.getElementById('portfolio-modal-main-category-trigger'),
        mainDisplay: document.getElementById('portfolio-modal-main-category-display'),
        subTrigger: document.getElementById('portfolio-modal-sub-category-trigger'),
        subDisplay: document.getElementById('portfolio-modal-sub-category-display'),
        sortTrigger: document.getElementById('portfolio-modal-sort-trigger'),
        sortDisplay: document.getElementById('portfolio-modal-sort-display'),

        // Specialized Containers
        resultsArea: document.getElementById('portfolio-search-modal-results'),

        // External Controls
        loadMoreButton: document.getElementById('btn-load-more-products')
    };
};
