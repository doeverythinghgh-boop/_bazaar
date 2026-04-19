/**
 * @file pages/merchant-portfolio/js/pharmacy-control-panel/pharmacy-sync-manager.js
 * @description مزامنة البيانات مع السيرفر والذاكرة المحلية (Synchronization & Persistence)
 */

async function pharmacyLoadCatalogData(preferenceState) {
    const loader = document.getElementById('catalog-loader');
    if (loader) loader.style.display = 'flex';

    try {
        const data = await window.PharmacyAPI.getCatalogSource();
        window.globalCatalogData = data; // Cache globally for badge calculations
        window.pharmacyRenderCatalog(data, preferenceState);
    } catch (error) {
        console.error("Pharmacy: Failed to load catalog data", error);
        const container = document.getElementById('catalog-container');
        if (container) container.innerHTML = `<p class='text-danger'>${window.pharmacyL('load_failed')}</p>`;
    } finally {
        if (loader) loader.style.display = 'none';
    }
}

function pharmacySetupPreferenceSaving(preferenceState, userKey) {
    const saveBtn = document.getElementById('btn-save-preferences');
    if (saveBtn) {
        saveBtn.onclick = () => pharmacyPerformSave(preferenceState, userKey);
    }

    const container = document.getElementById('catalog-container');
    if (!container) return;
    
    container.addEventListener('change', (e) => {
        const toggle = e.target;
        if (toggle.tagName === 'INPUT' && toggle.type === 'checkbox') {
            const id = Number(toggle.dataset.id);
            const type = toggle.dataset.type;

            if (type === 'main') {
                if (!toggle.checked) preferenceState.hidden_main_categories.add(id);
                else preferenceState.hidden_main_categories.delete(id);
            } else if (type === 'sub') {
                if (!toggle.checked) preferenceState.hidden_sub_categories.add(id);
                else preferenceState.hidden_sub_categories.delete(id);
                
                const badge = document.getElementById(`hidden-badge-${toggle.closest('.catalog-card').id.split('-').pop()}`);
                if (badge) {
                     const mainId = toggle.closest('.catalog-card').id.split('-').pop();
                     const mainObj = window.globalCatalogData?.find(m => String(m.id) === String(mainId));
                     if (mainObj) {
                         const count = (mainObj.sub || []).filter(s => preferenceState.hidden_sub_categories.has(Number(s.id))).length;
                         if (count > 0) {
                             badge.innerHTML = `<i class="fas fa-eye-slash"></i> ${count}`;
                             badge.style.display = 'inline-block';
                         } else badge.style.display = 'none';
                     }
                }
            }

            const isActuallyDirty = window.pharmacyIsStateDirty(preferenceState);
            const localKey = `pharmacy_pending_prefs_${userKey}`;
            if (isActuallyDirty) {
                const localPayload = {
                    hidden_main_categories: Array.from(preferenceState.hidden_main_categories),
                    hidden_sub_categories: Array.from(preferenceState.hidden_sub_categories),
                    hidden_catalog_products: Array.from(preferenceState.hidden_catalog_products)
                };
                localStorage.setItem(localKey, JSON.stringify(localPayload));
            } else {
                localStorage.removeItem(localKey);
            }

            window.pharmacySetDirtyState(isActuallyDirty, preferenceState, userKey);
        }
    });

    const isInitiallyDirty = window.pharmacyIsStateDirty(preferenceState);
    window.pharmacySetDirtyState(isInitiallyDirty, preferenceState, userKey);
}

function pharmacySetDirtyState(isDirty, state, userKey) {
    const catalogItem = document.getElementById('menu-item-catalog');
    if (!catalogItem) return;

    const catalogIcon = document.getElementById('menu-icon-catalog');
    const catalogText = document.getElementById('menu-text-catalog');

    if (isDirty) {
        catalogItem.style.pointerEvents = 'auto';
        catalogItem.classList.add('save-needed');
        if (catalogIcon) catalogIcon.className = 'fas fa-save animated pulse infinite';
        if (catalogText) catalogText.innerText = window.pharmacyL('nav_save');
        catalogItem.onclick = (e) => {
            e.preventDefault();
            pharmacyPerformSave(state, userKey);
        };
    } else {
        catalogItem.style.pointerEvents = 'auto';
        catalogItem.classList.remove('save-needed');
        if (catalogIcon) catalogIcon.className = 'fas fa-sitemap';
        if (catalogText) catalogText.innerText = window.pharmacyL('pharmacy_ctrl_tab_catalog') || (window.app_language === 'en' ? 'Catalog' : 'الكتالوج');
        catalogItem.onclick = null;
    }
}

