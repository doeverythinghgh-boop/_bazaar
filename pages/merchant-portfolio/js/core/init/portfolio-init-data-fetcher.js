/**
 * @file portfolio-init-data-fetcher.js
 * @description Data fetching orchestration for merchant portfolio initialization.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

window.portfolioInitFetchData = async function(userKey, controller, hideMainLoader) {
    console.log(`[Performance] Starting parallel data fetching...`);

    // 1. Kick off all major data requests in parallel
    const p_categories = (typeof fetchAppCategories === 'function') ? fetchAppCategories() : Promise.resolve();
    const p_user = window.portfolioFetchUser(userKey);

    // Speculatively load pharmacy context if the script is available
    const p_pharmacy = (window.pharmacyStorefrontData?.loadPharmacyContext)
        ? window.pharmacyStorefrontData.loadPharmacyContext(userKey)
        : Promise.resolve();

    // Apply cache immediately for instant UI response
    const cache = controller?.getCache ? controller.getCache(userKey) : window.portfolioCache.load(userKey);
    console.log(`[Diagnostic] Applying cached user data (if any)...`);
    const hasCachedUser = typeof window.portfolioApplyCachedUser === 'function' && window.portfolioApplyCachedUser(cache, controller, userKey, hideMainLoader);

    let userRes = null;

    if (hasCachedUser) {
        console.log(`[Diagnostic] Fast-path active: Cached user data applied. Running network sync in the background.`);
        userRes = cache.user;

        // Perform background resolution of user data and subsequent flows.
        // CRITICAL: Since hasCachedUser=true, the UI is already initialized (specialty, products, scroll).
        // The background sync must be a LIGHT REFRESH only - updating user data and profile header.
        // It must NOT call applyPortfolioSpecialtyView or initialize (which trigger full re-renders).
        Promise.all([p_user, p_categories]).then(async ([userData, _]) => {
            console.log(`[Diagnostic] Background user data resolved.`);
            if (!userData) return;

            // Wait for any active navigation restoration to fully complete before touching the DOM.
            if (window.__portfolioRestorationActive) {
                console.log('[Diagnostic] Background user sync: waiting for restoration to complete...');
                await new Promise(resolve => {
                    const maxWait = setTimeout(resolve, 6000); // Safety: max 6s
                    const poll = setInterval(() => {
                        if (!window.__portfolioRestorationActive) {
                            clearInterval(poll);
                            clearTimeout(maxWait);
                            resolve();
                        }
                    }, 150);
                });
                console.log('[Diagnostic] Background user sync: restoration complete. Proceeding with light refresh.');
            }

            // Light refresh: update user data reference and re-render profile header only.
            // Do NOT call applyPortfolioSpecialtyView or initialize — the section and specialty
            // are already correctly set by portfolioApplyCachedUser. Re-running them would
            // trigger refreshProducts, resetSpecialtyRuntime, and cause scroll/DOM regression.
            console.log('[Diagnostic] Background user sync: applying light refresh (user data + profile header + selector).');
            if (controller?.setActiveUser) {
                controller.setActiveUser(userData, { userKey, persist: true });
            }
            if (typeof window.portfolioRenderProfile === 'function') {
                window.portfolioRenderProfile(userData);
            }

            // Re-render the specialty selector with fresh user data and resolved session permissions.
            // This is safe because: (a) restoration is complete, (b) renderSelector only updates the DOM
            // without triggering store.patch → refreshProducts chain.
            if (window.portfolioActiveSpecialty && window.SpecialtyCore && window.SpecialtyUtils) {
                try {
                    const entries = window.SpecialtyCore.buildEntries(userData);
                    const activeEntry = window.SpecialtyUtils.readStoredSelection(userKey, entries) || entries[0];
                    window.portfolioActiveSpecialty.renderSelector(userData, entries, activeEntry);
                    console.log('[Diagnostic] Background user sync: specialty selector re-rendered with resolved session data.');
                } catch (selectorErr) {
                    console.error('[Background Task] Failed to re-render specialty selector:', selectorErr);
                }
            }

            if (typeof window.initFeaturedState === 'function') {
                window.initFeaturedState(userData);
            }
        }).catch(err => {
            console.error(`[Background Task] Failed to sync user data in background:`, err);
        });

    } else {
        // 2. Wait for user data (blocking since no cache exists)
        console.log(`[Diagnostic] Waiting for core user data (No cache found)...`);
        const userData = await p_user;
        console.log(`[Diagnostic][${performance.now().toFixed(0)}ms] Core user data resolved.`);
        userRes = userData;

        // 3. Ensure global categories are also loaded
        console.log(`[Diagnostic] Ensuring global app categories are loaded...`);
        await p_categories;
        console.log(`[Diagnostic][${performance.now().toFixed(0)}ms] App categories resolved.`);

        if (!userData) {
            const L = (key, fallback) => (typeof window.langu === 'function' ? window.langu(key) : null) || fallback;
            if (typeof Swal !== 'undefined') {
                Swal.fire(L('port_fetch_error_title', 'خطأ'), L('port_fetch_error_text', 'لم يتم العثور على بيانات مقدم الخدمة'), 'error').then(() => {
                    window.location.href = '/index.html';
                });
            }
            return null;
        }

        if (typeof window.portfolioApplyResolvedUser === 'function') {
            window.portfolioApplyResolvedUser(userData, cache, controller, userKey);
        }
    }

    if (controller?.setupScrollPersistence) {
        controller.setupScrollPersistence(userKey);
    }

    // Show main profile instantly, allow products to load progressively
    if (controller?.showMainContainer) controller.showMainContainer();
    hideMainLoader();

    // Parallel Catalog Execution: Trigger catalog render as soon as pharmacy context is ready
    p_pharmacy.then(() => {
        console.log(`[Diagnostic][${performance.now().toFixed(0)}ms] Pharmacy context pre-load promise resolved. Triggering catalog render.`);
        const grid = document.getElementById('portfolio-products-grid');
        if (grid && typeof window.portfolioRenderPharmacyCatalog === 'function') {
            // Determine if we should render based on user category
            const activeSpecialty = window.portfolioActiveSpecialty?.getActive ? window.portfolioActiveSpecialty.getActive() : null;
            const isPharmacy = activeSpecialty
                ? !!activeSpecialty.isPharmacy
                : (userRes?.business_category?.includes('204') ||
                   (userRes?.portfolio_view_model?.profile?.entries?.some(e => String(e.subId) === '204')));
            if (isPharmacy) {
                window.portfolioRenderPharmacyCatalog({ isPharmacy: true, grid: grid });
            }
        }
    });

    if (typeof window.portfolioApplyCachedProducts === 'function') {
        const hasCachedProducts = window.portfolioApplyCachedProducts(cache, controller, userKey);
        if (!hasCachedProducts) {
            console.log(`[Diagnostic] No cached products. Preparing fetch...`);

            const activeSpecialty = window.portfolioActiveSpecialty?.getActive ? window.portfolioActiveSpecialty.getActive() : null;
            const isPharmacy = activeSpecialty
                ? !!activeSpecialty.isPharmacy
                : (userRes?.business_category?.includes('204') ||
                   (userRes?.portfolio_view_model?.profile?.entries?.some(e => String(e.subId) === '204')));

            // Restoration Limit: Use saved visibleCount if available, otherwise default to 5
            const restoredLimit = (window.pharmacyRestoringState && !window.pharmacyRestoringState.isSearchResult)
                ? Number(window.pharmacyRestoringState.visibleCount)
                : 5;
            const fetchLimit = Math.max(5, restoredLimit || 5);

            if (isPharmacy) {
                console.log(`[Diagnostic] Pharmacy detected. Running fetchProducts (Limit: ${fetchLimit}) in background.`);
                if (typeof window.portfolioFetchProducts === 'function') {
                    window.portfolioFetchProducts(userKey, 0, fetchLimit); // Start fetch but don't wait
                }
            } else {
                console.log(`[Diagnostic] Standard merchant. Fetching products (Limit: ${fetchLimit}) - Non-blocking in background.`);
                if (typeof window.portfolioFetchProducts === 'function') {
                    window.portfolioFetchProducts(userKey, 0, fetchLimit); // Fetch in background to prevent thread block
                }
            }
        } else {
            console.log(`[Diagnostic] Cached products applied successfully.`);
        }
    }

    return userRes;
};
