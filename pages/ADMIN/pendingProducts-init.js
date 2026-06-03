/**
 * @file pages/ADMIN/pendingProducts-init.js
 * @description Initialization and coordination module for products management in Admin Panel.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


var publishedOffset = 0;
var pendingOffset = 0;
var pageSize = 10;

async function fetchAllData() {
    console.log("[Admin-Init] Fetching all core data...");
    publishedOffset = 0;
    pendingOffset = 0;

    const pendingContainer = document.getElementById("pending-list-container");
    if (pendingContainer && pendingContainer.style.display !== "none") {
        await fetchPendingItems(false);
    }

    const publishedContainer = document.getElementById("published-list-container");
    if (publishedContainer && publishedContainer.style.display !== "none") {
        await fetchPublishedItems(false);
    }
}

async function fetchPendingItems(append = false) {
    const cardsWrapper = document.getElementById("pending-cards-wrapper");
    const loadMoreContainer = document.getElementById("load-more-pending-container");

    if (!cardsWrapper) return;

    if (!append) {
        pendingOffset = 0;
        cardsWrapper.innerHTML = '<div class="loader-container"><div class="loader"></div></div>';
        if (loadMoreContainer) loadMoreContainer.style.display = "none";
    }

    try {
        const products = await fetchProductsFromAPI(0, pageSize, pendingOffset);

        if (!products || products.length === 0) {
            if (!append) cardsWrapper.innerHTML = `<div class="no-data-msg">${adminPendingText("admin_pending_no_pending", "لم يتم العثور على خدمات معلقة.")}</div>`;
            if (loadMoreContainer) loadMoreContainer.style.display = "none";
            return;
        }

        let html = "";
        products.forEach((p) => { html += createPendingCardHTML(p); });

        if (append) {
            cardsWrapper.insertAdjacentHTML("beforeend", html);
        } else {
            cardsWrapper.innerHTML = html;
        }

        pendingOffset += products.length;
        if (loadMoreContainer) loadMoreContainer.style.display = (products.length === pageSize) ? "flex" : "none";
    } catch (e) {
        if (!append) cardsWrapper.innerHTML = `<div class="no-data-msg" style="color:red">${adminPendingText("admin_pending_load_error", "خطأ في تحميل البيانات")}</div>`;
    }
}

async function fetchPublishedItems(append = false) {
    const tableWrapper = document.getElementById("published-table-wrapper");
    const loadMoreContainer = document.getElementById("load-more-published-container");

    if (!tableWrapper) return;

    if (!append) {
        publishedOffset = 0;
        tableWrapper.innerHTML = '<div class="loader-container"><div class="loader"></div></div>';
        if (loadMoreContainer) loadMoreContainer.style.display = "none";
    }

    try {
        const products = await fetchProductsFromAPI(1, pageSize, publishedOffset);

        if (!products || products.length === 0) {
            if (!append) tableWrapper.innerHTML = `<div class="no-data-msg">${adminPendingText("admin_pending_no_published", "لم يتم العثور على خدمات منشورة.")}</div>`;
            if (loadMoreContainer) loadMoreContainer.style.display = "none";
            return;
        }

        let rowsHtml = "";
        products.forEach((p) => {
            console.log(`[Admin-Init] Rendering row for product: ${p.productName}`);
            rowsHtml += createPublishedRowHTML(p);
        });

        if (append) {
            const tbody = document.getElementById("published-table-body");
            if (tbody) tbody.insertAdjacentHTML("beforeend", rowsHtml);
        } else {
            tableWrapper.innerHTML = getPublishedTableHeaderHTML() + rowsHtml + "</tbody></table>";
        }

        publishedOffset += products.length;
        if (loadMoreContainer) loadMoreContainer.style.display = (products.length === pageSize) ? "flex" : "none";
    } catch (e) {
        if (!append) tableWrapper.innerHTML = `<div class="no-data-msg" style="color:red">${adminPendingText("admin_pending_load_error", "خطأ في تحميل البيانات")}</div>`;
    }
}

window.fetchAllData = fetchAllData;
window.adminFetchAllData = fetchAllData;

(function () {
    if (!document.getElementById("pending-list-container") && !document.getElementById("published-list-container")) return;

    console.log("[Admin-Init] Running automatic initialization...");
    fetchAllData();

    const togglePendingBtn = document.getElementById("toggle-pending-btn");
    const pendingContainer = document.getElementById("pending-list-container");
    if (togglePendingBtn && pendingContainer) {
        togglePendingBtn.addEventListener("click", async () => {
            if (pendingContainer.style.display === "none") {
                pendingContainer.style.display = "block";
                togglePendingBtn.classList.add("active");
                if (document.getElementById("pending-cards-wrapper").querySelector(".loader-container")) await fetchPendingItems(false);
            } else {
                pendingContainer.style.display = "none";
                togglePendingBtn.classList.remove("active");
            }
        });
    }

    const loadMorePendingBtn = document.getElementById("btn-load-more-pending");
    if (loadMorePendingBtn) {
        loadMorePendingBtn.addEventListener("click", async () => {
            loadMorePendingBtn.disabled = true;
            await fetchPendingItems(true);
            loadMorePendingBtn.disabled = false;
        });
    }

    const togglePublishedBtn = document.getElementById("toggle-published-btn");
    const publishedContainer = document.getElementById("published-list-container");
    if (togglePublishedBtn && publishedContainer) {
        togglePublishedBtn.addEventListener("click", async () => {
            if (publishedContainer.style.display === "none") {
                publishedContainer.style.display = "block";
                togglePublishedBtn.classList.add("active");
                if (document.getElementById("published-table-wrapper").querySelector(".loader-container")) await fetchPublishedItems(false);
            } else {
                publishedContainer.style.display = "none";
                togglePublishedBtn.classList.remove("active");
            }
        });
    }

    const loadMorePublishedBtn = document.getElementById("btn-load-more-published");
    if (loadMorePublishedBtn) {
        loadMorePublishedBtn.addEventListener("click", async () => {
            loadMorePublishedBtn.disabled = true;
            await fetchPublishedItems(true);
            loadMorePublishedBtn.disabled = false;
        });
    }
})();
