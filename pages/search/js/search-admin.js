/**
 * @file search-admin.js
 * @description Admin-specific logic for search results.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


function isProductSelected(key) {
    console.log(` [Search Module - Admin] isProductSelected() Called for key: ${key}`);
    if (!window.selectedSearchProductsSet) {
        console.warn(" [Search Module - Admin] selectedSearchProductsSet is undefined");
        return false;
    }
    for (let item of window.selectedSearchProductsSet) {
        if (typeof item === 'string' && item === key) {
            console.info(` [Search Module - Admin] Product found (string format)`);
            return true;
        }
        if (typeof item === 'object' && item.key === key) {
            console.info(` [Search Module - Admin] Product found (object format)`);
            return true;
        }
    }
    console.info(" [Search Module - Admin] Product not selected");
    return false;
}

window.loadSelectedSearchProducts = async function () {
    console.log(" [Search Module - Admin] loadSelectedSearchProducts() Started");
    if (window.selectedSearchProductsSet && window.selectedSearchProductsSet.size > 0) {
        selectedSearchProducts = window.selectedSearchProductsSet;
        console.info(` [Search Module - Admin] Using global cache: ${selectedSearchProducts.size} terms.`);
        console.log(" [Search Module - Admin] loadSelectedSearchProducts() Finished (Cached)");
        return;
    }

    try {
        console.info(" [Search Module - Admin] Fetching featured products from DB...");
        const list = await apiFetch(`/api/get-featured?t=${Date.now()}`);
        if (list && !list.error && Array.isArray(list)) {
            selectedSearchProducts = new Set(list);
            window.selectedSearchProductsSet = new Set(list);
            console.info(` [Search Module - Admin] Terms loaded from DB: ${list.length}`);
        }
        console.log(" [Search Module - Admin] loadSelectedSearchProducts() Finished Successfully");
    } catch (e) {
        console.warn(" [Search Module - Admin] Failed to load selected products from DB.", e);
        console.log(" [Search Module - Admin] loadSelectedSearchProducts() Finished with Error");
    }
};

window.toggleSearchProduct = async function (metaStr, divEl) {
    console.log(" [Search Module - Admin] toggleSearchProduct() Started");
    if (!isAdminForSearch) {
        console.warn(" [Search Module - Admin] User is not an admin, ignoring toggle");
        return;
    }

    let productMeta;
    try {
        productMeta = JSON.parse(decodeURIComponent(metaStr));
        console.info(" [Search Module - Admin] Product meta parsed successfully");
    } catch (e) {
        console.error(" [Search Module - Admin] Meta parse error", e);
        return;
    }

    const key = productMeta.key;
    const checkbox = divEl.querySelector('input');
    const isChecked = checkbox.checked;

    let existingItem = null;
    let existingItemString = null;

    console.info(` [Search Module - Admin] Searching for existing item with key: ${key}`);
    for (let item of selectedSearchProducts) {
        if (typeof item === 'string' && item === key) {
            existingItemString = item;
            break;
        }
        if (typeof item === 'object' && item.key === key) {
            existingItem = item;
            break;
        }
    }

    if (isChecked) {
        if (!existingItem && !existingItemString) {
            console.info(" [Search Module - Admin] Adding new product meta");
            selectedSearchProducts.add(productMeta);
            window.selectedSearchProductsSet.add(productMeta);
        } else if (existingItemString) {
            console.info(" [Search Module - Admin] Upgrading existing string key to full object meta");
            selectedSearchProducts.delete(existingItemString);
            window.selectedSearchProductsSet.delete(existingItemString);
            selectedSearchProducts.add(productMeta);
            window.selectedSearchProductsSet.add(productMeta);
        }
    } else {
        console.info(" [Search Module - Admin] Removing product from selected list");
        if (existingItem) {
            selectedSearchProducts.delete(existingItem);
            window.selectedSearchProductsSet.delete(existingItem);
        }
        if (existingItemString) {
            selectedSearchProducts.delete(existingItemString);
            window.selectedSearchProductsSet.delete(existingItemString);
        }
    }

    console.info(` [Search Module - Admin] Product ${key} is now ${isChecked ? 'SELECTED' : 'REMOVED'}`);
    await saveSelectedSearchProducts();
    console.log(" [Search Module - Admin] toggleSearchProduct() Finished");
};

async function saveSelectedSearchProducts() {
    console.log(" [Search Module - Admin] saveSelectedSearchProducts() Started");
    if (!isAdminForSearch) {
        console.warn(" [Search Module - Admin] User is not an admin, aborting save");
        return;
    }
    try {
        const list = Array.from(selectedSearchProducts);
        console.info(` [Search Module - Admin] Saving ${list.length} products to DB`);
        const data = await apiFetch('/api/save-featured', {
            method: 'POST',
            body: { products: list }
        });

        if (data && !data.error) {
            console.info(" [Search Module - Admin] List saved successfully.");
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'success',
                    text: window.langu('search_admin_save_success'),
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 2000
                });
            }
        } else {
            throw new Error("Failed to save list");
        }
        console.log(" [Search Module - Admin] saveSelectedSearchProducts() Finished Successfully");
    } catch (e) {
        console.error(" [Search Module - Admin] Error saving products:", e);
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'error',
                text: window.langu('search_admin_save_error'),
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            });
        }
        console.log(" [Search Module - Admin] saveSelectedSearchProducts() Finished with Error");
    }
}
