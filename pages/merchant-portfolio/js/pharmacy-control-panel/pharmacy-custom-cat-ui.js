/**
 * @file pages/merchant-portfolio/js/pharmacy-control-panel/pharmacy-custom-cat-ui.js
 * @description إدارة واجهة نموذج الأقسام المخصصة وتفاعلات الـ DOM
 */

(function () {
    /**
     * إعداد التبديل بين القسم الرئيسي والفرعي في النموذج
     */
    function pharmacySetupCustomCategoryLevelToggle() {
        const levelSelect = document.getElementById('custom-cat-level');
        const parentGroup = document.getElementById('parent-cat-group');
        if (!levelSelect || !parentGroup) return;

        levelSelect.addEventListener('change', (e) => {
            if (e.target.value === 'SUB') {
                parentGroup.classList.remove('hidden');
            } else {
                parentGroup.classList.add('hidden');
            }
        });
    }

    /**
     * إضافة القسم الجديد للقائمة المرئية في الصفحة
     */
    /**
     * رندرة كامل القائمة بنظام الهيكل الهرمي (Tree View)
     */
    function pharmacyRenderCustomCategoryTree(categories, standardCategories = []) {
        const listContainer = document.getElementById('custom-categories-list');
        if (!listContainer) return;

        if ((!categories || categories.length === 0) && (!standardCategories || standardCategories.length === 0)) {
            listContainer.innerHTML = `<span id="custom-cats-empty-text">${window.app_language === 'en' ? 'No custom categories yet.' : 'لا توجد أقسام مخصصة حتى الآن.'}</span>`;
            listContainer.classList.add('empty-state');
            return;
        }

        listContainer.innerHTML = '';
        listContainer.classList.remove('empty-state');
        listContainer.style.display = 'flex';
        listContainer.style.flexDirection = 'column';
        listContainer.style.gap = '15px';

        const mainCats = categories.filter(c => c.level === 'MAIN');
        const subCats = categories.filter(c => c.level === 'SUB');

        // Identify standard categories that have custom subs attached
        const usedStandardIds = new Set(subCats.filter(s => !mainCats.some(m => String(m.id) === String(s.parent_id))).map(s => String(s.parent_id)));
        const activeStandardCats = standardCategories.filter(std => usedStandardIds.has(String(std.id)));

        // Combine for rendering: Standard used parents + Custom parents
        const allParentGroups = [
            ...activeStandardCats.map(std => ({ ...std, isStandard: true, level: 'MAIN' })),
            ...mainCats
        ];

        allParentGroups.forEach(main => {
            const mainBox = document.createElement('div');
            mainBox.className = 'custom-cat-group';
            mainBox.style.background = main.isStandard ? 'rgba(0,0,0,0.02)' : 'rgba(0,86,179,0.03)';
            mainBox.style.border = main.isStandard ? '1px dashed #ccc' : '1px solid rgba(0,86,179,0.1)';
            mainBox.style.borderRadius = '12px';
            mainBox.style.padding = '12px';

            const mainHeader = document.createElement('div');
            mainHeader.style.display = 'flex';
            mainHeader.style.justifyContent = 'space-between';
            mainHeader.style.alignItems = 'center';
            mainHeader.style.marginBottom = '8px';
            
            const titleText = main.isStandard ? main.title : main.title_ar;
            const badge = main.isStandard 
                ? `<span style="font-size:0.65rem; background:#6c757d; color:#fff; padding:2px 6px; border-radius:10px; margin-inline-start:5px;">${window.app_language === 'en' ? 'Catalog' : 'كتالوج'}</span>`
                : (main.isPending ? `<span style="font-size:0.65rem; background:#ffc107; color:#000; padding:2px 6px; border-radius:10px; margin-inline-start:5px;">${window.app_language === 'en' ? 'Draft' : 'مسودة'}</span>` : '');

            mainHeader.innerHTML = `
                <div>
                    <i class="${main.isStandard ? 'fas fa-book' : 'fas fa-folder-open'}" style="color:${main.isStandard ? '#666' : 'var(--primary)'}; margin-inline-end:8px;"></i>
                    <strong style="color:var(--dark-blue); font-size:1rem;">${titleText}</strong>
                    ${badge}
                </div>
                ${!main.isStandard ? `
                <div style="display:flex; gap:10px; align-items:center;">
                    <button class="btn-edit-custom-cat" data-id="${main.id}" style="border:none; background:none; color:var(--primary); cursor:pointer; opacity:0.6;">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-delete-custom-cat" data-id="${main.id}" style="border:none; background:none; color:#dc3545; cursor:pointer; opacity:0.6;">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>` : ''}
            `;
            mainBox.appendChild(mainHeader);

            // Sub categories area
            const subsArea = document.createElement('div');
            subsArea.style.marginInlineStart = '25px';
            subsArea.style.display = 'flex';
            subsArea.style.flexDirection = 'column';
            subsArea.style.gap = '8px';
            subsArea.style.borderInlineStart = '2px solid rgba(0,0,0,0.05)';
            subsArea.style.paddingInlineStart = '12px';

            const relatedSubs = subCats.filter(s => String(s.parent_id) === String(main.id || main.title)); // Fix ID match for standard
            if (relatedSubs.length === 0 && !main.isStandard) {
                subsArea.innerHTML = `<span style="font-size:0.75rem; color:#888; font-style:italic;">${window.app_language === 'en' ? 'No sub-sections yet' : 'لا يوجد أقسام فرعية بعد'}</span>`;
            } else {
                relatedSubs.forEach(sub => {
                    const subItem = document.createElement('div');
                    subItem.style.display = 'flex';
                    subItem.style.justifyContent = 'space-between';
                    subItem.style.alignItems = 'center';
                    subItem.style.background = '#fff';
                    subItem.style.padding = '6px 10px';
                    subItem.style.borderRadius = '8px';
                    subItem.style.border = '1px solid #eee';
                    subItem.innerHTML = `
                        <span style="font-size:0.9rem; color:#555;">${sub.title_ar}</span>
                        <div style="display:flex; gap:8px;">
                            <button class="btn-edit-custom-cat" data-id="${sub.id}" style="border:none; background:none; color:var(--primary); cursor:pointer; opacity:0.4; font-size:0.8rem;">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-delete-custom-cat" data-id="${sub.id}" style="border:none; background:none; color:#dc3545; cursor:pointer; opacity:0.4; font-size:0.8rem;">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    `;
                    subsArea.appendChild(subItem);
                });
            }
            
            mainBox.appendChild(subsArea);
            listContainer.appendChild(mainBox);
        });

        // Update parent dropdown - Merge Custom + Standard
        const parentSelect = document.getElementById('custom-cat-parent');
        if (parentSelect) {
            const currentVal = parentSelect.value;
            parentSelect.innerHTML = `<option value="">${window.pharmacyL('choose_parent')}</option>`;
            
            // 1. Standard categories
            if (standardCategories && standardCategories.length > 0) {
                const stdGroup = document.createElement('optgroup');
                stdGroup.label = window.app_language === 'en' ? 'Standard Sections' : 'أقسام الكتالوج الأساسية';
                standardCategories.forEach(std => {
                    const opt = document.createElement('option');
                    opt.value = std.id;
                    opt.textContent = std.title; // Fix: it's .title in pharmList.json
                    stdGroup.appendChild(opt);
                });
                parentSelect.appendChild(stdGroup);
            }

            // 2. Custom categories
            if (mainCats.length > 0) {
                const custGroup = document.createElement('optgroup');
                custGroup.label = window.app_language === 'en' ? 'My Custom Sections' : 'أقسامي المخصصة';
                mainCats.forEach(m => {
                    const opt = document.createElement('option');
                    opt.value = m.id;
                    opt.textContent = m.title_ar;
                    custGroup.appendChild(opt);
                });
                parentSelect.appendChild(custGroup);
            }

            parentSelect.value = currentVal;
        }
    }

    /**
     * تفريغ النموذج بعد النجاح
     */
    function pharmacyResetCustomCategoryForm() {
        ['custom-cat-ar', 'custom-cat-en'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
    }

    // تصدير الدوال للوصول العالمي
    window.pharmacyCustomCatUI = {
        setupLevelToggle: pharmacySetupCustomCategoryLevelToggle,
        renderTree: pharmacyRenderCustomCategoryTree,
        appendToList: (cat) => {
            // Backward compatibility alias: just re-renders the whole tree if you pass a list, 
            // or we logic it to fetch if single. Actually we used single cat in control panel.
            // Better: just let control panel call renderTree with the array it fetched.
        },
        resetForm: pharmacyResetCustomCategoryForm
    };

    window.pharmacySetupCustomCategoryLevelToggle = pharmacySetupCustomCategoryLevelToggle;
    window.pharmacyRenderCustomCategoryTree = pharmacyRenderCustomCategoryTree;
    window.pharmacyResetCustomCategoryForm = pharmacyResetCustomCategoryForm;
})();
