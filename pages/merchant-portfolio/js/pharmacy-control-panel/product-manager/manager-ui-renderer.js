/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */
(function() {
    if (!window.PharmacyProductManagerModule) return;
    const { ui, state } = window.PharmacyProductManagerModule;

    window.PharmacyProductManagerModule.ui.renderer = {
        /**
         * Local reference for event listeners to ensure clean removal
         */
        activeListeners: new Map(),

        /**
         * Displays a modern loading indicator
         */
        showLoading: function() {
            Swal.fire({
                title: window.pharmacyL('loading_products'),
                didOpen: () => { Swal.showLoading(); },
                customClass: {
                    popup: 'swal-modern-mini-popup',
                    title: 'swal-modern-mini-title',
                    htmlContainer: 'swal-modern-mini-text'
                },
                allowOutsideClick: false
            });
        },

        /**
         * Orchestrates the rendering of the product management modal
         */
        bindManagementModalEvents: function(subCatId) {
            const popup = Swal.getPopup();
            if (!popup) {
                console.warn(`[Pharmacy-Swal-Diagnostic] Product management modal event binding skipped. Reason: Swal popup was not found. SubCategory=${subCatId}`);
                return;
            }

            // Define handlers
            const clickHandler = async (event) => {
                const actionButton = event.target.closest('[data-action="catalog-featured"], [data-action="catalog-customize"]');
                if (!actionButton) return;

                event.preventDefault();
                event.stopPropagation();

                const action = actionButton.dataset.action;
                const productId = actionButton.dataset.productId || '';
                const actionSubCatId = actionButton.dataset.subCatId || subCatId;
                console.log(`[Pharmacy-Swal-Diagnostic] Product modal action started. Action=${action}, Product=${productId}, SubCategory=${actionSubCatId}`);

                actionButton.disabled = true;
                try {
                    if (action === 'catalog-featured') {
                        const crownEl = actionButton.querySelector('.portfolio-feature-crown');
                        const success = await window.pharmacyControlToggleFeaturedCatalogProduct?.(productId, actionSubCatId, crownEl);
                        console.log(`[Pharmacy-Swal-Diagnostic] Featured action finished. Success=${success === true}.`);
                        if (success === true) {
                            Swal.close();
                        }
                        return;
                    }

                    if (action === 'catalog-customize') {
                        const success = await window.pharmacyCustomizeCatalogProduct?.(productId, actionSubCatId);
                        console.log(`[Pharmacy-Swal-Diagnostic] Customize action finished. Success=${success === true}.`);
                        if (success === true && Swal.isVisible()) {
                            Swal.close();
                        }
                    }
                } catch (error) {
                    console.error(`[Pharmacy-Swal-Diagnostic] Product modal action failed. Action=${action}`, error);
                } finally {
                    if (document.body.contains(actionButton)) {
                        actionButton.disabled = false;
                    }
                }
            };

            const changeHandler = (event) => {
                const visibilityToggle = event.target.closest('[data-action="catalog-visibility"]');
                if (!visibilityToggle) return;

                event.stopPropagation();

                const productId = visibilityToggle.dataset.productId || '';
                console.log(`[Pharmacy-Swal-Diagnostic] Visibility toggle started. Product=${productId}, Visible=${visibilityToggle.checked}`);
                try {
                    const success = window.pharmacyToggleProductVisibility?.(productId, visibilityToggle.checked);
                    console.log(`[Pharmacy-Swal-Diagnostic] Visibility toggle finished. Success=${success === true}`);
                } catch (error) {
                    console.error(`[Pharmacy-Swal-Diagnostic] Visibility toggle failed.`, error);
                    visibilityToggle.checked = !visibilityToggle.checked;
                }
            };

            // Register and bind
            popup.addEventListener('click', clickHandler);
            popup.addEventListener('change', changeHandler);
            this.activeListeners.set(popup, { click: clickHandler, change: changeHandler });
            
            console.log(`[Pharmacy-Swal-Diagnostic] Events bound for SubCategory=${subCatId}`);
        },

        cleanupEvents: function() {
            const popup = Swal.getPopup();
            const listeners = this.activeListeners.get(popup);
            if (listeners && popup) {
                popup.removeEventListener('click', listeners.click);
                popup.removeEventListener('change', listeners.change);
                this.activeListeners.delete(popup);
                console.log(`[Pharmacy-Swal-Diagnostic] Events cleaned up for popup.`);
            }
        },

        renderManagementModal: function(subCatTitle, subCatId, displayProducts) {
            let html = `
                <div class="modern-mini-list-container" style="max-height: 400px; overflow-y: auto; padding: 0;">
                    <p style="font-size: 0.85rem; color: #71717a; margin-bottom: 15px; text-align: center; font-weight: 500; border-bottom: 1px solid rgba(0,0,0,0.05); padding-bottom: 10px; margin-inline: 10px;">
                        <i class="fas fa-info-circle" style="margin-inline-end: 5px; opacity: 0.7;"></i> ${window.pharmacyL('product_visibility')}
                    </p>
            `;

            displayProducts.forEach(product => {
                const productId = product.displayId;
                state.subCategoryIndex[String(productId)] = String(subCatId);
                const isChecked = !window.globalPreferenceState.hidden_catalog_products.has(String(productId));
                html += ui.templates.renderProductRow(product, subCatId, isChecked);
            });

            html += `</div>`;

            // Use requestAnimationFrame to ensure the event loop is clear before firing Swal
            requestAnimationFrame(() => {
                Swal.fire({
                    title: subCatTitle,
                    html,
                    showConfirmButton: true,
                    confirmButtonText: window.pharmacyL('btn_ok'),
                    didOpen: () => {
                        console.log(`[Pharmacy-Swal-Diagnostic] Product management modal opened. SubCategory=${subCatId}`);
                        window.PharmacyProductManagerModule.ui.renderer.bindManagementModalEvents(subCatId);
                    },
                    willClose: () => {
                        console.log(`[Pharmacy-Swal-Diagnostic] Product management modal closing. SubCategory=${subCatId}`);
                        window.PharmacyProductManagerModule.ui.renderer.cleanupEvents();
                    },
                    customClass: {
                        popup: 'swal-modern-mini-popup',
                        title: 'swal-modern-mini-title',
                        htmlContainer: 'swal-modern-mini-text',
                        confirmButton: 'swal-modern-mini-confirm'
                    }
                });
            });
        }
    };
    console.log("[Pharmacy-Manager] UI Renderer loaded.");
})();
