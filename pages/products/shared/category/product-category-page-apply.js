/**
 * @file pages/products/shared/category/product-category-page-apply.js
 * @description Main entry points for applying category-driven UI behavior.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


(function initProductCategoryPageApply() {
    const internal = window.__ProductCategoryInternal;

    function mergeOverrideProfile(profile, overrideKey) {
        if (!overrideKey || !window.ProductCategoryUi) return profile;
        const config = window.ProductCategoryUi.getConfig();
        const overrideProfile = window.ProductCategoryUi.buildProfile(config, overrideKey);
        if (!overrideProfile) return profile;
        return {
            ...profile,
            profileKey: overrideKey,
            meta: overrideProfile.meta || profile.meta,
            summary: overrideProfile.summary || profile.summary,
            submit: window.ProductCategoryUi.mergeDeep(profile.submit || {}, overrideProfile.submit || {}),
            pages: window.ProductCategoryUi.mergeDeep(profile.pages || {}, overrideProfile.pages || {})
        };
    }

    async function applyAddPage(mainId, subId) {
        if (!window.ProductCategoryUi) return null;
        if (window.ProductCategoryLogger) window.ProductCategoryLogger.group('PageCore', 'apply-add-page');
        else console.group('[ProductCategoryPageCore] apply-add-page');
        internal.trace('apply-add-page-start', { mainId, subId });
        await window.ProductCategoryUi.loadConfig();
        let profile = window.ProductCategoryUi.resolveCategoryProfile(mainId, subId);
        if (window.ProductPharmacyBridge?.isPharmacyProfile?.(profile)) {
            profile = mergeOverrideProfile(profile, 'pharmacy_product_profile');
        }
        if (window.ProductSpecialtyListingBridge?.isSpecialtyProfile?.(profile)) {
            profile = mergeOverrideProfile(profile, window.ProductSpecialtyListingBridge.getSpecialtyProfileKey(profile));
        }
        window.ProductCategoryUi.setActiveProfile('add', profile);
        const pageProfile = window.ProductCategoryUi.getPageProfile(profile, 'add');
        const appPriceEnabled = window.AppBehavior?.enableAppPrice !== false;

        internal.applyFormPageFields('add', profile);
        if (window.ProductPharmacyBridge?.ensureFormFields) {
            await window.ProductPharmacyBridge.ensureFormFields('add', profile);
        }
        if (window.ProductSpecialtyListingBridge?.ensureFormFields) {
            await window.ProductSpecialtyListingBridge.ensureFormFields('add', profile);
        }
        if (!appPriceEnabled) {
            internal.setVisible(document.getElementById('add1_group_real_price'), false);
            internal.applyRequiredAttribute(document.getElementById('add1_real_price'), false);
            internal.setDisabled(document.getElementById('add1_real_price'), true);
        }

        const submitText = internal.resolveText(pageProfile.submitButton);
        const submitSpan = document.querySelector('#add1_btn_submit span');
        if (submitText && submitSpan) internal.setText(submitSpan, submitText);

        const titleText = internal.resolveText(pageProfile.pageTitle);
        const titleSpan = document.querySelector('#add1_product_title span');
        if (titleText && titleSpan) internal.setText(titleSpan, titleText);

        await internal.renderFormSummary({
            pageType: 'add',
            containerId: 'add1_category_display',
            summaryId: 'add1_category_profile_summary',
            profile,
            mainId,
            subId
        });

        internal.trace('apply-add-page-complete', { profileKey: profile.profileKey, mainId: profile.mainId, subId: profile.subId });
        if (window.ProductCategoryLogger) window.ProductCategoryLogger.groupEnd();
        else console.groupEnd();
        return profile;
    }

    async function applyEditPage(mainId, subId) {
        if (!window.ProductCategoryUi) return null;
        if (window.ProductCategoryLogger) window.ProductCategoryLogger.group('PageCore', 'apply-edit-page');
        else console.group('[ProductCategoryPageCore] apply-edit-page');
        internal.trace('apply-edit-page-start', { mainId, subId });
        await window.ProductCategoryUi.loadConfig();
        let profile = window.ProductCategoryUi.resolveCategoryProfile(mainId, subId);
        if (window.ProductPharmacyBridge?.isPharmacyProfile?.(profile)) {
            profile = mergeOverrideProfile(profile, 'pharmacy_product_profile');
        }
        if (window.ProductSpecialtyListingBridge?.isSpecialtyProfile?.(profile)) {
            profile = mergeOverrideProfile(profile, window.ProductSpecialtyListingBridge.getSpecialtyProfileKey(profile));
        }
        window.ProductCategoryUi.setActiveProfile('edit', profile);
        const pageProfile = window.ProductCategoryUi.getPageProfile(profile, 'edit');
        const appPriceEnabled = window.AppBehavior?.enableAppPrice !== false;
        const originalPriceEnabled = window.AppBehavior?.enableOriginalPrice !== false;

        internal.applyFormPageFields('edit', profile);
        if (window.ProductPharmacyBridge?.ensureFormFields) {
            await window.ProductPharmacyBridge.ensureFormFields('edit', profile);
        }
        if (window.ProductSpecialtyListingBridge?.ensureFormFields) {
            await window.ProductSpecialtyListingBridge.ensureFormFields('edit', profile);
        }

        if (!appPriceEnabled) {
            internal.setVisible(document.getElementById('edit_group_real_price'), false);
            internal.applyRequiredAttribute(document.getElementById('real-price'), false);
            internal.setDisabled(document.getElementById('real-price'), true);
        }

        if (!originalPriceEnabled) {
            internal.setVisible(document.getElementById('edit_group_original_price'), false);
            internal.applyRequiredAttribute(document.getElementById('original-price'), false);
            internal.setDisabled(document.getElementById('original-price'), true);
        }

        const submitText = internal.resolveText(pageProfile.submitButton);
        const submitSpan = document.querySelector('#edit_btn_submit span');
        if (submitText && submitSpan) internal.setText(submitSpan, submitText);

        const titleText = internal.resolveText(pageProfile.pageTitle);
        const titleSpan = document.querySelector('#editProductTitle span');
        if (titleText && titleSpan) internal.setText(titleSpan, titleText);

        await internal.renderFormSummary({
            pageType: 'edit',
            containerId: 'edit_category_display',
            summaryId: 'edit_category_profile_summary',
            profile,
            mainId,
            subId
        });

        internal.trace('apply-edit-page-complete', { profileKey: profile.profileKey, mainId: profile.mainId, subId: profile.subId });
        if (window.ProductCategoryLogger) window.ProductCategoryLogger.groupEnd();
        else console.groupEnd();
        return profile;
    }

    async function applyViewPage(productData, categoryOverride = null) {
        if (!window.ProductCategoryUi) return null;
        if (window.ProductCategoryLogger) window.ProductCategoryLogger.group('PageCore', 'apply-view-page');
        else console.group('[ProductCategoryPageCore] apply-view-page');
        
        const mainId = categoryOverride ? categoryOverride.mainId : (productData?.MainCategory || null);
        const subId = categoryOverride ? categoryOverride.subId : (productData?.SubCategory || null);

        internal.trace('apply-view-page-start', {
            productKey: productData?.product_key || null,
            mainId,
            subId,
            isSimulation: !!categoryOverride
        });

        await window.ProductCategoryUi.loadConfig();

        // Resolve profile using override if provided
        let profile = categoryOverride 
            ? window.ProductCategoryUi.resolveCategoryProfile(mainId, subId)
            : window.ProductCategoryUi.resolveProductProfile(productData);
        if (window.ProductPharmacyBridge?.isPharmacyProduct?.(productData)) {
            profile = mergeOverrideProfile(profile, 'pharmacy_product_profile');
        }
        if (window.ProductSpecialtyListingBridge?.isSpecialtyProduct?.(productData)) {
            profile = mergeOverrideProfile(profile, window.ProductSpecialtyListingBridge.getSpecialtyProfileKey(profile, productData));
        }

        window.ProductCategoryUi.setActiveProfile('view', profile);
        const names = await internal.getCategoryNames(mainId, subId);
        const pageProfile = window.ProductCategoryUi.getPageProfile(profile, 'view');
        const appPriceEnabled = window.AppBehavior?.enableAppPrice !== false;
        const originalPriceEnabled = window.AppBehavior?.enableOriginalPrice !== false;
        const imageList = Array.isArray(productData?.imageSrc) ? productData.imageSrc.filter(Boolean) : [];
        const showImages = window.ProductCategoryUi.isFieldVisible('view', 'images', profile) && imageList.length > 0;

        internal.setVisible(document.getElementById('productView_image_container'), showImages);
        internal.setVisible(document.getElementById('productView_price_main'), window.ProductCategoryUi.isFieldVisible('view', 'price', profile));
        internal.setVisible(document.getElementById('productView_cart_actions'), window.ProductCategoryUi.isFieldVisible('view', 'cartActions', profile));
        internal.setVisible(document.getElementById('productView_quantity_row'), window.ProductCategoryUi.isFieldVisible('view', 'quantity', profile));
        internal.setVisible(document.getElementById('productView_description_container'), window.ProductCategoryUi.isFieldVisible('view', 'description', profile));
        // sellerMessage visibility is now profile-driven instead of always-visible (true).
        // Pharmacy profiles set sellerMessage.visible = false to hide the free-text message block.
        internal.setVisible(document.getElementById('productView_seller_message_container'), window.ProductCategoryUi.isFieldVisible('view', 'sellerMessage', profile));
        internal.setVisible(document.getElementById('productView_share_btn'), window.ProductCategoryUi.isFieldVisible('view', 'share', profile));
        internal.setVisible(document.getElementById('productView_original_price_container'), originalPriceEnabled && window.ProductCategoryUi.isFieldVisible('view', 'originalPrice', profile));
        internal.setVisible(document.getElementById('productView_seller_card'), window.ProductCategoryUi.isFieldVisible('view', 'sellerCard', profile));
        internal.setVisible(document.getElementById('admin_field_price'), appPriceEnabled && window.ProductCategoryUi.isFieldVisible('view', 'realPrice', profile));
        internal.setVisible(document.getElementById('admin_field_heavy'), window.ProductCategoryUi.isFieldVisible('view', 'heavyLoad', profile));

        const descriptionMode = window.ProductCategoryUi.getFieldConfig('view', 'description', profile).mode || pageProfile.descriptionMode || 'accordion';
        const toggle = document.getElementById('productView_description_toggle');
        const content = document.getElementById('productView_description_content');
        const container = document.getElementById('productView_description_container');
        if (toggle && content && container) {
            const plain = descriptionMode === 'plain';
            toggle.style.pointerEvents = plain ? 'none' : '';
            if (plain) {
                toggle.setAttribute('aria-expanded', 'true');
                container.classList.remove('is-collapsed');
                container.classList.add('is-expanded');
                content.style.maxHeight = 'none';
            }
        }

        const actionTextSpec = window.ProductCategoryUi.getFieldConfig('view', 'cartActions', profile).actionText || pageProfile.actionButtonText || null;
        const actionText = internal.resolveText(actionTextSpec);
        const actionLabel = document.getElementById('productView_add_to_cart_text');
        if (actionText && actionLabel) internal.setText(actionLabel, actionText);

        const bannerHost = document.getElementById('productView_description_container') || document.getElementById('productView_info_grid');
        if (bannerHost) {
            const capabilities = typeof window.resolveUserCapabilities === 'function' ? window.resolveUserCapabilities(window.userSession) : null;
            const isSuperAdmin = capabilities?.isSuperAdmin === true;

            if (!isSuperAdmin) {
                const skipMsg = 'Category profile banner skipped: User is not a Super Admin';
                if (window.ProductCategoryLogger) window.ProductCategoryLogger.info('PageCore', skipMsg);
                else console.log(`[ProductCategoryPageCore] ${skipMsg}`);
            } else {
                let banner = document.getElementById('productView_category_profile_banner');
                if (!banner) {
                    banner = document.createElement('div');
                    banner.id = 'productView_category_profile_banner';
                    banner.setAttribute('data-admin-only', 'true');
                    banner.style.cssText = 'margin-bottom:14px;padding:12px 14px;border-radius:16px;background:rgba(11,94,215,.08);border:1px solid rgba(11,94,215,.12);';
                    bannerHost.insertAdjacentElement('beforebegin', banner);

                    const createMsg = 'Category profile banner created for Super Admin';
                    if (window.ProductCategoryLogger) window.ProductCategoryLogger.info('PageCore', createMsg);
                    else console.log(`[ProductCategoryPageCore] ${createMsg}`);
                }

                const title = internal.resolveText(pageProfile.summaryTitle, 'Category behavior');
                const categoryText = names.sub || names.main || '';
                const bodyText = categoryText
                    ? internal.resolveText(profile.summary, '')
                    : internal.resolveText(pageProfile.summaryFallback, 'This product uses the standard category-driven layout.');
                const hints = window.ProductCategoryUi.getProfileHints(profile, 'view');

                const noticeText = typeof window.langu === 'function' ? window.langu('pv_super_admin_notice') : 'Notice: This section is visible only to Super Admin';

                banner.innerHTML = `
                    <div style="font-size:0.75rem; color:#dc3545; font-weight:bold; margin-bottom:8px; border-bottom:1px dashed rgba(220,53,69,0.2); padding-bottom:4px;">
                        <i class="fas fa-shield-alt"></i> ${noticeText}
                    </div>
                    <div id="productView_category_profile_banner_title" style="font-weight:700;color:#0b5ed7;">${title}${categoryText ? `: ${categoryText}` : ''}</div>
                    <div id="productView_category_profile_banner_body" style="color:#495057;">${bodyText || window.ProductCategoryUi.getProfileLabel(profile)}</div>
                    ${hints.length ? `<div id="productView_category_profile_banner_hints" style="margin-top:6px;color:#6c757d;font-size:.9rem;">${hints.join(' | ')}</div>` : ''}
                    <div id="productView_category_profile_banner_profile" style="margin-top:6px;color:#6c757d;font-size:.9rem;">Profile: ${window.ProductCategoryUi.getProfileLabel(profile)}</div>

                    <div id="productView_category_profile_simulator_wrapper" style="margin-top:12px; padding-top:12px; border-top:1px solid rgba(11,94,215,0.1);">
                        <div style="font-size:0.7rem; color:#0b5ed7; font-weight:bold; margin-bottom:8px; text-transform:uppercase; letter-spacing:0.5px;">
                            <i class="fas fa-flask"></i> محاكي واجهة التصنيفات (تفاعلي)
                        </div>
                        <div id="productView_category_simulator_panel_host"></div>
                    </div>
                `;

                // Render the simulator selector
                if (window.ProductCategoryScope && typeof window.ProductCategoryScope.renderSelector === 'function') {
                    await window.ProductCategoryScope.renderSelector({
                        containerId: 'productView_category_simulator_panel_host',
                        itemType: 'product',
                        inputClass: 'product-view-admin-input', // Generic class
                        mainLabel: 'محاكاة القسم الرئيسي',
                        subLabel: 'محاكاة القسم الفرعي',
                        preferredMainId: mainId,
                        preferredSubId: subId,
                        emptyMessage: 'لا توجد أقسام متاحة للمحاكاة.',
                        skipGlobalState: true,
                        bypassFilter: true, // Show all categories for simulation
                        onSync: async (simMainId, simSubId) => {
                            if (simMainId === mainId && simSubId === subId) return;
                            
                            const logMsg = `Simulating Category UI (View Mode): ${simMainId} > ${simSubId}`;
                            if (window.ProductCategoryLogger) window.ProductCategoryLogger.info('Simulator', logMsg);
                            else console.log(`[ProductCategorySimulator] ${logMsg}`);

                            // Re-apply the view page UI with the simulated IDs
                            await applyViewPage(productData, { mainId: simMainId, subId: simSubId });
                        }
                    });
                }
            }
        }

        internal.trace('apply-view-page-complete', {
            productKey: productData?.product_key || null,
            profileKey: profile.profileKey,
            mainId: profile.mainId,
            subId: profile.subId
        });
        if (window.ProductCategoryLogger) window.ProductCategoryLogger.groupEnd();
        else console.groupEnd();
        return profile;
    }

    window.ProductCategoryPageCore = {
        applyAddPage,
        applyEditPage,
        applyViewPage,
        getCategoryNames: internal.getCategoryNames
    };
})();
