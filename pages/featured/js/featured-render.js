/**
 * @file pages/featured/js/featured-render.js
 * @description Card rendering logic for featured products.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


function createFeaturedCard(product, index) {
    const card = document.createElement('div');
    card.className = 'featured-card';
    const cardId = `featured-card-${product.id || product.key || index}`;
    card.id = cardId;
    card.setAttribute('data-product', JSON.stringify(product));

    const imgSource = product.img || product.ImageName || product.image;
    const imgUrl = imgSource
        ? (typeof getPublicR2FileUrl === 'function' ? getPublicR2FileUrl(imgSource) : imgSource)
        : 'images/placeholder.png';

    const priceVal = typeof product.price === 'number' ? product.price.toFixed(2) : product.price;
    const hidePrice = typeof window.ProductCategoryUi?.shouldHidePriceForProduct === 'function'
        ? window.ProductCategoryUi.shouldHidePriceForProduct(product)
        : false;

    card.innerHTML = `
        <div class="featured-img-container" id="${cardId}-img-container">
            <img src="${imgUrl}" 
                 id="${cardId}-img"
                 class="featured-img" 
                 loading="lazy" 
                 alt="${product.name || product.productName}">
        </div>
        <div class="featured-details" id="${cardId}-details">
            <div class="featured-name" id="${cardId}-name">${product.name || product.productName}</div>
            ${!hidePrice ? `<div class="featured-price" id="${cardId}-price">${priceVal} ${window.langu('currency_egp')}</div>` : ''}
        </div>
    `;
    return card;
}

function renderFeaturedTrack(track, validProducts) {
    const minItems = 15;
    let itemsToRender = [...validProducts];
    while (itemsToRender.length < minItems) {
        itemsToRender = [...itemsToRender, ...validProducts];
    }

    track.innerHTML = '';
    itemsToRender.forEach((p, idx) => {
        track.appendChild(createFeaturedCard(p, idx));
    });

    const children = Array.from(track.children);
    children.forEach((child, idx) => {
        const clone = child.cloneNode(true);
        if (clone.id) clone.id = `${clone.id}-clone-${idx}`;

        // Update IDs of children in the clone to be unique
        clone.querySelectorAll('[id]').forEach(el => {
            el.id = `${el.id}-clone-${idx}`;
        });

        track.appendChild(clone);
    });
}