async function pharmacyPerformSave(preferenceState, userKey) {
    const { value: isConfirmed, dismiss } = await Swal.fire({
        title: window.pharmacyL('confirm_title'),
        text: window.pharmacyL('confirm_text'),
        showCancelButton: true,
        confirmButtonText: window.pharmacyL('btn_confirm'),
        cancelButtonText: window.pharmacyL('btn_revert'),
        customClass: { popup: 'modern-mini-popup' },
        buttonsStyling: true,
        reverseButtons: true
    });

    if (dismiss === Swal.DismissReason.cancel) {
        preferenceState.hidden_main_categories = new Set(preferenceState.initial_snapshot.main);
        preferenceState.hidden_sub_categories = new Set(preferenceState.initial_snapshot.sub);
        preferenceState.hidden_catalog_products = new Set(preferenceState.initial_snapshot.products);
        
        localStorage.removeItem(`pharmacy_pending_prefs_${userKey}`);
        if (window.pharmacySetDirtyState) window.pharmacySetDirtyState(false);
        const data = await window.PharmacyAPI.getCatalogSource();
        window.globalCatalogData = data; // Sync global cache on revert
        window.pharmacyRenderCatalog(data, preferenceState);
        return;
    }

    if (!isConfirmed) return;

    const catalogItem = document.getElementById('menu-item-catalog');
    const catalogIcon = document.getElementById('menu-icon-catalog');
    const catalogText = document.getElementById('menu-text-catalog');

    if (catalogItem) catalogItem.style.pointerEvents = 'none';
    if (catalogIcon) catalogIcon.className = 'fas fa-spinner fa-spin';
    if (catalogText) catalogText.innerText = '...';

    const prefsData = {
        hidden_main_categories: Array.from(preferenceState.hidden_main_categories),
        hidden_sub_categories: Array.from(preferenceState.hidden_sub_categories),
        hidden_catalog_products: Array.from(preferenceState.hidden_catalog_products)
    };

    try {
        await window.PharmacyAPI.savePreferences(userKey, prefsData);
        if (window.PharmacyAPI?.invalidateCatalogContext) {
            window.PharmacyAPI.invalidateCatalogContext(userKey);
        }
        preferenceState.initial_snapshot.main = Array.from(preferenceState.hidden_main_categories);
        preferenceState.initial_snapshot.sub = Array.from(preferenceState.hidden_sub_categories);
        preferenceState.initial_snapshot.products = Array.from(preferenceState.hidden_catalog_products);
        localStorage.removeItem(`pharmacy_pending_prefs_${userKey}`);

        if (window.pharmacySetDirtyState) window.pharmacySetDirtyState(false);

        Swal.fire({
            title: window.pharmacyL('save_success_title'),
            text: window.pharmacyL('save_success_text'),
            customClass: { popup: 'modern-mini-popup' },
            confirmButtonText: window.pharmacyL('btn_ok'),
            timer: 2000
        });
    } catch (error) {
        Swal.fire({
            title: window.pharmacyL('save_error_title'),
            text: window.pharmacyL('save_error_text'),
            customClass: { popup: 'modern-mini-popup' },
            confirmButtonText: window.pharmacyL('btn_close')
        });
        if (window.pharmacySetDirtyState) window.pharmacySetDirtyState(true, preferenceState, userKey);
    } finally {
        if (catalogItem) catalogItem.style.pointerEvents = 'auto';
    }
}

window.pharmacyLoadCatalogData = pharmacyLoadCatalogData;
window.pharmacySetupPreferenceSaving = pharmacySetupPreferenceSaving;
window.pharmacySetDirtyState = pharmacySetDirtyState;
window.pharmacyPerformSave = pharmacyPerformSave;
