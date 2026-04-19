/**
 * @file pages/merchant-portfolio/js/portfolio-featured-render.js
 * @description Featured products rendering helpers.
 */

async function renderCommercialFeaturedScroller() {
    const state = window.portfolioFeaturedState;
    const storeState = window.PortfolioStore?.getState ? window.PortfolioStore.getState() : window.portfolioState;
    const container = document.getElementById('commercial-featured-section');
    const track = document.getElementById('commercial-featured-track');
    const activeUser = storeState?.activeUser || null;
    const specialtyViewModel = typeof window.resolvePortfolioSpecialtyViewModel === 'function'
        ? (activeUser?.portfolio_view_model || (activeUser ? window.resolvePortfolioSpecialtyViewModel(activeUser) : null))
        : null;

    if (!container || !track) return;
    if (specialtyViewModel && specialtyViewModel.showFeaturedSection === false) {
        container.style.display = 'none';
        return;
    }

    const userKey = new URLSearchParams(window.location.search).get('user_key');
    const cachedProducts = window.portfolioCache.load(userKey)?.products || [];
    const allAvailable = window.portfolioPageController?.mergeProductSets
        ? window.portfolioPageController.mergeProductSets(storeState?.allProducts || [], cachedProducts)
        : (storeState?.allProducts || cachedProducts);

    let featuredList = allAvailable.filter((product) => state.featuredIds.has(String(product.id)) || state.featuredIds.has(String(product.product_key)));

    if (userKey && state.featuredIds.size > 0 && featuredList.length < state.featuredIds.size && typeof window.portfolioFetchAllFeaturedProducts === 'function') {
        const remoteFeatured = await window.portfolioFetchAllFeaturedProducts(userKey);
        featuredList = window.portfolioPageController?.mergeProductSets
            ? window.portfolioPageController.mergeProductSets(featuredList, remoteFeatured)
            : [...featuredList, ...remoteFeatured];
    }

    if (featuredList.length === 0) {
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
        const card = createCommercialFeaturedCard(product, idx);
        track.appendChild(card);
    });

    if (userKey) {
        const savedPos = sessionStorage.getItem(state.storageKey + userKey);
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
        if (typeof window.loadProductView === 'function') {
            window.loadProductView(product, { showAddToCart: true });
        }
    };

    return card;
}

window.renderCommercialFeaturedScroller = renderCommercialFeaturedScroller;
window.renderSellerFeaturedScroller = renderCommercialFeaturedScroller;
