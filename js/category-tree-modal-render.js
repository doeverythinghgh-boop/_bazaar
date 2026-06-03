/** Developer note: Hover effects are prohibited in this project. This UI is designed for tablet devices, so do not add hover-based behavior. */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

/**
 * @file js/category-tree-modal-render.js
 * @description Public rendering and presentation API for the category tree modal.
 */

window.CategoryTreeModal = (function () {
    'use strict';

    async function show(initialSelection = {}) {
        const state = await window.CategoryTreeModalCore.prepareState(initialSelection);

        if (state.categories.length === 0) {
            Swal.fire({
                title: window.langu('gen_swal_error_title'),
                text: window.langu('cat_empty_list_error'),
                icon: 'error',
                buttonsStyling: false,
                customClass: {
                    popup: 'swal-modern-mini-popup',
                    title: 'swal-modern-mini-title',
                    htmlContainer: 'swal-modern-mini-text',
                    confirmButton: 'swal-modern-mini-confirm'
                }
            });
            return null;
        }

        const { value: result } = await Swal.fire({
            title: `<span class="swal-modern-mini-title">${window.langu('profile_business_category_label')}</span>`,
            html: window.CategoryTreeModalUI.buildTreeHtml(),
            width: 'min(95vw, 320px)',
            showCancelButton: true,
            showCloseButton: true,
            confirmButtonText: window.langu('gen_btn_save'),
            cancelButtonText: window.langu('alert_cancel_btn'),
            reverseButtons: true,
            buttonsStyling: false,
            customClass: {
                popup: 'swal-modern-mini-popup',
                confirmButton: 'swal-modern-mini-confirm',
                cancelButton: 'swal-modern-mini-cancel'
            },
            didOpen: () => {
                window.CategoryTreeModalUI.attachListeners();
                window.CategoryTreeModalUI.updateUI();
            },
            preConfirm: () => {
                const count = Object.keys(state.selectedData).length;
                if (count === 0) {
                    Swal.showValidationMessage(window.langu('register_error_no_category'));
                    return false;
                }
                return state.selectedData;
            }
        });

        return result || null;
    }

    function getSelectedNames(selectedData) {
        window.CategoryTreeModalCore.ensureCategoriesCache();
        const state = window.CategoryTreeModalCore.getState();
        if (!selectedData || Object.keys(selectedData).length === 0) return '';
        const normalizedData = typeof window.normalizeBusinessCategoryMap === 'function'
            ? window.normalizeBusinessCategoryMap(selectedData)
            : selectedData;
        const lang = window.app_language || 'ar';
        const names = [];

        Object.keys(normalizedData).forEach((mainId) => {
            const cat = state.categories.find((item) => String(item.id) === String(mainId));
            if (cat) {
                const catTitle = typeof cat.title === 'object' ? (cat.title[lang] || cat.title['ar']) : cat.title;
                names.push(catTitle);

                normalizedData[mainId].forEach((subId) => {
                    const sub = cat.subcategories ? cat.subcategories.find((item) => String(item.id) === String(subId)) : null;
                    if (sub) {
                        const subTitle = typeof sub.title === 'object' ? (sub.title[lang] || sub.title['ar']) : sub.title;
                        names.push(subTitle);
                    }
                });
            }
        });

        return names.join(' - ');
    }

    function renderDetailedSelection(selectedData, container) {
        if (!container) return;
        container.innerHTML = "";
        window.CategoryTreeModalCore.ensureCategoriesCache();
        const state = window.CategoryTreeModalCore.getState();
        if (!selectedData || Object.keys(selectedData).length === 0) return;
        const normalizedData = typeof window.normalizeBusinessCategoryMap === 'function'
            ? window.normalizeBusinessCategoryMap(selectedData)
            : selectedData;

        const lang = window.app_language || 'ar';
        const isRtl = lang === 'ar';

        const wrapper = document.createElement("div");
        wrapper.className = "detailed-selection-wrapper";
        wrapper.style.cssText = `display: flex; flex-direction: column; gap: 15px; width: 100%; text-align: ${isRtl ? 'right' : 'left'}; direction: ${isRtl ? 'rtl' : 'ltr'};`;

        Object.keys(normalizedData).forEach((mainId) => {
            const cat = state.categories.find((item) => String(item.id) === String(mainId));
            if (!cat) return;

            const catTitle = typeof cat.title === 'object' ? (cat.title[lang] || cat.title['ar']) : cat.title;

            const group = document.createElement("div");
            group.className = "selection-group";
            group.style.cssText = "background: rgba(var(--primary-rgb), 0.03); border: 1px solid var(--border-color-soft); border-radius: 12px; padding: 12px;";

            const header = document.createElement("div");
            header.className = "selection-group-header";
            header.style.cssText = "font-weight: 700; color: var(--primary-color); font-size: 0.9rem; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;";
            header.innerHTML = `<i class="fas fa-tags" style="font-size: 0.8rem;"></i> ${catTitle}`;
            group.appendChild(header);

            const tagsCont = document.createElement("div");
            tagsCont.className = "selection-tags-container";
            tagsCont.style.cssText = "display: flex; flex-wrap: wrap; gap: 6px;";

            normalizedData[mainId].forEach((subId) => {
                const sub = cat.subcategories ? cat.subcategories.find((item) => String(item.id) === String(subId)) : null;
                if (!sub) return;
                const subTitle = typeof sub.title === 'object' ? (sub.title[lang] || sub.title['ar']) : sub.title;

                const tag = document.createElement("span");
                tag.style.cssText = "background: var(--bg-color-white); color: var(--text-color-dark); border: 1px solid var(--border-color); padding: 4px 10px; border-radius: 8px; font-size: 0.75rem; font-weight: 500; display: inline-flex; align-items: center;";
                tag.textContent = subTitle;
                tagsCont.appendChild(tag);
            });

            if (tagsCont.children.length > 0) group.appendChild(tagsCont);
            wrapper.appendChild(group);
        });

        container.appendChild(wrapper);
    }

    return { show, getSelectedNames, renderDetailedSelection };
})();
