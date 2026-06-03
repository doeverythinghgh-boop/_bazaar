/**
 * @file portfolio-actions-toolbar-main.js
 * @description Main setup for product toolbar actions.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

window.portfolioSetupProductToolbarActions = function (user, currentUser) {
    const PortfolioAPI = window.PortfolioAPI || {};
    const store = window.PortfolioStore || null;
    const loadMoreBtn = document.getElementById('btn-load-more-products');
    const addProductBtn = document.getElementById('btn-portfolio-add-product');
    const headerWrapper = document.getElementById('portfolio-products-header-wrapper');
    const headerContainer = document.getElementById('portfolio-products-header');
    const filterFeaturedBtn = document.getElementById('btn-portfolio-filter-featured');
    const manageProductsBtn = document.getElementById('btn-portfolio-manage-products');

    const currentUserCapabilities = PortfolioAPI.resolveUserCapabilities
        ? PortfolioAPI.resolveUserCapabilities(currentUser)
        : null;

    const specialtyViewModel = PortfolioAPI.resolveSpecialtyViewModel
        ? (user?.portfolio_view_model || PortfolioAPI.resolveSpecialtyViewModel(user))
        : null;
    const activeSpecialty = window.portfolioActiveSpecialty?.getActive ? window.portfolioActiveSpecialty.getActive() : null;
    const activeViewModel = activeSpecialty?.viewModel || specialtyViewModel;

    const isSpecialUser = !!currentUserCapabilities?.isAdmin;
    const isOwner = currentUser && (currentUser.user_key === user.user_key || currentUser.id === user.id);
    const hasPermission = currentUser && (isOwner || isSpecialUser);

    const accountType = typeof window.normalizeAccountType === 'function'
        ? window.normalizeAccountType(user?.account_type || 1)
        : parseInt(user?.account_type || 1, 10);

    const isBuyerOnlyAccount = accountType === 1;
    const parsedBusinessCategory = typeof window.portfolioParseBusinessCategory === 'function'
        ? window.portfolioParseBusinessCategory(user?.business_category)
        : {};
    const hasBusinessSpecialties = Object.keys(parsedBusinessCategory).length > 0;

    const isPharmacy = activeSpecialty ? !!activeSpecialty.isPharmacy : (
        specialtyViewModel?.profile?.entries?.some(e => String(e.subId) === '204') ||
        (user && typeof user.business_category === 'string' && user.business_category.includes('"204"'))
    );
    const isMedicalServices = activeSpecialty ? String(activeSpecialty.mainId || '') === '20' : (
        specialtyViewModel?.profile?.entries?.some(e => String(e.mainId) === '20') ||
        Object.prototype.hasOwnProperty.call(parsedBusinessCategory, '20')
    );
    const isCarSales = activeSpecialty ? !!activeSpecialty.isCarSales : false;
    const showMedicalSettings = isMedicalServices || isPharmacy;

    const shouldShowProductHeader = hasPermission
        && hasBusinessSpecialties
        && !isBuyerOnlyAccount
        && activeViewModel?.allowCatalogManagement !== false;

    const shouldShowFeaturedControls = shouldShowProductHeader && activeViewModel?.canFeatureCatalog !== false;

    if (headerWrapper) headerWrapper.style.display = 'none';
    if (headerContainer) {
        headerContainer.style.display = 'none';
        headerContainer.style.opacity = '';
        headerContainer.style.pointerEvents = '';
    }
    if (addProductBtn) addProductBtn.style.display = 'none';
    if (filterFeaturedBtn) filterFeaturedBtn.style.display = 'none';
    if (manageProductsBtn) manageProductsBtn.style.display = 'none';

    if (shouldShowProductHeader) {
        if (headerWrapper) headerWrapper.style.display = 'block';
        if (headerContainer) {
            headerContainer.style.display = 'flex';
            if (user.user_key === "guest_user") {
                headerContainer.style.setProperty('opacity', '0.5', 'important');
                headerContainer.style.setProperty('pointer-events', 'none', 'important');
            }

            if (isPharmacy && addProductBtn) {
                addProductBtn.style.setProperty('display', 'none', 'important');
            }

            if (showMedicalSettings && hasPermission && !document.getElementById('btn-pharmacy-store-settings')) {
                const addSettingsBtn = document.createElement('button');
                addSettingsBtn.id = 'btn-pharmacy-store-settings';
                const settingsLabel = typeof window.langu === 'function' ? window.langu('medical_services_settings_btn') : 'إعدادات الخدمات الطبية';
                addSettingsBtn.innerHTML = `<i class="fas fa-sliders-h"></i> <span>${settingsLabel}</span>`;
                addSettingsBtn.onclick = function () {
                    const currentActive = window.portfolioActiveSpecialty?.getActive ? window.portfolioActiveSpecialty.getActive() : activeSpecialty;
                    if (currentActive?.isPharmacy || String(currentActive?.subId || '') === '204') {
                        window.location.href = '/pages/merchant-portfolio/pharmacy-control-panel.html?user_key=' + encodeURIComponent(user.user_key);
                        return;
                    }

                    const params = new URLSearchParams();
                    params.set('user_key', user.user_key);
                    params.set('MainCategory', String(currentActive?.mainId || '20'));
                    if (currentActive?.subId) params.set('SubCategory', String(currentActive.subId));
                    window.location.href = '/pages/merchant-control-panel/merchant-control-panel.html?' + params.toString();
                };
                headerContainer.appendChild(addSettingsBtn);
            }
            const pharmacySettingsBtn = document.getElementById('btn-pharmacy-store-settings');
            if (pharmacySettingsBtn) {
                pharmacySettingsBtn.style.display = showMedicalSettings ? 'inline-flex' : 'none';
                const settingsLabel = pharmacySettingsBtn.querySelector('span');
                if (settingsLabel) settingsLabel.textContent = typeof window.langu === 'function' ? window.langu('medical_services_settings_btn') : 'إعدادات الخدمات الطبية';
            }
        }

        if (addProductBtn && !isPharmacy) {
            addProductBtn.style.display = 'none';
            addProductBtn.onclick = null;
        } else if (addProductBtn) {
            addProductBtn.style.setProperty('display', 'none', 'important');
        }

        if (filterFeaturedBtn && shouldShowFeaturedControls) {
            filterFeaturedBtn.style.display = 'none';
            filterFeaturedBtn.onclick = null;
        }

        if (manageProductsBtn && !isPharmacy && !isMedicalServices && hasPermission) {
            manageProductsBtn.style.display = 'inline-flex';
            const manageLabel = manageProductsBtn.querySelector('span');
            if (manageLabel) manageLabel.textContent = isCarSales ? 'إدارة السيارات' : (typeof window.langu === 'function' ? (window.langu('mcp_title') || 'إدارة الخدمات') : 'إدارة الخدمات');
            manageProductsBtn.onclick = function () {
                const params = new URLSearchParams();
                params.set('user_key', user.user_key);

                const currentActive = window.portfolioActiveSpecialty?.getActive ? window.portfolioActiveSpecialty.getActive() : null;
                const currentVM = PortfolioAPI.resolveSpecialtyViewModel ? PortfolioAPI.resolveSpecialtyViewModel(user) : specialtyViewModel;
                const firstEntry = currentVM?.profile?.entries?.[0] || null;

                const activeMainId = currentActive?.mainId || firstEntry?.mainId;
                const activeSubId = currentActive?.subId || firstEntry?.subId;

                if (activeMainId) {
                    params.set('MainCategory', String(activeMainId));
                    // For specialized categories (Cars=7, Real Estate=16), we omit SubCategory in the management link 
                    // to ensure the merchant sees all their listings (including uncategorized ones) by default.
                    const isSpecialty = String(activeMainId) === '7' || String(activeMainId) === '16';
                    if (activeSubId && !isSpecialty) {
                        params.set('SubCategory', String(activeSubId));
                    }
                }

                window.location.href = '/pages/merchant-control-panel/merchant-control-panel.html?' + params.toString();
            };
        }
    }

    if (loadMoreBtn) {
        loadMoreBtn.onclick = async function () {
            console.log("[Portfolio][Toolbar] Load More clicked.");

            if (loadMoreBtn.disabled) {
                console.log("[Portfolio][Toolbar] Button is disabled (already loading). Ignoring.");
                return;
            }

            console.log("[Portfolio][Toolbar] Step 1: Checking for search or pharmacy pagination...");
            if (typeof window.portfolioLoadMoreSellerSearchResults === 'function' && window.portfolioLoadMoreSellerSearchResults()) {
                console.log("[Portfolio][Toolbar] Load more handled by search system. Stopping normal fetch.");
                return;
            }

            if (typeof window.portfolioLoadMorePharmacySubResults === 'function' && window.portfolioLoadMorePharmacySubResults()) {
                console.log("[Portfolio][Toolbar] Load more handled by pharmacy sub-category system. Stopping normal fetch.");
                return;
            }

            console.log("[Portfolio][Toolbar] Step 2: Resolving state and offset...");
            const state = store?.getState ? store.getState() : window.portfolioState;
            const currentOffset = (state && typeof state.productOffset === 'number') ? state.productOffset : 0;
            const currentLimit = (state && typeof state.productLimit === 'number') ? state.productLimit : 5;

            console.log(`[Portfolio][Toolbar] Current state info - Offset: ${currentOffset}, Limit: ${currentLimit}`);

            if (typeof window.portfolioFetchProducts === 'function') {
                try {
                    console.log("[Portfolio][Toolbar] Step 3: Starting fetch operation...");
                    loadMoreBtn.disabled = true;
                    loadMoreBtn.style.opacity = '0.5';

                    console.log(`[Portfolio][Toolbar] Calling portfolioFetchProducts for user: ${user.user_key}`);
                    await window.portfolioFetchProducts(user.user_key, currentOffset, currentLimit);

                    console.log("[Portfolio][Toolbar] Step 4: Fetch completed successfully.");
                } catch (error) {
                    console.error("[Portfolio][Toolbar] Error during fetch operation:", error);
                } finally {
                    console.log("[Portfolio][Toolbar] Final Step: Re-enabling button.");
                    loadMoreBtn.disabled = false;
                    loadMoreBtn.style.opacity = '';
                }
            } else {
                console.warn("[Portfolio][Toolbar] portfolioFetchProducts is not defined in window.");
            }
        };
    }

    if (typeof window.portfolioSetupSellerSearch === 'function') {
        window.portfolioSetupSellerSearch(user);
        console.log(`[Search-Upgrade] Modal initialization requested from toolbar.`);
    }
};
