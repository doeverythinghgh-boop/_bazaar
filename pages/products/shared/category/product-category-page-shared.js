/**
 * @file pages/products/shared/category/product-category-page-shared.js
 * @description Shared constants and DOM helpers for category-driven UI behavior.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


(function initProductCategoryPageShared() {
    const FORM_FIELD_MAPS = {
        add: [
            { fieldKey: 'images', groupId: 'add1_section_images' },
            { fieldKey: 'productName', groupId: 'add1_group_product_name', inputId: 'add1_product_name', labelSelector: '#add1_label_product_name span[data-lkey="add1_label_product_name"]' },
            { fieldKey: 'description', groupId: 'add1_group_description', inputId: 'add1_product_description', labelSelector: '#add1_label_description span[data-lkey="add1_label_description"]' },
            { fieldKey: 'sellerMessage', groupId: 'add1_group_seller_message', inputId: 'add1_seller_message', labelSelector: '#add1_label_seller_message span[data-lkey="add1_label_seller_message"]' },
            { fieldKey: 'notes', groupId: 'add1_group_notes', inputId: 'add1_product_notes', labelSelector: '#add1_label_notes span[data-lkey="add1_label_notes"]' },
            { fieldKey: 'quantity', groupId: 'add1_group_quantity', inputId: 'add1_product_quantity', labelSelector: '#add1_label_quantity span[data-lkey="add1_label_quantity"]' },
            { fieldKey: 'price', groupId: 'add1_group_price', inputId: 'add1_product_price', labelSelector: '#add1_label_price span[data-lkey="add1_label_price"]' },
            { fieldKey: 'originalPrice', groupId: 'add1_group_original_price', inputId: 'add1_original_price', labelSelector: '#add1_label_original_price span[data-lkey="add1_label_original_price"]' },
            { fieldKey: 'realPrice', groupId: 'add1_group_real_price', inputId: 'add1_real_price', labelSelector: '#add1_label_real_price span[data-lkey="add1_label_real_price"]' },
            { fieldKey: 'heavyLoad', groupId: 'add1_group_heavy_load', inputId: 'add1_heavy_load' },
            { fieldKey: 'advancedOptions', groupId: 'add1_advanced_options_container' }
        ],
        edit: [
            { fieldKey: 'images', groupId: 'edit_group_images' },
            { fieldKey: 'productName', groupId: 'edit_group_product_name', inputId: 'product-name', labelSelector: 'label[for="product-name"] span[data-lkey="edit_label_product_name"]' },
            { fieldKey: 'description', groupId: 'edit_group_description', inputId: 'product-description', labelSelector: 'label[for="product-description"] span[data-lkey="edit_label_description"]' },
            { fieldKey: 'sellerMessage', groupId: 'edit_group_seller_message', inputId: 'merchant-message', labelSelector: 'label[for="merchant-message"] span[data-lkey="edit_label_seller_message"]' },
            { fieldKey: 'notes', groupId: 'edit_group_notes', inputId: 'product-notes', labelSelector: 'label[for="product-notes"] span[data-lkey="edit_label_notes"]' },
            { fieldKey: 'quantity', groupId: 'edit_group_quantity', inputId: 'product-quantity', labelSelector: 'label[for="product-quantity"] span[data-lkey="edit_label_quantity"]' },
            { fieldKey: 'price', groupId: 'edit_group_price', inputId: 'product-price', labelSelector: 'label[for="product-price"] span[data-lkey="edit_label_price"]' },
            { fieldKey: 'originalPrice', groupId: 'edit_group_original_price', inputId: 'original-price', labelSelector: 'label[for="original-price"] span[data-lkey="edit_label_original_price"]' },
            { fieldKey: 'realPrice', groupId: 'edit_group_real_price', inputId: 'real-price', labelSelector: 'label[for="real-price"] span[data-lkey="edit_label_real_price"]' },
            { fieldKey: 'heavyLoad', groupId: 'edit_group_heavy_load', inputId: 'heavy-load' },
            { fieldKey: 'advancedOptions', groupId: 'edit_advanced_options_container' }
        ]
    };

    function trace(step, payload) {
        if (window.ProductCategoryLogger) {
            window.ProductCategoryLogger.info('PageCore', step, payload);
            return;
        }
        if (typeof payload === 'undefined') console.log(`[ProductCategoryPageCore] ${step}`);
        else console.log(`[ProductCategoryPageCore] ${step}`, payload);
    }

    function setVisible(element, visible) {
        if (!element) return;
        element.style.display = visible ? '' : 'none';
        element.hidden = !visible;
    }

    function setDisabled(element, disabled) {
        if (!element) return;
        element.disabled = !!disabled;
        if (disabled) {
            element.setAttribute('aria-disabled', 'true');
        } else {
            element.removeAttribute('aria-disabled');
        }
    }

    function setText(element, text) {
        if (!element || typeof text !== 'string') return;
        element.textContent = text;
    }

    function setPlaceholder(element, text) {
        if (!element || typeof text !== 'string') return;
        element.placeholder = text;
    }

    function resolveText(spec, fallbackText = '') {
        if (!window.ProductCategoryUi) return fallbackText || '';
        return window.ProductCategoryUi.translate(spec, fallbackText);
    }

    async function getCategoryNames(mainId, subId) {
        try {
            trace('get-category-names-start', { mainId, subId });
            const data = window.appCategoriesList || await fetchAppCategories();
            const categories = Array.isArray(data?.categories) ? data.categories : [];
            const mainCategory = categories.find((item) => String(item.id) === String(mainId));
            if (!mainCategory) {
                return { main: '', sub: '' };
            }

            const mainTitle = typeof mainCategory.title === 'object'
                ? (mainCategory.title[window.app_language] || mainCategory.title.ar || '')
                : String(mainCategory.title || '');

            if (!subId) {
                const result = { main: mainTitle, sub: '' };
                trace('get-category-names-success', result);
                return result;
            }

            const subCategory = Array.isArray(mainCategory.subcategories)
                ? mainCategory.subcategories.find((item) => String(item.id) === String(subId))
                : null;

            const subTitle = subCategory
                ? (typeof subCategory.title === 'object'
                    ? (subCategory.title[window.app_language] || subCategory.title.ar || '')
                    : String(subCategory.title || ''))
                : '';

            const result = { main: mainTitle, sub: subTitle };
            trace('get-category-names-success', result);
            return result;
        } catch (error) {
            console.warn('[ProductCategoryPageCore] Failed to resolve category names:', error);
            return { main: '', sub: '' };
        }
    }

    window.__ProductCategoryInternal = {
        FORM_FIELD_MAPS,
        trace,
        setVisible,
        setDisabled,
        setText,
        setPlaceholder,
        resolveText,
        getCategoryNames
    };
})();
