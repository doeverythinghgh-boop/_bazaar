/**
 * @file search-api.js
 * @description Pure API logic for fetching products and merchants.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


const SearchAPI = {
    _inFlightController: null,
    _cache: new Map(),
    _dedupeResults(mode, items) {
        const merged = [];
        const seen = new Set();
        (Array.isArray(items) ? items : []).forEach((item) => {
            const uniqueKey = mode === 'merchants'
                ? String(item?.user_key || item?.id || '')
                : String(item?.product_key || item?.id || '');
            if (!uniqueKey || seen.has(uniqueKey)) return;
            seen.add(uniqueKey);
            merged.push(item);
        });
        return merged;
    },
    async _getLocalProductHints(params) {
        if (params.mode === 'merchants' || !window.LocalDB || Number(params.offset || 0) > 0) return [];
        try {
            return await window.LocalDB.searchProductsLocal(params.searchTerm || '', {
                mainCategory: params.mainCategory,
                subCategory: params.subCategory,
                userKey: params.userKey
            });
        } catch (error) {
            console.warn(" [Search Module - API] Local product search failed", error);
            return [];
        }
    },
    /**
     * @function fetchResults
     * @description Construct URL and fetch data based on mode and filters.
     */
    async fetchResults(params) {
        console.log(" [Search Module - API] fetchResults() Started", params);
        const { mode, searchTerm, mainCategory, subCategory, userKey, limit, offset } = params;
        const endpoint = mode === 'merchants' ? "/api/users" : "/api/products";
        const localHints = await this._getLocalProductHints(params);

        console.info(" [Search Module - API] Evaluating target categories");
        const targets = (mainCategory && typeof window.getCompatibleCategorySelections === 'function')
            ? window.getCompatibleCategorySelections(mainCategory, subCategory || "")
            : [{ mainId: mainCategory || "", subId: subCategory || "" }];

        const cacheKey = JSON.stringify({ mode, searchTerm, mainCategory, subCategory, userKey, limit, offset });
        if (this._cache.has(cacheKey)) {
            console.log(" [Search Module - API] Returning cached results", cacheKey);
            console.log(" [Search Module - API] fetchResults() Finished (Cached)");
            return this._cache.get(cacheKey);
        }

        if (this._inFlightController) {
            console.warn(" [Search Module - API] Aborting previous in-flight request");
            this._inFlightController.abort();
        }
        this._inFlightController = new AbortController();

        console.info(" [Search Module - API] Constructing requests...");
        const requests = targets.map(async (target) => {
            const queryParams = new URLSearchParams();

            if (mode === 'merchants') {
                queryParams.append("mode", "category_search");
                if (searchTerm) queryParams.append("searchTerm", searchTerm);
                if (target.mainId) queryParams.append("main_id", target.mainId);
                if (target.subId) queryParams.append("sub_id", target.subId);
                if (userKey) queryParams.append("user_key", userKey);
            } else {
                if (searchTerm) queryParams.append("searchTerm", searchTerm);
                if (target.mainId) queryParams.append("MainCategory", target.mainId);
                if (target.subId) queryParams.append("SubCategory", target.subId);
                if (userKey) queryParams.append("user_key", userKey);
            }

            if (limit !== undefined) queryParams.append("limit", limit);
            if (offset !== undefined) queryParams.append("offset", offset);

            const searchURL = `${baseURL}${endpoint}?${queryParams.toString()}`;
            console.log(` [Search Module - API] Fetching from: ${searchURL}`);

            try {
                const result = await apiFetch(`${endpoint}?${queryParams.toString()}`, {
                    signal: this._inFlightController.signal
                });
                if (result && result.error) throw new Error(result.error);
                console.info(" [Search Module - API] Request successful");
                return result;
            } catch (error) {
                console.error(" [Search Module - API] Request failed!", error);
                throw error;
            }
        });

        console.info(" [Search Module - API] Awaiting all requests to complete");
        let responses;
        try {
            responses = await Promise.all(requests);
        } catch (error) {
            console.error(" [Search Module - API] Promise.all failed!", error);
            console.log(" [Search Module - API] fetchResults() Finished (Error)");
            throw error;
        }

        if (responses.length === 1) {
            console.info(" [Search Module - API] Single response received, caching...");
            const enriched = mode === 'products'
                ? this._dedupeResults(mode, [...localHints, ...(Array.isArray(responses[0]) ? responses[0] : [])])
                : responses[0];
            if (mode === 'products') {
                window.LocalDB?.saveProducts(enriched, 'search-fetch').catch((error) => console.warn(" [Search Module - API] Failed to persist search products", error));
            }
            this._cache.set(cacheKey, enriched);
            console.log(" [Search Module - API] fetchResults() Finished");
            return enriched;
        }

        console.info(" [Search Module - API] Merging multiple responses...");
        const merged = [];
        const seen = new Set();
        responses.forEach((result) => {
            if (!Array.isArray(result)) return;
            result.forEach((item) => {
                const uniqueKey = mode === 'merchants'
                    ? String(item?.user_key || item?.id || '')
                    : String(item?.product_key || item?.id || '');
                if (!uniqueKey || seen.has(uniqueKey)) return;
                seen.add(uniqueKey);
                merged.push(item);
            });
        });

        console.info(" [Search Module - API] Merging complete, caching results...");
        const enrichedMerged = mode === 'products'
            ? this._dedupeResults(mode, [...localHints, ...merged])
            : merged;
        if (mode === 'products') {
            window.LocalDB?.saveProducts(enrichedMerged, 'search-fetch').catch((error) => console.warn(" [Search Module - API] Failed to persist search products", error));
        }
        this._cache.set(cacheKey, enrichedMerged);
        console.log(" [Search Module - API] fetchResults() Finished");
        return enrichedMerged;
    }
};
