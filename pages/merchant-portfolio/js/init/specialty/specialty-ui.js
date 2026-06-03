/**
 * @file pages/merchant-portfolio/js/init/specialty/specialty-ui.js
 * @description UI rendering and chrome updates for the specialty selector.
 */

(function () {
    window.SpecialtyUI = {
        renderSelector: (user, entries, activeEntry, onSelect) => {
            const section = document.getElementById('portfolio-specialty-selector-section');
            const list = document.getElementById('portfolio-specialty-selector-list');
            if (!section || !list) return;

            const header = document.getElementById('portfolio-specialty-selector-header');
            if (header && !header.dataset.listenerBound) {
                header.dataset.listenerBound = 'true';
                header.addEventListener('click', (e) => {
                    e.preventDefault();
                    header.classList.toggle('active');
                });
            }

            // Trigger category tree fetching if not yet available, and hot-reload when done
            const isPlaceholder = !window.appCategoriesList;
            if (isPlaceholder && typeof window.fetchAppCategories === 'function') {
                window.fetchAppCategories().then(() => {
                    const currentActive = window.portfolioActiveSpecialty?.getActive ? window.portfolioActiveSpecialty.getActive() : activeEntry;
                    window.SpecialtyUI.renderSelector(user, entries, currentActive || activeEntry, onSelect);
                });
            }

            // Permissions Check
            const currentUser = typeof SessionManager !== 'undefined' ? SessionManager.getUser() : null;
            const isOwner = currentUser && (currentUser.user_key === user.user_key || currentUser.id === user.id);
            const PortfolioAPI = window.PortfolioAPI || {};
            const currentUserCapabilities = PortfolioAPI.resolveUserCapabilities ? PortfolioAPI.resolveUserCapabilities(currentUser) : null;
            const isSpecialUser = !!currentUserCapabilities?.isAdmin;
            const hasPermission = currentUser && (isOwner || isSpecialUser);

            if (!Array.isArray(entries) || entries.length === 0 || (!hasPermission && entries.length === 1)) {
                section.style.display = 'none';
                list.innerHTML = '';
                return;
            }

            const groups = {};
            entries.forEach(entry => {
                const mid = String(entry.mainId);
                if (!groups[mid]) groups[mid] = [];
                groups[mid].push(entry);
            });

            list.innerHTML = '';
            Object.entries(groups).forEach(([mainId, subEntries]) => {
                const card = document.createElement('div');
                card.className = 'specialty-main-card';

                const mainTitle = isPlaceholder ? '' : subEntries[0].mainTitle;
                const isPharmacy = subEntries.some(e => window.SpecialtyUtils.isPharmacyEntry(e));
                const isMedicalServices = String(mainId) === '20';
                const isCarSales = subEntries.some(e => window.SpecialtyUtils.isCarEntry(e));
                const isRealEstateSales = subEntries.some(e => window.SpecialtyUtils.isRealEstateEntry(e));

                card.innerHTML = `
                    <div class="specialty-main-header">
                        <div class="specialty-main-info">
                            <span class="specialty-main-title">${isPlaceholder ? '<span class="specialty-title-skeleton" style="width: 40px; height: 8px;"></span>' : mainTitle}</span>
                        </div>
                    </div>
                    <div class="specialty-subs-grid"></div>
                    <div class="specialty-card-footer" style="display: none;"></div>
                `;

                const grid = card.querySelector('.specialty-subs-grid');
                subEntries.forEach((entry) => {
                    const subItem = document.createElement('button');
                    subItem.type = 'button';
                    subItem.className = `specialty-sub-item${window.SpecialtyUtils.isSameEntry(entry, activeEntry) ? ' is-active' : ''}`;

                    const subImg = isPlaceholder ? 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7' : window.SpecialtyUtils.getSubImage(mainId, entry.subId);
                    const subTitle = entry.subTitle || entry.mainTitle;

                    subItem.innerHTML = `
                        <div class="specialty-sub-img-wrapper${isPlaceholder ? ' is-loading' : ''}">
                            <img src="${subImg}" class="specialty-sub-img" alt="${isPlaceholder ? 'loading' : subTitle}">
                        </div>
                        <span class="specialty-sub-title">${isPlaceholder ? '<span class="specialty-title-skeleton"></span>' : subTitle}</span>
                    `;

                    subItem.addEventListener('click', () => onSelect(entry, subItem));
                    grid.appendChild(subItem);
                });

                if (hasPermission) {
                    const footer = card.querySelector('.specialty-card-footer');
                    if (footer) {
                        footer.style.display = 'flex';
                        const manageBtn = document.createElement('button');
                        manageBtn.className = 'specialty-manage-btn';

                        const manageLabel = isMedicalServices ?
                            (typeof window.langu === 'function' ? window.langu('medical_services_settings_btn') : 'إعدادات الخدمات الطبية') :
                            (isCarSales ? 'إدارة السيارات' : (isRealEstateSales ? 'إدارة العقارات' : (typeof window.langu === 'function' ? (window.langu('mcp_title') || 'إدارة الخدمات') : 'إدارة الخدمات')));

                        manageBtn.innerHTML = `<i class="fas fa-sliders-h"></i> <span>${manageLabel}</span>`;

                        manageBtn.onclick = (e) => {
                            e.stopPropagation();
                            const currentActive = window.portfolioActiveSpecialty?.getActive ? window.portfolioActiveSpecialty.getActive() : null;
                            const activeEntry = currentActive && String(currentActive.mainId) === String(mainId)
                                ? currentActive
                                : subEntries[0];

                            if (window.SpecialtyUtils.isPharmacyEntry(activeEntry)) {
                                window.location.href = '/pages/merchant-portfolio/pharmacy-control-panel.html?user_key=' + encodeURIComponent(user.user_key);
                            } else {
                                const params = new URLSearchParams();
                                params.set('user_key', user.user_key);
                                params.set('MainCategory', String(mainId));

                                // Smart SubCategory injection
                                if (activeEntry && activeEntry.subId) {
                                    params.set('SubCategory', String(activeEntry.subId));
                                } else if (isCarSales) {
                                    params.set('SubCategory', '1');
                                } else if (isRealEstateSales && subEntries.length > 0) {
                                    params.set('SubCategory', String(subEntries[0].subId));
                                } else if (subEntries.length > 0) {
                                    params.set('SubCategory', String(subEntries[0].subId));
                                }

                                window.location.href = '/pages/merchant-control-panel/merchant-control-panel.html?' + params.toString();
                            }
                        };
                        footer.appendChild(manageBtn);
                    }
                }

                list.appendChild(card);
            });

            section.style.display = 'block';
        },


        applySpecialtyChrome: (user, entry, viewModel) => {
            const productsTitle = document.getElementById('portfolio-products-title');
            const featuredTitle = document.getElementById('commercial-featured-section-title');
            const searchPanelTitle = document.getElementById('portfolio-inline-search-title');
            const body = document.getElementById('port-body') || document.body;
            const mainContainer = document.getElementById('portfolio-main-container');
            const productsSection = document.getElementById('portfolio-products-section');
            const isCarSales = window.portfolioActiveSpecialty?.isCarEntry(entry);
            const isRealEstateSales = window.portfolioActiveSpecialty?.isRealEstateEntry(entry);
            const isPharmacy = window.portfolioActiveSpecialty?.isPharmacyEntry(entry);
            const accent = typeof window.resolveBusinessSpecialtyAccent === 'function'
                ? window.resolveBusinessSpecialtyAccent(window.portfolioActiveSpecialty.buildSelectionUser(user, entry))
                : null;

            if (productsTitle && viewModel?.catalogSectionTitle) {
                productsTitle.textContent = isRealEstateSales ? 'إعلانات العقارات' : (isCarSales ? 'إعلانات السيارات' : viewModel.catalogSectionTitle);
            }
            if (featuredTitle && viewModel?.featuredSectionTitle) {
                featuredTitle.textContent = isRealEstateSales ? 'عقارات مميزة' : (isCarSales ? 'سيارات مميزة' : viewModel.featuredSectionTitle);
            }
            if (searchPanelTitle && viewModel?.searchPanelTitle) {
                searchPanelTitle.textContent = isRealEstateSales ? 'بحث داخل العقارات' : (isCarSales ? 'بحث داخل السيارات' : viewModel.searchPanelTitle);
            }

            [body, mainContainer].forEach((node) => {
                if (!node) return;
                node.dataset.primaryCategory = String(entry?.mainId || '');
                node.dataset.catalogPresentation = String(viewModel?.catalogPresentation || '');
                node.dataset.listingType = isRealEstateSales ? 'real_estate' : (isCarSales ? 'cars' : 'products');
                node.dataset.activeSpecialtyMain = String(entry?.mainId || '');
                node.dataset.activeSpecialtySub = String(entry?.subId || '');
            });

            if (productsSection) {
                if ((!isPharmacy && viewModel?.hasCatalogAccess === false) || viewModel?.showProductsSection === false) {
                    if (window.__portfolioRestorationActive) {
                        console.log('[Diagnostic] applySpecialtyChrome: Keeping portfolio-products-section visible (restoration active).');
                    } else {
                        productsSection.style.display = 'none';
                    }
                } else {
                    productsSection.style.display = 'block';
                }
            }

            if (body && accent?.color) body.style.setProperty('--portfolio-specialty-accent', accent.color);
            if (body && accent?.soft) body.style.setProperty('--portfolio-specialty-accent-soft', accent.soft);
            if (body && accent?.border) body.style.setProperty('--portfolio-specialty-accent-border', accent.border);
        },

        resetSpecialtyRuntime: () => {
            // Save restoration state before wiping it
            const wasRestoring = !!window.__portfolioRestorationActive;
            const restorationSnapshot = window.__portfolioRestorationSnapshot || window.pharmacyRestoringState;

            window.pharmacyActiveCategoryId = null;
            window.pharmacyActiveSubCategoryId = null;

            // Do NOT clear pharmacyRestoringState if a restoration is actively in progress
            if (!wasRestoring) {
                window.pharmacyRestoringState = null;
            } else {
                console.log('[Diagnostic] resetSpecialtyRuntime: Skipping pharmacyRestoringState clear (restoration active).');
            }

            const subRow = document.getElementById('pharmacy-subcats-row');
            if (subRow) {
                subRow.innerHTML = '';
                subRow.style.display = 'none';
            }
            const filteredContainer = document.getElementById('pharmacy-filtered-products-container');
            if (filteredContainer) filteredContainer.remove();

            const featuredTrack = document.getElementById('commercial-featured-track');
            if (featuredTrack) featuredTrack.innerHTML = '';
            const featuredSection = document.getElementById('commercial-featured-section');
            if (featuredSection) featuredSection.style.display = 'none';

            // Resolve active specialty features to see if we should show section/grid skeletons
            const active = window.portfolioActiveSpecialty?.getActive();
            const viewModel = active?.viewModel;
            const isPharmacy = active?.isPharmacy;
            const hasCatalogAccess = viewModel ? viewModel.hasCatalogAccess !== false : true;
            const showProductsSection = viewModel ? viewModel.showProductsSection !== false : true;

            const productsGrid = document.getElementById('portfolio-products-grid');
            if (productsGrid) {
                productsGrid.innerHTML = '';
                if (hasCatalogAccess && showProductsSection && !isPharmacy) {
                    productsGrid.style.display = 'grid'; // display grid for generic skeletons
                } else {
                    productsGrid.style.display = 'none';
                }
            }

            // Only hide the section if no restoration is active and catalog access is disabled
            const productsSection = document.getElementById('portfolio-products-section');
            if (productsSection) {
                if (wasRestoring) {
                    console.log('[Diagnostic] resetSpecialtyRuntime: Keeping portfolio-products-section visible (restoration active).');
                } else if (!hasCatalogAccess || !showProductsSection) {
                    productsSection.style.display = 'none';
                } else {
                    productsSection.style.display = 'block'; // Assert visibility for loader skeletons
                }
            }
        }
    };
})();
