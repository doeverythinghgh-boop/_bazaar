/**
 * @file pages/merchant-portfolio/js/fetch/pharmacy-featured-fetch.js
 * @description Persistence and fetching for pharmacy featured products.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

(function () {
    function readFeaturedData(user) {
        const currentData = user?.featured_items_data;
        if (!currentData) return {};
        try {
            const parsed = typeof currentData === 'string' ? JSON.parse(currentData) : currentData;
            return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
        } catch (error) {
            console.error('[PharmacyFeatured] Failed to parse featured_items_data:', error);
            return {};
        }
    }

    function extractPharmacyFeaturedItems(user) {
        const imgJson = readFeaturedData(user);
        const utils = window.pharmacyFeaturedUtils || {};
        const rawItems = Array.isArray(imgJson.pharmacy_featured_ids) ? imgJson.pharmacy_featured_ids : [];
        return rawItems
            .map((entry) => utils.normalizeSavedItem ? utils.normalizeSavedItem(entry) : entry)
            .filter(Boolean);
    }

    function canPersistFeaturedCleanup(userKey) {
        const PortfolioAPI = window.PortfolioAPI || {};
        const currentUser = typeof SessionManager !== 'undefined' ? SessionManager.getUser() : null;
        const capabilities = PortfolioAPI.resolveUserCapabilities
            ? PortfolioAPI.resolveUserCapabilities(currentUser)
            : null;
        return !!(currentUser && (currentUser.user_key === userKey || capabilities?.isAdmin));
    }

    function haveSameFeaturedItems(leftItems, rightItems) {
        const utils = window.pharmacyFeaturedUtils || {};
        const keyOf = utils.getFeaturedKey || ((entry) => `${entry?.type || 'catalog'}:${entry?.id || entry}`);
        const leftKeys = (Array.isArray(leftItems) ? leftItems : []).map(keyOf).filter(Boolean).sort();
        const rightKeys = (Array.isArray(rightItems) ? rightItems : []).map(keyOf).filter(Boolean).sort();
        return leftKeys.length === rightKeys.length && leftKeys.every((key, index) => key === rightKeys[index]);
    }

    window.portfolioUpdatePharmacyFeaturedItems = async function (userKey, featuredItems) {
        try {
            const PortfolioAPI = window.PortfolioAPI || {};
            const utils = window.pharmacyFeaturedUtils || {};
            const normalizedItems = (Array.isArray(featuredItems) ? featuredItems : [])
                .map((entry) => utils.normalizeSavedItem ? utils.normalizeSavedItem(entry) : entry)
                .filter(Boolean);

            const user = await window.portfolioFetchUser(userKey);
            if (!user) return false;

            const imgJson = readFeaturedData(user);
            imgJson.pharmacy_featured_ids = normalizedItems;

            const result = await updateUser({
                user_key: userKey,
                featured_items_data: JSON.stringify(imgJson)
            });

            if (result && !result.error) {
                if (PortfolioAPI.saveCache) {
                    const cache = PortfolioAPI.loadCache(userKey) || {};
                    PortfolioAPI.saveCache(userKey, {
                        ...cache,
                        user: {
                            ...(cache.user || user),
                            ...user,
                            featured_items_data: JSON.stringify(imgJson)
                        }
                    });
                }
                if (utils.setFeaturedItems) utils.setFeaturedItems(normalizedItems);
                console.log('[PharmacyFeatured] Featured items updated successfully.');
                return true;
            }

            return false;
        } catch (error) {
            console.error('[PharmacyFeatured] Update featured items failed:', error);
            return false;
        }
    };

    async function findCatalogProductByFeaturedItem(featuredItem, userKey, options = {}) {
        if (!featuredItem?.id || !featuredItem?.subId) return null;
        
        const context = options.context || (window.pharmacyUIBase?.loadPharmacyContext
            ? await window.pharmacyUIBase.loadPharmacyContext(userKey)
            : (window.PharmacyAPI?.getCatalogContext ? await window.PharmacyAPI.getCatalogContext(userKey) : null));
            
        const hiddenProducts = new Set(context?.hiddenProductIds || []);
        if (hiddenProducts.has(String(featuredItem.id))) {
            console.log(`[Pharmacy-Featured-Fetch] Item ${featuredItem.id} is hidden by user. Skipping.`);
            return null;
        }

        // Use pre-fetched merchant products if available to check for customization
        const merchantProducts = options.merchantProducts || (window.PharmacyAPI?.fetchMerchantProducts 
            ? await window.PharmacyAPI.fetchMerchantProducts(userKey).catch(() => []) 
            : []);

        const customizedProduct = merchantProducts.find((product) => (
            String(product?.original_catalog_id || '') === String(featuredItem.id) &&
            String(product?.custom_sub_cat_id || featuredItem.subId || '') === String(featuredItem.subId || '') &&
            Number(product?.status) !== 0
        ));

        if (customizedProduct) {
            return {
                ...customizedProduct,
                id: customizedProduct.product_id || customizedProduct.id,
                image_url: customizedProduct.image_url || customizedProduct.image_names,
                subId: customizedProduct.custom_sub_cat_id || featuredItem.subId,
                isMerchant: true
            };
        }

        const categories = Array.isArray(context?.mergedCategories) ? context.mergedCategories : [];
        const category = categories.find((main) => Array.isArray(main.sub) && main.sub.some((sub) => String(sub.id) === String(featuredItem.subId)));
        if (!category) return null;

        const subCategory = category.sub.find((sub) => String(sub.id) === String(featuredItem.subId));
        const dataFile = category.dataFile;
        let products = [];

        if (subCategory?.isCustom) {
            products = window.PharmacyAPI?.getProductsBySubCategory
                ? await window.PharmacyAPI.getProductsBySubCategory(userKey, subCategory.id).catch(() => [])
                : [];
        } else if (dataFile && window.pharmacyUIBase?.fetchJsonCached) {
            const categoryData = await window.pharmacyUIBase.fetchJsonCached(dataFile);
            const subData = Array.isArray(categoryData?.sub)
                ? categoryData.sub.find((item) => String(item.id) === String(featuredItem.subId))
                : null;
            products = Array.isArray(subData?.active_ingredients) ? subData.active_ingredients : [];
        } else if (window.PharmacyAPI?.getSubCategoryStaticProducts) {
            products = await window.PharmacyAPI.getSubCategoryStaticProducts(featuredItem.subId).catch(() => []);
        }

        const product = products.find((item) => {
            const rawId = item.id || item.product_id || item.catalog_id || '';
            const id = Array.isArray(rawId) ? rawId[0] : rawId;
            return String(id) === String(featuredItem.id);
        });

        if (!product) return null;
        return {
            ...product,
            subId: featuredItem.subId,
            mainId: category.id,
            mainTitle: category.title,
            subTitle: subCategory?.title || subCategory?.name_en || '',
            isMerchant: false
        };
    }

    async function findMerchantProductByFeaturedItem(featuredItem, userKey, options = {}) {
        if (!featuredItem?.id) return null;

        // Try to find in pre-fetched list first to avoid extra API call
        if (options.merchantProducts) {
            const found = options.merchantProducts.find(p => String(p.product_id || p.id) === String(featuredItem.id));
            if (found && Number(found.status) !== 0) {
                return {
                    ...found,
                    id: found.product_id || found.id,
                    image_url: found.image_url || found.image_names,
                    subId: found.custom_sub_cat_id || featuredItem.subId,
                    isMerchant: true
                };
            }
            if (found && Number(found.status) === 0) return null;
        }

        if (!window.PharmacyAPI?.getProductMetadata) return null;
        const product = await window.PharmacyAPI.getProductMetadata(featuredItem.id).catch(() => null);
        if (product?.error || !product || Number(product.status) === 0) return null;
        if (String(product?.user_key || '') !== String(userKey || '')) return null;

        return {
            ...product,
            id: product.product_id || product.id,
            image_url: product.image_url || product.image_names,
            subId: product.custom_sub_cat_id || featuredItem.subId,
            isMerchant: true
        };
    }

    window.portfolioFetchAllPharmacyFeaturedProducts = async function (userKey) {
        console.log(`[Pharmacy-Featured-Fetch] Fetching all featured products for: ${userKey}`);
        const storeState = window.PortfolioStore?.getState ? window.PortfolioStore.getState() : window.portfolioState;
        const activeUser = storeState?.activeUser || (window.PortfolioAPI?.loadCache ? window.PortfolioAPI.loadCache(userKey)?.user : null);
        
        let featuredItems = window.pharmacyFeaturedUtils?.getFeaturedItems
            ? window.pharmacyFeaturedUtils.getFeaturedItems()
            : extractPharmacyFeaturedItems(activeUser);

        if ((!Array.isArray(featuredItems) || featuredItems.length === 0) && activeUser) {
            featuredItems = extractPharmacyFeaturedItems(activeUser);
            if (featuredItems.length && window.pharmacyFeaturedUtils?.setFeaturedItems) {
                window.pharmacyFeaturedUtils.setFeaturedItems(featuredItems);
            }
        }

        if (!Array.isArray(featuredItems) || featuredItems.length === 0) {
            console.log('[Pharmacy-Featured-Fetch] No featured items found.');
            return [];
        }

        console.log(`[Pharmacy-Featured-Fetch] Resolving ${featuredItems.length} featured items...`);

        // Batch fetch merchant products ONCE to optimize resolution
        const merchantProducts = window.PharmacyAPI?.fetchMerchantProducts 
            ? await window.PharmacyAPI.fetchMerchantProducts(userKey).catch(() => []) 
            : [];
        
        const context = window.pharmacyUIBase?.loadPharmacyContext
            ? await window.pharmacyUIBase.loadPharmacyContext(userKey)
            : (window.PharmacyAPI?.getCatalogContext ? await window.PharmacyAPI.getCatalogContext(userKey) : null);

        const merchant = activeUser || { user_key: userKey };
        const resolved = [];
        const keptFeaturedItems = [];
        
        for (const featuredItem of featuredItems) {
            try {
                const product = featuredItem.type === 'merchant'
                    ? await findMerchantProductByFeaturedItem(featuredItem, userKey, { merchantProducts })
                    : await findCatalogProductByFeaturedItem(featuredItem, userKey, { merchantProducts, context });
                
                if (product && window.pharmacyFeaturedUtils?.adaptForBanner) {
                    resolved.push(window.pharmacyFeaturedUtils.adaptForBanner(product, merchant));
                    keptFeaturedItems.push(featuredItem);
                } else {
                    console.log(`[Pharmacy-Featured-Fetch] Could not resolve item: ${featuredItem.id}. It will be removed from state.`);
                }
            } catch (error) {
                console.error('[Pharmacy-Featured-Fetch] Failed to resolve featured product:', error);
                keptFeaturedItems.push(featuredItem); // Keep it on error to avoid aggressive deletion
            }
        }

        if (!haveSameFeaturedItems(featuredItems, keptFeaturedItems)) {
            console.log(`[Pharmacy-Featured-Fetch] Cleaning up ${featuredItems.length - keptFeaturedItems.length} invalid items...`);
            if (window.pharmacyFeaturedUtils?.setFeaturedItems) {
                window.pharmacyFeaturedUtils.setFeaturedItems(keptFeaturedItems);
            }
            if (canPersistFeaturedCleanup(userKey) && typeof window.portfolioUpdatePharmacyFeaturedItems === 'function') {
                window.portfolioUpdatePharmacyFeaturedItems(userKey, keptFeaturedItems).catch((error) => {
                    console.error('[Pharmacy-Featured-Fetch] Failed to persist featured cleanup:', error);
                });
            }
        }

        console.log(`[Pharmacy-Featured-Fetch] Successfully resolved ${resolved.length} products.`);
        return resolved;
    };

    window.portfolioExtractPharmacyFeaturedItems = extractPharmacyFeaturedItems;
})();
