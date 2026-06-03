/**
 * @file pages/merchant-portfolio/js/init/specialty/specialty-utils.js
 * @description Helper functions and storage utilities for the specialty selector.
 */

(function () {
    window.SpecialtyUtils = {
        getStore: () => window.PortfolioStore || null,
        
        getUserKey: (user) => user?.user_key || new URLSearchParams(window.location.search).get('user_key') || '',
        
        getStorageKey: (userKey) => `portfolio_active_specialty_${userKey || 'guest_user'}`,

        getCategoryData: (mainId, subId) => {
            const categories = Array.isArray(window.appCategoriesList?.categories) ? window.appCategoriesList.categories : [];
            const main = categories.find((item) => String(item.id) === String(mainId));
            if (!main) return null;
            if (!subId) return main;
            return Array.isArray(main.subcategories) ? main.subcategories.find((item) => String(item.id) === String(subId)) : null;
        },

        getCategoryTitle: (mainId, subId) => {
            if (typeof window.portfolioResolveCategoryTitle === 'function') {
                return window.portfolioResolveCategoryTitle(mainId, subId) || '';
            }
            const data = window.SpecialtyUtils.getCategoryData(mainId, subId);
            const lang = window.app_language || 'ar';
            return typeof data?.title === 'object' ? (data.title[lang] || data.title.ar || '') : (data?.title || '');
        },

        getMainImage: (mainId) => {
            const data = window.SpecialtyUtils.getCategoryData(mainId);
            return data?.image ? `/images/mainCategories/${data.image}` : '/images/icons/icon-192x192.png';
        },

        getSubImage: (mainId, subId) => {
            const data = window.SpecialtyUtils.getCategoryData(mainId, subId);
            return data?.image ? `/images/subCategories/${data.image}` : '/images/icons/icon-192x192.png';
        },

        getMainIcon: (mainId) => {
            const categories = Array.isArray(window.appCategoriesList?.categories) ? window.appCategoriesList.categories : [];
            const main = categories.find((item) => String(item.id) === String(mainId));
            return main?.icon || (String(mainId) === '7' ? 'fas fa-car' : (String(mainId) === '20' ? 'fas fa-prescription-bottle-medical' : 'fas fa-store'));
        },

        isSameEntry: (left, right) => {
            return String(left?.mainId || '') === String(right?.mainId || '') &&
                String(left?.subId || '') === String(right?.subId || '');
        },

        readStoredSelection: (userKey, entries) => {
            try {
                const raw = LocalDBStorage.getItem(window.SpecialtyUtils.getStorageKey(userKey));
                if (!raw) return null;
                const parsed = JSON.parse(raw);
                return entries.find((entry) => window.SpecialtyUtils.isSameEntry(entry, parsed)) || null;
            } catch (error) {
                console.warn('[SpecialtyUtils] Failed to read stored specialty.', error);
                return null;
            }
        },

        persistSelection: (userKey, entry) => {
            if (!userKey || !entry) return;
            try {
                LocalDBStorage.setItem(window.SpecialtyUtils.getStorageKey(userKey), JSON.stringify({
                    mainId: String(entry.mainId || ''),
                    subId: String(entry.subId || '')
                }));
            } catch (error) {
                console.warn('[SpecialtyUtils] Failed to persist specialty.', error);
            }
        },

        isPharmacyEntry: (entry) => String(entry?.subId || '') === '204',
        
        isCarEntry: (entry) => String(entry?.mainId || '') === '7' && String(entry?.subId || '') === '1',

        isRealEstateEntry: (entry) => String(entry?.mainId || '') === '16'
    };
})();
