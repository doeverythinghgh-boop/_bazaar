/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */
(function() {
    if (!window.PharmacyProductManagerModule) return;
    const { constants } = window.PharmacyProductManagerModule;

    window.PharmacyProductManagerModule.ui.templates = {
        /**
         * Renders a single product row for the management list
         */
        renderProductRow: function(product, subCatId, isChecked) {
            const productName = (window.app_language === 'en' ? (product.name_en || product.title) : (product.name_ar || product.title)) || product.title;
            const badgeText = typeof window.pharmacyL === 'function' ? window.pharmacyL('customized') : (window.app_language === 'en' ? 'Customized' : 'مخصص');
            const badge = product.isCustomized ? `<span style="${constants.BADGE_STYLE}">${badgeText}</span>` : '';
            const bgColor = product.isCustomized ? constants.ITEM_BG_CUSTOM : constants.ITEM_BG_DEFAULT;
            const border = product.isCustomized ? constants.ITEM_BORDER_CUSTOM : 'none';
            const icon = product.isCustomized ? 'fa-edit' : 'fa-pen-to-square';
            const isFeatured = window.pharmacyControlIsFeatured
                ? window.pharmacyControlIsFeatured({
                    id: String(product.displayId || ''),
                    subId: String(subCatId || ''),
                    type: 'catalog',
                    source: 'pharmacy'
                })
                : false;

            const btnTitle = product.isCustomized
                ? (typeof window.pharmacyL === 'function' ? window.pharmacyL('edit_customization') : 'تعديل التخصيص')
                : (typeof window.pharmacyL === 'function' ? window.pharmacyL('customize_product') : 'تخصيص المنتج');

            return `
                <div class="modern-mini-item" style="display:flex; justify-content:space-between; align-items:center; padding: 12px 10px; background: ${bgColor}; border-radius: 12px; margin-bottom: 8px; border: ${border};">
                    <div style="flex: 1; margin-inline-end: 10px;">
                        <span style="font-weight: 600; font-size: 0.95rem; color: var(--dark-blue); display: block; line-height: 1.3;">
                            ${productName} ${badge}
                        </span>
                    </div>
                    <div style="display:flex; align-items:center; gap: 10px;">
                        <button class="btn-pharmacy-catalog-featured" type="button"
                                data-action="catalog-featured"
                                data-product-id="${product.displayId}"
                                data-sub-cat-id="${subCatId}"
                                aria-label="Featured product"
                                style="width: 32px; height: 32px; border-radius: 8px; border: none; background: ${isFeatured ? '#fff7db' : 'rgba(245,158,11,0.1)'}; color: ${isFeatured ? '#f59e0b' : '#9ca3af'}; display: flex; align-items: center; justify-content: center; cursor: pointer;">
                            <i class="fas fa-crown portfolio-feature-crown ${isFeatured ? 'active' : ''}" style="font-size: 0.9rem;"></i>
                        </button>
                        <button class="btn-customize-catalog" type="button" title="${btnTitle}"
                                data-action="catalog-customize"
                                data-product-id="${product.displayId}"
                                data-sub-cat-id="${subCatId}"
                                style="width: 32px; height: 32px; border-radius: 8px; border: none; background: ${product.isCustomized ? 'var(--primary)' : 'rgba(0,86,179,0.08)'}; color: ${product.isCustomized ? 'white' : 'var(--primary)'}; display: flex; align-items: center; justify-content: center; cursor: pointer;">
                            <i class="fas ${icon}" style="font-size: 0.85rem;"></i>
                        </button>
                        <label class="toggle-switch" style="transform: scale(0.85);">
                            <input type="checkbox"
                                   data-action="catalog-visibility"
                                   data-product-id="${product.displayId}"
                                   ${isChecked ? 'checked' : ''}>
                            <span class="slider"></span>
                        </label>
                    </div>
                </div>
            `;
        }
    };
    console.log("[Pharmacy-Manager] UI Templates loaded.");
})();
