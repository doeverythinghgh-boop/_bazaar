/**
 * @file pages/ADMIN/pendingProducts-init.js
 * @description Initialization and coordination module for products management in Admin Panel.
 */

// Pagination state
var publishedOffset = 0;
var pendingOffset = 0;
var pageSize = 10;

/**
 * @function fetchAllData
 * @description Resets offsets and refreshes visible lists.
 */
async function fetchAllData() {
    console.log("[Admin-Init] جاري جلب جميع البيانات الأساسية...");
    publishedOffset = 0;
    pendingOffset = 0;

    const pendingContainer = document.getElementById('pending-list-container');
    if (pendingContainer && pendingContainer.style.display !== 'none') {
        await fetchPendingItems(false);
    }

    const publishedContainer = document.getElementById('published-list-container');
    if (publishedContainer && publishedContainer.style.display !== 'none') {
        await fetchPublishedItems(false);
    }
}

/**
 * @function fetchPendingItems
 * @description Coordinates fetching and rendering pending products.
 * @param {boolean} append - To append or replace content.
 */
async function fetchPendingItems(append = false) {
    const cardsWrapper = document.getElementById('pending-cards-wrapper');
    const loadMoreContainer = document.getElementById('load-more-pending-container');

    if (!cardsWrapper) return;

    if (!append) {
        pendingOffset = 0;
        cardsWrapper.innerHTML = '<div class="loader-container"><div class="loader"></div></div>';
        if (loadMoreContainer) loadMoreContainer.style.display = 'none';
    }

    try {
        const products = await fetchProductsFromAPI(0, pageSize, pendingOffset);

        if (!products || products.length === 0) {
            if (!append) cardsWrapper.innerHTML = '<div class="no-data-msg">لم يتم العثور على منتجات معلقة.</div>';
            if (loadMoreContainer) loadMoreContainer.style.display = 'none';
            return;
        }

        let html = '';
        products.forEach(p => html += createPendingCardHTML(p));

        if (append) {
            cardsWrapper.insertAdjacentHTML('beforeend', html);
        } else {
            cardsWrapper.innerHTML = html;
        }

        pendingOffset += products.length;
        if (loadMoreContainer) loadMoreContainer.style.display = (products.length === pageSize) ? 'flex' : 'none';

    } catch (e) {
        if (!append) cardsWrapper.innerHTML = '<div class="no-data-msg" style="color:red">خطأ في تحميل البيانات</div>';
    }
}

/**
 * @function fetchPublishedItems
 * @description Coordinates fetching and rendering published products.
 * @param {boolean} append - To append or replace content.
 */
async function fetchPublishedItems(append = false) {
    const tableWrapper = document.getElementById('published-table-wrapper');
    const loadMoreContainer = document.getElementById('load-more-published-container');

    if (!tableWrapper) return;

    if (!append) {
        publishedOffset = 0;
        tableWrapper.innerHTML = '<div class="loader-container"><div class="loader"></div></div>';
        if (loadMoreContainer) loadMoreContainer.style.display = 'none';
    }

    try {
        const products = await fetchProductsFromAPI(1, pageSize, publishedOffset);

        if (!products || products.length === 0) {
            if (!append) tableWrapper.innerHTML = '<div class="no-data-msg">لم يتم العثور على منتجات منشورة.</div>';
            if (loadMoreContainer) loadMoreContainer.style.display = 'none';
            return;
        }

        let rowsHtml = '';
        products.forEach(p => {
            console.log(`[Admin-Init] Rendering row for product: ${p.productName}`);
            rowsHtml += createPublishedRowHTML(p);
        });

        if (append) {
            const tbody = document.getElementById('published-table-body');
            if (tbody) tbody.insertAdjacentHTML('beforeend', rowsHtml);
        } else {
            tableWrapper.innerHTML = getPublishedTableHeaderHTML() + rowsHtml + '</tbody></table>';
        }

        publishedOffset += products.length;
        if (loadMoreContainer) loadMoreContainer.style.display = (products.length === pageSize) ? 'flex' : 'none';

    } catch (e) {
        if (!append) tableWrapper.innerHTML = '<div class="no-data-msg" style="color:red">Error loading data</div>';
    }
}

// Global exposure
window.fetchAllData = fetchAllData;
window.adminFetchAllData = fetchAllData;

// Auto-initialize
(function() {
    if (!document.getElementById('pending-list-container') && !document.getElementById('published-list-container')) return;

    console.log("[Admin-Init] جاري تشغيل التهيئة التلقائية...");
    fetchAllData();

    // Toggle Pending
    const togglePendingBtn = document.getElementById('toggle-pending-btn');
    const pendingContainer = document.getElementById('pending-list-container');
    if (togglePendingBtn && pendingContainer) {
        togglePendingBtn.addEventListener('click', async () => {
            if (pendingContainer.style.display === 'none') {
                pendingContainer.style.display = 'block';
                togglePendingBtn.classList.add('active');
                if (document.getElementById('pending-cards-wrapper').querySelector('.loader-container')) await fetchPendingItems(false);
            } else {
                pendingContainer.style.display = 'none';
                togglePendingBtn.classList.remove('active');
            }
        });
    }

    // Load More Pending
    const loadMorePendingBtn = document.getElementById('btn-load-more-pending');
    if (loadMorePendingBtn) {
        loadMorePendingBtn.addEventListener('click', async () => {
            loadMorePendingBtn.disabled = true;
            await fetchPendingItems(true);
            loadMorePendingBtn.disabled = false;
        });
    }

    // Toggle Published
    const togglePublishedBtn = document.getElementById('toggle-published-btn');
    const publishedContainer = document.getElementById('published-list-container');
    if (togglePublishedBtn && publishedContainer) {
        togglePublishedBtn.addEventListener('click', async () => {
            if (publishedContainer.style.display === 'none') {
                publishedContainer.style.display = 'block';
                togglePublishedBtn.classList.add('active');
                if (document.getElementById('published-table-wrapper').querySelector('.loader-container')) await fetchPublishedItems(false);
            } else {
                publishedContainer.style.display = 'none';
                togglePublishedBtn.classList.remove('active');
            }
        });
    }

    // Load More Published
    const loadMorePublishedBtn = document.getElementById('btn-load-more-published');
    if (loadMorePublishedBtn) {
        loadMorePublishedBtn.addEventListener('click', async () => {
            loadMorePublishedBtn.disabled = true;
            await fetchPublishedItems(true);
            loadMorePublishedBtn.disabled = false;
        });
    }
})();
