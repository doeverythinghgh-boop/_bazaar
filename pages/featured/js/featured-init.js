/**
 * @file pages/featured/js/featured-init.js
 * @description Main initialization for featured products module.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


async function initFeaturedModule() {
    const container = document.getElementById('featured-products-section');
    const track = document.getElementById('featured-track');

    if (typeof window.applyAppTranslations === 'function') {
        window.applyAppTranslations();
    }

    let products = [];
    if (window.selectedSearchProductsSet && window.selectedSearchProductsSet.size > 0) {
        products = Array.from(window.selectedSearchProductsSet);
    } else {
        container.style.display = 'none';
        return;
    }

    const validProducts = products.filter(p => typeof p === 'object' && (p.img || p.ImageName || p.image));

    if (validProducts.length === 0) {
        const user = window.UserService && typeof window.UserService.get === 'function'
            ? window.UserService.get()
            : null;
        const capabilities = typeof window.resolveUserCapabilities === 'function'
            ? window.resolveUserCapabilities(user)
            : null;
        const isAdmin = !!capabilities?.isAdmin;

        if (isAdmin) {
            container.style.display = 'flex';
            container.innerHTML = `
                <div style="padding: 10px; text-align: center; border: 1px dashed #ccc; background: rgba(255,255,255,0.5); width: 100%; border-radius: 8px;">
                    <i class="fas fa-info-circle text-primary"></i>
                    <span style="font-size: 0.85rem; color: #555;">(Admin Only) No featured products selected. Check products in Search to add them.</span>
                </div>
            `;
        } else {
            container.style.display = 'none';
        }
        return;
    }

    console.log(`[Featured] Displaying ${validProducts.length} items.`);
    container.style.display = 'flex';

    if (typeof renderFeaturedTrack === 'function') {
        renderFeaturedTrack(track, validProducts);
    }

    track.addEventListener('click', function (e) {
        const card = e.target.closest('.featured-card');
        if (card) {
            const rawData = card.getAttribute('data-product');
            if (rawData) {
                try {
                    const product = JSON.parse(rawData);
                    if (typeof window.mapProductData === 'function' && typeof window.loadProductView === 'function') {
                        const mapped = window.mapProductData(product);
                        window.loadProductView(mapped, true);
                    }
                } catch { }
            }
        }
    });

    if (typeof setupFeaturedScroll === 'function') {
        setupFeaturedScroll(track);
    }
}

window.initFeaturedModule = initFeaturedModule;

