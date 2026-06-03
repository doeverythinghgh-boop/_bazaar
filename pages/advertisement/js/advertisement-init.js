/**
 * @file pages/advertisement/js/advertisement-init.js
 * @description Initialization and state management for advertisements.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


/**
 * @description Initializes and displays the advertisement module.
 */
async function initAdverModule(container, forceRefresh = false) {
    if (!container) {
        console.error(`[AdverModule] Container not found. Skipping initialization.`);
        return;
    }

    console.log('[AdverModule] Initializing advertisement module...');

    const CACHE_KEY_IMAGES = 'adver_images_cache';
    const CACHE_KEY_TIMESTAMP = 'adver_timestamp_cache';
    const CACHE_KEY_LAST_CHECK = 'adver_last_check_timestamp';
    const CHECK_INTERVAL = 1 * 60 * 60 * 1000; // 1 hour

    const cachedTimestamp = LocalDBStorage.getItem(CACHE_KEY_TIMESTAMP);
    const cachedImages = JSON.parse(LocalDBStorage.getItem(CACHE_KEY_IMAGES));
    const lastCheckTimestamp = LocalDBStorage.getItem(CACHE_KEY_LAST_CHECK);

    if (!forceRefresh && lastCheckTimestamp && (Date.now() - lastCheckTimestamp < CHECK_INTERVAL) && cachedImages && cachedImages.length > 0) {
        console.log('[AdverModule] Local check interval valid. Loading ads from cache.');
        if (typeof buildSlider === 'function') buildSlider(container, cachedImages);
        return;
    }

    console.log('[AdverModule] Fetching latest update timestamp from server...');
    const latestUpdate = typeof getLatestUpdate === 'function' ? await getLatestUpdate() : null;
    const serverTimestamp = latestUpdate ? latestUpdate.datetime : null;

    if (!forceRefresh && serverTimestamp && serverTimestamp === cachedTimestamp && cachedImages && cachedImages.length > 0) {
        console.log('[AdverModule] Cached ads are up-to-date. Loading from cache.');
        LocalDBStorage.setItem(CACHE_KEY_LAST_CHECK, Date.now());
        if (typeof buildSlider === 'function') buildSlider(container, cachedImages);
        return;
    }

    console.log('[AdverModule] Cache is invalid, stale, or expired. Fetching fresh ads from server...');

    const fetchedImages = [];
    let fetchSuccess = false;

    try {
        const adsData = await apiFetch(`/api/get-ads?t=${Date.now()}`);

        if (adsData && !adsData.error && Array.isArray(adsData)) {
            console.log('[AdverModule] Successfully fetched ads from server.', adsData);
            adsData.forEach(item => {
                fetchedImages.push({
                    url: typeof getPublicR2FileUrl === 'function' ? getPublicR2FileUrl(item.img) : item.img,
                    query: item.query || ''
                });
            });
            fetchSuccess = true;
        } else {
            console.warn('[AdverModule] API request returned error or non-array data:', adsData ? adsData.error : 'empty response');
        }
    } catch (e) {
        console.error("[AdverModule] Failed connection to ads API:", e);
    }

    if (fetchSuccess) {
        if (fetchedImages.length > 0) {
            LocalDBStorage.setItem(CACHE_KEY_IMAGES, JSON.stringify(fetchedImages));
            if (serverTimestamp) {
                LocalDBStorage.setItem(CACHE_KEY_TIMESTAMP, serverTimestamp);
            }
            LocalDBStorage.setItem(CACHE_KEY_LAST_CHECK, Date.now());
            if (typeof buildSlider === 'function') buildSlider(container, fetchedImages);
        } else {
            console.warn('[AdverModule] No advertisements found on server.');
            LocalDBStorage.removeItem(CACHE_KEY_IMAGES);
            container.innerHTML = '<p class="no-ads-message">لا توجد إعلانات حالياً.</p>';
        }
    } else {
        console.log('[AdverModule] Fetch failed. Falling back to local cache.');
        if (cachedImages && cachedImages.length > 0) {
            if (typeof buildSlider === 'function') buildSlider(container, cachedImages);
        } else {
            const noAdsMsg = container.querySelector('.no-ads-message');
            if (noAdsMsg) noAdsMsg.style.display = 'block';
        }
    }
}

/**
 * @description Initializes the Selected Products module (for Search Admin).
 */
window.initSelectedProductsModule = async function (forceRefresh = false) {
    const CACHE_KEY_DATA = 'selected_products_cache';
    const CACHE_KEY_TIME = 'selected_products_time';
    const CHECK_INTERVAL = 1 * 60 * 60 * 1000; // 1 hour

    const cachedData = LocalDBStorage.getItem(CACHE_KEY_DATA);
    const lastCheck = LocalDBStorage.getItem(CACHE_KEY_TIME);

    if (!forceRefresh && lastCheck && (Date.now() - lastCheck < CHECK_INTERVAL) && cachedData) {
        console.log('[SelectedProducts] Local check interval valid. Loading selected products from cache.');
        try {
            const list = JSON.parse(cachedData);
            window.selectedSearchProductsSet = new Set(list);
            return;
        } catch (e) { console.error("[SelectedProducts] Cache parse error:", e); }
    }

    console.log('[SelectedProducts] Cache expired or invalid. Fetching fresh selected products from database...');
    try {
        const list = await apiFetch(`/api/get-featured?t=${Date.now()}`);
        if (list && !list.error && Array.isArray(list)) {
            window.selectedSearchProductsSet = new Set(list);
            LocalDBStorage.setItem(CACHE_KEY_DATA, JSON.stringify(list));
            LocalDBStorage.setItem(CACHE_KEY_TIME, Date.now());
            console.log('[SelectedProducts] Successfully loaded and cached selected products.');
        } else {
            console.warn('[SelectedProducts] API request returned error or non-array data:', list ? list.error : 'empty response');
            if (cachedData) {
                const listData = JSON.parse(cachedData);
                window.selectedSearchProductsSet = new Set(listData);
            }
        }
    } catch (e) {
        console.error("[SelectedProducts] Fetch error:", e);
        if (cachedData) {
            const list = JSON.parse(cachedData);
            window.selectedSearchProductsSet = new Set(list);
        }
    }
};
