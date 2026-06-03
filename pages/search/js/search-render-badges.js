/**
 * @file search-render-badges.js
 * @description Logic for generating and managing search filter badges.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


/**
 * @function generateBadgesHTML
 * @description Generates HTML for search filter badges based on current state.
 */
function generateBadgesHTML(mode) {
    console.log(` [Search Module - Badges] generateBadgesHTML() Started for mode: ${mode}`);
    const { searchModalInput, mainCatDisplay, subCatDisplay } = searchElements;
    const searchTerm = searchModalInput ? searchModalInput.value.trim() : "";
    const mainCatText = (mainCatDisplay && mainCatDisplay.getAttribute('data-customized') === 'true') ? mainCatDisplay.textContent : "";
    const subCatText = (subCatDisplay && subCatDisplay.getAttribute('data-customized') === 'true') ? subCatDisplay.textContent : "";
    const modeText = mode === 'merchants' ? window.langu('search_mode_sellers') : window.langu('search_mode_products');

    let filterCount = 0;
    let html = `<span id="search-badge-mode" class="search-badge mode">${modeText}</span>`;

    if (typeof merchantContext !== 'undefined' && merchantContext && merchantContext.name) {
        console.info(` [Search Module - Badges] Adding merchant badge: ${merchantContext.name}`);
        filterCount++;
        html += `
          <span id="search-badge-merchant" class="search-badge merchant" style="background-color: var(--primary-color-light); color: var(--dark-blue); border-color: var(--primary-color-light);">
              <i id="search-merchant-icon" class="fas fa-store"></i> ${window.langu('search_merchant_prefix') || 'مقدم الخدمة'}: ${merchantContext.name}
              <i id="search-badge-merchant-remove" class="fas fa-times badge-remove" onclick="window.removeSearchFilter('merchant')"></i>
          </span>`;
    }

    if (searchTerm) {
        console.info(` [Search Module - Badges] Adding search term badge: ${searchTerm}`);
        filterCount++;
        html += `
          <span id="search-badge-query" class="search-badge query">
              <i id="search-query-icon" class="fas fa-font"></i> ${searchTerm}
              <i id="search-badge-query-remove" class="fas fa-times badge-remove" onclick="window.removeSearchFilter('query')"></i>
          </span>`;
    }

    if (mainCatText) {
        console.info(` [Search Module - Badges] Adding main category badge: ${mainCatText}`);
        filterCount++;
        html += `
          <span id="search-badge-main-cat" class="search-badge cat">
              <i id="search-main-cat-icon" class="fas fa-cubes"></i> ${mainCatText}
              <i id="search-badge-main-cat-remove" class="fas fa-times badge-remove" onclick="window.removeSearchFilter('main-cat')"></i>
          </span>`;
    }

    if (subCatText) {
        console.info(` [Search Module - Badges] Adding sub category badge: ${subCatText}`);
        filterCount++;
        html += `
          <span id="search-badge-sub-cat" class="search-badge sub-cat">
              <i id="search-sub-cat-icon" class="fas fa-cube"></i> ${subCatText}
              <i id="search-badge-sub-cat-remove" class="fas fa-times badge-remove" onclick="window.removeSearchFilter('sub-cat')"></i>
          </span>`;
    }

    console.log(` [Search Module - Badges] generateBadgesHTML() Finished. Generated ${filterCount} filter badges.`);
    return { html, filterCount };
}

/**
 * @function removeSearchFilter
 * @description Removes a specific search filter and re-executes search.
 */
window.removeSearchFilter = function (type) {
    console.log(` [Search Module - Badges] removeSearchFilter() Started for type: ${type}`);
    const { searchModalInput, mainCatTrigger, subCatTrigger, mainCatDisplay, subCatDisplay, searchTextDisplay } = searchElements;

    if (type === 'query') {
        console.info(" [Search Module - Badges] Clearing search query");
        if (searchModalInput) searchModalInput.value = "";
        if (searchTextDisplay) {
            searchTextDisplay.textContent = 'نص';
            searchTextDisplay.dataset.lkey = "search_modal_input_placeholder";
        }
    } else if (type === 'main-cat') {
        console.info(" [Search Module - Badges] Clearing main category and sub category");
        if (mainCatTrigger) mainCatTrigger.dataset.value = "";
        if (mainCatDisplay) {
            mainCatDisplay.textContent = 'الرئيسي';
            mainCatDisplay.dataset.lkey = "search_modal_main_category_label";
            mainCatDisplay.removeAttribute('data-customized');
        }
        // Also clear sub if main is cleared
        if (subCatTrigger) {
            subCatTrigger.dataset.value = "";
            subCatTrigger.classList.add("disabled");
        }
        if (subCatDisplay) {
            subCatDisplay.textContent = 'الفرعي';
            subCatDisplay.dataset.lkey = "search_modal_sub_category_label";
            subCatDisplay.removeAttribute('data-customized');
        }
    } else if (type === 'sub-cat') {
        console.info(" [Search Module - Badges] Clearing sub category");
        if (subCatTrigger) subCatTrigger.dataset.value = "";
        if (subCatDisplay) {
            subCatDisplay.textContent = 'الفرعي';
            subCatDisplay.dataset.lkey = "search_modal_sub_category_label";
            subCatDisplay.removeAttribute('data-customized');
        }
    } else if (type === 'merchant') {
        console.info(" [Search Module - Badges] Clearing merchant context");
        merchantContext = null;
        // Reset search title if active
        const searchModalTitle = document.getElementById('search-modal-title');
        if (searchModalTitle) {
            searchModalTitle.textContent = window.langu('search_modal_title') || 'البحث';
            searchModalTitle.dataset.lkey = 'search_modal_title';
        }
    }

    if (typeof SearchState !== 'undefined') SearchState.save();
    if (typeof SearchFlow !== 'undefined') {
        console.info(" [Search Module - Badges] Triggering SearchFlow.execute() after filter removal");
        SearchFlow.execute();
    }
    console.log(" [Search Module - Badges] removeSearchFilter() Finished");
};
