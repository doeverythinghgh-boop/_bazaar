/**
 * @file pages/merchant-portfolio/js/init/portfolio-active-specialty.js
 * @description Main entry point for specialty management. Orchestrates utils, ui, and core logic.
 */

(function () {
    window.portfolioActiveSpecialty = {
        buildEntries: (user) => window.SpecialtyCore.buildEntries(user),
        
        initialize: (user, options = {}) => {
            const entries = window.SpecialtyCore.buildEntries(user);
            if (!entries.length) return null;
            
            const userKey = window.SpecialtyUtils.getUserKey(user);
            
            let activeEntry = null;

            // 1. HIGHEST PRIORITY: URL query params from subcategory-products navigation.
            //    If the user explicitly navigated here from subcategory-products with a
            //    specific specialty intent, always honour that — even if a restoration
            //    snapshot exists from a previous session.
            const params = new URLSearchParams(window.location.search);
            const queryMainId = params.get('mainId') || params.get('main_id');
            const querySubId  = params.get('subId')  || params.get('sub_id');
            if (queryMainId) {
                activeEntry = entries.find(e =>
                    String(e.mainId) === String(queryMainId) &&
                    (!querySubId || String(e.subId) === String(querySubId))
                );
                if (activeEntry) {
                    console.log('[Diagnostic] Active specialty set from URL query parameters (highest priority):', activeEntry);
                    // NOTE: The specialty selector header always starts collapsed on load.
                    // Selection is applied silently without expanding the list.
                }
            }

            // 2. SECOND PRIORITY: Restoration state (back-navigation / session restore).
            //    Only used when the page was NOT opened with explicit URL params.
            if (!activeEntry) {
                const restoration = window.pharmacyRestoringState || window.__portfolioRestorationSnapshot;
                if (restoration) {
                    const restoredMainId = String(restoration.activeCategoryId || restoration.searchMainCategory || '');
                    const restoredSubId  = String(restoration.activeSubCategoryId || restoration.searchSubCategory || '');
                    if (restoredMainId) {
                        activeEntry = entries.find(e =>
                            String(e.mainId) === restoredMainId &&
                            (!restoredSubId || String(e.subId) === restoredSubId)
                        );
                        if (activeEntry) {
                            console.log('[Diagnostic] Active specialty restored from navigation state:', activeEntry);
                        }
                    }
                }
            }

            // 3. FALLBACK: Last stored selection or first available entry.
            if (!activeEntry) {
                activeEntry = window.SpecialtyUtils.readStoredSelection(userKey, entries) || entries[0];
            }
            
            const active = window.SpecialtyCore.setActiveSpecialty(user, activeEntry, {
                source: options.source || 'active-specialty-init'
            });
            
            window.portfolioActiveSpecialty.renderSelector(user, entries, activeEntry);
            return active;
        },

        setActiveSpecialty: (user, entry, options = {}) => window.SpecialtyCore.setActiveSpecialty(user, entry, options),
        
        refreshProductsForActiveSpecialty: async (user) => window.SpecialtyCore.refreshProducts(user),
        
        getActive: () => {
            const store = window.SpecialtyUtils.getStore();
            const state = store?.getState ? store.getState() : window.portfolioState;
            return state?.activeSpecialty || null;
        },

        getActiveFilter: () => {
            const active = window.portfolioActiveSpecialty.getActive();
            if (!active) return null;
            return {
                mainId: String(active.mainId || ''),
                subId: String(active.subId || '')
            };
        },

        renderSelector: (user, entries, activeEntry) => {
            window.SpecialtyUI.renderSelector(user, entries, activeEntry, async (entry, subItem) => {
                const current = window.portfolioActiveSpecialty.getActive();
                if (window.SpecialtyUtils.isSameEntry(current, entry)) return;

                // Update UI visually
                const list = document.getElementById('portfolio-specialty-selector-list');
                if (list) {
                    list.querySelectorAll('.specialty-sub-item').forEach((item) => item.classList.remove('is-active'));
                }
                subItem.classList.add('is-active');

                // Execute core switch logic
                window.portfolioActiveSpecialty.setActiveSpecialty(user, entry, { source: 'active-specialty-selector' });
                await window.portfolioActiveSpecialty.refreshProductsForActiveSpecialty(user);

                // Trigger external UI updates
                if (typeof window.portfolioSetupProductToolbarActions === 'function') {
                    const currentUser = typeof SessionManager !== 'undefined' ? SessionManager.getUser() : null;
                    window.portfolioSetupProductToolbarActions(user, currentUser);
                }
                if (typeof window.portfolioRefreshSellerSearchControls === 'function') {
                    window.portfolioRefreshSellerSearchControls(user);
                }
            });
        },

        isPharmacyEntry: (entry) => window.SpecialtyUtils.isPharmacyEntry(entry),
        
        isCarEntry: (entry) => window.SpecialtyUtils.isCarEntry(entry),
        
        isRealEstateEntry: (entry) => window.SpecialtyUtils.isRealEstateEntry(entry),
        
        buildSelectionUser: (user, entry) => {
            const subIds = entry?.subId ? [String(entry.subId)] : [];
            return {
                ...(user || {}),
                business_category: JSON.stringify({ [String(entry?.mainId || '')]: subIds })
            };
        }
    };
})();
