/**
 * @file pages/productView/js/view_ui_dom.js
 * @description DOM accessors and static UI helpers for ProductView.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


function productView_getDomElements() {
    return {
        quantityContainer: document.getElementById("productView_quantity_container"),
        shareBtn: document.getElementById("productView_share_btn"),
        cartActionsContainer: document.getElementById("productView_cart_actions"),
        originalPriceContainer: document.getElementById("productView_original_price_container"),
        name: document.getElementById("productView_name"),
        quantityValue: document.getElementById("productView_quantity_value"),
        price: document.getElementById("productView_price"),
        originalPrice: document.getElementById("productView_original_price"),
        description: document.getElementById("productView_description_text"),
        sellerMessage: document.getElementById("productView_seller_message_text"),
        mainImage: document.getElementById("productView_image"),
        thumbnailsContainer: document.getElementById("productView_thumbnails_container"),
        decreaseBtn: document.getElementById("productView_decrease_quantity_btn"),
        increaseBtn: document.getElementById("productView_increase_quantity_btn"),
        selectedQuantityInput: document.getElementById("productView_selected_quantity_input"),
        totalPriceEl: document.getElementById("productView_total_price"),
        addToCartBtn: document.getElementById("productView_add_to_cart_btn"),
        realPrice: document.getElementById("productView_real_price"),
        adminSellerInfo: document.getElementById("productView_admin_seller_info"),
        adminSellerKey: document.getElementById("productView_admin_seller_key"),
        adminMainCategory: document.getElementById("productView_admin_main_category"),
        adminSubCategory: document.getElementById("productView_admin_sub_category"),
        heavyLoadValue: document.getElementById("productView_heavy_load_value"),
        heavyLoadContainer: document.getElementById("productView_heavy_load_container"),
        displaySellerName: document.getElementById("productView_display_seller_name"),
        goToSellerBtn: document.getElementById("productView_go_to_seller_btn"),
        addToRequestBtn: document.getElementById("productView_add_to_request_btn"),
        discountBadge: document.getElementById("productView_discount_badge"),
        descriptionContainer: document.getElementById("productView_description_container"),
        descriptionToggle: document.getElementById("productView_description_toggle"),
        descriptionContent: document.getElementById("productView_description_content"),
        totalSavingsEl: document.getElementById("productView_total_savings"),
        editBtn: document.getElementById("productView_edit_btn"),
        deleteBtn: document.getElementById("productView_delete_btn")
    };
}

function productView_cleanRequestValue(value) {
    if (Array.isArray(value)) return productView_cleanRequestValue(value[0]);
    return String(value || '').trim();
}

function productView_firstRequestImage(productData) {
    if (!productData) return '';
    const candidates = [
        Array.isArray(productData.imageSrc) ? productData.imageSrc[0] : productData.imageSrc,
        productData.image,
        productData.ImageName,
        productData.image_name,
        productData.image_url,
        productData.pharmacyCatalogItem?.renderedImgUrl,
        productData.pharmacyCatalogItem?.image_url
    ];
    return productView_cleanRequestValue(candidates.find((item) => productView_cleanRequestValue(item)));
}

function productView_resolveRequestSourceType(productData) {
    if (!productData) return 'product';
    if (window.ProductPharmacyBridge?.isPharmacyProduct?.(productData) === true) {
        return productData.pharmacyCatalogItem?.isMerchant ? 'custom_pharmacy' : 'catalog_pharmacy';
    }
    if (productData.is_car_listing || productData._source === 'car' || productData.item_type === 'car') return 'car';
    if (productData.is_real_estate_listing || productData._source === 'real_estate' || productData.item_type === 'real_estate') return 'real_estate';
    return productView_cleanRequestValue(productData.item_type || productData._source || 'product');
}

function productView_buildRequestViewPath(productData, merchantKey, productId) {
    if (window.ProductRoutes?.buildProductViewUrl) {
        return window.ProductRoutes.buildProductViewUrl(productData, {
            providerKey: merchantKey,
            productKey: productId
        });
    }

    const params = new URLSearchParams();
    params.set('product_key', productId);
    params.set('provider_key', merchantKey);

    if (window.ProductPharmacyBridge?.isPharmacyProduct?.(productData) === true) {
        params.set('pharmacy', '1');
    } else if (productData?.is_car_listing || productData?._source === 'car' || productData?.item_type === 'car') {
        params.set('listing', 'car');
    } else if (productData?.is_real_estate_listing || productData?._source === 'real_estate' || productData?.item_type === 'real_estate') {
        params.set('listing', 'real_estate');
    }

    return `/pages/products/productView/productView.html?${params.toString()}`;
}

function productView_buildRequestCartItem(productData, dom) {
    const merchantKey = productView_cleanRequestValue(productData?.user_key || productData?.seller_key || productData?.merchant_user_key);
    const productId = productView_cleanRequestValue(productData?.product_key || productData?.id || productData?.product_id);
    if (!merchantKey || !productId) return null;

    const quantity = Math.max(1, parseInt(dom?.selectedQuantityInput?.value || 1, 10) || 1);
    const sourceType = productView_resolveRequestSourceType(productData);

    return {
        merchantKey,
        productId,
        sourceType,
        name: productView_cleanRequestValue(productData?.productName || productData?.name || productData?.pharmacyCatalogItem?.name_ar || productData?.pharmacyCatalogItem?.name_en),
        image: productView_firstRequestImage(productData),
        quantity,
        viewPath: productView_buildRequestViewPath(productData, merchantKey, productId),
        payload: {
            product_key: productId,
            price: productData?.pricePerItem ?? productData?.product_price ?? productData?.price ?? null,
            original_price: productData?.original_price ?? null,
            main_category: productData?.MainCategory ?? productData?.mainId ?? null,
            sub_category: productData?.SubCategory ?? productData?.subId ?? null,
            source_type: sourceType,
            is_pharmacy: window.ProductPharmacyBridge?.isPharmacyProduct?.(productData) === true,
            is_car_listing: !!productData?.is_car_listing,
            is_real_estate_listing: !!productData?.is_real_estate_listing
        }
    };
}

function productView_refreshRequestButtonState(productData, dom) {
    const merchantKey = productView_cleanRequestValue(productData?.user_key || productData?.seller_key || productData?.merchant_user_key);
    if (!dom?.addToRequestBtn || !merchantKey || !window.PharmacyRequestCart) return;

    const productId = productView_cleanRequestValue(productData.product_key || productData.id || productData.product_id);
    const exists = productId && window.PharmacyRequestCart.has(merchantKey, productId);
    dom.addToRequestBtn.classList.toggle('is-added', !!exists);
    const label = dom.addToRequestBtn.querySelector('span');
    if (label) label.textContent = exists ? 'مضاف للطلب' : 'أضف للطلب';
}

function productView_notifyRequestCart(title, icon) {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title,
            icon: icon || 'success',
            timer: 1400,
            showConfirmButton: false,
            toast: true,
            position: 'top-end',
            customClass: { popup: 'swal-modern-mini-popup' }
        });
        return;
    }

    alert(title);
}

function productView_setupRequestButton(productData, dom) {
    const btn = dom?.addToRequestBtn;
    if (!btn) return;

    // Only show request button for categories using the `quote_request` profile.
    try {
        if (window.ProductCategoryUi && typeof window.ProductCategoryUi.resolveProductProfile === 'function') {
            const resolved = window.ProductCategoryUi.resolveProductProfile(productData || {});
            if (resolved?.profileKey !== 'quote_request') {
                btn.style.display = 'none';
                return;
            }
        }
    } catch (err) {
        console.warn('[ProductView] Failed to resolve product profile for request button:', err);
    }

    const cartApi = window.PharmacyRequestCart;
    const cartItem = productView_buildRequestCartItem(productData, dom);
    if (!cartApi || !cartItem) {
        btn.style.display = 'none';
        return;
    }

    btn.style.display = 'flex';
    productView_refreshRequestButtonState(productData, dom);

    btn.onclick = async (event) => {
        event.preventDefault();

        const nextCartItem = productView_buildRequestCartItem(productData, dom);
        if (!nextCartItem) return;

        const result = cartApi.add(nextCartItem);
        if (!result.added && result.reason === 'duplicate') {
            cartApi.updateQuantity(nextCartItem.merchantKey, nextCartItem.productId, nextCartItem.quantity);
        }
        cartApi.syncBadge(nextCartItem.merchantKey);
        productView_refreshRequestButtonState(productData, dom);
        productView_notifyRequestCart(
            result.added ? 'تمت إضافة المنتج للطلب' : 'المنتج مضاف للطلب مسبقا',
            result.added ? 'success' : 'info'
        );
    };
}

function productView_setupDescriptionAccordion(dom) {
    if (!dom.descriptionContainer || !dom.descriptionToggle || !dom.descriptionContent || !dom.description) return;

    const expand = function () {
        dom.descriptionContainer.classList.remove("is-collapsed");
        dom.descriptionContainer.classList.add("is-expanded");
        dom.descriptionToggle.setAttribute("aria-expanded", "true");
        dom.descriptionContent.style.maxHeight = `${dom.description.scrollHeight + 24}px`;
    };

    const collapse = function () {
        dom.descriptionContainer.classList.remove("is-expanded");
        dom.descriptionContainer.classList.add("is-collapsed");
        dom.descriptionToggle.setAttribute("aria-expanded", "false");
        dom.descriptionContent.style.maxHeight = "0px";
    };

    collapse();

    dom.descriptionToggle.onclick = function () {
        if (dom.descriptionContainer.classList.contains("is-expanded")) {
            collapse();
        } else {
            expand();
        }
    };
}

async function productView_renderBehaviorBanner(productData) {
    if (typeof window.ProductCategoryPageCore === 'undefined' || typeof window.ProductCategoryPageCore.applyViewPage !== 'function') {
        return null;
    }

    try {
        const payload = {
            productKey: productData?.product_key || null,
            mainId: productData?.MainCategory || null,
            subId: productData?.SubCategory || null
        };
        if (window.ProductCategoryLogger) window.ProductCategoryLogger.info('ViewPage', 'apply-view-profile-start', payload);
        else console.log('[ProductView][CategoryUI] apply-view-profile-start', payload);
        const result = await window.ProductCategoryPageCore.applyViewPage(productData);
        const completePayload = {
            productKey: productData?.product_key || null,
            profileKey: result?.profileKey || null
        };
        if (window.ProductCategoryLogger) window.ProductCategoryLogger.info('ViewPage', 'apply-view-profile-complete', completePayload);
        else console.log('[ProductView][CategoryUI] apply-view-profile-complete', completePayload);
        return result;
    } catch (error) {
        console.error('[ProductView] Failed to apply category-driven view profile:', error);
        return null;
    }
}

async function productView_updateCategoryBadge(mainId, subId, badgeEl) {
    if (!badgeEl) return;
    if (typeof productView_getCategoryNames === "function") {
        const names = await productView_getCategoryNames(mainId, subId);
        badgeEl.textContent = names.sub !== "-" ? names.sub : names.main;
    }
}

function productView_setupSellerButton(productData, dom) {
    const merchantKey = productView_cleanRequestValue(productData?.user_key || productData?.seller_key || productData?.merchant_user_key);
    if (!merchantKey) {
        if (dom.goToSellerBtn) dom.goToSellerBtn.style.display = 'none';
        if (dom.addToRequestBtn) dom.addToRequestBtn.style.display = 'none';
        return;
    }

    if (dom.displaySellerName) {
        dom.displaySellerName.textContent = productData.sellerName || "...";
    }

    if (dom.goToSellerBtn) {
        dom.goToSellerBtn.onclick = () => {
            const portfolioUrl = `/pages/merchant-portfolio/merchant-portfolio.html?user_key=${merchantKey}`;
            window.location.href = portfolioUrl;
        };
    }

    productView_setupRequestButton(productData, dom);
}
