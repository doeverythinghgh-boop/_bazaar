/**
 * @file pages/merchant-portfolio/js/pharmacy-control-panel/pharmacy-product-manager.js
 * @description Catalog product visibility workflow for pharmacy control panel.
 */

window.pharmacyProductSubCategoryIndex = window.pharmacyProductSubCategoryIndex || {};

async function pharmacyOpenProductManagement(subCatId, subCatTitle) {
    const userKey = new URLSearchParams(window.location.search).get('user_key');

    Swal.fire({
        title: window.pharmacyL('loading_products'),
        didOpen: () => { Swal.showLoading(); },
        customClass: { popup: 'modern-mini-popup' },
        allowOutsideClick: false
    });

    let products = [];
    try {
        products = await window.PharmacyAPI.getProductsBySubCategory(userKey, subCatId);
    } catch (apiError) {
        console.warn("Pharmacy: Primary API failed, switching to fallback", apiError);
    }

    if (products.length === 0) {
        try {
            products = await window.PharmacyAPI.getSubCategoryStaticProducts(subCatId);
        } catch (fallbackError) {
            console.error("Pharmacy: Fallback fetch also failed", fallbackError);
        }
    }

    Swal.close();

    if (!products.length) {
        Swal.fire({
            title: subCatTitle,
            text: window.pharmacyL('no_products_found'),
            customClass: { popup: 'modern-mini-popup' }
        });
        return;
    }

    try {
        let html = `
            <div style="max-height: 400px; overflow-y: auto; text-align: right; padding: 10px;">
                <p style="font-size: 0.8rem; color: #666; margin-bottom: 15px;">${window.pharmacyL('product_visibility')}</p>
        `;

        products.forEach(product => {
            const productId = Array.isArray(product.id) ? product.id[0] : product.id;
            window.pharmacyProductSubCategoryIndex[String(productId)] = String(subCatId);

            const isChecked = !window.globalPreferenceState.hidden_catalog_products.has(String(productId));
            const productName = (window.app_language === 'en' ? product.name_en : product.title) || product.title || product.name_ar;

            html += `
                <div style="display:flex; justify-content:space-between; align-items:center; padding: 10px; border-bottom: 1px solid #f0f0f0;">
                    <span style="font-weight: 600; font-size: 0.9rem;">${productName}</span>
                    <label class="toggle-switch">
                        <input type="checkbox" onchange="pharmacyToggleProductVisibility('${productId}', this.checked)" ${isChecked ? 'checked' : ''}>
                        <span class="slider"></span>
                    </label>
                </div>
            `;
        });

        html += `</div>`;

        Swal.fire({
            title: subCatTitle,
            html,
            showConfirmButton: true,
            confirmButtonText: window.pharmacyL('btn_ok'),
            customClass: { popup: 'modern-mini-popup' }
        });
    } catch (renderError) {
        console.error("Pharmacy: Render error", renderError);
        Swal.fire({
            title: window.pharmacyL('error'),
            text: window.pharmacyL('load_failed'),
            customClass: { popup: 'modern-mini-popup' }
        });
    }
}

function pharmacyResolveSubCategoryForProduct(productId) {
    const resolved = window.pharmacyProductSubCategoryIndex?.[String(productId)];
    if (resolved) return String(resolved);

    const allCounters = document.querySelectorAll('.btn-product-counter');
    for (const counter of allCounters) {
        const subId = counter.id.replace('product-counter-', '');
        if (String(productId).startsWith(subId)) {
            return subId;
        }
    }

    return null;
}

function pharmacyCountHiddenProductsForSubCategory(subId, hiddenProductSet) {
    return Array.from(hiddenProductSet).filter(productId => {
        const mappedSubId = window.pharmacyProductSubCategoryIndex?.[String(productId)];
        return String(mappedSubId || '') === String(subId) || String(productId).startsWith(String(subId));
    }).length;
}

function pharmacyToggleProductVisibility(productId, isVisible) {
    const state = window.globalPreferenceState;
    if (!state) return;

    const normalizedId = String(productId);
    if (!isVisible) state.hidden_catalog_products.add(normalizedId);
    else state.hidden_catalog_products.delete(normalizedId);

    const subId = pharmacyResolveSubCategoryForProduct(normalizedId);
    if (subId) {
        const hiddenCount = pharmacyCountHiddenProductsForSubCategory(subId, state.hidden_catalog_products);
        const counterEl = document.getElementById(`product-counter-${subId}`);
        const manageBtn = document.getElementById(`btn-manage-${subId}`);

        if (hiddenCount > 0) {
            if (counterEl) {
                counterEl.textContent = '-' + hiddenCount;
            } else if (manageBtn) {
                const newCounter = document.createElement('span');
                newCounter.className = 'btn-product-counter';
                newCounter.id = `product-counter-${subId}`;
                newCounter.textContent = '-' + hiddenCount;
                manageBtn.appendChild(newCounter);
            }
        } else if (counterEl) {
            counterEl.remove();
        }
    }

    if (window.pharmacySetDirtyState) {
        const userKey = new URLSearchParams(window.location.search).get('user_key');
        const isDirty = window.pharmacyIsStateDirty(state);

        localStorage.setItem(`pharmacy_pending_prefs_${userKey}`, JSON.stringify({
            hidden_main_categories: Array.from(state.hidden_main_categories),
            hidden_sub_categories: Array.from(state.hidden_sub_categories),
            hidden_catalog_products: Array.from(state.hidden_catalog_products)
        }));

        window.pharmacySetDirtyState(isDirty, state, userKey);
    }
}

window.pharmacyOpenProductManagement = pharmacyOpenProductManagement;
window.pharmacyToggleProductVisibility = pharmacyToggleProductVisibility;
