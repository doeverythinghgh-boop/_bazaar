/**
 * @file pages/merchant-portfolio/js/pharmacy-control-panel/pharmacy-tabs.js
 * @description Tab navigation helpers for pharmacy control panel.
 *
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 */

function pharmacySetupTabNavigation() {
    const tabs = document.querySelectorAll('.navbar-menu li[data-tab]');
    const sections = document.querySelectorAll('.dashboard-section');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.getAttribute('data-tab');

            // Deep Security: Clear pending catalog ID if switching to 'Add Product' manually (NOT via Customize flow)
            if (targetTab === 'add-product-tab' && window.pharmacyPendingCatalogHideId && !window.pharmacyIsCustomizing) {
                console.log("[Pharmacy] Pending catalog ID cleared due to manual tab navigation.");
                delete window.pharmacyPendingCatalogHideId;
            }

            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            sections.forEach(s => s.classList.remove('active-section'));
            document.getElementById(targetTab).classList.add('active-section');
        });
    });
}

/**
 * Sets up inner sub-tab switching for ALL .custom-cat-subtabs groups on the page.
 * Each group independently controls its own set of .custom-cat-subtab-panel elements.
 */
function pharmacySetupCustomCatSubTabs() {
    const subtabGroups = document.querySelectorAll('.custom-cat-subtabs');
    if (!subtabGroups.length) return;

    subtabGroups.forEach(group => {
        const btns = group.querySelectorAll('.custom-cat-subtab[data-subtab]');
        btns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetPanelId = btn.getAttribute('data-subtab');

                // Deactivate all buttons in this group
                btns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Find all panels that belong to this group's buttons
                btns.forEach(b => {
                    const panel = document.getElementById(b.getAttribute('data-subtab'));
                    if (panel) panel.classList.remove('active');
                });

                // Activate target panel
                const target = document.getElementById(targetPanelId);
                if (target) target.classList.add('active');

                console.log('[PharmacySubTabs] Switched to panel:', targetPanelId);
            });
        });
    });

    console.log('[PharmacySubTabs] Initialized', subtabGroups.length, 'sub-tab group(s).');
}
