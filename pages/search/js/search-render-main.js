/**
 * @file search-render-main.js
 * @description Core logic for rendering search results list.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


/**
 * @function displaySearchResults
 * @description Displays search results in the UI, applying sort options if any.
 *   Attaches click events to product cards to open details modal.
 * @param {Array<Object>} results - Array of product objects.
 * @param {string} mode - "products" or 'merchants'.
 * @param {boolean} append - Whether to append to existing results.
 * @returns {void}
 */
/**
 * @function displaySearchResults
 * @description Displays search results in the UI, applying sort options if any.
 *   Attaches click events to product cards to open details modal.
 * @param {Array<Object>} results - Array of product objects.
 * @param {string} mode - "products" or 'merchants'.
 * @param {boolean} append - Whether to append to existing results.
 * @returns {void}
 */
function displaySearchResults(results, mode = "products", append = false) {
    console.log(` [Search Module - Render] displaySearchResults() Started for mode: ${mode}, append: ${append}, results count: ${results ? results.length : 0}`);
    const { searchResultsContainer, sortTrigger } = searchElements;

    if (!results || !Array.isArray(results)) {
        console.warn(" [Search Module - Render] displaySearchResults called with invalid results array");
        return;
    }

    let sortedResults = [...results];
    const sortValue = sortTrigger ? (sortTrigger.dataset.value || "default") : "default";

    if (mode === "products") {
        console.info(` [Search Module - Render] Applying sort: ${sortValue}`);
        const getSortMeta = (item) => {
            const hidden = typeof window.ProductCategoryUi?.shouldHidePriceForProduct === 'function'
                ? window.ProductCategoryUi.shouldHidePriceForProduct(item)
                : false;
            const price = parseFloat(item.product_price);
            return {
                hidden,
                price: Number.isFinite(price) ? price : 0
            };
        };

        if (sortValue === "price-asc") {
            sortedResults.sort((a, b) => {
                const metaA = getSortMeta(a);
                const metaB = getSortMeta(b);
                if (metaA.hidden !== metaB.hidden) return metaA.hidden ? 1 : -1;
                return metaA.price - metaB.price;
            });
        } else if (sortValue === "price-desc") {
            sortedResults.sort((a, b) => {
                const metaA = getSortMeta(a);
                const metaB = getSortMeta(b);
                if (metaA.hidden !== metaB.hidden) return metaA.hidden ? 1 : -1;
                return metaB.price - metaA.price;
            });
        }
    }

    // Initial load (not appending)
    if (!append) {
        console.info(" [Search Module - Render] Rendering new result set");
        const { html: badgesHTML, filterCount } = (typeof generateBadgesHTML === 'function') ? generateBadgesHTML(mode) : { html: '', filterCount: 0 };

        if (sortedResults.length === 0) {
            console.info(" [Search Module - Render] No results found, displaying empty state");
            let noResultsHTML = `
        <div id="search-no-results-container">
          <div id="search-no-results-illustration">
              <i id="search-no-results-icon" class="fas fa-search-minus search-no-results-icon"></i>
          </div>
          <div id="search-no-results-title" class="search-no-results-title">${window.langu('search_modal_no_results') || 'لم يتم العثور على نتائج'}</div>`;

            // Only show criteria block if there are actual filters applied
            if (filterCount > 0) {
                noResultsHTML += `
          <div id="search-no-results-desc" class="search-no-results-desc">
              <div id="search-no-results-hint" class="search-no-results-hint">${window.langu('search_no_results_hint') || 'لم نجد أي تطابق للمعايير التالية:'}</div>
              <div id="search-results-header-empty" class="search-results-header">
                  <div id="search-label-row-empty" class="search-label-row">
                      <span id="search-results-label-empty" class="search-results-label">${window.langu('search_results_criteria_label') || 'عناصر البحث'}</span>
                      <button id="search-reset-all-btn-empty" class="search-reset-all-btn" onclick="window.resetSearchFilters()" title="${window.langu('search_modal_reset_filters') || 'إعادة تعيين'}">
                          <i id="search-reset-all-icon-empty" class="fas fa-sync-alt"></i> ${window.langu('search_modal_reset_filters') || 'إعادة تعيين'}
                      </button>
                  </div>
                  <div id="search-badges-container-empty" class="search-badges-container">
                      ${badgesHTML}
                  </div>
              </div>
          </div>`;
            }

            noResultsHTML += `</div>`;
            searchResultsContainer.innerHTML = noResultsHTML;
            console.log(" [Search Module - Render] displaySearchResults() Finished (Empty State)");
            return;
        }

        let resultsHTML = `
      <div id="search-results-header" class="search-results-header">
          <div id="search-label-row" class="search-label-row">
              <span id="search-results-label" class="search-results-label">${window.langu('search_results_criteria_label') || 'عناصر البحث'}</span>
              <button id="search-reset-all-btn" class="search-reset-all-btn" onclick="window.resetSearchFilters()" title="${window.langu('search_modal_reset_filters') || 'إعادة تعيين'}">
                  <i id="search-reset-all-icon" class="fas fa-sync-alt"></i> ${window.langu('search_modal_reset_filters') || 'إعادة تعيين'}
             </button>
          </div>
          <div id="search-badges-container" class="search-badges-container active-results">
              ${badgesHTML}
          </div>
      </div>
      <div id="search-results-grid" class="search-results-grid">`;

        console.info(` [Search Module - Render] Generating HTML for ${sortedResults.length} items`);
        sortedResults.forEach((item) => {
            resultsHTML += (mode === 'merchants' ? generateMerchantResultHTML(item) : generateSearchResultHTML(item));
        });

        resultsHTML += "</div>";

        // Add Load More Button Placeholder
        resultsHTML += `
      <div id="search-load-more-container" style="text-align: center; margin: 30px 0;">
        <button id="search-load-more-btn" class="search-load-more-btn" onclick="window.loadMoreSearch()">
          ${window.langu('search_modal_load_more') || 'عرض المزيد'}
        </button>
      </div>`;

        searchResultsContainer.innerHTML = resultsHTML;
        console.info(" [Search Module - Render] Results injected into DOM");
    } else {
        // Appending results
        console.info(" [Search Module - Render] Appending to existing result set");
        const grid = document.getElementById('search-results-grid');
        if (grid) {
            let appendHTML = "";
            console.info(` [Search Module - Render] Generating HTML for ${sortedResults.length} appended items`);
            sortedResults.forEach((item) => {
                appendHTML += (mode === 'merchants' ? generateMerchantResultHTML(item) : generateSearchResultHTML(item));
            });
            grid.insertAdjacentHTML('beforeend', appendHTML);
            console.info(" [Search Module - Render] Appended results injected into DOM");
        } else {
            console.warn(" [Search Module - Render] search-results-grid not found, cannot append");
        }
    }

    // Manage Load More button visibility
    const loadMoreBtn = document.getElementById('search-load-more-btn');
    if (loadMoreBtn) {
        loadMoreBtn.disabled = false;
        loadMoreBtn.innerHTML = window.langu('search_modal_load_more') || 'عرض المزيد';
        // If we got fewer results than the limit, hide the button
        if (results.length < SEARCH_LIMIT) {
            console.info(" [Search Module - Render] Results less than limit, hiding 'Load More' button");
            loadMoreBtn.style.display = 'none';
        } else {
            loadMoreBtn.style.display = 'inline-block';
        }
    }

    // Click events for products (must be re-attached or delegated)
    if (mode === "products") {
        console.info(" [Search Module - Render] Attaching click listeners to product cards");
        const items = append ? document.querySelectorAll(".search-result-item:not(.merchant-result)") : searchResultsContainer.querySelectorAll(".search-result-item:not(.merchant-result)");
        items.forEach((item) => {
            // Avoid double listeners
            if (!item.dataset.listenerAttached) {
                item.addEventListener("click", () => {
                    const productKey = item.dataset.productKey;
                    console.log(` [Search Module - Render] Product card clicked: ${productKey}`);
                    const productData = currentResults.find((p) => p.product_key === productKey);
                    if (typeof loadProductView === 'function') {
                        loadProductView(productData, true);
                    }
                });
                item.dataset.listenerAttached = "true";
            }
        });
    }
    console.log(" [Search Module - Render] displaySearchResults() Finished");
}
