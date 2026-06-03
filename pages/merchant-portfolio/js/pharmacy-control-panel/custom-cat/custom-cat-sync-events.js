/**
 * @file custom-cat-sync-events.js
 * @description Event binding for custom category management.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

(function() {
    window.pharmacyCustomCatEvents = {
        bindEvents: function(userKey) {
            const addCatBtn = document.getElementById('btn-add-custom-cat');
            if (addCatBtn && addCatBtn.dataset.bound !== 'true') {
                addCatBtn.dataset.bound = 'true';
                addCatBtn.addEventListener('click', () => window.pharmacyCustomCatLogic.createCategory(userKey));
            }

            const listContainer = document.getElementById('custom-categories-list');
            if (!listContainer || listContainer.dataset.bound === 'true') return;

            listContainer.dataset.bound = 'true';
            listContainer.addEventListener('click', event => {
                const deleteBtn = event.target.closest('.btn-delete-custom-cat');
                if (deleteBtn) {
                    window.pharmacyCustomCatLogic.deleteCategory(userKey, deleteBtn.dataset.id);
                    return;
                }

                const editBtn = event.target.closest('.btn-edit-custom-cat');
                if (editBtn) {
                    window.pharmacyCustomCatLogic.editCategory(userKey, editBtn.dataset.id);
                }
            });
        }
    };
})();
