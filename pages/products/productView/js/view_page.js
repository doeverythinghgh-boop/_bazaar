/**
 * @file pages/productView/js/view_page.js
 * @description Page bootstrap for ProductView.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
/**
 * @file pages/productView/js/view_page.js
 * @description Page bootstrap for ProductView.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


window.productView_initPage = async function productView_initPage() {
    const loaderElement = document.getElementById('loader-container');
    const contentElement = document.getElementById('productView_modal_content');

    console.log('[ProductView] ===== PAGE INITIALIZATION START =====');
    console.log('[ProductView] Loader element found:', !!loaderElement);
    console.log('[ProductView] Content element found:', !!contentElement);

    window.ProductDebugConsole?.log('productView-page', 'init-start');

    if (loaderElement) loaderElement.style.display = 'block';
    if (contentElement) contentElement.style.display = 'none';

    try {
        const params = new URLSearchParams(window.location.search);
        const sourceType = (params.get('source') || '').trim().toLowerCase();
        const rawListingType = params.get('listing') || params.get('listing_type') || sourceType
            || (params.get('car_key') ? 'car' : (params.get('real_estate_key') ? 'real_estate' : ''));
        const listingType = ['car', 'cars', 'real_estate', 'real-estate', 'realestate'].includes(String(rawListingType || '').toLowerCase())
            ? rawListingType
            : '';
        const isPharmacyRoute = params.get('pharmacy') === '1' || sourceType === 'pharmacy' || !!params.get('pharmacy_product_id');
        const dataListingType = isPharmacyRoute ? 'pharmacy' : listingType;
        const urlKey = params.get('product_key') || params.get('key') || params.get('id') || params.get('car_key') || params.get('real_estate_key');
        const providerKey = params.get('provider_key') || params.get('m') || params.get('merchant_key');

        if (!urlKey || !providerKey) {
            console.error('[ProductView] Missing provider_key or product_key in URL. Redirecting to home.');
            window.location.replace('/');
            return;
        }

        let productData = typeof ProductStateManager !== 'undefined' ? ProductStateManager.getCurrentProduct() : null;

        window.ProductDebugConsole?.snapshot('productView-page', 'route-context', {
            urlKey,
            hasInitialStateProduct: !!productData
        });

        if (productData && window.ProductModel) {
            const mappedCurrent = window.ProductModel.normalize(productData);
            if (mappedCurrent) productData = mappedCurrent;
            window.ProductDebugConsole?.snapshot('productView-page', 'normalized-initial-product', {
                productKey: productData?.product_key || null
            });
        }

        if (urlKey && (!productData || String(productData.product_key) !== String(urlKey))) {
            const cachedProduct = typeof ProductStateManager !== 'undefined'
                ? ProductStateManager.getProductFromHistory(urlKey)
                : null;

            if (cachedProduct) {
                console.log(`[ProductView] Restored from registry for key: ${urlKey}`);
                productData = cachedProduct;
                window.ProductDebugConsole?.log('productView-page', 'restored-from-registry', { urlKey });
            } else {
                productData = null;
                window.ProductDebugConsole?.warn('productView-page', 'registry-miss', { urlKey });
            }
        }

        const activeKey = urlKey || productData?.product_key || null;
        const viewOptions = typeof ProductStateManager !== 'undefined'
            ? ProductStateManager.getViewOptions(activeKey)
            : {};

        window.ProductDebugConsole?.snapshot('productView-page', 'resolved-options', {
            activeKey,
            optionKeys: Object.keys(viewOptions || {})
        });

        if (productData && window.ProductModel) {
            const mapped = window.ProductModel.normalize(productData);
            if (mapped) productData = mapped;
        }

        const isLite = window.ProductModel ? window.ProductModel.isLiteProduct(productData) : false;
        window.ProductDebugConsole?.snapshot('productView-page', 'product-shape-check', {
            activeKey,
            hasProduct: !!productData,
            isLite
        });

        // Attempt to fetch from API if product data is missing
        if (activeKey && (!productData || !productData.product_key) && typeof getProductByKey === 'function') {
            try {
                console.log('[ProductView] Starting direct API fetch for product:', activeKey);
                window.ProductDebugConsole?.log('productView-page', 'direct-api-fetch-start', { activeKey });
                const apiProduct = await getProductByKey(activeKey, { listingType: dataListingType });
                console.log('[ProductView] API response received:', {
                    hasData: !!apiProduct,
                    hasError: !!apiProduct?.error,
                    productKey: apiProduct?.product_key
                });
                if (apiProduct && !apiProduct.error) {
                    const apiMapped = window.ProductModel
                        ? window.ProductModel.normalize(apiProduct)
                        : apiProduct;
                    if (apiMapped && apiMapped.product_key) {
                        productData = apiMapped;
                        console.log('[ProductView] ✅ Product data successfully loaded from API:', {
                            productKey: apiMapped.product_key,
                            productName: apiMapped.productName,
                            imageCount: apiMapped.images?.length || 0
                        });
                        if (typeof ProductStateManager !== 'undefined') {
                            ProductStateManager.setProductForView(productData, viewOptions);
                        }
                        window.ProductDebugConsole?.log('productView-page', 'direct-api-fetch-complete', {
                            activeKey,
                            fetchedProductKey: apiMapped.product_key
                        });
                    }
                }
            } catch (apiError) {
                console.error('[ProductView] ❌ Direct API fetch failed:', apiError?.message || apiError);
                window.ProductDebugConsole?.warn('productView-page', 'direct-api-fetch-failed', {
                    activeKey,
                    message: apiError?.message || String(apiError)
                });
            }
        }

        if (activeKey && (!productData || !productData.product_key) && isPharmacyRoute && typeof window.ProductPharmacyBridge?.buildLegacyProduct === 'function') {
            const legacyPharmacyProduct = await window.ProductPharmacyBridge.buildLegacyProduct(activeKey, providerKey);
            if (legacyPharmacyProduct) {
                productData = window.ProductModel ? window.ProductModel.normalize(legacyPharmacyProduct) : legacyPharmacyProduct;
                if (productData) {
                    productData.pharmacy_metadata = true;
                    productData.pharmacyCatalogItem = legacyPharmacyProduct.pharmacyCatalogItem || null;
                }
                if (typeof ProductStateManager !== 'undefined') {
                    ProductStateManager.setProductForView(productData, viewOptions);
                }
                window.ProductDebugConsole?.log('productView-page', 'loaded-legacy-pharmacy-product', { activeKey });
            }
        }

        const shouldFetchFullProduct = activeKey && (!productData || !productData.pharmacyCatalogItem);
        if (shouldFetchFullProduct) {
            window.ProductDebugConsole?.log('productView-page', 'fetch-full-product-start', { activeKey });
            if (typeof getProductByKey === 'function') {
                try {
                    const fullData = await getProductByKey(activeKey, { listingType: dataListingType });
                    if (fullData && !fullData.error) {
                        const fullMapped = window.ProductModel
                            ? window.ProductModel.normalize(fullData)
                            : fullData;
                        if (fullMapped) {
                            productData = fullMapped;
                            window.ProductDebugConsole?.log('productView-page', 'fetch-full-product-complete', {
                                activeKey,
                                fetchedProductKey: fullMapped.product_key || null
                            });
                            if (typeof ProductStateManager !== 'undefined') {
                                ProductStateManager.setProductForView(productData, viewOptions);
                            }
                        }
                    } else {
                        window.ProductDebugConsole?.warn('productView-page', 'fetch-full-product-empty', {
                            activeKey,
                            hasError: !!fullData?.error
                        });
                        if (productData && typeof ProductStateManager !== 'undefined') {
                            ProductStateManager.setProductForView(productData, viewOptions);
                        }
                    }
                } catch (fetchErr) {
                    console.error('[ProductView] Error fetching full details:', fetchErr);
                    window.ProductDebugConsole?.error('productView-page', 'fetch-full-product-error', {
                        activeKey,
                        message: fetchErr?.message || String(fetchErr)
                    });
                    if (productData && typeof ProductStateManager !== 'undefined') {
                        ProductStateManager.setProductForView(productData, viewOptions);
                    }
                }
            } else {
                window.ProductDebugConsole?.warn('productView-page', 'getProductByKey-not-available', { activeKey });
                if (productData && typeof ProductStateManager !== 'undefined') {
                    ProductStateManager.setProductForView(productData, viewOptions);
                }
            }
        }

        if (activeKey && (!productData || !productData.product_key) && isPharmacyRoute && typeof window.ProductPharmacyBridge?.buildLegacyProduct === 'function') {
            const legacyPharmacyProduct = await window.ProductPharmacyBridge.buildLegacyProduct(activeKey, providerKey);
            if (legacyPharmacyProduct) {
                productData = window.ProductModel ? window.ProductModel.normalize(legacyPharmacyProduct) : legacyPharmacyProduct;
                if (productData) {
                    productData.pharmacy_metadata = true;
                    productData.pharmacyCatalogItem = legacyPharmacyProduct.pharmacyCatalogItem || null;
                }
                if (typeof ProductStateManager !== 'undefined') {
                    ProductStateManager.setProductForView(productData, viewOptions);
                }
                window.ProductDebugConsole?.log('productView-page', 'loaded-legacy-pharmacy-product', { activeKey });
            }
        }

        if (activeKey && (!productData || !productData.product_key) && listingType && typeof window.ProductSpecialtyListingBridge?.buildLegacyProduct === 'function') {
            const legacySpecialtyProduct = await window.ProductSpecialtyListingBridge.buildLegacyProduct(listingType, activeKey, providerKey);
            if (legacySpecialtyProduct) {
                productData = window.ProductModel ? window.ProductModel.normalize(legacySpecialtyProduct) : legacySpecialtyProduct;
                if (productData) {
                    productData.item_type = legacySpecialtyProduct.item_type;
                    if (legacySpecialtyProduct.is_car_listing) productData.is_car_listing = true;
                    if (legacySpecialtyProduct.is_real_estate_listing) productData.is_real_estate_listing = true;
                }
                if (typeof ProductStateManager !== 'undefined') {
                    ProductStateManager.setProductForView(productData, viewOptions);
                }
                window.ProductDebugConsole?.log('productView-page', 'loaded-legacy-specialty-product', { activeKey, listingType });
            }
        }

        if (productData && typeof window.ProductPharmacyBridge?.enrichProduct === 'function') {
            try {
                productData = await window.ProductPharmacyBridge.enrichProduct(productData) || productData;
            } catch (error) {
                console.warn('[ProductView] Pharmacy enrichment failed:', error);
            }
        }

        if (productData && typeof window.ProductSpecialtyListingBridge?.enrichProduct === 'function') {
            try {
                productData = await window.ProductSpecialtyListingBridge.enrichProduct(productData) || productData;
            } catch (error) {
                console.warn('[ProductView] Specialty listing enrichment failed:', error);
            }
        }

        if (productData && typeof ProductStateManager !== 'undefined') {
            ProductStateManager.setProductForView(productData, viewOptions);
        }

        if (productData && (productData.product_key || (productData.productName && productData.productName !== 'منتج غير مسمى'))) {
            console.log('[ProductView] ✅ RENDERING PRODUCT DATA:', {
                productKey: productData.product_key,
                productName: productData.productName,
                price: productData.pricePerItem,
                images: productData.images?.length || 0
            });
            window.ProductDebugConsole?.log('productView-page', 'render-start', {
                productKey: productData.product_key || null
            });
            await productView_viewDetails(productData, viewOptions);

            // Verify content element display state
            console.log('[ProductView] Setting contentElement display to flex');
            console.log('[ProductView] Before: contentElement.style.display =', contentElement?.style.display);
            if (contentElement) {
                contentElement.style.display = 'flex';
                console.log('[ProductView] After: contentElement.style.display =', contentElement.style.display);

                // Get computed styles
                const computedStyle = window.getComputedStyle(contentElement);
                console.log('[ProductView] ⚙️ COMPUTED STYLES:', {
                    display: computedStyle.display,
                    visibility: computedStyle.visibility,
                    opacity: computedStyle.opacity,
                    zIndex: computedStyle.zIndex,
                    position: computedStyle.position,
                    backgroundColor: computedStyle.backgroundColor,
                    color: computedStyle.color,
                    pointerEvents: computedStyle.pointerEvents,
                    overflow: computedStyle.overflow,
                    transform: computedStyle.transform,
                    filter: computedStyle.filter
                });

                console.log('[ProductView] contentElement visibility:', {
                    offsetHeight: contentElement.offsetHeight,
                    offsetWidth: contentElement.offsetWidth,
                    clientHeight: contentElement.clientHeight,
                    clientWidth: contentElement.clientWidth,
                    offsetTop: contentElement.offsetTop,
                    offsetLeft: contentElement.offsetLeft,
                    scrollHeight: contentElement.scrollHeight,
                    scrollWidth: contentElement.scrollWidth
                });

                // Check if element is in viewport
                const rect = contentElement.getBoundingClientRect();
                console.log('[ProductView] 📍 VIEWPORT POSITION:', {
                    top: rect.top,
                    left: rect.left,
                    bottom: rect.bottom,
                    right: rect.right,
                    width: rect.width,
                    height: rect.height,
                    inViewport: rect.top < window.innerHeight && rect.bottom > 0
                });

                // Check parent elements
                let parent = contentElement.parentElement;
                let parentLevel = 0;
                while (parent && parentLevel < 3) {
                    const parentComputed = window.getComputedStyle(parent);
                    console.log(`[ProductView] 👪 PARENT[${parentLevel}] (${parent.tagName}):`, {
                        id: parent.id,
                        class: parent.className,
                        display: parentComputed.display,
                        visibility: parentComputed.visibility,
                        opacity: parentComputed.opacity,
                        zIndex: parentComputed.zIndex,
                        backgroundColor: parentComputed.backgroundColor
                    });
                    parent = parent.parentElement;
                    parentLevel++;
                }

                // Check for child elements visibility
                const children = contentElement.querySelectorAll('[id*="productView"]');
                console.log(`[ProductView] 👶 FOUND ${children.length} PRODUCTVIEW CHILD ELEMENTS`);
                if (children.length > 0) {
                    const sampleChild = children[0];
                    const childComputed = window.getComputedStyle(sampleChild);
                    console.log('[ProductView] 👶 SAMPLE CHILD:', {
                        id: sampleChild.id,
                        display: childComputed.display,
                        visibility: childComputed.visibility,
                        opacity: childComputed.opacity,
                        textContent: sampleChild.textContent?.substring(0, 50)
                    });
                }
            } else {
                console.error('[ProductView] ❌ CRITICAL: contentElement is null!');
            }
            window.ProductDebugConsole?.log('productView-page', 'render-complete', {
                productKey: productData.product_key || null
            });
        } else {
            console.error('[ProductView] ❌ RENDER FAILED - Product data is invalid:', {
                hasProductData: !!productData,
                hasProductKey: !!productData?.product_key,
                hasProductName: !!productData?.productName,
                productNameValue: productData?.productName,
                dataKeys: productData ? Object.keys(productData) : 'null'
            });
            window.ProductDebugConsole?.warn('productView-page', 'no-product-data');
            console.warn('[ProductView] ' + window.langu('pv_no_product_data'));
            Swal.fire({
                icon: 'error',
                title: window.langu('pv_error_init') || 'خطأ',
                text: window.langu('pv_no_product_data') || 'لم يتم العثور على بيانات المنتج'
            });
        }
    } catch (error) {
        console.error('[ProductView] ❌ CRITICAL ERROR during initialization:', error);
        console.error('[ProductView] Error stack:', error?.stack);
        window.ProductDebugConsole?.error('productView-page', 'init-error', {
            message: error?.message || String(error)
        });
    } finally {
        console.log('[ProductView] ===== FINALIZATION PHASE =====');
        console.log('[ProductView] Hiding loader...');
        if (loaderElement) {
            loaderElement.style.display = 'none';
            console.log('[ProductView] Loader hidden. Display state:', loaderElement.style.display);
        }
        console.log('[ProductView] Checking final state:');
        if (contentElement) {
            const finalComputed = window.getComputedStyle(contentElement);
            console.log('[ProductView] 📊 FINAL CSS STATE:', {
                display: finalComputed.display,
                visibility: finalComputed.visibility,
                opacity: finalComputed.opacity,
                zIndex: finalComputed.zIndex,
                backgroundColor: finalComputed.backgroundColor,
                color: finalComputed.color
            });

            console.log('[ProductView] Content element display:', contentElement.style.display);
            console.log('[ProductView] Content is visible:', contentElement.style.display !== 'none');
            console.log('[ProductView] Content HTML length:', contentElement.innerHTML?.length || 0);

            // Check if body background might be hiding content
            const bodyComputed = window.getComputedStyle(document.body);
            console.log('[ProductView] 🖼️ BODY STYLES:', {
                backgroundColor: bodyComputed.backgroundColor,
                color: bodyComputed.color,
                overflow: bodyComputed.overflow
            });

            // Check root element
            const rootElement = document.getElementById('productView_modal_content');
            if (rootElement) {
                const rootBoundingBox = rootElement.getBoundingClientRect();
                console.log('[ProductView] 🎯 ROOT ELEMENT VISIBLE IN VIEWPORT:', {
                    isInViewport: rootBoundingBox.top < window.innerHeight && rootBoundingBox.bottom > 0,
                    boundingBox: {
                        top: rootBoundingBox.top,
                        left: rootBoundingBox.left,
                        bottom: rootBoundingBox.bottom,
                        right: rootBoundingBox.right
                    }
                });
            }
        } else {
            console.error('[ProductView] ❌ CRITICAL: Content element not found at finalization!');
        }
        window.ProductDebugConsole?.log('productView-page', 'init-finished');
        console.log('[ProductView] ===== PAGE INITIALIZATION COMPLETE =====');
    }
};
