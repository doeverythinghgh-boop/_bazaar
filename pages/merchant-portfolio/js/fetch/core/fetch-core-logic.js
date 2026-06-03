/**
 * @file pages/merchant-portfolio/js/fetch/core/fetch-core-logic.js
 * @description Core API and persistence logic for product fetching.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 */

(function () {
    window.portfolioFetchProductData = async function (userKey, offset, limit, options, PortfolioAPI) {
        let products = null;
        const mainKey = String(options.mainCategory || 'all');
        const subKey = String(options.subCategory || 'all');
        const isSpecialty = options.listingType === 'real_estate' || options.listingType === 'cars';
        const cacheType = options.listingType === 'real_estate' ? `real_estate_${mainKey}_${subKey}` : (options.listingType === 'cars' ? `cars_${mainKey}_${subKey}` : `generic_${mainKey}_${subKey}`);
        
        if (!options.force && window.portfolioPersistence) {
            const cached = window.portfolioPersistence.get(userKey, cacheType, '', offset);
            // Bypass empty cache for specialized merchants to allow self-healing logic to trigger
            if (cached && (cached.length > 0 || !isSpecialty || !options.subCategory)) {
                products = cached;
                console.log(`[Mirror][Cache] Product cache HIT for offset ${offset}. Found ${products.length} items.`);
            } else if (cached) {
                console.log(`[Mirror][Cache] Bypassing empty specialized cache to trigger fresh fetch.`);
            }
        }

        if (!products) {
            console.log(`[Mirror][Fetch] Requesting products from API...`);
            const fetchStart = performance.now();
            
            if (options.listingType === 'real_estate' && PortfolioAPI.fetchRealEstate) {
                products = await PortfolioAPI.fetchRealEstate({ userKey: userKey, limit: limit, offset: offset, subCategory: options.subCategory });
                
                // Self-healing: If sub-category returned nothing, try fetching ALL listings for this merchant
                if (offset === 0 && (!products || products.length === 0) && options.subCategory) {
                    console.log(`[Mirror][Self-Healing] No real estate found for sub-category ${options.subCategory}. Attempting fetch for all items.`);
                    const fallbackProducts = await PortfolioAPI.fetchRealEstate({ userKey: userKey, limit: limit, offset: 0, subCategory: '' });
                    if (Array.isArray(fallbackProducts) && fallbackProducts.length > 0) {
                        console.log(`[Mirror][Self-Healing] Found ${fallbackProducts.length} items in fallback fetch.`);
                        products = fallbackProducts;
                    }
                }
            } else if (options.listingType === 'cars' && PortfolioAPI.fetchCars) {
                products = await PortfolioAPI.fetchCars({ userKey: userKey, limit: limit, offset: offset });
            } else if (PortfolioAPI.fetchProducts) {
                products = await PortfolioAPI.fetchProducts({
                    userKey: userKey,
                    limit: limit,
                    offset: offset,
                    mainCategory: options.mainCategory,
                    subCategory: options.subCategory
                });
            } else {
                products = [];
            }
            
            console.log(`[Mirror][Success] API Fetch finished in ${(performance.now() - fetchStart).toFixed(0)}ms. Received ${products?.length || 0} items.`);

            if (window.portfolioPersistence && products && products.length > 0) {
                console.log(`[Mirror][Cache] Saving ${products.length} products to persistence.`);
                window.portfolioPersistence.save(userKey, cacheType, '', offset, products);
            }
        }

        return products;
    };
})();
