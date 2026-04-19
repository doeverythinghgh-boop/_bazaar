/**
 * @file pages/merchant-portfolio/js/renderers/portfolio-product-grid-renderer.js
 * @description Grid-level rendering helpers for merchant portfolio products.
 */

function portfolioRenderEmptyState(grid, productsToRender, append, specialtyViewModel) {
    const empty = document.getElementById('portfolio-empty');
    const state = window.PortfolioStore?.getState ? window.PortfolioStore.getState() : window.portfolioState;

    if (productsToRender.length === 0 && !append) {
        if (grid.id === 'pharmacy-filtered-products-container') {
            grid.innerHTML = '<div class="pharmacy-feedback"><i class="fas fa-box-open"></i><p>لا توجد منتجات مطابقة لهذه الفئة</p></div>';
        } else if (empty) {
            empty.style.display = 'block';
            if (state?.showFeaturedOnly) {
                empty.innerHTML = `<i class="fas fa-crown"></i><p>${specialtyViewModel?.emptyFeaturedText || window.langu('port_no_featured_found') || 'لا توجد منتجات مميزة لعرضها'}</p>`;
            } else if (state?.sellerSearch?.isActive) {
                empty.innerHTML = '<i class="fas fa-magnifying-glass"></i><p>لا توجد منتجات مطابقة لعوامل البحث الحالية</p>';
            } else {
                empty.innerHTML = `<i class="fas fa-box-open"></i><p>${specialtyViewModel?.emptyCatalogText || window.langu('no_products') || 'لا توجد منتجات حالياً'}</p>`;
            }
        }
    } else if (empty && grid.id === 'portfolio-products-grid') {
        empty.style.display = 'none';
    }
}

function portfolioApplyBaseGridState(grid, append) {
    if (!append) grid.innerHTML = '';
    grid.classList.remove('pharmacy-category-grid');
    grid.style.display = 'grid';
}

function portfolioGetProductsToRender(products, state) {
    let productsToRender = Array.isArray(products) ? products.slice() : [];

    if (state?.showFeaturedOnly) {
        productsToRender = productsToRender.filter((product) => {
            const productId = String(product.product_key || product.id);
            return window.portfolioFeaturedState && window.portfolioFeaturedState.featuredIds.has(productId);
        });
    }

    return productsToRender;
}
