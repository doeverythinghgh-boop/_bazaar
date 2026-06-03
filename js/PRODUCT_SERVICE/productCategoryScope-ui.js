/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */
/**
 * @file js/PRODUCT_SERVICE/productCategoryScope-ui.js
 * @description UI components for rendering in-page category selectors.
 */

(function () {
    'use strict';
    window.ProductCategoryScope = window.ProductCategoryScope || {};
    const core = window.ProductCategoryScope;

    async function renderSelector(options) {
        const {
            containerId,
            itemType,
            inputClass,
            mainLabel,
            subLabel,
            preferredMainId,
            preferredSubId,
            emptyMessage,
            disabled = false,
            onSync = null, // Custom callback
            skipGlobalState = false, // Whether to bypass ProductStateManager
            bypassFilter = false // Whether to bypass category restrictions
        } = options || {};

        const container = document.getElementById(containerId);
        if (!container) return { ok: false, tree: [] };

        const tree = await core.getAllowedTree(itemType, null, bypassFilter);
        if (!tree.length) {
            container.innerHTML = `<div id="${containerId}_empty" class="category-scope-empty">${emptyMessage}</div>`;
            if (!skipGlobalState && typeof ProductStateManager !== 'undefined') {
                ProductStateManager.setSelectedCategories(null, null);
            }
            if (onSync) onSync(null, null);
            return { ok: false, tree: [] };
        }

        container.innerHTML = `
            <div id="${containerId}_panel" class="category-scope-panel">
                <label id="${containerId}_main_label" for="${containerId}_main_select">${mainLabel}</label>
                <label id="${containerId}_sub_label" for="${containerId}_sub_select">${subLabel}</label>
                <select id="${containerId}_main_select" class="${inputClass}" ${disabled ? 'disabled' : ''}></select>
                <select id="${containerId}_sub_select" class="${inputClass}" ${disabled ? 'disabled' : ''}></select>
            </div>
            <div id="${containerId}_profile_notice" class="category-profile-notice" style="display:none; margin-top:10px; font-size:0.85rem; padding:8px 12px; border-radius:8px; background:rgba(108,117,125,0.05); border:1px dashed rgba(108,117,125,0.2); color:#6c757d; line-height:1.4;"></div>
        `;

        const mainSelect = document.getElementById(`${containerId}_main_select`);
        const subSelect = document.getElementById(`${containerId}_sub_select`);
        const noticeEl = document.getElementById(`${containerId}_profile_notice`);
        if (!mainSelect || !subSelect) return { ok: false, tree };

        const populateMains = () => {
            mainSelect.innerHTML = tree.map((mainCat) => (
                `<option value="${mainCat.id}">${mainCat.title}</option>`
            )).join('');
        };

        const populateSubs = (mainId, preferredSub = null) => {
            const activeMain = tree.find((item) => String(item.id) === String(mainId)) || tree[0];
            const subs = activeMain?.subcategories || [];
            subSelect.innerHTML = subs.map((subCat) => (
                `<option value="${subCat.id}">${subCat.title}</option>`
            )).join('');

            const subExists = preferredSub && subs.some((subCat) => String(subCat.id) === String(preferredSub));
            subSelect.value = subExists ? String(preferredSub) : (subs[0] ? String(subs[0].id) : '');
            subSelect.disabled = disabled || subs.length === 0;
        };

        populateMains();
        const selection = core.getSelectionFromTree(tree, preferredMainId, preferredSubId);
        mainSelect.value = selection.mainId;
        populateSubs(selection.mainId, selection.subId);

        const syncSelection = () => {
            const mId = mainSelect.value || null;
            const sId = subSelect.value || null;

            // Profile Notice Logic - Specific to Simulator Panels
            if (noticeEl && window.ProductCategoryUi) {
                const currentPanelId = `${containerId}_panel`;
                const isSimulator = currentPanelId.includes('_simulator_panel_host_panel');

                if (isSimulator) {
                    if (!mId) {
                        noticeEl.innerHTML = `<i class="fas fa-search" style="margin-left:5px;"></i> يرجى اختيار فئة للمعاينة.`;
                        noticeEl.style.cssText = 'display:block; margin-top:10px; font-size:0.85rem; padding:8px 12px; border-radius:8px; background:rgba(108,117,125,0.05); border:1px dashed rgba(108,117,125,0.2); color:#6c757d; line-height:1.4;';
                    } else {
                        const profile = window.ProductCategoryUi.resolveCategoryProfile(mId, sId);
                        const config = window.ProductCategoryUi.getConfig();
                        const isDefault = profile.profileKey === config.defaultProfileKey;
                        const label = window.ProductCategoryUi.translate(profile.meta?.label, profile.profileKey);

                        if (isDefault) {
                            noticeEl.innerHTML = `<i class="fas fa-info-circle" style="margin-left:5px;"></i> هذا التصنيف لا يملك بروفيل واجهة مخصص؛ سيتم استخدام الإعدادات القياسية للمنصة.`;
                            noticeEl.style.cssText = 'display:block; margin-top:10px; font-size:0.85rem; padding:8px 12px; border-radius:8px; background:rgba(108,117,125,0.05); border:1px dashed rgba(108,117,125,0.2); color:#6c757d; line-height:1.4;';
                        } else {
                            noticeEl.innerHTML = `<i class="fas fa-check-circle" style="margin-left:5px;"></i> تم تفعيل بروفيل: <strong>${label}</strong> لهذا التصنيف.`;
                            noticeEl.style.cssText = 'display:block; margin-top:10px; font-size:0.85rem; padding:8px 12px; border-radius:8px; background:rgba(25,135,84,0.05); border:1px solid rgba(25,135,84,0.2); color:#198754; line-height:1.4;';
                        }
                    }
                } else {
                    noticeEl.style.display = 'none';
                }
            }

            if (!skipGlobalState && typeof ProductStateManager !== 'undefined') {
                ProductStateManager.setSelectedCategories(mId, sId);
            }
            if (onSync) onSync(mId, sId);
        };

        mainSelect.addEventListener('change', () => {
            populateSubs(mainSelect.value, null);
            syncSelection();
        });
        subSelect.addEventListener('change', syncSelection);
        syncSelection();

        return { ok: true, tree, mainSelect, subSelect };
    }

    // Export methods
    window.ProductCategoryScope.renderSelector = renderSelector;
})();
