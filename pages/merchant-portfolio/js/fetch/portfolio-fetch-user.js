/**
 * RULE: All comments and documentation must be in English only.
 * WARNING: Hover effects are strictly prohibited on this page to ensure touch-device compatibility.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

/**
 * @file pages/merchant-portfolio/js/portfolio-fetch-user.js
 * @description Handles merchant profile fetching.
 */

window.portfolioFetchUser = async function (userKey) {
    const PortfolioAPI = window.PortfolioAPI || {};

    console.log(`[Portfolio] Loading merchant profile (${userKey})...`);

    if (userKey === 'guest_user') {
        const isEn = (window.app_language || LocalDBStorage.getItem('app_language') || 'ar') === 'en';
        return {
            user_key: 'guest_user',
            username: isEn ? 'Suez Bazaar Guest' : 'ضيف سويس بازار',
            business_name: isEn ? 'Suez Bazaar - Demo Profile' : 'سويس بازار - نسخة تجريبية',
            business_category: isEn ? 'General Store' : 'متجر عام',
            business_bio: isEn
                ? 'Welcome to Suez Bazaar! This is a demo profile to preview the app interface and shopping experience.'
                : 'أهلاً بك في سويس بازار! هذا بروفايل تجريبي لاستعراض واجهة التطبيق وتجربة التسوق.',
            user_image: JSON.stringify({ avatar: '/assets/img/default-avatar.png' }),
            featured_items_data: JSON.stringify({ featured_ids: [], pharmacy_featured_ids: [] }),
            rating: 5,
            reviews_count: 100
        };
    }

    try {
        const data = PortfolioAPI.fetchUser
            ? await PortfolioAPI.fetchUser(userKey)
            : await apiFetch(`/api/users?user_key=${userKey}`);

        if (data && !data.error) {
            const user = window.UserService?.normalizeUser
                ? window.UserService.normalizeUser(data)
                : data;
            const existingCache = (PortfolioAPI.loadCache ? PortfolioAPI.loadCache(userKey) : null) || {};

            if (typeof window.buildBusinessSpecialtyProfile === 'function' && !user.specialty_profile) {
                console.log('[Portfolio] Building specialty profile...');
                user.specialty_profile = window.buildBusinessSpecialtyProfile(user);
            }
            
            if (!user.portfolio_view_model) {
                if (PortfolioAPI.resolveSpecialtyViewModel) {
                    console.log('[Portfolio] Resolving specialty view model (API)...');
                    user.portfolio_view_model = PortfolioAPI.resolveSpecialtyViewModel(user);
                } else if (typeof window.resolvePortfolioSpecialtyViewModel === 'function') {
                    console.log('[Portfolio] Resolving specialty view model (Global)...');
                    user.portfolio_view_model = window.resolvePortfolioSpecialtyViewModel(user);
                }
            }

            if (PortfolioAPI.saveCache) {
                PortfolioAPI.saveCache(userKey, {
                    ...existingCache,
                    user: user
                });
            } else if (window.portfolioCache) {
                window.portfolioCache.save(userKey, {
                    ...existingCache,
                    user: user
                });
            }

            return user;
        }

        return null;
    } catch (error) {
        console.error('[Portfolio] Failed to load merchant profile:', error);
        return null;
    }
};
