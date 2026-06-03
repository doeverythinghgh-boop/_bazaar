/** Developer note: Hover effects are prohibited in this project. This UI is designed for tablet devices, so do not add hover-based behavior. */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

/**
 * @file js/category-tree-modal-ui.js
 * @description Tree markup generation and interaction handlers for category modal.
 */

window.CategoryTreeModalUI = (function () {
    'use strict';

    function buildTreeHtml() {
        const lang = window.app_language || 'ar';
        const state = window.CategoryTreeModalCore.getState();
        let html = `
            <style>
                .category-tree {
                    text-align: right;
                    direction: rtl;
                    max-height: 400px;
                    overflow-y: auto;
                    padding: 10px;
                }
                .tree-main-item {
                    margin-bottom: 12px;
                    background: var(--bg-color-white);
                    border-radius: 12px;
                    overflow: hidden;
                    border: 1px solid var(--border-color);
                    transition: all 0.3s ease;
                }
                .tree-main-item.selected {
                    border-color: var(--primary-color);
                    background: var(--primary-color-light);
                }
                .tree-main-header {
                    display: flex;
                    align-items: center;
                    padding: 12px;
                    cursor: pointer;
                    user-select: none;
                }
                .tree-checkbox {
                    width: 20px;
                    height: 20px;
                    margin-left: 12px;
                    cursor: pointer;
                    accent-color: var(--primary-color);
                }
                .tree-main-label {
                    flex: 1;
                    font-weight: 600;
                    font-size: 1rem;
                    color: var(--text-color-dark);
                }
                .tree-sub-list {
                    padding: 0 44px 12px 12px;
                    display: none;
                    grid-template-columns: 1fr;
                    gap: 8px;
                }
                .tree-main-item.expanded .tree-sub-list {
                    display: grid;
                }
                .tree-sub-item {
                    display: flex;
                    align-items: center;
                    padding: 6px 0;
                    font-size: 0.9rem;
                    color: var(--text-color-medium);
                }
                .tree-expand-icon {
                    font-size: 0.8rem;
                    transition: transform 0.3s ease;
                    margin-right: auto;
                    color: var(--text-color-light);
                }
                .tree-main-item.expanded .tree-expand-icon {
                    transform: rotate(180deg);
                }
                .tree-limit-info {
                    font-size: 0.8rem;
                    color: var(--text-color-light);
                    margin-bottom: 15px;
                    padding: 0 10px;
                }
                .tree-limit-info b { color: var(--primary-color); }
            </style>
            <div class="tree-limit-info">
                ${(function() {
                    const user = window.UserService ? window.UserService.get() : null;
                    const isSuperAdmin = user ? (window.isSuperAdminUserByIds ? window.isSuperAdminUserByIds(user) : false) : false;
                    if (isSuperAdmin) {
                        return window.langu('cat_selection_instruction_super_admin');
                    }
                    return window.langu('cat_selection_instruction');
                })()}
            </div>
            <div class="category-tree" id="category-tree-root">
        `;

        state.categories.forEach((cat) => {
            const catTitle = typeof cat.title === 'object' ? (cat.title[lang] || cat.title['ar']) : cat.title;
            const isMainSelected = !!state.selectedData[cat.id];

            html += `
                <div class="tree-main-item ${isMainSelected ? 'selected' : ''}" data-id="${cat.id}">
                    <div class="tree-main-header">
                        <input type="checkbox" class="tree-checkbox main-cb" ${isMainSelected ? 'checked' : ''} data-id="${cat.id}">
                        <span class="tree-main-label">${catTitle}</span>
                        <i class="fas fa-chevron-down tree-expand-icon"></i>
                    </div>
                    <div class="tree-sub-list">
            `;

            if (cat.subcategories) {
                cat.subcategories.forEach((sub) => {
                    const subTitle = typeof sub.title === 'object' ? (sub.title[lang] || sub.title['ar']) : sub.title;
                    const isSubSelected = isMainSelected && state.selectedData[cat.id].includes(String(sub.id));

                    html += `
                        <label class="tree-sub-item">
                            <input type="checkbox" class="tree-checkbox sub-cb"
                                ${isSubSelected ? 'checked' : ''}
                                data-main-id="${cat.id}"
                                data-id="${sub.id}">
                            <span>${subTitle}</span>
                        </label>
                    `;
                });
            }

            html += `
                    </div>
                </div>
            `;
        });

        html += `</div>`;
        return html;
    }

    function updateUI() {}

    function showLimitAlert() {
        const msg = window.langu('cat_limit_main_msg');
        Swal.showValidationMessage(msg);
        setTimeout(() => Swal.resetValidationMessage(), 3000);
    }

    function attachListeners() {
        const root = document.getElementById('category-tree-root');
        if (!root) return;
        const state = window.CategoryTreeModalCore.getState();
        const user = window.UserService ? window.UserService.get() : null;
        const isSuperAdmin = user ? (window.isSuperAdminUserByIds ? window.isSuperAdminUserByIds(user) : false) : false;
        const maxAllowed = isSuperAdmin ? Infinity : 3;

        root.querySelectorAll('.tree-main-header').forEach((header) => {
            header.addEventListener('click', (event) => {
                if (event.target.classList.contains('tree-checkbox')) return;
                header.parentElement.classList.toggle('expanded');
            });
        });

        root.querySelectorAll('.main-cb').forEach((cb) => {
            cb.addEventListener('change', () => {
                const mainId = cb.dataset.id;
                if (cb.checked) {
                    if (Object.keys(state.selectedData).length >= maxAllowed) {
                        cb.checked = false;
                        showLimitAlert();
                        return;
                    }
                    if (!state.selectedData[mainId]) state.selectedData[mainId] = [];
                    cb.parentElement.parentElement.classList.add('selected');
                    cb.parentElement.parentElement.classList.add('expanded');
                } else {
                    delete state.selectedData[mainId];
                    cb.parentElement.parentElement.classList.remove('selected');
                    cb.parentElement.parentElement.querySelectorAll('.sub-cb').forEach((subCb) => { subCb.checked = false; });
                }
                updateUI();
            });
        });

        root.querySelectorAll('.sub-cb').forEach((cb) => {
            cb.addEventListener('change', () => {
                const mainId = cb.dataset.mainId;
                const subId = String(cb.dataset.id);
                const mainCb = root.querySelector(`.main-cb[data-id="${mainId}"]`);

                if (cb.checked) {
                    if (!state.selectedData[mainId]) {
                        if (Object.keys(state.selectedData).length >= maxAllowed) {
                            cb.checked = false;
                            showLimitAlert();
                            return;
                        }
                        state.selectedData[mainId] = [];
                        mainCb.checked = true;
                        mainCb.parentElement.parentElement.classList.add('selected');
                    }
                    if (!state.selectedData[mainId].includes(subId)) {
                        state.selectedData[mainId].push(subId);
                    }
                } else if (state.selectedData[mainId]) {
                    state.selectedData[mainId] = state.selectedData[mainId].filter((id) => id !== subId);
                }
                updateUI();
            });
        });
    }

    return {
        buildTreeHtml,
        attachListeners,
        updateUI
    };
})();
