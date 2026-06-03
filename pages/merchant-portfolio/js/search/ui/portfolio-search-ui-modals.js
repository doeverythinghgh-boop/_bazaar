/**
 * @file pages/merchant-portfolio/js/search/ui/portfolio-search-ui-modals.js
 * @description Swal-based interactive modals for merchant search.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

window.portfolioShowQuickSelectModal = async function (title, options, currentValue, callback, theme = 'primary') {
    if (typeof Swal === 'undefined') return;

    await Swal.fire({
        title: title,
        html: `
            <div class="quick-select-list">
                ${options.map((option) => `
                    <div class="quick-select-item ${String(option.value) === String(currentValue) ? 'active' : ''}"
                         data-value="${option.value}"
                         data-label="${option.label}">
                        <span class="quick-select-text">${option.label}</span>
                        ${String(option.value) === String(currentValue) ? '<i class="fas fa-check-circle quick-select-check"></i>' : ''}
                    </div>
                `).join('')}
            </div>
        `,
        showConfirmButton: false,
        showCloseButton: true,
        width: 'min(90vw, 320px)',
        customClass: {
            container: 'portfolio-search-swal-container',
            popup: `swal-modern-mini-popup swal-theme-${theme}`,
            title: 'swal-modern-mini-title',
            htmlContainer: 'swal-modern-mini-text'
        },
        didOpen: () => {
            const popup = Swal.getPopup();
            popup.querySelectorAll('.quick-select-item').forEach((item) => {
                item.addEventListener('click', () => {
                    callback({
                        value: item.dataset.value,
                        label: item.dataset.label
                    });
                    Swal.close();
                });
            });
        }
    });
};

window.portfolioOpenSellerSearchTextModal = async function () {
    const searchState = window.portfolioEnsureSellerSearchState();
    if (typeof Swal === 'undefined') return;

    const result = await Swal.fire({
        title: window.portfolioSellerSearchL('port_search_text_title', 'ابحث باسم المنتج أو الوصف', 'Search by product name or description'),
        input: 'text',
        inputValue: searchState.query,
        inputPlaceholder: window.portfolioSellerSearchL('port_search_text_placeholder', 'أدخل الاسم أو الوصف', 'Enter product name or description'),
        showCancelButton: true,
        confirmButtonText: window.portfolioSellerSearchL('alert_confirm_btn', 'موافق', 'OK'),
        cancelButtonText: window.portfolioSellerSearchL('alert_cancel_btn', 'إلغاء', 'Cancel'),
        buttonsStyling: false,
        customClass: {
            container: 'portfolio-search-swal-container',
            popup: 'swal-modern-mini-popup swal-theme-dark-blue',
            title: 'swal-modern-mini-title',
            input: 'swal-modern-mini-input',
            confirmButton: 'swal-modern-mini-confirm',
            cancelButton: 'swal-modern-mini-cancel'
        }
    });

    if (result.value !== undefined) {
        const nextQuery = String(result.value || '').trim();
        if (window.PortfolioStore?.patchSellerSearch) {
            window.PortfolioStore.patchSellerSearch({ query: nextQuery }, { source: 'merchant-search-text' });
        } else {
            searchState.query = nextQuery;
        }

        const userKey = new URLSearchParams(window.location.search).get('user_key');
        if (typeof window.portfolioSaveSearchStateToLocal === 'function') {
            window.portfolioSaveSearchStateToLocal(userKey);
        }
    }
};
