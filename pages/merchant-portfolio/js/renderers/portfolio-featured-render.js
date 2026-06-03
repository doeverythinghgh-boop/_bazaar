/**
 * @file pages/merchant-portfolio/js/portfolio-featured-render.js
 * @description Featured products rendering helpers.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


async function renderCommercialFeaturedScroller() {
    const state = window.portfolioFeaturedState;
    const storeState = window.PortfolioStore?.getState ? window.PortfolioStore.getState() : window.portfolioState;
    const container = document.getElementById('commercial-featured-section');
    const track = document.getElementById('commercial-featured-track');
    const activeUser = storeState?.activeUser || null;
    const activeSpecialty = storeState?.activeSpecialty || null;
    const specialtyViewModel = activeSpecialty?.viewModel || (typeof window.resolvePortfolioSpecialtyViewModel === 'function'
        ? (activeUser?.portfolio_view_model || (activeUser ? window.resolvePortfolioSpecialtyViewModel(activeUser) : null))
        : null);

    if (!container || !track) return;
    if (specialtyViewModel && specialtyViewModel.showFeaturedSection === false) {
        container.style.display = 'none';
        return;
    }

    const userKey = new URLSearchParams(window.location.search).get('user_key');
    let isPharmacy = false;
    let isCarSales = false;
    let isRealEstateSales = false;
    const firstEntry = specialtyViewModel?.profile?.entries?.[0] || null;
    
    if (activeSpecialty) {
        isPharmacy = !!activeSpecialty.isPharmacy;
        isCarSales = !!activeSpecialty.isCarSales;
        isRealEstateSales = !!activeSpecialty.isRealEstateSales;
    } else {
        isPharmacy = String(firstEntry?.subId || '') === '204';
        isCarSales = String(firstEntry?.mainId || '') === '7' && String(firstEntry?.subId || '') === '1';
        isRealEstateSales = String(firstEntry?.mainId || '') === '16';
    }
    if (isPharmacy && typeof window.portfolioFetchAllPharmacyFeaturedProducts === 'function') {
        const pharmacyFeaturedList = await window.portfolioFetchAllPharmacyFeaturedProducts(userKey);
        renderFeaturedList(container, track, pharmacyFeaturedList, createPharmacyFeaturedCard, userKey);
        return;
    }

    const cachedProducts = window.portfolioCache.load(userKey)?.products || [];
    const allAvailable = window.portfolioPageController?.mergeProductSets
        ? window.portfolioPageController.mergeProductSets(storeState?.allProducts || [], cachedProducts)
        : (storeState?.allProducts || cachedProducts);

    let featuredList = (isCarSales || isRealEstateSales)
        ? allAvailable.filter((product) => String(product?.is_featured) === '1')
        : allAvailable.filter((product) => state.featuredIds.has(String(product.id)) || state.featuredIds.has(String(product.product_key)));

    if (isCarSales && userKey && typeof window.PortfolioAPI?.fetchCars === 'function') {
        const remoteFeatured = await window.PortfolioAPI.fetchCars({ userKey, featured: true, limit: 100, offset: 0 });
        featuredList = Array.isArray(remoteFeatured) && remoteFeatured.length ? remoteFeatured : featuredList;
    }

    if (isRealEstateSales && userKey && typeof window.PortfolioAPI?.fetchRealEstate === 'function') {
        const remoteFeatured = await window.PortfolioAPI.fetchRealEstate({ userKey, featured: true, limit: 100, offset: 0 });
        featuredList = Array.isArray(remoteFeatured) && remoteFeatured.length ? remoteFeatured : featuredList;
    }

    if (!isCarSales && !isRealEstateSales && userKey && state.featuredIds.size > 0 && typeof window.portfolioFetchAllFeaturedProducts === 'function') {
        const remoteFeatured = await window.portfolioFetchAllFeaturedProducts(userKey);
        featuredList = remoteFeatured.length > 0
            ? remoteFeatured
            : allAvailable.filter((product) => (
                state.featuredIds.has(String(product.id)) ||
                state.featuredIds.has(String(product.product_key))
            ));
    }

    if (activeSpecialty && !isCarSales && !isRealEstateSales) {
        featuredList = featuredList.filter((product) => {
            const mainId = String(product?.MainCategory || '');
            const subId = String(product?.SubCategory || '');
            if (String(activeSpecialty.mainId || '') && mainId !== String(activeSpecialty.mainId || '')) return false;
            if (String(activeSpecialty.subId || '') && subId !== String(activeSpecialty.subId || '')) return false;
            return true;
        });
    }

    renderFeaturedList(container, track, featuredList, createCommercialFeaturedCard, userKey);
}

function renderFeaturedList(container, track, featuredList, cardFactory, userKey) {
    const state = window.portfolioFeaturedState;

    if (!Array.isArray(featuredList) || featuredList.length === 0) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'flex';
    track.innerHTML = '';

    const minItems = 12;
    let itemsToRender = [...featuredList];
    while (itemsToRender.length < minItems && itemsToRender.length > 0) {
        itemsToRender = [...itemsToRender, ...featuredList];
    }

    itemsToRender.forEach((product, idx) => {
        const card = cardFactory(product, idx);
        track.appendChild(card);
    });

    if (userKey) {
        const savedPos = LocalDBSession.getItem(state.storageKey + userKey);
        if (savedPos !== null) {
            state.scrollPos = parseFloat(savedPos);
            const isRTL = document.documentElement.dir === 'rtl';
            track.scrollLeft = isRTL ? -state.scrollPos : state.scrollPos;
        }
    }

    const children = Array.from(track.children);
    children.forEach((child, idx) => {
        const clone = child.cloneNode(true);
        if (clone.id) clone.id = `${clone.id}-clone-${idx}`;
        clone.querySelectorAll('[id]').forEach((el) => { el.id = `${el.id}-clone-${idx}`; });
        track.appendChild(clone);
    });

    if (!state.animationFrame) {
        startCommercialFeaturedScroll(track);
    }
}

function createCommercialFeaturedCard(product, index) {
    const card = document.createElement('div');
    card.className = 'commercial-featured-card';
    const sId = product.product_key || product.id || index;
    card.id = `commercial-featured-card-${sId}`;

    const firstImage = product.ImageName ? product.ImageName.split(',')[0] : '';
    const imgUrl = firstImage && typeof getPublicR2FileUrl === 'function'
        ? getPublicR2FileUrl(firstImage)
        : '/assets/images/placeholder.png';

    const oldPrice = product.original_price ? parseFloat(product.original_price) : 0;
    const currentPrice = parseFloat(product.product_price);
    const hasDiscount = oldPrice > currentPrice;

    card.innerHTML = `
        <div class="commercial-featured-img-container" id="sf-img-cont-${sId}">
            <img src="${imgUrl}" class="commercial-featured-img" id="sf-img-${sId}" loading="lazy" alt="${product.productName}">
        </div>
        <div class="commercial-featured-details" id="sf-details-${sId}">
            <div class="commercial-featured-name" id="sf-name-${sId}">${product.productName}</div>
            <div class="commercial-featured-price-wrapper" id="sf-price-wrapper-${sId}">
                ${hasDiscount ? `<span class="commercial-featured-price-before" id="sf-price-before-${sId}">${product.original_price} ج.م</span>` : ''}
                <span class="commercial-featured-price" id="sf-price-${sId}">${product.product_price} ج.م</span>
            </div>
        </div>
    `;

    card.onclick = () => {
        const providerKey = product.user_key || new URLSearchParams(window.location.search).get('user_key') || '';
        if (product?.item_type === 'car' || product?.is_car_listing) {
            window.location.href = window.ProductRoutes?.buildProductViewUrl
                ? window.ProductRoutes.buildProductViewUrl(product, { providerKey, productKey: product.car_key || product.product_key || product.id, listingType: 'car' })
                : `/pages/products/productView/productView.html?product_key=${encodeURIComponent(product.car_key || product.product_key || product.id)}&provider_key=${encodeURIComponent(providerKey)}&listing=car`;
        } else if (product?.item_type === 'real_estate' || product?.is_real_estate_listing) {
            window.location.href = window.ProductRoutes?.buildProductViewUrl
                ? window.ProductRoutes.buildProductViewUrl(product, { providerKey, productKey: product.real_estate_key || product.product_key || product.id, listingType: 'real_estate' })
                : `/pages/products/productView/productView.html?product_key=${encodeURIComponent(product.real_estate_key || product.product_key || product.id)}&provider_key=${encodeURIComponent(providerKey)}&listing=real_estate`;
        } else if (typeof window.loadProductView === 'function') {
            window.loadProductView(product, { showAddToCart: true });
        }
    };

    return card;
}

function createPharmacyFeaturedCard(product, index) {
    const card = document.createElement('div');
    card.className = 'commercial-featured-card pharmacy-featured-card';
    const sId = product.product_key || product.id || index;
    card.id = `commercial-featured-card-pharmacy-${sId}`;

    const imgUrl = product.renderedImgUrl || (window.pharmacyFeaturedUtils?.resolveImageUrl
        ? window.pharmacyFeaturedUtils.resolveImageUrl(product)
        : '/assets/images/placeholder.png');
    const price = product.product_price || product.price || '';
    const oldPrice = product.original_price ? parseFloat(product.original_price) : 0;
    const currentPrice = parseFloat(price);
    const hasDiscount = oldPrice && currentPrice && oldPrice > currentPrice;

    card.innerHTML = `
        <div class="commercial-featured-img-container" id="sf-img-cont-pharmacy-${sId}">
            <img src="${imgUrl}" class="commercial-featured-img" id="sf-img-pharmacy-${sId}" loading="lazy" alt="${product.productName || ''}">
        </div>
        <div class="commercial-featured-details" id="sf-details-pharmacy-${sId}">
            <div class="commercial-featured-name" id="sf-name-pharmacy-${sId}">${product.productName || ''}</div>
            <div class="commercial-featured-price-wrapper" id="sf-price-wrapper-pharmacy-${sId}">
                ${hasDiscount ? `<span class="commercial-featured-price-before" id="sf-price-before-pharmacy-${sId}">${product.original_price} ج.م</span>` : ''}
                ${price !== '' ? `<span class="commercial-featured-price" id="sf-price-pharmacy-${sId}">${price} ج.م</span>` : ''}
            </div>
        </div>
    `;

    card.onclick = () => {
        const merchantKey = product.merchant_user_key || new URLSearchParams(window.location.search).get('user_key');
        if (!merchantKey || !sId) return;
        const merchant = (window.PortfolioStore?.getState ? window.PortfolioStore.getState()?.activeUser : window.portfolioState?.activeUser) || {};
        LocalDBSession.setItem(`pharmacy_view_${sId}`, JSON.stringify({ item: product, merchant }));
        if (typeof window.portfolioSaveNavigationState === 'function') {
            window.portfolioSaveNavigationState(merchantKey);
        }
        window.location.href = window.ProductRoutes?.buildProductViewUrl
            ? window.ProductRoutes.buildProductViewUrl({ product_key: sId, user_key: merchantKey, pharmacy_metadata: true }, { pharmacy: true })
            : `/pages/products/productView/productView.html?product_key=${encodeURIComponent(sId)}&provider_key=${encodeURIComponent(merchantKey)}&pharmacy=1`;
    };

    return card;
}

window.renderCommercialFeaturedScroller = renderCommercialFeaturedScroller;
window.renderSellerFeaturedScroller = renderCommercialFeaturedScroller;
