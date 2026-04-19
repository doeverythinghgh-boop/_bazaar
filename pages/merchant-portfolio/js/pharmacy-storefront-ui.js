/**
 * @file pages/merchant-portfolio/js/pharmacy-storefront-ui.js
 * @description محرك رندرة واجهة الصيدلية في المتجر (UI & Rendering Layer)
 */

(function () {
    const { state, fetchJsonCached, loadPharmacyContext } = window.pharmacyStorefrontData;

    function getLanguageValue(arValue, enValue) {
        return (window.app_language === 'en' ? (enValue || arValue) : (arValue || enValue || ''));
    }

    function ensureSubcategoriesRow(grid) {
        let row = document.getElementById('pharmacy-subcats-row');
        if (!row) {
            row = document.createElement('div');
            row.id = 'pharmacy-subcats-row';
            row.className = 'pharmacy-subcategories-row';
            if (grid.parentNode) {
                grid.parentNode.insertBefore(row, grid.nextSibling);
            }
        }
        row.innerHTML = '';
        row.style.display = 'none';
        return row;
    }

    function ensureFilteredProductsContainer(anchorNode) {
        let container = document.getElementById('pharmacy-filtered-products-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'pharmacy-filtered-products-container';
            container.className = 'pharmacy-filtered-products-grid';
            if (anchorNode.parentNode) {
                anchorNode.parentNode.insertBefore(container, anchorNode.nextSibling);
            }
        }
        return container;
    }

    function renderFeedback(container, options = {}) {
        const iconClass = options.iconClass || 'fas fa-box-open';
        const extraClass = options.isLoading ? ' is-loading' : '';
        container.innerHTML = `
            <div class="pharmacy-feedback${extraClass}">
                <i class="${iconClass}${options.isLoading ? ' fa-spin' : ''}"></i>
                <p>${options.message || ''}</p>
            </div>
        `;
    }

    function renderIngredientCards(container, ingredients, refData) {
        const fragment = document.createDocumentFragment();
        const fallbackImg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='%23f8fafc'%3E%3Crect width='100' height='100'/%3E%3Cpath fill='%23cbd5e1' d='M50 35a15 15 0 100 30 15 15 0 000-30zm-2 21V46h-5v-2h5v-5h2v5h5v2h-5v10h-2z'/%3E%3C/svg%3E";

        const hiddenProducts = state.hiddenProducts || new Set();

        ingredients.filter(item => {
            const pId = Array.isArray(item.id) ? item.id[0] : item.id;
            return !hiddenProducts.has(String(pId));
        }).forEach((item) => {
            const card = document.createElement('div');
            card.className = 'portfolio-product-card pharmacy-ingredient-card';

            const primaryTitle = getLanguageValue(item.name_ar, item.name_en);
            const brandsArray = window.app_language === 'en' ? (item.brand_en || []) : (item.brand_ar || []);
            const brandsText = brandsArray.length > 0 ? (brandsArray.slice(0, 2).join('، ') + (brandsArray.length > 2 ? '...' : '')) : '';
            const formsText = (item.form_ref || []).map((code) => {
                const ref = refData?.forms?.[code];
                return ref ? getLanguageValue(ref.ar, ref.en) : '';
            }).filter(Boolean).join('، ');
            const strengthsText = (item.strength_ref || []).map((code) => refData?.strengths?.[code] || '').filter(Boolean).join('، ');
            let imgUrl = '/' + 'assets/images/placeholder.png';
            if (item.image_url) {
                if (item.image_url.includes('/')) {
                    imgUrl = '/' + item.image_url.replace(/^\/+/, ''); // Ensure no double slashes
                } else {
                    imgUrl = (typeof window.getPublicR2FileUrl === 'function') 
                        ? window.getPublicR2FileUrl(item.image_url) 
                        : ('/' + item.image_url);
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
                    ${formsText ? `<p class="pharmacy-ingredient-meta"><i class="fas fa-pills"></i> ${formsText}</p>` : ''}
                    ${strengthsText ? `<p class="pharmacy-ingredient-meta"><i class="fas fa-weight-hanging"></i> ${strengthsText}</p>` : ''}
                </div>
            `;
            fragment.appendChild(card);
        });

        container.innerHTML = '';
        container.appendChild(fragment);
    }

    async function showPharmacySubCategories(category) {
        const row = document.getElementById('pharmacy-subcats-row');
        if (!row) return;

        const productsContainer = ensureFilteredProductsContainer(row);
        productsContainer.innerHTML = '';
        row.innerHTML = '';
        row.style.display = 'flex';

        const hiddenSub = state.hiddenSub || new Set();

        (category.sub || []).forEach((subCategory) => {
            if (hiddenSub.has(String(subCategory.id))) return;

            const pill = document.createElement('button');
            pill.type = 'button';
            pill.className = 'pharmacy-subcategory-pill';
            pill.textContent = getLanguageValue(subCategory.title, subCategory.name_en);

            pill.addEventListener('click', async function () {
                const urlParams = new URLSearchParams(window.location.search);
                const userKey = urlParams.get('user_key');

                Array.from(row.children).forEach((child) => child.classList.remove('is-active'));
                pill.classList.add('is-active');
                renderFeedback(productsContainer, {
                    isLoading: true,
                    iconClass: 'fas fa-spinner',
                    message: window.portfolioSellerSearchL('search_loading_status', 'جاري التحميل...', 'Loading...')
                });

                try {
                    let ingredients = [];
                    let refData = {};

                    if (subCategory.isCustom) {
                        ingredients = await window.PharmacyAPI.getProductsBySubCategory(userKey, subCategory.id);
                    } else {
                        const [categoryData, subRefData] = await Promise.all([
                            fetchJsonCached(category.dataFile),
                            category.refFile ? fetchJsonCached(category.refFile) : Promise.resolve(null)
                        ]);
                        refData = subRefData || {};
                        const subData = Array.isArray(categoryData?.sub)
                            ? categoryData.sub.find((item) => String(item.id) === String(subCategory.id))
                            : null;
                        const staticIngredients = (subData?.active_ingredients || subCategory.active_ingredients || []).slice();

                        let customAddedProducts = [];
                        try {
                            customAddedProducts = await window.PharmacyAPI.getProductsBySubCategory(userKey, subCategory.id);
                        } catch(e) {
                            console.warn("Failed to fetch custom override products for standard category", e);
                        }
                        
                        ingredients = [...customAddedProducts, ...staticIngredients];
                    }

                    if (ingredients.length === 0) {
                        renderFeedback(productsContainer, {
                            iconClass: 'fas fa-box-open',
                            message: window.portfolioSellerSearchL('no_products', 'لا توجد منتجات مضافة لهذا القسم', 'No products available for this section')
                        });
                        return;
                    }

                    renderIngredientCards(productsContainer, ingredients, refData);
                } catch (error) {
                    console.error('[Portfolio Pharmacy] Failed to load sub-category:', error);
                    renderFeedback(productsContainer, {
                        iconClass: 'fas fa-exclamation-circle',
                        message: window.portfolioSellerSearchL('port_fetch_error_text', 'حدث خطأ أثناء جلب المنتجات', 'Unable to load products')
                    });
                }
            });

            row.appendChild(pill);
        });
    }

    async function renderPharmacyCatalog(grid) {
        const urlParams = new URLSearchParams(window.location.search);
        const userKey = urlParams.get('user_key');

        const empty = document.getElementById('portfolio-empty');
        if (empty) empty.style.display = 'none';
        
        grid.style.display = 'block';
        renderFeedback(grid, {
            isLoading: true,
            iconClass: 'fas fa-spinner',
            message: (typeof window.portfolioSellerSearchL === 'function') ? window.portfolioSellerSearchL('search_loading_status', 'جاري التحميل...', 'Loading...') : (window.app_language === 'en' ? 'Loading...' : 'جاري التحميل...')
        });

        try {
            const context = await loadPharmacyContext(userKey);
            const categories = Array.isArray(context?.mergedCategories) ? context.mergedCategories : [];
            const hiddenMain = new Set(context?.hiddenMainIds || []);
            const hiddenSub = new Set(context?.hiddenSubIds || []);
            const hiddenProducts = new Set(context?.hiddenProductIds || []);
        
            state.hiddenSub = hiddenSub;
            state.hiddenProducts = hiddenProducts;

            const row = ensureSubcategoriesRow(grid);
            const filteredProductsContainer = document.getElementById('pharmacy-filtered-products-container');
            if (filteredProductsContainer) filteredProductsContainer.remove();

            grid.innerHTML = '';
            grid.classList.add('pharmacy-category-grid');
            grid.style.display = 'flex';

            const fragment = document.createDocumentFragment();
            categories.forEach((category) => {
                if (hiddenMain.has(String(category.id))) return;

                const card = document.createElement('button');
                card.type = 'button';
                card.className = 'portfolio-product-card pharmacy-category-card pharmacy-cat-card';
                card.innerHTML = `
                    <i class="${category.icon || 'fas fa-pills'}"></i>
                    <h3>${getLanguageValue(category.title, category.name_en)}</h3>
                `;

                card.addEventListener('click', function () {
                    grid.querySelectorAll('.pharmacy-category-card').forEach((element) => element.classList.remove('is-active'));
                    card.classList.add('is-active');
                    showPharmacySubCategories(category);
                });

                fragment.appendChild(card);
            });

            grid.appendChild(fragment);
            if (empty) empty.style.display = 'none';
            if (row) row.style.display = 'none';
        } catch (error) {
            console.error('[Portfolio Pharmacy] Failed to render pharmacy catalog:', error);
            renderFeedback(grid, {
                iconClass: 'fas fa-exclamation-circle',
                message: window.portfolioSellerSearchL('port_fetch_error_text', 'حدث خطأ أثناء جلب المنتجات', 'Unable to load products')
            });
        }
    }

    window.portfolioRenderPharmacyCatalog = async function (options = {}) {
        const isPharmacy = !!(options.isPharmacy && !options.append && !window.portfolioState?.sellerSearch?.isActive && !window.portfolioState?.showFeaturedOnly);
        if (!isPharmacy) return false;
        await renderPharmacyCatalog(options.grid);
        return true;
    };

    window.portfolioShowPharmacySubCatsInline = showPharmacySubCategories;
})();
