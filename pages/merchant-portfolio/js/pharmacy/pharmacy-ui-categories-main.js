/**
 * @file pages/merchant-portfolio/js/pharmacy/pharmacy-ui-categories-main.js
 * @description Specialized logic for rendering the main pharmacy category catalog.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


(function () {
    const { getLanguageValue, renderFeedback, loadPharmacyContext, state } = window.pharmacyUIBase;
    const { ensureSubcategoriesRow } = window.pharmacyUILayout;

    async function renderPharmacyCatalog(grid) {
        if (state.isRenderingCatalog) {
            console.log(`[Diagnostic] renderPharmacyCatalog: Already in progress. Skipping duplicate call.`);
            return;
        }

        // CRITICAL: If the user is already viewing a sub-category, do NOT overwrite it with the main catalog
        if (window.pharmacyActiveSubCategoryId) {
            console.log(`[Diagnostic] renderPharmacyCatalog: User is already in sub-category ${window.pharmacyActiveSubCategoryId}. Skipping main catalog re-render.`);
            return;
        }

        state.isRenderingCatalog = true;

        console.log(`[Mirror][Start] renderPharmacyCatalog: Initializing pharmacy UI...`);
        console.time('[Mirror][Runtime] renderPharmacyCatalog');

        const urlParams = new URLSearchParams(window.location.search);
        const userKey = urlParams.get('user_key');

        const empty = document.getElementById('portfolio-empty');
        if (empty) empty.style.display = 'none';

        // NEW: Detect if we should suppress the loader because search is already active/restoring
        let searchIsActive = false;
        if (typeof window.portfolioEnsureSellerSearchState === 'function') {
            const ss = window.portfolioEnsureSellerSearchState();
            if (ss.isActive) searchIsActive = true;
        }
        if (!searchIsActive && window.pharmacyRestoringState && window.pharmacyRestoringState.isSearchResult === true) {
            searchIsActive = true;
        }

        if (!searchIsActive) {
            grid.style.display = 'block';
            renderFeedback(grid, {
                isLoading: true,
                iconClass: 'fas fa-spinner',
                message: (typeof window.portfolioSellerSearchL === 'function') ? window.portfolioSellerSearchL('search_loading_status', 'جاري التحميل...', 'Loading...') : 'Loading...'
            });
        }

        try {
            console.log(`[Diagnostic] Loading pharmacy context...`);
            const contextLoadStart = performance.now();
            const context = await loadPharmacyContext(userKey);
            console.log(`[Diagnostic][${performance.now().toFixed(0)}ms] Pharmacy context loaded in ${(performance.now() - contextLoadStart).toFixed(0)}ms.`);

            const categories = Array.isArray(context?.mergedCategories) ? context.mergedCategories : [];
            const hiddenMain = new Set(context?.hiddenMainIds || []);

            state.hiddenSub = new Set(context?.hiddenSubIds || []);
            state.hiddenProducts = new Set(context?.hiddenProductIds || []);

            const row = ensureSubcategoriesRow(grid);
            const filteredProductsContainer = document.getElementById('pharmacy-filtered-products-container');

            // Re-use searchIsActive from above for consistency
            if (filteredProductsContainer && !searchIsActive) {
                console.log(`[Pharmacy UI] Removing existing filtered container to refresh catalog...`);
                filteredProductsContainer.remove();
            } else if (filteredProductsContainer && searchIsActive) {
                console.log(`[Pharmacy UI] Preserving existing search results during catalog render.`);
            }

            console.log(`[Developer] Rendering pharmacy catalog. UI optimized for 72px cards with marquee animation for active titles.`);

            if (searchIsActive) {
                console.log(`[Pharmacy UI] Categories suppressed because search is active or restoring.`);
            }

            console.log(`[Diagnostic] Preparing grid for ${categories.length} categories...`);

            // Surgical clear: Do NOT use innerHTML = '' if search is active/restoring
            if (searchIsActive) {
                console.log(`[Pharmacy UI] Search active. Surgically removing only category cards.`);
                grid.querySelectorAll('.pharmacy-category-card').forEach(c => c.remove());
                // Also remove any existing sub-category rows if present
                grid.querySelectorAll('.pharmacy-subcats-row').forEach(r => r.remove());
            } else {
                grid.innerHTML = '';
            }

            grid.classList.add('pharmacy-category-grid');
            grid.style.display = 'flex';

            const fragment = document.createDocumentFragment();
            categories.forEach((category) => {
                if (hiddenMain.has(String(category.id))) return;

                const card = document.createElement('button');
                card.type = 'button';
                card.className = 'portfolio-product-card pharmacy-category-card pharmacy-cat-card';
                card.dataset.categoryId = category.id;

                // Set initial display based on search state
                if (searchIsActive) {
                    card.style.display = 'none';
                }

                card.innerHTML = `
                    <i class="${category.icon || 'fas fa-pills'}"></i>
                    <h3>${getLanguageValue(category.title, category.name_en)}</h3>
                `;

                card.addEventListener('click', function (e) {
                    if (e && e.isTrusted) {
                        console.log(`[Pharmacy UI] Main Category Selected: ${category.id}. Clearing persistent search.`);

                        // Clear persistent search on category switch
                        if (typeof window.portfolioClearSearchStateFromLocal === 'function') {
                            window.portfolioClearSearchStateFromLocal(userKey);
                        }

                        console.log(`[Scroll Debug] Real user clicked main category. Search text and filters preserved.`);
                        const fc = document.getElementById('pharmacy-filtered-products-container');
                        if (fc) fc.remove();
                    }
                    window.pharmacyActiveCategoryId = category.id;
                    grid.querySelectorAll('.pharmacy-category-card').forEach((element) => element.classList.remove('is-active'));
                    card.classList.add('is-active');

                    // Proactively save state on real user click only.
                    if (e && e.isTrusted && typeof window.portfolioSaveNavigationState === 'function') {
                        window.portfolioSaveNavigationState(userKey);
                    }

                    if (window.pharmacyUICategories && typeof window.pharmacyUICategories.showPharmacySubCategories === 'function') {
                        window.pharmacyUICategories.showPharmacySubCategories(category);
                    }
                });

                fragment.appendChild(card);
            });

            const domStart = performance.now();
            grid.appendChild(fragment);
            console.log(`[Diagnostic][${performance.now().toFixed(0)}ms] DOM fragment appended in ${(performance.now() - domStart).toFixed(0)}ms.`);

            // Detect overflow for marquee animation
            grid.querySelectorAll('.pharmacy-category-card h3').forEach(h3 => {
                if (h3.scrollWidth > h3.clientWidth) {
                    h3.classList.add('can-marquee');
                }
            });

            if (empty) empty.style.display = 'none';
            if (row) row.style.display = 'none';

            if (window.pharmacyRestoringState && window.pharmacyRestoringState.activeCategoryId) {
                const targetCard = grid.querySelector(`.pharmacy-category-card[data-category-id="${window.pharmacyRestoringState.activeCategoryId}"]`);
                if (targetCard) {
                    targetCard.click();
                    if (window.pharmacyRestoringState.gridScroll) {
                        setTimeout(() => { grid.scrollLeft = window.pharmacyRestoringState.gridScroll; }, 50);
                    }
                } else {
                    window.pharmacyRestoringState = null;
                }
            }
        } catch (error) {
            console.error('[Portfolio Pharmacy] Failed to render pharmacy catalog:', error);
            renderFeedback(grid, {
                iconClass: 'fas fa-exclamation-circle',
                message: window.portfolioSellerSearchL('port_fetch_error_text', 'حدث خطأ أثناء جلب الخدمات', 'Unable to load products')
            });
        } finally {
            state.isRenderingCatalog = false;
            console.timeEnd('[Mirror][Runtime] renderPharmacyCatalog');
            console.log(`[Mirror][End] renderPharmacyCatalog: Finished.`);
        }
    }

    window.pharmacyUICategories = window.pharmacyUICategories || {};
    window.pharmacyUICategories.renderPharmacyCatalog = renderPharmacyCatalog;
})();
