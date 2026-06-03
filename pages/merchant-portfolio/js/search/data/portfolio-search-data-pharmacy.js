/**
 * @file portfolio-search-data-pharmacy.js
 * @description Unified pharmacy search (Merchant + Global Catalog).
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

window.portfolioSearchPharmacyUnified = async function (userKey, criteria) {
    const query = window.portfolioNormalizeSearchText ? window.portfolioNormalizeSearchText(criteria?.query) : criteria?.query;
    if (!query) return [];

    console.log(`[Developer] Starting Unified Pharmacy Search for query: "${query}"`);

    // 1. Fetch Merchant Products
    const merchantProducts = await window.portfolioFetchSellerSearchSource(userKey);
    const filteredMerchant = window.portfolioFilterSellerProducts(merchantProducts, criteria);

    // 2. Load Pharmacy Context (to check for hidden items)
    const context = (window.pharmacyStorefrontData && typeof window.pharmacyStorefrontData.loadPharmacyContext === 'function')
        ? await window.pharmacyStorefrontData.loadPharmacyContext(userKey)
        : null;
    const hiddenMain = new Set(context?.hiddenMainIds || []);
    const hiddenSub = new Set(context?.hiddenSubIds || []);
    const hiddenProducts = new Set(context?.hiddenProductIds || []);

    // 3. Search Global Catalog (Deep Search inside DataFiles)
    const catalogSource = context?.mergedCategories || [];
    const globalResults = [];

    // Save to state for UI sync (Teleport)
    if (window.portfolioState) {
        window.portfolioState.pharmacyCatalog = catalogSource;
    }
    const fetchJson = window.pharmacyStorefrontData?.fetchJsonCached || (async (path) => {
        const r = await fetch('/' + String(path).replace(/^\/+/, ''));
        return r.ok ? r.json() : null;
    });

    // Use Promise.all to search all data files in parallel
    await Promise.all(catalogSource.map(async (mainCat) => {
        if (hiddenMain.has(String(mainCat.id))) return;

        let expandedMain = mainCat;
        if (mainCat.dataFile) {
            try {
                const data = await fetchJson(mainCat.dataFile);
                if (data) expandedMain = data;
            } catch (e) {
                console.warn(`[Developer] Failed to load dataFile: ${mainCat.dataFile}`, e);
            }
        }

        (expandedMain.sub || []).forEach(subCat => {
            if (hiddenSub.has(String(subCat.id))) return;

            const subTitle = window.portfolioNormalizeSearchText ? window.portfolioNormalizeSearchText(subCat.title || subCat.name_en) : (subCat.title || subCat.name_en);
            const subMatches = subTitle && subTitle.includes(query);

            (subCat.active_ingredients || []).forEach(item => {
                const pIds = Array.isArray(item.id) ? item.id : [item.id];
                const pId = pIds[0];
                if (hiddenProducts.has(String(pId))) return;

                const nameAr = window.portfolioNormalizeSearchText ? window.portfolioNormalizeSearchText(item.name_ar) : item.name_ar;
                const nameEn = window.portfolioNormalizeSearchText ? window.portfolioNormalizeSearchText(item.name_en) : item.name_en;
                const brandsAr = (item.brand_ar || []).map(b => window.portfolioNormalizeSearchText ? window.portfolioNormalizeSearchText(b) : b);
                const brandsEn = (item.brand_en || []).map(b => window.portfolioNormalizeSearchText ? window.portfolioNormalizeSearchText(b) : b);

                const isMatch = subMatches ||
                               (nameAr && nameAr.includes(query)) ||
                               (nameEn && nameEn.includes(query)) ||
                               brandsAr.some(b => b && b.includes(query)) ||
                               brandsEn.some(b => b && b.includes(query));

                if (isMatch) {
                    globalResults.push({
                        id: String(pId),
                        productName: item.name_ar || item.name_en,
                        isGlobal: true,
                        mainId: String(mainCat.id),
                        subId: String(subCat.id),
                        mainTitle: mainCat.title || mainCat.name_en,
                        subTitle: subCat.title || subCat.name_en,
                        image_url: item.image_url,
                        is_prescription_required: !!item.is_prescription_required,
                        brand_ar: item.brand_ar,
                        brand_en: item.brand_en,
                        name_ar: item.name_ar,
                        name_en: item.name_en,
                        form_ref: item.form_ref,
                        strength_ref: item.strength_ref,
                        description_ar: item.description_ar,
                        description_en: item.description_en,
                        price: item.price,
                        unit_ar: item.unit_ar,
                        unit_en: item.unit_en,
                        active_ingredients_list: item.active_ingredients || item.ingredients || []
                    });
                }
            });
        });
    }));

    // 4. Merge Results (Deduplicate if merchant has the same global ID)
    const merchantIds = new Set();
    filteredMerchant.forEach((product) => {
        if (product?.id != null) merchantIds.add(String(product.id));
        if (product?.product_id != null) merchantIds.add(String(product.product_id));
        if (product?.original_catalog_id != null) merchantIds.add(String(product.original_catalog_id));
    });
    const uniqueGlobal = globalResults.filter(g => !merchantIds.has(g.id));

    console.log(`[Developer] Unified Search complete. Merchant results: ${filteredMerchant.length}, Global results: ${uniqueGlobal.length}`);

    const combinedResults = [
        ...filteredMerchant.map(p => ({ ...p, isMerchant: true })),
        ...uniqueGlobal
    ];

    // 5. Apply Sorting (mainly for merchant products, global items follow)
    return window.portfolioSortSellerProducts(combinedResults, criteria?.sort || 'default');
};
