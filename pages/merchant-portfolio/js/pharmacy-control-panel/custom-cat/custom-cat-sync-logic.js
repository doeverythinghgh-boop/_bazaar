/**
 * @file custom-cat-sync-logic.js
 * @description Logic for custom category operations (Create, Delete, Edit, Reload).
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

(function() {
    window.pharmacyCustomCatLogic = {
        state: {
            localCategories: [],
            staticCatalog: []
        },

        getCategoryById: function(categoryId) {
            return this.state.localCategories.find(category => String(category.id) === String(categoryId)) || null;
        },

        reload: async function(userKey) {
            const context = await window.PharmacyAPI.getCatalogContext(userKey, { force: true });
            this.state.staticCatalog = Array.isArray(context.catalogSource) ? context.catalogSource : [];
            this.state.localCategories = Array.isArray(context.customCategories) ? context.customCategories : [];

            if (window.pharmacyCustomCatUI?.renderTree) {
                window.pharmacyCustomCatUI.renderTree(this.state.localCategories, this.state.staticCatalog);
            }

            if (window.pharmacyProductFormController?.refreshCategories) {
                window.pharmacyProductFormController.refreshCategories();
            }

            if (window.globalPreferenceState) {
                const mergedData = context.mergedCategories || [];
                window.globalCatalogData = mergedData;
                if (typeof window.pharmacyRenderCatalog === 'function') {
                    window.pharmacyRenderCatalog(mergedData, window.globalPreferenceState);
                }
            }
        },

        createCategory: async function(userKey) {
            const levelSelect = document.getElementById('custom-cat-level');
            const parentSelect = document.getElementById('custom-cat-parent');
            const addCatBtn = document.getElementById('btn-add-custom-cat');

            const ar = document.getElementById('custom-cat-ar').value.trim();
            const en = document.getElementById('custom-cat-en').value.trim();
            const level = levelSelect.value;
            const parentId = parentSelect.value;

            if (!ar) {
                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        title: window.pharmacyL('warning'),
                        text: window.pharmacyL('name_required'),
                        customClass: {
                            popup: 'swal-modern-mini-popup',
                            title: 'swal-modern-mini-title',
                            htmlContainer: 'swal-modern-mini-text',
                            confirmButton: 'swal-modern-mini-confirm'
                        }
                    });
                }
                return;
            }

            const newCategory = {
                id: 'CUST_' + Date.now(),
                user_key: userKey,
                title_ar: ar,
                title_en: en,
                level,
                parent_id: level === 'SUB' ? parentId : null
            };

            if (level === 'MAIN') {
                newCategory.isPending = true;
                this.state.localCategories.push(newCategory);
                window.pharmacyCustomCatUI.renderTree(this.state.localCategories, this.state.staticCatalog);

                levelSelect.value = 'SUB';
                levelSelect.dispatchEvent(new Event('change'));
                parentSelect.value = newCategory.id;
                window.pharmacyCustomCatUI.resetForm();

                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        title: window.pharmacyL('success'),
                        text: window.pharmacyL('main_drafted_msg'),
                        toast: true,
                        position: 'top-end',
                        showConfirmButton: false,
                        timer: 3000,
                        customClass: {
                            popup: 'swal-modern-mini-popup',
                            title: 'swal-modern-mini-title',
                            htmlContainer: 'swal-modern-mini-text'
                        }
                    });
                }
                return;
            }

            if (addCatBtn) {
                addCatBtn.disabled = true;
                addCatBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${window.pharmacyL('creating')}`;
            }

            try {
                const parent = this.getCategoryById(parentId);
                if (parent?.isPending) {
                    await window.PharmacyAPI.addCustomCategory(parent);
                }

                await window.PharmacyAPI.addCustomCategory(newCategory);
                await this.reload(userKey);
                window.pharmacyCustomCatUI.resetForm();

                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        title: window.pharmacyL('success'),
                        text: window.pharmacyL('new_category_success'),
                        customClass: {
                            popup: 'swal-modern-mini-popup',
                            title: 'swal-modern-mini-title',
                            htmlContainer: 'swal-modern-mini-text',
                            confirmButton: 'swal-modern-mini-confirm'
                        }
                    });
                }
            } catch (error) {
                console.error("[PharmacyCustomCategories] Create failed:", error);
            } finally {
                if (addCatBtn) {
                    addCatBtn.disabled = false;
                    addCatBtn.innerHTML = `<i class="fas fa-plus"></i> ${window.pharmacyL('create_btn')}`;
                }
            }
        },

        deleteCategory: async function(userKey, categoryId) {
            const target = this.getCategoryById(categoryId);
            if (!target) return;

            if (target.level === 'SUB') {
                const isParentCustom = this.state.localCategories.some(category =>
                    String(category.id) === String(target.parent_id) && category.level === 'MAIN'
                );
                if (isParentCustom) {
                    const siblingCount = this.state.localCategories.filter(category => String(category.parent_id) === String(target.parent_id)).length;
                    if (siblingCount <= 1) {
                        if (typeof Swal !== 'undefined') {
                            Swal.fire({
                                title: typeof window.pharmacyL === 'function' ? window.pharmacyL('action_blocked') : 'إجراء مرفوض',
                                text: typeof window.pharmacyL === 'function' ? window.pharmacyL('custom_cat_min_sub_required') : 'يجب أن يحتوي قسمك الرئيسي المخصص على قسم فرعي واحد على الأقل.',
                                customClass: {
                                    popup: 'swal-modern-mini-popup',
                                    title: 'swal-modern-mini-title',
                                    htmlContainer: 'swal-modern-mini-text',
                                    confirmButton: 'swal-modern-mini-confirm'
                                }
                            });
                        }
                        return;
                    }
                }
            }

            if (typeof Swal === 'undefined') return;

            const result = await Swal.fire({
                title: typeof window.pharmacyL === 'function' ? window.pharmacyL('delete_confirm_title') : 'حذف؟',
                text: typeof window.pharmacyL === 'function' ? window.pharmacyL('delete_confirm_text_cat') : 'تأكيد حذف هذا القسم.',
                showCancelButton: true,
                confirmButtonColor: '#dc3545',
                confirmButtonText: typeof window.pharmacyL === 'function' ? window.pharmacyL('delete_btn') : 'حذف',
                cancelButtonText: window.pharmacyL('btn_close'),
                customClass: {
                    popup: 'swal-modern-mini-popup',
                    title: 'swal-modern-mini-title',
                    htmlContainer: 'swal-modern-mini-text',
                    confirmButton: 'swal-modern-mini-confirm',
                    cancelButton: 'swal-modern-mini-cancel'
                }
            });

            if (!result.isConfirmed) return;

            try {
                if (!target.isPending) {
                    await window.PharmacyAPI.deleteCustomCategory(userKey, categoryId);
                }

                await this.reload(userKey);
            } catch (error) {
                console.error("[PharmacyCustomCategories] Delete failed:", error);
            }
        },

        editCategory: async function(userKey, categoryId) {
            const target = this.getCategoryById(categoryId);
            if (!target) return;

            if (typeof Swal === 'undefined') return;

            const { value: formValues } = await Swal.fire({
                title: typeof window.pharmacyL === 'function' ? window.pharmacyL('edit_category_title') : 'تعديل القسم',
                html:
                    `<input id="swal-input-ar" class="swal-modern-mini-input" style="width:100%; margin-bottom:10px;" placeholder="${window.pharmacyL('name_ar_placeholder')}" value="${target.title_ar || ''}">` +
                    `<input id="swal-input-en" class="swal-modern-mini-input" style="width:100%;" placeholder="${window.pharmacyL('name_en_placeholder')}" value="${target.title_en || ''}">`,
                focusConfirm: false,
                showCancelButton: true,
                confirmButtonText: typeof window.pharmacyL === 'function' ? window.pharmacyL('update_btn') : 'تحديث',
                cancelButtonText: window.pharmacyL('btn_close'),
                customClass: {
                    popup: 'swal-modern-mini-popup',
                    title: 'swal-modern-mini-title',
                    confirmButton: 'swal-modern-mini-confirm',
                    cancelButton: 'swal-modern-mini-cancel'
                },
                preConfirm: () => ({
                    title_ar: document.getElementById('swal-input-ar').value.trim(),
                    title_en: document.getElementById('swal-input-en').value.trim()
                })
            });

            if (!formValues?.title_ar) return;

            try {
                const updatedData = { ...target, ...formValues };
                if (!target.isPending) {
                    await window.PharmacyAPI.updateCustomCategory(updatedData);
                }

                await this.reload(userKey);
                Swal.fire({
                    title: window.pharmacyL('success'),
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 2000,
                    customClass: {
                        popup: 'swal-modern-mini-popup',
                        title: 'swal-modern-mini-title'
                    }
                });
            } catch (error) {
                console.error("[PharmacyCustomCategories] Update failed:", error);
            }
        }
    };
})();
