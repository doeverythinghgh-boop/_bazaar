/**
 * RULE: All comments and documentation must be in English only.
 * WARNING: Hover effects are strictly prohibited on this page to ensure touch-device compatibility.
 */
/**
 * @file pages/merchant-portfolio/js/portfolio-actions-products.js
 * @description Handles product toolbar actions for the merchant portfolio page.
 */

window.portfolioSetupProductToolbarActions = function (user, currentUser) {
    const PortfolioAPI = window.PortfolioAPI || {};
    const store = window.PortfolioStore || null;
    const loadMoreBtn = document.getElementById('btn-load-more-products');
    const addProductBtn = document.getElementById('btn-portfolio-add-product');
    const headerWrapper = document.getElementById('portfolio-products-header-wrapper');
    const headerContainer = document.getElementById('portfolio-products-header');
    const filterFeaturedBtn = document.getElementById('btn-portfolio-filter-featured');

    const currentUserCapabilities = PortfolioAPI.resolveUserCapabilities
        ? PortfolioAPI.resolveUserCapabilities(currentUser)
        : null;
    const specialtyViewModel = PortfolioAPI.resolveSpecialtyViewModel
        ? (user?.portfolio_view_model || PortfolioAPI.resolveSpecialtyViewModel(user))
        : null;
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
    const shouldShowProductHeader = hasPermission
        && hasBusinessSpecialties
        && !isBuyerOnlyAccount
        && specialtyViewModel?.allowCatalogManagement !== false;
    const shouldShowFeaturedControls = shouldShowProductHeader && specialtyViewModel?.canFeatureCatalog !== false;

    if (headerWrapper) headerWrapper.style.display = 'none';
    if (headerContainer) {
        headerContainer.style.display = 'none';
        headerContainer.style.opacity = '';
        headerContainer.style.pointerEvents = '';
    }
    if (addProductBtn) addProductBtn.style.display = 'none';
    if (filterFeaturedBtn) filterFeaturedBtn.style.display = 'none';

    if (shouldShowProductHeader) {
        if (headerWrapper) headerWrapper.style.display = 'block';
        if (headerContainer) {
            headerContainer.style.display = 'flex';
            if (user.user_key === "guest_user") {
                headerContainer.style.setProperty('opacity', '0.5', 'important');
                headerContainer.style.setProperty('pointer-events', 'none', 'important');
            }

            // --- PHARMACY CONTROL PANEL BUTTON START ---
            const isPharmacy = specialtyViewModel?.profile?.entries?.some(e => String(e.subId) === '204') ||
                               (user && typeof user.business_category === 'string' && user.business_category.includes('"204"'));

            // Hide the standard "Add Product" button for pharmacists as it's now in their control panel
            if (isPharmacy && addProductBtn) {
                addProductBtn.style.setProperty('display', 'none', 'important');
            }

            if (isPharmacy && hasPermission && !document.getElementById('btn-pharmacy-store-settings')) {
                const addSettingsBtn = document.createElement('button');
                addSettingsBtn.id = 'btn-pharmacy-store-settings';
                // We reuse the portfolio actions standard class
                addSettingsBtn.className = 'btn-portfolio-action primary-action';
                addSettingsBtn.style.padding = '8px 15px';
                addSettingsBtn.style.marginLeft = '10px';
                addSettingsBtn.style.color = '#fff';
                addSettingsBtn.style.background = '#0056b3';
                addSettingsBtn.style.border = 'none';
                addSettingsBtn.style.borderRadius = '5px';
                addSettingsBtn.style.cursor = 'pointer';
                addSettingsBtn.style.display = 'inline-flex';
                addSettingsBtn.style.alignItems = 'center';
                addSettingsBtn.style.gap = '5px';
                addSettingsBtn.innerHTML = '<i class="fas fa-sliders-h"></i> <span>إعدادات الصيدلية</span>';
                addSettingsBtn.onclick = function() {
                    window.location.href = '/pages/merchant-portfolio/pharmacy-control-panel.html?user_key=' + encodeURIComponent(user.user_key);
                };
                headerContainer.appendChild(addSettingsBtn);
            }
            // --- PHARMACY CONTROL PANEL BUTTON END ---
        }

        // Hide standard "Add Product" for pharmacies regardless of role
        const isPharmacy = specialtyViewModel?.profile?.entries?.some(e => String(e.subId) === '204') ||
                           (user && typeof user.business_category === 'string' && user.business_category.includes('"204"'));

        if (addProductBtn && !isPharmacy) {
            addProductBtn.style.display = 'inline-flex';
            addProductBtn.onclick = function () {
                let filter = null;
                try {
                    if (user.business_category) {
                        filter = typeof user.business_category === 'string'
                            ? JSON.parse(user.business_category)
                            : user.business_category;
                    }
                } catch (error) {
                    console.error("[Portfolio] Failed to parse business_category:", error);
                }

                if (!filter || Object.keys(filter).length === 0) {
                    if (typeof Swal !== 'undefined') {
                        Swal.fire({
                            title: window.langu('port_profile_specialties_required_title') || 'خطوة مطلوبة',
                            text: window.langu('port_profile_specialties_required_text') || 'يرجى تحديث تخصصات النشاط في ملفك الشخصي أولاً لتتمكن من إضافة منتجاتك بالقسم الصحيح.',
                            icon: 'info',
                            confirmButtonText: window.langu('port_profile_specialties_required_confirm') || 'تعديل البيانات',
                            buttonsStyling: false,
                            customClass: {
                                popup: 'swal-modern-mini-popup',
                                title: 'swal-modern-mini-title',
                                htmlContainer: 'swal-modern-mini-text',
                                confirmButton: 'swal-modern-mini-confirm'
                            }
                        }).then(function (result) {
                            if (result.isConfirmed) {
                                const settingsBtn = document.getElementById('btn-settings-mini');
                                if (settingsBtn) settingsBtn.click();
                            }
                        });
                    }
                    return;
                }

                if (typeof showAddProductModal === 'function') {
                    if (PortfolioAPI.clearCache) PortfolioAPI.clearCache(user.user_key);
                    showAddProductModal({
                        filter: filter,
                        title: window.langu('port_add_product_modal_title') || 'إضافة منتج جديد'
                    });
                } else {
                    console.warn("[Portfolio] showAddProductModal not found.");
                }
            };
        } else if (addProductBtn) {
            addProductBtn.style.setProperty('display', 'none', 'important');
        }

        if (filterFeaturedBtn && shouldShowFeaturedControls) {
            filterFeaturedBtn.style.display = 'inline-flex';

            const setFeaturedBtnLoading = function (isLoading) {
                const icon = document.getElementById('filter-featured-icon');
                if (isLoading) {
                    filterFeaturedBtn.disabled = true;
                    filterFeaturedBtn.style.opacity = '0.7';
                    filterFeaturedBtn.style.pointerEvents = 'none';
                    if (icon) {
                        icon.classList.remove('fa-crown');
                        icon.classList.add('fa-spinner', 'fa-spin');
                    }
                } else {
                    filterFeaturedBtn.disabled = false;
                    filterFeaturedBtn.style.opacity = '';
                    filterFeaturedBtn.style.pointerEvents = '';
                    if (icon) {
                        icon.classList.remove('fa-spinner', 'fa-spin');
                        icon.classList.add('fa-crown');
                    }
                }
            };

            filterFeaturedBtn.onclick = async function () {
                setFeaturedBtnLoading(true);
                const state = store?.getState ? store.getState() : (window.portfolioState || (window.portfolioState = {}));
                state.showFeaturedOnly = !state.showFeaturedOnly;
                if (store?.patch) {
                    store.patch({ showFeaturedOnly: state.showFeaturedOnly });
                }

                const currentLoadMoreBtn = document.getElementById('btn-load-more-products');
                const searchCommercialBtn = document.getElementById('btn-portfolio-search-commercial');

                try {
                    if (state.showFeaturedOnly) {
                        filterFeaturedBtn.classList.add('active');
                        if (currentLoadMoreBtn) currentLoadMoreBtn.style.display = 'none';
                        if (searchCommercialBtn) searchCommercialBtn.style.display = 'none';
                        if (typeof window.portfolioResetSellerSearch === 'function') {
                            window.portfolioResetSellerSearch({ closePanel: true });
                        }

                        if (typeof window.portfolioFetchAllFeaturedProducts === 'function') {
                            const allFeatured = await window.portfolioFetchAllFeaturedProducts(user.user_key);
                            window.portfolioRenderProducts(allFeatured, false);
                        }
                    } else {
                        filterFeaturedBtn.classList.remove('active');
                        if (currentLoadMoreBtn && state.allProducts && state.allProducts.length >= (state.productLimit || 5)) {
                            currentLoadMoreBtn.style.display = 'flex';
                        }
                        if (searchCommercialBtn && state.allProducts && state.allProducts.length > 0) {
                            searchCommercialBtn.style.display = 'flex';
                        }

                        if (state.allProducts) {
                            window.portfolioRenderProducts(state.allProducts, false);
                        }
                    }
                } finally {
                    setFeaturedBtnLoading(false);
                }
            };
        }
    }

    if (loadMoreBtn) {
        loadMoreBtn.onclick = async function () {
            if (typeof window.portfolioLoadMoreSellerSearchResults === 'function' && window.portfolioLoadMoreSellerSearchResults()) {
                return;
            }
            const state = store?.getState ? store.getState() : window.portfolioState;
            await window.portfolioFetchProducts(user.user_key, state?.productOffset, state?.productLimit);
        };
    }

    if (typeof window.portfolioSetupSellerSearch === 'function') {
        window.portfolioSetupSellerSearch(user);
    }
};
