/**
 * @file pages/merchant-portfolio/js/renderers/portfolio-product-virtualizer.js
 * @description Virtualization and chunked append helpers for merchant portfolio products.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


function portfolioClearVirtualization(grid) {
    if (grid?._portfolioVirtualCleanup) {
        grid._portfolioVirtualCleanup();
        grid._portfolioVirtualCleanup = null;
    }
    if (grid?.dataset) {
        delete grid.dataset.portfolioVirtualized;
    }
}

function portfolioCreateSpacer(height) {
    const spacer = document.createElement('div');
    spacer.className = 'portfolio-virtual-spacer';
    spacer.style.gridColumn = '1 / -1';
    spacer.style.height = `${Math.max(0, height)}px`;
    spacer.style.pointerEvents = 'none';
    return spacer;
}

function portfolioEstimateVirtualColumns(grid) {
    const minCardWidth = 220;
    return Math.max(1, Math.floor((grid.clientWidth || window.innerWidth || minCardWidth) / minCardWidth));
}

function portfolioVirtualRender(grid, productsToRender, specialtyViewModel, permissions) {
    portfolioClearVirtualization(grid);
    if (grid?.dataset) {
        grid.dataset.portfolioVirtualized = 'true';
    }

    const rowHeight = 340;
    const overscanRows = 2;

    function renderWindow() {
        const columns = portfolioEstimateVirtualColumns(grid);
        const totalRows = Math.ceil(productsToRender.length / columns);
        const gridTop = grid.getBoundingClientRect().top + window.scrollY;
        const viewportTop = Math.max(0, window.scrollY - gridTop);
        const viewportBottom = viewportTop + window.innerHeight;
        const startRow = Math.max(0, Math.floor(viewportTop / rowHeight) - overscanRows);
        const endRow = Math.min(totalRows, Math.ceil(viewportBottom / rowHeight) + overscanRows);
        const startIndex = startRow * columns;
        const endIndex = Math.min(productsToRender.length, endRow * columns);
        const visibleProducts = productsToRender.slice(startIndex, endIndex);

        grid.innerHTML = '';
        grid.appendChild(portfolioCreateSpacer(startRow * rowHeight));
        visibleProducts.forEach(function (product) {
            grid.appendChild(portfolioCreateProductCard(product, specialtyViewModel, permissions));
        });
        grid.appendChild(portfolioCreateSpacer((totalRows - endRow) * rowHeight));
    }

    let rafId = 0;
    const scheduleRender = function () {
        if (rafId) return;
        rafId = window.requestAnimationFrame(function () {
            rafId = 0;
            renderWindow();
        });
    };

    window.addEventListener('scroll', scheduleRender, { passive: true });
    window.addEventListener('resize', scheduleRender);
    grid._portfolioVirtualCleanup = function () {
        window.removeEventListener('scroll', scheduleRender);
        window.removeEventListener('resize', scheduleRender);
        if (rafId) {
            window.cancelAnimationFrame(rafId);
        }
    };

    renderWindow();
}

async function portfolioAppendProductCards(grid, productsToRender, specialtyViewModel, permissions) {
    const chunkSize = 12;
    for (let index = 0; index < productsToRender.length; index += chunkSize) {
        const fragment = document.createDocumentFragment();
        const batch = productsToRender.slice(index, index + chunkSize);

        batch.forEach((product) => {
            const productId = product.product_key || product.id;
            if (document.getElementById(`product-card-${productId}`)) {
                return;
            }
            fragment.appendChild(portfolioCreateProductCard(product, specialtyViewModel, permissions));
        });

        if (fragment.childNodes.length > 0) {
            grid.appendChild(fragment);
        }

        if (index + chunkSize < productsToRender.length) {
            await new Promise((resolve) => window.requestAnimationFrame(resolve));
        }
    }
}
