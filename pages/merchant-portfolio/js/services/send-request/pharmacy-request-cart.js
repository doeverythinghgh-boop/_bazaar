/**
 * @file pages/merchant-portfolio/js/services/send-request/pharmacy-request-cart.js
 * @description Local cart for pharmacy products attached to direct merchant requests.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

(function () {
    const STORAGE_KEY = 'pharmacy_request_cart_v1';
    const EVENT_NAME = 'pharmacy-request-cart-updated';

    function readRaw() {
        try {
            const parsed = JSON.parse(LocalDBStorage.getItem(STORAGE_KEY) || '[]');
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            console.error('[PharmacyRequestCart] Failed to parse storage:', error);
            return [];
        }
    }

    function writeRaw(items) {
        LocalDBStorage.setItem(STORAGE_KEY, JSON.stringify(Array.isArray(items) ? items : []));
        window.dispatchEvent(new CustomEvent(EVENT_NAME));
    }

    function cleanString(value) {
        return String(value || '').trim();
    }

    function cleanProductId(value) {
        return cleanString(Array.isArray(value) ? value[0] : value);
    }

    function makeKey(merchantKey, productId) {
        return `${cleanString(merchantKey)}::${cleanString(productId)}`;
    }

    function clampQuantity(value) {
        return Math.max(1, parseInt(value || 1, 10) || 1);
    }

    function normalizeItem(input) {
        const merchantKey = cleanString(input.merchantKey || input.merchant_key || input.seller_key);
        const productId = cleanProductId(input.productId || input.product_id || input.product_key || input.id);
        if (!merchantKey || !productId) return null;

        return {
            key: makeKey(merchantKey, productId),
            merchantKey,
            productId,
            sourceType: cleanString(input.sourceType || input.source_type || 'pharmacy'),
            name: cleanString(input.name || input.product_name || input.productName),
            image: cleanString(input.image || input.product_image || input.image_url),
            quantity: clampQuantity(input.quantity),
            viewPath: cleanString(input.viewPath || input.view_path || (window.ProductRoutes?.buildProductViewUrl
                ? window.ProductRoutes.buildProductViewUrl({ product_key: productId, user_key: merchantKey, pharmacy_metadata: true }, { pharmacy: true })
                : `/pages/products/productView/productView.html?product_key=${encodeURIComponent(productId)}&provider_key=${encodeURIComponent(merchantKey)}&pharmacy=1`)),
            payload: input.payload && typeof input.payload === 'object' ? input.payload : {}
        };
    }

    function getAll() {
        return readRaw().map(normalizeItem).filter(Boolean);
    }

    function getItems(merchantKey) {
        const key = cleanString(merchantKey);
        return getAll().filter((item) => item.merchantKey === key);
    }

    function count(merchantKey) {
        return getItems(merchantKey).length;
    }

    function has(merchantKey, productId) {
        const key = makeKey(merchantKey, productId);
        return getAll().some((item) => item.key === key);
    }

    function add(input) {
        const nextItem = normalizeItem(input);
        if (!nextItem) return { added: false, item: null, reason: 'invalid' };

        const items = getAll();
        if (items.some((item) => item.key === nextItem.key)) {
            return { added: false, item: nextItem, reason: 'duplicate' };
        }

        items.push(nextItem);
        writeRaw(items);
        return { added: true, item: nextItem };
    }

    function updateQuantity(merchantKey, productId, quantity) {
        const key = makeKey(merchantKey, productId);
        const items = getAll().map((item) => item.key === key
            ? { ...item, quantity: clampQuantity(quantity) }
            : item);
        writeRaw(items);
        return items.find((item) => item.key === key) || null;
    }

    function remove(merchantKey, productId) {
        const key = makeKey(merchantKey, productId);
        writeRaw(getAll().filter((item) => item.key !== key));
    }

    function clearMerchant(merchantKey) {
        const key = cleanString(merchantKey);
        writeRaw(getAll().filter((item) => item.merchantKey !== key));
    }

    function toOrderPayload(merchantKey) {
        return getItems(merchantKey).map((item) => ({
            product_id: item.productId,
            seller_key: item.merchantKey,
            product_name: item.name,
            product_image: item.image,
            quantity: item.quantity,
            source_type: item.sourceType,
            view_path: item.viewPath,
            payload: item.payload
        }));
    }

    function syncBadge(merchantKey) {
        const btn = document.getElementById('btn-send-request-mini');
        if (!btn) return;

        const total = count(merchantKey);
        const existing = document.getElementById('pharmacy-request-cart-badge');

        if (total <= 0) {
            // Option B: remove entirely from DOM when count is zero
            if (existing) existing.remove();
            return;
        }

        // Count > 0: create if not present, then update
        btn.style.position = 'relative';
        const badge = existing || (() => {
            const el = document.createElement('span');
            el.id = 'pharmacy-request-cart-badge';
            el.className = 'pharmacy-request-cart-badge';
            btn.appendChild(el);
            return el;
        })();

        badge.textContent = String(total);
        badge.style.display = 'inline-flex';
    }

    function notify(title, icon) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title,
                icon: icon || 'success',
                timer: 1400,
                showConfirmButton: false,
                toast: true,
                position: 'top-end',
                customClass: { popup: 'swal-modern-mini-popup' }
            });
            return;
        }
        alert(title);
    }

    function bindPharmacyViewButton(product, merchantKey) {
        const btn = document.getElementById('pharmacy-add-to-request-btn');
        if (!btn || !product || !merchantKey) return;

        const productId = cleanProductId(product.id || product.product_id || product.product_key);
        const name = typeof window.getVal === 'function'
            ? window.getVal(product.name_ar || product.product_name_ar, product.name_en || product.product_name_en)
            : cleanString(product.name_ar || product.name_en || product.productName || product.name);
        const image = cleanString(product.renderedImgUrl || product.image_url || product.image_names || product.image);

        const refreshState = () => {
            const exists = has(merchantKey, productId);
            btn.classList.toggle('is-added', exists);
            btn.querySelector('span').textContent = exists ? '\u0645\u0636\u0627\u0641 \u0644\u0644\u0637\u0644\u0628' : '\u0627\u0636\u0641 \u0627\u0644\u064a \u0637\u0644\u0628';
        };

        refreshState();
        btn.onclick = (event) => {
            event.preventDefault();
            const result = add({
                merchantKey,
                productId,
                name,
                image,
                sourceType: product.isCustom ? 'custom_pharmacy' : 'catalog_pharmacy',
                quantity: 1,
                payload: {
                    isCustom: !!product.isCustom,
                    price: product.price || null
                }
            });

            refreshState();
            syncBadge(merchantKey);
            notify(
                result.added
                    ? '\u062a\u0645\u062a \u0627\u0636\u0627\u0641\u0629 \u0627\u0644\u0645\u0646\u062a\u062c \u0644\u0644\u0637\u0644\u0628'
                    : '\u0627\u0644\u0645\u0646\u062a\u062c \u0645\u0636\u0627\u0641 \u0645\u0633\u0628\u0642\u0627',
                result.added ? 'success' : 'info'
            );
        };
    }

    window.PharmacyRequestCart = {
        STORAGE_KEY,
        EVENT_NAME,
        getAll,
        getItems,
        count,
        has,
        add,
        updateQuantity,
        remove,
        clearMerchant,
        toOrderPayload,
        syncBadge,
        bindPharmacyViewButton
    };

    window.addEventListener(EVENT_NAME, () => {
        const merchantKey = new URLSearchParams(window.location.search).get('user_key')
            || new URLSearchParams(window.location.search).get('m');
        if (merchantKey) syncBadge(merchantKey);
    });
})();
