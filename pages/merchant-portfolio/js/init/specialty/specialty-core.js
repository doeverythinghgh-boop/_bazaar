/**
 * @file pages/merchant-portfolio/js/init/specialty/specialty-core.js
 * @description Core business logic and state orchestration for the specialty selector.
 */

(function () {
    window.SpecialtyCore = {
        parseBusinessMap: (user) => {
            if (typeof window.parseBusinessCategorySelection === 'function') {
                return window.parseBusinessCategorySelection(user?.business_category);
            }
            if (typeof window.portfolioParseBusinessCategory === 'function') {
                return window.portfolioParseBusinessCategory(user?.business_category);
            }
            return {};
        },

        buildEntries: (user) => {
            const map = window.SpecialtyCore.parseBusinessMap(user);
            const entries = [];
            const utils = window.SpecialtyUtils;

            Object.entries(map || {}).forEach(([mainId, subIds]) => {
                const normalizedMain = String(mainId || '').trim();
                if (!normalizedMain) return;
                const normalizedSubs = Array.isArray(subIds) ? subIds.map((item) => String(item || '').trim()).filter(Boolean) : [];
                
                if (!normalizedSubs.length) {
                    entries.push({
                        mainId: normalizedMain,
                        subId: '',
                        key: `${normalizedMain}:`,
                        mainTitle: utils.getCategoryTitle(normalizedMain) || `#${normalizedMain}`,
                        subTitle: '',
                        icon: utils.getMainIcon(normalizedMain)
                    });
                    return;
                }
                normalizedSubs.forEach((subId) => {
                    entries.push({
                        mainId: normalizedMain,
                        subId,
                        key: `${normalizedMain}:${subId}`,
                        mainTitle: utils.getCategoryTitle(normalizedMain) || `#${normalizedMain}`,
                        subTitle: utils.getCategoryTitle(normalizedMain, subId) || `#${subId}`,
                        icon: utils.getMainIcon(normalizedMain)
                    });
                });
            });
            return entries;
        },

        setActiveSpecialty: (user, entry, options = {}) => {
            const utils = window.SpecialtyUtils;
            const ui = window.SpecialtyUI;
            const userKey = utils.getUserKey(user);
            if (!entry) return null;

            const viewModel = window.SpecialtyCore.resolveViewModel(user, entry);
            const payload = {
                mainId: String(entry.mainId || ''),
                subId: String(entry.subId || ''),
                key: String(entry.key || `${entry.mainId}:${entry.subId || ''}`),
                mainTitle: entry.mainTitle || '',
                subTitle: entry.subTitle || '',
                icon: entry.icon || 'fas fa-store',
                viewModel,
                isPharmacy: window.portfolioActiveSpecialty?.isPharmacyEntry ? window.portfolioActiveSpecialty.isPharmacyEntry(entry) : false,
                isCarSales: window.portfolioActiveSpecialty?.isCarEntry ? window.portfolioActiveSpecialty.isCarEntry(entry) : false,
                isRealEstateSales: window.portfolioActiveSpecialty?.isRealEstateEntry ? window.portfolioActiveSpecialty.isRealEstateEntry(entry) : false
            };

            utils.persistSelection(userKey, payload);
            ui.applySpecialtyChrome(user, payload, viewModel);

            const store = utils.getStore();
            if (store?.patch) {
                store.patch({
                    activeSpecialty: payload,
                    specialtyViewModel: viewModel || null
                }, {
                    source: options.source || 'active-specialty'
                });
            } else if (window.portfolioState) {
                window.portfolioState.activeSpecialty = payload;
                window.portfolioState.specialtyViewModel = viewModel || null;
            }

            return payload;
        },

        resolveViewModel: (user, entry) => {
            if (!user || !entry || typeof window.resolvePortfolioSpecialtyViewModel !== 'function') return null;
            return window.resolvePortfolioSpecialtyViewModel(window.portfolioActiveSpecialty.buildSelectionUser(user, entry));
        },

        refreshProducts: async (user) => {
            const utils = window.SpecialtyUtils;
            const ui = window.SpecialtyUI;
            const store = utils.getStore();
            const state = store?.getState ? store.getState() : window.portfolioState;
            const active = state?.activeSpecialty;
            const userKey = utils.getUserKey(user);
            const grid = document.getElementById('portfolio-products-grid');

            // If a navigation restoration is active, skip the destructive reset and fresh fetch
            if (window.__portfolioRestorationActive) {
                console.log('[Diagnostic] refreshProducts: Skipping (restoration active). Will resume after restoration completes.');
                return;
            }

            if (store?.resetSellerSearch) store.resetSellerSearch({ source: 'active-specialty-switch' });
            else if (window.portfolioState) window.portfolioState.sellerSearch = {};
            
            if (typeof window.portfolioClearSearchStateFromLocal === 'function') {
                window.portfolioClearSearchStateFromLocal(userKey);
            }

            ui.resetSpecialtyRuntime();

            if (store?.patch) {
                store.patch({
                    products: [],
                    allProducts: [],
                    productOffset: 0,
                    hasMoreProducts: false,
                    showFeaturedOnly: false
                }, {
                    source: 'active-specialty-refresh',
                    skipCatalogRender: true
                });
            }

            if (window.portfolioPersistence && userKey && active) {
                window.portfolioPersistence.clear?.(userKey, `generic_${active.mainId}_${active.subId || 'all'}`);
                window.portfolioPersistence.clear?.(userKey, `cars_${active.mainId}_${active.subId || 'all'}`);
                window.portfolioPersistence.clear?.(userKey, `real_estate_${active.mainId}_${active.subId || 'all'}`);
            }

            if (active?.isPharmacy) {
                const productsSection = document.getElementById('portfolio-products-section');
                if (productsSection) productsSection.style.display = 'block';
                if (grid && typeof window.portfolioRenderPharmacyCatalog === 'function') {
                    await window.portfolioRenderPharmacyCatalog({ isPharmacy: true, append: false, grid });
                }
                if (typeof window.renderCommercialFeaturedScroller === 'function') {
                    window.renderCommercialFeaturedScroller();
                }
                return;
            }

            if (typeof window.portfolioFetchProducts === 'function') {
                await window.portfolioFetchProducts(userKey, 0, 5, { force: true });
            }
            if (typeof window.renderCommercialFeaturedScroller === 'function') {
                window.renderCommercialFeaturedScroller();
            }
        }
    };
})();
