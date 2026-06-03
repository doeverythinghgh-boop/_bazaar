/**
 * @file pages/merchant-portfolio/js/pharmacy/pharmacy-ui-ingredients.js
 * @description Renders ingredient cards for pharmacy storefront.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


(function () {
    const { getLanguageValue } = window.pharmacyUIBase;

    /**
     * FIX: parseMaybeArray helper
     * Problem: Custom products store form_ref and strength_ref as JSON strings
     *          (e.g. '["code1","code2"]') rather than real arrays as catalog products do.
     *          Calling .map() on a string throws "is not a function".
     * Solution: Normalise any value into a real array before calling .map(),
     *           handling arrays, JSON strings, plain strings, null, and undefined.
     */
    function parseMaybeArray(value) {
        if (Array.isArray(value)) return value;
        if (value === null || value === undefined || value === '') return [];
        if (typeof value === 'string') {
            // Try JSON parse first (handles '["code1","code2"]')
            try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed : [String(value)]; } catch (_) {}
            // Single plain string
            return [value];
        }
        return [String(value)];
    }

    function renderIngredientCards(container, ingredients, refData, append = false) {
        const fragment = document.createDocumentFragment();
        const fallbackImg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='%23f8fafc'%3E%3Crect width='100' height='100'/%3E%3Cpath fill='%23cbd5e1' d='M50 35a15 15 0 100 30 15 15 0 000-30zm-2 21V46h-5v-2h5v-5h2v5h5v2h-5v10h-2z'/%3E%3C/svg%3E";

        const hiddenProducts = window.pharmacyUIBase.state.hiddenProducts || new Set();

        // FIX: hiddenProducts filter
        // Problem: Catalog products expose their key as item.id (sometimes an array),
        //          while custom products use item.product_id. The old filter only read
        //          item.id, so custom products were never correctly matched against
        //          the hidden-products set.
        // Solution: Resolve the raw ID from product_id || id before the Set lookup.
        ingredients.filter(item => {
            const raw = item.product_id || item.id;
            const pId = Array.isArray(raw) ? raw[0] : raw;
            return !hiddenProducts.has(String(pId ?? ''));
        }).forEach((item) => {
            // Resolve canonical product ID:
            // - Catalog products: item.id (may be an array like ["PH001"])
            // - Custom products:  item.product_id
            // FIX: canonical productId resolver
            // Problem: Catalog products use item.id (may be an array), custom products
            //          use item.product_id. Using item.id directly for custom products
            //          produced undefined, breaking localStorage keys and navigation URLs.
            // Solution: Always derive a single string ID from product_id || id.
            const productId = (() => {
                const raw = item.product_id || item.id;
                return String(Array.isArray(raw) ? raw[0] : (raw ?? ''));
            })();

            const card = document.createElement('div');
            card.className = 'portfolio-product-card pharmacy-ingredient-card';

            const primaryTitle = getLanguageValue(item.name_ar, item.name_en);
            // FIX: brand array resolution
            // Problem: Catalog products supply brand_ar/brand_en as arrays, but custom
            //          products store them as plain strings or null. Calling
            //          .slice().join() on a string fails because strings don't have .join().
            // Solution: Wrap non-array values in a single-element array so .join() always works.
            const _rawBrands = window.app_language === 'en' ? item.brand_en : item.brand_ar;
            const brandsArray = Array.isArray(_rawBrands) ? _rawBrands : (_rawBrands ? [String(_rawBrands)] : []);
            const brandsText = brandsArray.length > 0 ? (brandsArray.slice(0, 2).join('، ') + (brandsArray.length > 2 ? '...' : '')) : '';
            // FIX: form_ref / strength_ref safe parsing
            // Uses parseMaybeArray (defined above) so JSON-string values from custom
            // products are parsed into real arrays before .map() is called.
            const formsText = parseMaybeArray(item.form_ref).map((code) => {
                const ref = refData?.forms?.[code];
                return ref ? getLanguageValue(ref.ar, ref.en) : '';
            }).filter(Boolean).join('، ');
            const strengthsText = parseMaybeArray(item.strength_ref).map((code) => refData?.strengths?.[code] || '').filter(Boolean).join('، ');
            // FIX: image field resolution
            // Problem: Catalog products carry their image path in item.image_url,
            //          while custom products store it in item.image_names.
            //          The old code checked only image_url, so custom product cards
            //          always fell back to the placeholder image.
            // Solution: Coalesce image_url || image_names into a single variable.
            const _rawImage = item.image_url || item.image_names || null;
            let imgUrl = '/assets/images/placeholder.png';
            if (_rawImage) {
                if (_rawImage.includes('/')) {
                    imgUrl = '/' + _rawImage.replace(/^\/+/, '');
                } else {
                    imgUrl = (typeof window.getPublicR2FileUrl === 'function')
                        ? window.getPublicR2FileUrl(_rawImage)
                        : ('/' + _rawImage);
                }
            }

            card.innerHTML = `
                <div class="pharmacy-ingredient-media">
                    ${item.is_prescription_required ? '<div class="pharmacy-rx-badge"><i class="fas fa-file-prescription"></i></div>' : ''}
                    <img src="${imgUrl}" class="product-img" loading="lazy" onerror="this.onerror=null; this.src='${fallbackImg}';" alt="${primaryTitle}">
                </div>
                <div class="pharmacy-ingredient-info">
                    <h3 class="pharmacy-ingredient-title">${primaryTitle}</h3>
                    ${brandsText ? `<p class="pharmacy-ingredient-brands"><span>${brandsText}</span></p>` : ''}
                </div>
            `;

            item.formsText = formsText;
            item.strengthsText = strengthsText;
            item.renderedImgUrl = imgUrl;

            card.addEventListener('click', (e) => {
                if (item.isSearchResult && !item.mainTitle) {
                    console.warn('[PharmacyView] Navigation blocked: Category not resolved for search result.');
                    return;
                }

                const grid = document.getElementById('portfolio-products-grid');
                const row = document.getElementById('pharmacy-subcats-row');

                const currentScroll = document.documentElement.scrollTop || document.body.scrollTop || window.scrollY || 0;
                console.log(`[Scroll Debug] Leaving page. Saving Vertical Scroll: ${currentScroll}px`);
                let searchQ = '';
                let searchMain = '';
                let searchSub = '';
                if (typeof window.portfolioEnsureSellerSearchState === 'function') {
                    const ss = window.portfolioEnsureSellerSearchState();
                    searchQ = ss.query || '';
                    searchMain = ss.mainCategory || '';
                    searchSub = ss.subCategory || '';
                }

                const storefrontState = {
                    userKey: new URLSearchParams(window.location.search).get('user_key') || null,
                    scroll: currentScroll,
                    gridScroll: grid ? grid.scrollLeft : 0,
                    rowScroll: row ? row.scrollLeft : 0,
                    searchQuery: searchQ,
                    searchMainCategory: searchMain,
                    searchSubCategory: searchSub,
                    activeCategory: window.portfolioState?.activeCategory || null,
                    activeSubCategory: window.portfolioState?.activeSubCategory || null,
                    activeCategoryId: window.pharmacyActiveCategoryId || null,
                    activeSubCategoryId: window.pharmacyActiveSubCategoryId || null,
                    visibleCount: window.pharmacyUIBase?.state?.visibleCount || 5,
                    isSearchResult: !!item.isSearchResult,
                    timestamp: Date.now()
                };
                const merchant = window.portfolioState?.activeUser || {};
                console.log(`[Diagnostic] Card clicked. Saving visibleCount: ${storefrontState.visibleCount}`);
                LocalDBSession.setItem('pharmacy_storefront_back_state', JSON.stringify(storefrontState));
                LocalDBSession.setItem(`pharmacy_view_${productId}`, JSON.stringify({ item, merchant }));
                if (typeof window.portfolioSaveNavigationState === 'function') {
                    window.portfolioSaveNavigationState(merchant.user_key);
                }

                window.location.href = window.ProductRoutes?.buildProductViewUrl
                    ? window.ProductRoutes.buildProductViewUrl({ product_key: productId, user_key: merchant.user_key, pharmacy_metadata: true }, { pharmacy: true })
                    : `/pages/products/productView/productView.html?product_key=${encodeURIComponent(productId)}&provider_key=${encodeURIComponent(merchant.user_key)}&pharmacy=1`;
            });

            fragment.appendChild(card);
        });

        if (!append) {
            container.innerHTML = '';
        }
        container.appendChild(fragment);
    }

    window.pharmacyUIIngredients = {
        renderIngredientCards
    };
})();
