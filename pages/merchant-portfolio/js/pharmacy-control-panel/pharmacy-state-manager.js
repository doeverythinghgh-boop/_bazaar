/**
 * @file pages/merchant-portfolio/js/pharmacy-control-panel/pharmacy-state-manager.js
 * @description إدارة حالة التفضيلات والمقارنة العميقة (Deep State & Snapshot Management)
 */

function pharmacyCreatePreferenceState(serverData = {}, userKey) {
    const state = {
        hidden_main_categories: new Set(),
        hidden_sub_categories: new Set(),
        hidden_catalog_products: new Set(),
        initial_snapshot: {
            main: [],
            sub: [],
            products: []
        }
    };
    
    // 1. Process Server Data for Snapshot
    const sPrefs = serverData?.data || serverData; // Handle potential wrap
    if (sPrefs.hidden_main_categories) {
        sPrefs.hidden_main_categories.forEach(id => state.initial_snapshot.main.push(Number(id)));
    }
    if (sPrefs.hidden_sub_categories) {
        sPrefs.hidden_sub_categories.forEach(id => state.initial_snapshot.sub.push(Number(id)));
    }
    if (sPrefs.hidden_catalog_products) {
        sPrefs.hidden_catalog_products.forEach(id => state.initial_snapshot.products.push(String(id)));
    }

    // 2. Check LocalStorage for Unsaved Pending Changes
    const localKey = `pharmacy_pending_prefs_${userKey}`;
    const localData = localStorage.getItem(localKey);
    let workingData = sPrefs;

    if (localData) {
        try {
            const parsed = JSON.parse(localData);
            workingData = parsed;
            console.log(window.pharmacyL('restored_pending'));
        } catch (e) {
            console.error("Pharmacy: Failed to parse local storage data", e);
        }
    }

    // 3. Populate Working State
    if (workingData.hidden_main_categories) {
        workingData.hidden_main_categories.forEach(id => state.hidden_main_categories.add(Number(id)));
    }
    if (workingData.hidden_sub_categories) {
        workingData.hidden_sub_categories.forEach(id => state.hidden_sub_categories.add(Number(id)));
    }
    if (workingData.hidden_catalog_products) {
        workingData.hidden_catalog_products.forEach(id => state.hidden_catalog_products.add(String(id)));
    }
    
    return state;
}

function pharmacyIsStateDirty(state) {
    const currentMain = Array.from(state.hidden_main_categories).sort();
    const originalMain = [...state.initial_snapshot.main].sort();
    if (JSON.stringify(currentMain) !== JSON.stringify(originalMain)) return true;
    
    const currentSub = Array.from(state.hidden_sub_categories).sort();
    const originalSub = [...state.initial_snapshot.sub].sort();
    if (JSON.stringify(currentSub) !== JSON.stringify(originalSub)) return true;

    const currentProducts = Array.from(state.hidden_catalog_products).sort();
    const originalProducts = [...state.initial_snapshot.products].sort();
    if (JSON.stringify(currentProducts) !== JSON.stringify(originalProducts)) return true;
    
    return false;
}

window.pharmacyCreatePreferenceState = pharmacyCreatePreferenceState;
window.pharmacyIsStateDirty = pharmacyIsStateDirty;
