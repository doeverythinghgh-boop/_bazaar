/**
 * @file pages/productView/js/view_details.js
 * @description Rendering and category lookup for ProductView.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


async function productView_viewDetails(productData, options = {}) {
    console.log('[ProductView-Details] ===== VIEW DETAILS RENDERING START =====');
    console.log('[ProductView-Details] Product input data:', {
        productKey: productData?.product_key,
        productName: productData?.productName,
        price: productData?.pricePerItem,
        imageCount: productData?.images?.length || 0,
        hasRatings: !!productData?.ratings,
        hasSellerSettings: !!productData?.seller_settings,
        categoryInfo: {
            mainId: productData?.MainCategory,
            subId: productData?.SubCategory
        }
    });
    try {
        if (window.LocalDB && productData) {
            window.LocalDB.saveProducts(productData, 'product-view').catch((error) => {
                console.warn('[ProductView] Failed to cache product locally:', error);
            });
        }
        // Fetch full metadata (ratings + seller_settings) for specialty listings
        // that arrive without this data (real_estate, vehicles, pharmacy bridges).
        const needsMetaFetch = productData && productData.product_key &&
            !productData.pharmacyCatalogItem &&
            (!productData.ratings || !productData.seller_settings || productData.seller_settings === '{}');
        if (needsMetaFetch) {
            try {
                // Prefer user_key from productData, then options, then URL params
                const listingType = productData.item_type === 'car' || productData.is_car_listing || productData._source === 'car'
                    ? 'car'
                    : (productData.item_type === 'real_estate' || productData.is_real_estate_listing || productData._source === 'real_estate' ? 'real_estate' : '');
                const listingParam = listingType ? `&listing=${encodeURIComponent(listingType)}` : '';
                const url = `/api/products?product_key=${encodeURIComponent(productData.product_key)}${listingParam}`;
                console.log('[ProductView] Fetching ratings/settings metadata from API:', url);
                const meta = await apiFetch(url);
                if (meta && !meta.error) {
                    productData.ratings = meta.ratings || [];
                    productData.seller_settings = meta.seller_settings || '{}';
                    if (!productData.user_key && meta.user_key) productData.user_key = meta.user_key;
                    console.log('[ProductView] Ratings/settings metadata fetched successfully. Ratings count:', productData.ratings.length);
                } else {
                    console.warn('[ProductView] Ratings/settings metadata fetch returned empty or error:', meta);
                    productData.ratings = productData.ratings || [];
                    productData.seller_settings = productData.seller_settings || '{}';
                }
            } catch (err) {
                console.error('[ProductView] Failed to fetch ratings/settings metadata:', err);
                productData.ratings = productData.ratings || [];
                productData.seller_settings = productData.seller_settings || '{}';
            }
        }

        if (window.ProductCategoryLogger) window.ProductCategoryLogger.group('ViewDetails', 'render-details', {
            productKey: productData?.product_key || null
        });
        else console.group('[ProductView] render-details');
        if (window.ProductCategoryLogger) window.ProductCategoryLogger.info('ViewDetails', 'render-input', productData);
        else console.log('[productView_] Rendering product details:', productData);
        window.ProductDebugConsole?.snapshot('productView-details', 'render-input', {
            productKey: productData?.product_key || null,
            optionKeys: Object.keys(options || {}),
            imageCount: Array.isArray(productData?.imageSrc) ? productData.imageSrc.length : 0
        });

        const dom = productView_getDomElements();
        const {
            name, quantityValue, price, description, sellerMessage,
            quantityContainer, cartActionsContainer,
            originalPriceContainer, originalPrice,
            mainImage, thumbnailsContainer,
            realPrice,
            adminSellerInfo, adminSellerKey,
            adminMainCategory, adminSubCategory
        } = dom;

        if (name) name.textContent = productData.productName || window.langu('pv_not_available');
        if (description) description.textContent = productData.description || window.langu('pv_no_description');
        if (sellerMessage) sellerMessage.textContent = productData.sellerMessage || window.langu('pv_not_available');
        productView_setupDescriptionAccordion(dom);

        // Heavy Load Visibility for all users (Solution C)
        if (dom.heavyLoadContainer) {
            const isHeavy = productData.heavyLoad == 1;
            console.log(`[ProductView] Heavy load check: ${isHeavy ? 'Enabled. Showing notice to buyer.' : 'Disabled. Hiding notice.'}`);
            dom.heavyLoadContainer.style.display = isHeavy ? 'block' : 'none';
        }

        if (typeof productView_renderBehaviorBanner === 'function') {
            await productView_renderBehaviorBanner(productData, dom);
            window.ProductDebugConsole?.log('productView-details', 'behavior-banner-rendered');
            if (window.ProductCategoryLogger) window.ProductCategoryLogger.info('ViewDetails', 'category-profile-applied');
            else console.log('[ProductView] category-profile-applied');
        }

        if (typeof window.ProductPharmacyBridge?.renderView === 'function') {
            await window.ProductPharmacyBridge.renderView(productData, dom);
        }
        if (typeof window.ProductSpecialtyListingBridge?.renderView === 'function') {
            await window.ProductSpecialtyListingBridge.renderView(productData, dom);
        }

        const activeProfile = window.ProductCategoryUi?.getActiveProfile?.('view') || null;
        const showAddToCart = options.showAddToCart !== false &&
            (typeof window.ProductCategoryUi === 'undefined' || window.ProductCategoryUi.isFieldVisible('view', 'cartActions', activeProfile));
        const showQuantity = typeof window.ProductCategoryUi === 'undefined' || window.ProductCategoryUi.isFieldVisible('view', 'quantity', activeProfile);
        const showPrice = typeof window.ProductCategoryUi === 'undefined' || window.ProductCategoryUi.isFieldVisible('view', 'price', activeProfile);
        const imageList = Array.isArray(productData.imageSrc) ? productData.imageSrc.filter(Boolean) : [];
        const showImages = imageList.length > 0 &&
            (typeof window.ProductCategoryUi === 'undefined' || window.ProductCategoryUi.isFieldVisible('view', 'images', activeProfile));
        window.ProductDebugConsole?.snapshot('productView-details', 'render-dom-presence', {
            hasName: !!name,
            hasPrice: !!price,
            hasMainImage: !!mainImage,
            hasThumbnails: !!thumbnailsContainer,
            showAddToCart,
            showImages
        });

        const imageContainer = document.getElementById('productView_image_container');
        if (imageContainer) imageContainer.style.display = showImages ? '' : 'none';
        if (quantityContainer) quantityContainer.style.display = showQuantity ? 'flex' : 'none';
        if (quantityValue) quantityValue.textContent = productData.availableQuantity || '0';
        if (price && showPrice) {
            price.textContent = `${productView_formatAmount(productData.pricePerItem || 0)} ${window.langu('pv_currency_egp')}`;
        } else if (price) {
            price.textContent = '';
        }

        if (showAddToCart) {
            if (cartActionsContainer) cartActionsContainer.style.display = 'block';
            productView_setupQuantityControls(productData, dom);
            productView_setupAddToCart(productData, dom);
            productView_updateTotalPrice(productData, dom);
            window.ProductDebugConsole?.log('productView-details', 'purchase-ui-enabled');
            if (window.ProductCategoryLogger) window.ProductCategoryLogger.info('ViewDetails', 'purchase-ui-enabled');
            else console.log('[ProductView] purchase-ui-enabled');
        } else if (cartActionsContainer) {
            cartActionsContainer.style.display = 'none';
            window.ProductDebugConsole?.log('productView-details', 'purchase-ui-hidden');
            if (window.ProductCategoryLogger) window.ProductCategoryLogger.info('ViewDetails', 'purchase-ui-hidden');
            else console.log('[ProductView] purchase-ui-hidden');
        }

        window.ProductViewCore?.applyStaticCopy();
        productView_setupSellerButton(productData, dom);
        productView_setupShareButton(productData, dom);
        window.ProductDebugConsole?.log('productView-details', 'seller-and-share-ready');

        if (window.ProductRatings && typeof window.ProductRatings.setup === 'function') {
            window.ProductRatings.setup(productData, {
                summaryId: 'productView-rating-summary',
                starsId: 'productView-rating-stars',
                countId: 'productView-rating-count',
                rateBtnId: 'productView-btn-rate',
                modal: {
                    modalId: 'productView-reviews-modal',
                    listId: 'productView-reviews-list',
                    closeBtnId: 'productView-btn-close-reviews'
                }
            });
            window.ProductDebugConsole?.log('productView-details', 'ratings-setup-complete');
        }

        productView_populateThumbnails(showImages ? imageList : [], mainImage, thumbnailsContainer);
        window.ProductDebugConsole?.snapshot('productView-details', 'thumbnails-populated', {
            imageCount: imageList.length
        });

        if (typeof productView_setupPinchZoom === 'function') {
            productView_setupPinchZoom(mainImage);
            window.ProductDebugConsole?.log('productView-details', 'pinch-zoom-enabled');
        }

        if (window.ProductViewCore && showPrice) {
            window.ProductViewCore.renderPriceMeta(productData, dom);
            window.ProductDebugConsole?.snapshot('productView-details', 'price-meta-rendered', {
                hasOriginalPrice: !!productData.original_price,
                hasDiscount: !!(productData.original_price && productData.pricePerItem < productData.original_price)
            });
        } else if (originalPriceContainer) {
            originalPriceContainer.style.display = 'none';
        }

        const user = window.userSession;
        if (user) {
            const access = window.ProductViewCore
                ? window.ProductViewCore.resolveAccess(productData, user)
                : { hasAccess: false };

            window.ProductDebugConsole?.snapshot('productView-details', 'access-evaluated', {
                hasAccess: !!access.hasAccess,
                userKey: user.user_key || null,
                productOwnerKey: productData.user_key || null
            });

            // Guard admin info panel visibility using the active category profile.
            // Pharmacy profiles set adminSellerInfo.visible = false so that admin-only
            // pricing fields (real price, heavy-load) are not exposed on pharmacy product pages.
            const activeProfileForAdmin = window.ProductCategoryUi?.getActiveProfile?.('view') || null;
            const showAdminInfo = typeof window.ProductCategoryUi === 'undefined' || window.ProductCategoryUi.isFieldVisible('view', 'adminSellerInfo', activeProfileForAdmin);

            if (access.hasAccess && showAdminInfo) {
                if (adminSellerInfo) {
                    if (adminSellerKey) adminSellerKey.textContent = productData.user_key || window.langu('pv_not_available');
                    if (realPrice) realPrice.textContent = `${productData.realPrice || 0} ${window.langu('pv_currency_egp')}`;

                    if (dom.heavyLoadValue) {
                        dom.heavyLoadValue.textContent = productData.heavyLoad == 1
                            ? window.langu('alert_confirm_yes')
                            : window.langu('alert_confirm_no');
                    }

                    if (adminMainCategory || adminSubCategory) {
                        productView_getCategoryNames(productData.MainCategory, productData.SubCategory)
                            .then((names) => {
                                if (adminMainCategory) adminMainCategory.textContent = names.main;
                                if (adminSubCategory) adminSubCategory.textContent = names.sub;
                                window.ProductDebugConsole?.snapshot('productView-details', 'admin-categories-resolved', names);
                            });
                    }

                    adminSellerInfo.style.display = 'block';
                    window.ProductDebugConsole?.log('productView-details', 'admin-panel-visible');
                    if (window.ProductCategoryLogger) window.ProductCategoryLogger.info('ViewDetails', 'admin-panel-visible');
                    else console.log('[ProductView] admin-panel-visible');

                    if (dom.editBtn) {
                        dom.editBtn.onclick = async () => {
                             window.ProductDebugConsole?.log('productView-details', 'edit-clicked', {
                                productKey: productData.product_key || null
                            });
                            if (typeof loadProductForm === 'function') {
                                if (typeof ProductStateManager !== 'undefined') {
                                    ProductStateManager.setSelectedCategories(productData.MainCategory, productData.SubCategory);
                                    ProductStateManager.setFormScopeFilter(null);
                                }
                                loadProductForm({ editMode: true, productData });
                            }
                        };
                    }

                    if (dom.deleteBtn) {
                        dom.deleteBtn.onclick = () => {
                            window.ProductDebugConsole?.log('productView-details', 'delete-clicked', {
                                productKey: productData.product_key || null
                            });
                            if (typeof productView_handleDelete === 'function') {
                                productView_handleDelete(productData);
                            }
                        };
                    }
                }
            } else if (adminSellerInfo) {
                adminSellerInfo.style.display = 'none';
                window.ProductDebugConsole?.log('productView-details', 'admin-panel-hidden');
                if (window.ProductCategoryLogger) window.ProductCategoryLogger.info('ViewDetails', 'admin-panel-hidden');
                else console.log('[ProductView] admin-panel-hidden');
            }
        } else if (adminSellerInfo) {
            adminSellerInfo.style.display = 'none';
            window.ProductDebugConsole?.log('productView-details', 'admin-panel-hidden-no-user-session');
            if (window.ProductCategoryLogger) window.ProductCategoryLogger.info('ViewDetails', 'admin-panel-hidden-no-user-session');
            else console.log('[ProductView] admin-panel-hidden-no-user-session');
        }

        if (originalPriceContainer && originalPrice) {
            window.ProductDebugConsole?.snapshot('productView-details', 'price-dom-state', {
                originalPriceVisible: originalPriceContainer.style.display !== 'none',
                originalPriceText: originalPrice.textContent || ''
            });
        }
        if (window.ProductCategoryLogger) {
            window.ProductCategoryLogger.info('ViewDetails', 'render-details-complete');
            window.ProductCategoryLogger.groupEnd();
        } else {
            console.log('[ProductView] render-details-complete');
            console.log('[ProductView-Details] ===== VIEW DETAILS RENDERING COMPLETE =====');
            console.log('[ProductView-Details] Final DOM state:');
            console.log('[ProductView-Details] - Modal content display:', document.getElementById('productView_modal_content')?.style.display);
            console.log('[ProductView-Details] - Product name element:', !!document.getElementById('productView_name'));
            console.log('[ProductView-Details] - Price element:', !!document.getElementById('productView_price'));
            console.log('[ProductView-Details] - Images container:', !!document.getElementById('productView_thumbnails_container'));
            console.groupEnd();
        }
    } catch (error) {
        console.error('[ProductView-Details] ❌ CRITICAL ERROR in productView_viewDetails:', error);
        console.error('[ProductView-Details] Error message:', error?.message);
        console.error('[ProductView-Details] Error stack:', error?.stack);
        if (window.ProductCategoryLogger) window.ProductCategoryLogger.groupEnd();
        else console.groupEnd();
        console.error('productView_viewDetails - general rendering error:', error);
        window.ProductDebugConsole?.error('productView-details', 'render-error', {
            message: error?.message || String(error)
        });
    }
}

async function productView_getCategoryNames(mainId, subId) {
    window.ProductDebugConsole?.log('productView-details', 'get-category-names-start', { mainId, subId });
    const result = window.ProductViewCore
        ? window.ProductViewCore.getCategoryNames(mainId, subId)
        : { main: window.langu('pv_load_failed'), sub: window.langu('pv_load_failed') };
    return result;
}
